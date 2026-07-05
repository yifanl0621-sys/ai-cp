const DEFAULT_MODEL = "gpt-4.1-mini";

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
  if (!input.product_name) return "Please enter a product name.";
  if (!input.intro) return "Please enter a short introduction.";
  if (!input.audience) return "Please enter the target audience.";
  if (!input.channel) return "Please choose a channel.";
  if (input.selling_points.length < 1) return "Please enter at least one selling point.";
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

function buildPrompt(input) {
  return [
    "Please generate Chinese marketing copy from the product brief below.",
    "Return JSON only. Do not return Markdown.",
    "",
    `Product name: ${input.product_name}`,
    `One-line introduction: ${input.intro}`,
    `Target audience: ${input.audience}`,
    `Selling points: ${input.selling_points.join("; ")}`,
    `Channel: ${input.channel}`,
    "",
    "The JSON must include: main_title, subtitle, cta, short_copies, long_copy."
  ].join("\n");
}

function safeParseOutputText(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      main_title: "Generated result needs review",
      subtitle: "The model returned non-JSON content. See long_copy.",
      cta: "Regenerate",
      short_copies: [text.slice(0, 220)],
      long_copy: text
    };
  }
}

function extractResponseText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

async function generateCopy(input) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY on the backend.");
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const { response, data } = await fetchJson(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: "You are a senior Chinese SaaS marketing copywriter. Write clear, credible, conversion-focused copy."
          },
          {
            role: "user",
            content: buildPrompt(input)
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "marketing_copy_result",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                main_title: { type: "string" },
                subtitle: { type: "string" },
                cta: { type: "string" },
                short_copies: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: { type: "string" }
                },
                long_copy: { type: "string" }
              },
              required: ["main_title", "subtitle", "cta", "short_copies", "long_copy"]
            }
          }
        }
      })
    },
    "OpenAI"
  );

  if (!response.ok) {
    const message = data.error && data.error.message ? data.error.message : data.message || "OpenAI generation failed.";
    throw new Error(message);
  }

  const text = extractResponseText(data);
  return {
    model,
    output: safeParseOutputText(text)
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
    const message = data.message || data.error || "Failed to save generation.";
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
    sendJson(res, 405, { error: "Only POST is supported." });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      sendJson(res, 500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the backend." });
      return;
    }

    const token = parseBearerToken(req);
    if (!token) {
      sendJson(res, 401, { error: "Please log in before generating copy." });
      return;
    }

    const user = await getSupabaseUser({ supabaseUrl, serviceRoleKey, token });
    if (!user || !user.id) {
      sendJson(res, 401, { error: "Your login session has expired. Please log in again." });
      return;
    }

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
    sendJson(res, 500, {
      error: error.message || "Generation failed. Please try again later."
    });
  }
};
