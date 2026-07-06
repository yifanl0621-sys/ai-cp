const PRO_PLAN = {
  plan_code: "pro",
  billing_cycle: "monthly"
};

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function parseBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
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

async function getSupabaseUser({ supabaseUrl, serviceRoleKey, token }) {
  const { response, data } = await fetchJson(
    `${supabaseUrl}/auth/v1/user`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${token}`
      }
    },
    "Supabase auth"
  );

  if (!response.ok) return null;
  return data;
}

async function getUserPlan({ supabaseUrl, serviceRoleKey, userId }) {
  const { response, data } = await fetchJson(
    `${supabaseUrl}/rest/v1/profiles?select=plan&id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    },
    "Supabase profiles"
  );

  if (!response.ok || !Array.isArray(data) || !data[0]) return "Free";
  return data[0].plan || "Free";
}

function encodeStripeParams(params) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.append(key, value);
  }
  return body;
}

async function createStripeSession({ user, appUrl }) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!stripeSecretKey || !priceId) {
    throw new Error("后端缺少 STRIPE_SECRET_KEY 或 STRIPE_PRO_PRICE_ID 环境变量。");
  }

  const mode = process.env.STRIPE_CHECKOUT_MODE || "subscription";
  const successUrl = `${appUrl}/app/billing.html?checkout=success`;
  const cancelUrl = `${appUrl}/app/billing.html?checkout=cancel`;
  const params = encodeStripeParams({
    mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "client_reference_id": user.id,
    "customer_email": user.email || "",
    "metadata[user_id]": user.id,
    "metadata[plan_code]": PRO_PLAN.plan_code,
    "metadata[billing_cycle]": PRO_PLAN.billing_cycle,
    "subscription_data[metadata][user_id]": user.id,
    "subscription_data[metadata][plan_code]": PRO_PLAN.plan_code,
    "subscription_data[metadata][billing_cycle]": PRO_PLAN.billing_cycle
  });

  const { response, data } = await fetchJson(
    "https://api.stripe.com/v1/checkout/sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    },
    "Stripe Checkout"
  );

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "创建 Stripe Checkout 失败。");
  }

  return data;
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

    const token = parseBearerToken(req);
    if (!token) {
      sendJson(res, 401, { error: "请先登录后再升级套餐。" });
      return;
    }

    const user = await getSupabaseUser({ supabaseUrl, serviceRoleKey, token });
    if (!user || !user.id) {
      sendJson(res, 401, { error: "登录状态已过期，请重新登录。" });
      return;
    }

    const currentPlan = await getUserPlan({ supabaseUrl, serviceRoleKey, userId: user.id });
    if (String(currentPlan || "").toLowerCase() === "pro") {
      sendJson(res, 409, { error: "你当前已经是 Pro 套餐，无需重复购买。" });
      return;
    }

    const appUrl = process.env.APP_URL || `http://${req.headers.host}`;
    const session = await createStripeSession({ user, appUrl });
    sendJson(res, 200, { url: session.url });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "创建支付页面失败。" });
  }
};
