const crypto = require("node:crypto");

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function log(message, data) {
  if (data === undefined) console.log(`[stripe-webhook] ${message}`);
  else console.log(`[stripe-webhook] ${message}`, data);
}

function parseStripeSignature(header) {
  const parts = String(header || "").split(",");
  const parsed = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) parsed[key] = value;
  }
  return parsed;
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!secret) throw new Error("后端缺少 STRIPE_WEBHOOK_SECRET 环境变量。");

  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed.t || !parsed.v1) throw new Error("Stripe webhook 签名格式不正确。");

  const payload = `${parsed.t}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(parsed.v1, "hex");
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new Error("Stripe webhook 签名验证失败。");
  }
}

async function fetchJson(url, options, label) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`${label} connection failed: ${error.message || "fetch failed"}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  return { response, data };
}

function getInvoiceMetadata(invoice) {
  return (
    invoice.metadata ||
    invoice.subscription_details?.metadata ||
    invoice.parent?.subscription_details?.metadata ||
    {}
  );
}

function rowFromCheckoutSession(session) {
  const metadata = session.metadata || {};
  return {
    user_id: metadata.user_id || session.client_reference_id || null,
    plan_code: metadata.plan_code || "pro",
    billing_cycle: metadata.billing_cycle || "monthly",
    amount_cents: session.amount_total || 0,
    status: session.payment_status || "paid",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent: session.payment_intent || null
  };
}

function rowFromInvoice(invoice) {
  const metadata = getInvoiceMetadata(invoice);
  return {
    user_id: metadata.user_id || null,
    plan_code: metadata.plan_code || "pro",
    billing_cycle: metadata.billing_cycle || "monthly",
    amount_cents: invoice.amount_paid || invoice.amount_due || 0,
    status: invoice.status || "paid",
    stripe_checkout_session_id: null,
    stripe_payment_intent: invoice.payment_intent || null
  };
}

async function insertBillingRecord({ supabaseUrl, serviceRoleKey, row }) {
  log("insert billing record start", {
    user_id: row.user_id,
    plan_code: row.plan_code,
    status: row.status,
    amount_cents: row.amount_cents,
    checkout_session: row.stripe_checkout_session_id
  });

  const { response, data } = await fetchJson(
    `${supabaseUrl}/rest/v1/billing_records`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates"
      },
      body: JSON.stringify(row)
    },
    "Supabase billing_records"
  );

  if (!response.ok) {
    log("insert billing record failed", data);
    throw new Error(data.message || data.error || "保存支付记录失败。");
  }

  log("insert billing record success");
  return row;
}

async function updateProfilePlan({ supabaseUrl, serviceRoleKey, userId }) {
  if (!userId) {
    log("skip profile update: missing user_id");
    return;
  }

  const { response, data } = await fetchJson(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ plan: "Pro" })
    },
    "Supabase profiles"
  );

  if (!response.ok) {
    log("profile update failed", data);
    throw new Error(data.message || data.error || "更新用户套餐失败。");
  }

  log("profile update success", { user_id: userId, plan: "Pro" });
}

async function savePaidPlan({ supabaseUrl, serviceRoleKey, row }) {
  await insertBillingRecord({ supabaseUrl, serviceRoleKey, row });
  if (row.status === "paid" || row.status === "no_payment_required" || row.status === "open") {
    await updateProfilePlan({ supabaseUrl, serviceRoleKey, userId: row.user_id });
  } else {
    log("skip profile update: unpaid status", row.status);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "只支持 POST 请求。" });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      sendJson(res, 500, { error: "后端缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量。" });
      return;
    }

    const rawBody = req.rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));
    verifyStripeSignature(rawBody, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);

    const event = JSON.parse(rawBody);
    log("event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      await savePaidPlan({
        supabaseUrl,
        serviceRoleKey,
        row: rowFromCheckoutSession(event.data.object)
      });
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const row = rowFromInvoice(event.data.object);
      if (row.user_id) {
        await savePaidPlan({ supabaseUrl, serviceRoleKey, row });
      } else {
        log("skip invoice event: missing user_id metadata");
      }
    }

    sendJson(res, 200, { received: true });
  } catch (error) {
    log("webhook failed", error.message);
    sendJson(res, 400, { error: error.message || "Webhook 处理失败。" });
  }
};
