(function () {
  const auth = window.CopyPilotAuth;
  const client = auth && auth.client;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function apiUrl(path) {
    return new URL(path, window.location.origin).toString();
  }

  async function readJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    if (response.status === 404 && text.includes("Not found")) {
      return {
        error: "后端接口 /api/generations 还没有运行。请使用支持 API 的本地开发服务器或部署到 Vercel 后再测试生成。"
      };
    }

    return {
      error: text || `请求失败，状态码：${response.status}`
    };
  }

  async function getSession() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session || null;
  }

  function formatTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function normalizeOutput(output) {
    return {
      main_title: output?.main_title || "未生成主标题",
      subtitle: output?.subtitle || "未生成副标题",
      cta: output?.cta || "立即行动",
      short_copies: Array.isArray(output?.short_copies) ? output.short_copies : [],
      long_copy: output?.long_copy || ""
    };
  }

  function renderResult(target, generation) {
    const output = normalizeOutput(generation.output);
    const shortCopies = output.short_copies.length ? output.short_copies : ["暂无短文案"];

    target.innerHTML = `
      <article class="result-card marketing-result">
        <div class="result-header">
          <div>
            <h3>${escapeHtml(generation.product_name)} 的${escapeHtml(generation.channel)}文案</h3>
            <div class="tag-list">
              <span class="tag">${escapeHtml(generation.channel)}</span>
              <span class="chip">${escapeHtml(generation.model || "AI")}</span>
              <span class="status success">已保存</span>
            </div>
          </div>
          <small>${formatTime(generation.created_at) || "刚刚"}</small>
        </div>

        <div class="result-section hero-copy">
          <span>主标题</span>
          <strong>${escapeHtml(output.main_title)}</strong>
        </div>

        <div class="result-section">
          <span>副标题</span>
          <p>${escapeHtml(output.subtitle)}</p>
        </div>

        <div class="result-section cta-copy">
          <span>CTA</span>
          <strong>${escapeHtml(output.cta)}</strong>
        </div>

        <div class="result-section">
          <span>3 版短文案</span>
          <div class="short-copy-grid">
            ${shortCopies.map((copy, index) => `
              <div class="copy-block"><strong>版本 ${index + 1}</strong><br>${escapeHtml(copy)}</div>
            `).join("")}
          </div>
        </div>

        <div class="result-section">
          <span>长文案</span>
          <div class="copy-block">${escapeHtml(output.long_copy)}</div>
        </div>
      </article>
    `;
  }

  function renderLoading(target) {
    target.innerHTML = `
      <div class="loading-state" aria-live="polite">
        <span class="spinner"></span>
        <div>
          <strong>正在生成文案</strong>
          <p>后端正在接收表单、调用模型并保存记录，请稍等几秒。</p>
        </div>
      </div>
    `;
  }

  function renderError(target, message) {
    target.innerHTML = `
      <div class="error-state" role="alert">
        <strong>生成失败</strong>
        <p>${escapeHtml(message || "生成失败，请稍后重试。")}</p>
      </div>
    `;
  }

  function getFormPayload(form) {
    const formData = new FormData(form);
    return {
      product_name: String(formData.get("productName") || "").trim(),
      intro: String(formData.get("intro") || "").trim(),
      audience: String(formData.get("audience") || "").trim(),
      selling_points: ["point1", "point2", "point3"]
        .map((name) => String(formData.get(name) || "").trim())
        .filter(Boolean),
      channel: String(formData.get("channel") || "").trim()
    };
  }

  function setGenerateState(button, status, loading, failed) {
    if (button) {
      if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
      button.disabled = loading;
      button.textContent = loading ? "生成中..." : button.dataset.defaultText;
    }
    if (status) {
      status.className = failed ? "status failed" : loading ? "status pending" : "status success";
      status.textContent = failed ? "生成失败" : loading ? "生成中" : "已生成";
    }
  }

  function bindGenerateForm() {
    const form = document.querySelector("[data-generate-form]");
    const target = document.querySelector("[data-generate-result]");
    const button = document.querySelector("[data-generate-button]");
    const status = document.querySelector("[data-generate-status]");
    if (!form || !target) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const session = await getSession();
      if (!session) {
        window.location.href = "./login.html";
        return;
      }

      setGenerateState(button, status, true, false);
      renderLoading(target);

      try {
        const response = await fetch(apiUrl("/api/generations"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify(getFormPayload(form))
        });
        const data = await readJsonResponse(response);
        if (!response.ok) {
          throw new Error(data.error || "生成失败，请稍后重试。");
        }

        setGenerateState(button, status, false, false);
        renderResult(target, data.generation);
      } catch (error) {
        setGenerateState(button, status, false, true);
        renderError(target, error.message);
      }
    });
  }

  function renderHistoryList(target, rows) {
    if (!rows.length) {
      target.innerHTML = `
        <div class="empty-state history-empty">
          <strong>还没有历史记录</strong>
          <p>去生成工作台完成第一次生成后，这里会显示你保存过的输入和输出。</p>
          <a class="btn primary" href="./generate.html">去生成文案</a>
        </div>
      `;
      return;
    }

    target.innerHTML = rows.map((item) => {
      const output = normalizeOutput(item.output);
      return `
        <article class="result-card history-card">
          <div class="result-header">
            <div>
              <h3>${escapeHtml(output.main_title)}</h3>
              <div class="tag-list">
                <span class="tag">${escapeHtml(item.channel)}</span>
                <span class="chip">${escapeHtml(item.product_name)}</span>
                <span class="status success">已保存</span>
              </div>
            </div>
            <small>${formatTime(item.created_at)}</small>
          </div>
          <div class="history-meta">
            <div><strong>目标用户</strong><span>${escapeHtml(item.audience)}</span></div>
            <div><strong>卖点</strong><span>${escapeHtml((item.selling_points || []).join(" / "))}</span></div>
          </div>
          <div class="copy-block">${escapeHtml(output.long_copy || output.subtitle)}</div>
        </article>
      `;
    }).join("");
  }

  async function loadHistory() {
    const target = document.querySelector("[data-generation-history]");
    if (!target) return;

    target.innerHTML = `
      <div class="loading-state">
        <span class="spinner"></span>
        <div>
          <strong>正在读取历史记录</strong>
          <p>正在从 Supabase 读取当前用户保存过的生成记录。</p>
        </div>
      </div>
    `;

    if (!client) {
      renderError(target, "请先配置 Supabase。");
      return;
    }

    const session = await getSession();
    if (!session) {
      window.location.href = "./login.html";
      return;
    }

    const { data, error } = await client
      .from("generations")
      .select("id,product_name,intro,audience,selling_points,channel,output,status,model,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      renderError(target, error.message);
      return;
    }

    renderHistoryList(target, data || []);
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindGenerateForm();
    loadHistory();
  });
})();
