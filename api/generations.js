const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_DASHSCOPE_MODEL = "qwen-max";
const DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

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

function normalizePayload(body) {
  const sellingPoints = Array.isArray(body.selling_points)
    ? body.selling_points.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  return {
    product_name: String(body.product_name || "").trim(),
    intro: String(body.intro || "").trim(),
    audience: String(body.audience || "").trim(),
    selling_points: sellingPoints.slice(0, 3),
    channel: String(body.channel || "").trim()
  };
}

function validateInput(input) {
  if (!input.product_name) return "请填写产品名称。";
  if (!input.intro) return "请填写一句话介绍。";
  if (!input.audience) return "请填写目标用户。";
  if (!input.channel) return "请选择投放渠道。";
  if (input.selling_points.length < 1) return "请至少填写 1 个卖点。";
  return "";
}

async function fetchJson(url, options, label) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`${label} connection failed: ${error.message || "fetch failed"}`);
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

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

async function getTodayGenerationCount({ supabaseUrl, serviceRoleKey, userId }) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { response, data } = await fetchJson(
    `${supabaseUrl}/rest/v1/generations?select=id&user_id=eq.${encodeURIComponent(userId)}&created_at=gte.${encodeURIComponent(start.toISOString())}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    },
    "Supabase generations"
  );

  if (!response.ok || !Array.isArray(data)) return 0;
  return data.length;
}

async function enforceGenerationLimit({ supabaseUrl, serviceRoleKey, userId }) {
  const plan = await getUserPlan({ supabaseUrl, serviceRoleKey, userId });
  const normalizedPlan = String(plan || "Free").toLowerCase();
  if (normalizedPlan === "pro" || normalizedPlan === "team") return;

  const count = await getTodayGenerationCount({ supabaseUrl, serviceRoleKey, userId });
  if (count >= 3) {
    const error = new Error("Free 用户每日最多生成 3 次。请升级 Pro 后继续生成。");
    error.statusCode = 403;
    throw error;
  }
}

function buildPrompt(input) {
  return [
    "请根据下面的产品信息生成一组中文营销文案。",
    "只返回 JSON，不要返回 Markdown。",
    "",
    `产品名称：${input.product_name}`,
    `一句话介绍：${input.intro}`,
    `目标用户：${input.audience}`,
    `卖点：${input.selling_points.join("；")}`,
    `投放渠道：${input.channel}`,
    "",
    "JSON 字段必须包含：main_title, subtitle, cta, short_copies, long_copy。",
    "short_copies 必须是 3 个字符串组成的数组。"
  ].join("\n");
}

function safeParseOutputText(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      main_title: "生成结果需要人工检查",
      subtitle: "模型返回了非 JSON 内容，请查看长文案。",
      cta: "重新生成",
      short_copies: [text.slice(0, 220)],
      long_copy: text
    };
  }
}

function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  const isDashScope = provider === "dashscope" || Boolean(process.env.DASHSCOPE_API_KEY);

  if (isDashScope) {
    return {
      label: "DashScope",
      apiKey: process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY,
      model: process.env.DASHSCOPE_MODEL || process.env.OPENAI_MODEL || DEFAULT_DASHSCOPE_MODEL,
      baseUrl: (process.env.DASHSCOPE_BASE_URL || DASHSCOPE_BASE_URL).replace(/\/$/, "")
    };
  }

  return {
    label: "OpenAI",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    baseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
  };
}

function normalizeModelOutput(data) {
  const text = data.choices?.[0]?.message?.content || data.output_text || "";
  return safeParseOutputText(text);
}

async function generateCopy(input) {
  const provider = getProviderConfig();
  if (!provider.apiKey) {
    throw new Error(`后端缺少 ${provider.label} API Key 环境变量。`);
  }

  const { response, data } = await fetchJson(
    `${provider.baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: "system",
            content: "你是资深中文 SaaS 营销文案专家，擅长写清晰、可信、可转化的营销文案。"
          },
          {
            role: "user",
            content: buildPrompt(input)
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    },
    provider.label
  );

  if (!response.ok) {
    const message = data.error?.message || data.message || `${provider.label} generation failed.`;
    throw new Error(message);
  }

  return {
    model: provider.model,
    output: normalizeModelOutput(data)
  };
}

async function insertGeneration({ supabaseUrl, serviceRoleKey, row }) {
  const { response, data } = await fetchJson(
    `${supabaseUrl}/rest/v1/generations`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(row)
    },
    "Supabase database"
  );

  if (!response.ok) {
    const message = data.message || data.error || "保存生成记录失败。";
    throw new Error(message);
  }

  return Array.isArray(data) ? data[0] : data;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

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
      sendJson(res, 401, { error: "请先登录后再生成文案。" });
      return;
    }

    const user = await getSupabaseUser({ supabaseUrl, serviceRoleKey, token });
    if (!user || !user.id) {
      sendJson(res, 401, { error: "登录状态已过期，请重新登录。" });
      return;
    }

    await enforceGenerationLimit({ supabaseUrl, serviceRoleKey, userId: user.id });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const input = normalizePayload(body);
    const validationError = validateInput(input);
    if (validationError) {
      sendJson(res, 400, { error: validationError });
      return;
    }

    const generated = await generateCopy(input);
    const saved = await insertGeneration({
      supabaseUrl,
      serviceRoleKey,
      row: {
        user_id: user.id,
        product_name: input.product_name,
        intro: input.intro,
        audience: input.audience,
        selling_points: input.selling_points,
        channel: input.channel,
        input,
        output: generated.output,
        status: "success",
        model: generated.model
      }
    });

    sendJson(res, 200, { generation: saved });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.message || "生成失败，请稍后重试。"
    });
  }
};
