(function () {
  const data = window.MockSaaS;

  function money(value) {
    return value === 0 ? "¥0" : `¥${value}`;
  }

  function statusClass(status) {
    if (status === "success" || status === "paid" || status === "active") return "success";
    if (status === "pending") return "pending";
    return "failed";
  }

  function statusLabel(status) {
    const labels = {
      success: "成功",
      failed: "失败",
      pending: "处理中",
      paid: "已支付",
      refunded: "已退款",
      active: "正常",
      blocked: "已封禁"
    };
    return labels[status] || status;
  }

  function renderScenarios() {
    const target = document.querySelector("[data-scenarios]");
    if (!target) return;
    target.innerHTML = data.scenarios.map((item) => `
      <article class="card">
        <div class="accent-line ${item.color || ""}"></div>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
      </article>
    `).join("");
  }

  function renderPricing() {
    document.querySelectorAll("[data-pricing]").forEach((target) => {
      const cycle = target.getAttribute("data-cycle") || "monthly";
      target.innerHTML = data.plans.map((plan) => {
        const price = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
        const suffix = price === 0 ? "" : cycle === "yearly" ? "/月，年付" : "/月";
        return `
          <article class="pricing-card ${plan.highlight ? "highlight" : ""}">
            ${plan.highlight ? '<span class="tag">推荐</span>' : ""}
            <h3>${plan.name}</h3>
            <p>${plan.desc}</p>
            <div class="price"><strong>${money(price)}</strong><span>${suffix}</span></div>
            <ul class="feature-list">
              ${plan.features.map((feature) => `<li>${feature}</li>`).join("")}
            </ul>
            <a class="btn ${plan.highlight ? "primary" : "secondary"} full" href="../app/billing.html">${plan.cta}</a>
          </article>
        `;
      }).join("");
    });
  }

  function bindPricingCycle() {
    const buttons = document.querySelectorAll("[data-cycle-button]");
    if (!buttons.length) return;
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        document.querySelectorAll("[data-pricing]").forEach((target) => {
          target.setAttribute("data-cycle", button.dataset.cycleButton);
        });
        renderPricing();
      });
    });
  }

  function renderFaq() {
    document.querySelectorAll("[data-faq]").forEach((target) => {
      target.innerHTML = data.faq.map((item, index) => `
        <details ${index === 0 ? "open" : ""}>
          <summary>${item.q}</summary>
          <p>${item.a}</p>
        </details>
      `).join("");
    });
  }

  function renderHistory() {
    const target = document.querySelector("[data-history]");
    if (!target) return;
    const filter = target.getAttribute("data-filter") || "全部";
    const rows = data.history.filter((item) => filter === "全部" || item.channel === filter);
    target.innerHTML = rows.map((item) => `
      <article class="result-card">
        <div class="result-header">
          <div>
            <h3>${item.title}</h3>
            <div class="tag-list">
              <span class="tag">${item.channel}</span>
              <span class="chip">${item.tone}</span>
              <span class="status ${statusClass(item.status)}">${statusLabel(item.status)}</span>
            </div>
          </div>
          <small>${item.createdAt}</small>
        </div>
        <div class="copy-block">${item.output}</div>
        <div class="chip-row">
          <button class="btn secondary">再次打开</button>
          <button class="btn secondary">复制</button>
          <button class="btn ghost">删除</button>
        </div>
      </article>
    `).join("") || '<p class="empty-note">这个筛选条件下暂无记录。</p>';
  }

  function bindHistoryFilter() {
    const target = document.querySelector("[data-history]");
    const buttons = document.querySelectorAll("[data-history-filter]");
    if (!target || !buttons.length) return;
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        target.setAttribute("data-filter", button.dataset.historyFilter);
        renderHistory();
      });
    });
  }

  function renderMetrics() {
    const target = document.querySelector("[data-metrics]");
    if (!target) return;
    target.innerHTML = data.admin.metrics.map((item) => `
      <article class="metric-card">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
        <small>${item.delta}</small>
      </article>
    `).join("");
  }

  function renderUsers() {
    const target = document.querySelector("[data-users]");
    if (!target) return;
    target.innerHTML = data.admin.users.map((user) => `
      <tr>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.plan}</td>
        <td><span class="status ${statusClass(user.status)}">${statusLabel(user.status)}</span></td>
        <td>${user.lastActive}</td>
        <td>${user.generations}</td>
        <td><button class="btn secondary">${user.status === "blocked" ? "恢复" : "封禁"}</button></td>
      </tr>
    `).join("");
  }

  function renderAdminGenerations() {
    const target = document.querySelector("[data-admin-generations]");
    if (!target) return;
    target.innerHTML = data.admin.generations.map((item) => `
      <tr>
        <td>${item.id}</td>
        <td>${item.user}</td>
        <td>${item.channel}</td>
        <td>${item.tone}</td>
        <td><span class="status ${statusClass(item.status)}">${statusLabel(item.status)}</span></td>
        <td>${item.cost}</td>
        <td>${item.createdAt}</td>
      </tr>
    `).join("");
  }

  function renderOrders() {
    const target = document.querySelector("[data-orders]");
    if (!target) return;
    target.innerHTML = data.admin.orders.map((order) => `
      <tr>
        <td>${order.id}</td>
        <td>${order.user}</td>
        <td>${order.plan}</td>
        <td>${order.cycle}</td>
        <td>${order.amount}</td>
        <td><span class="status ${statusClass(order.status)}">${statusLabel(order.status)}</span></td>
        <td>${order.createdAt}</td>
      </tr>
    `).join("");
  }

  function bindAppSidebarAuth() {
    const nav = document.querySelector("[data-app-nav]");
    if (!nav) return;

    const params = new URLSearchParams(window.location.search);
    const isGuest = document.body.dataset.auth === "guest" || params.get("auth") === "guest";
    if (!isGuest) return;

    document.querySelectorAll("[data-auth-only]").forEach((item) => {
      item.hidden = true;
    });
    document.querySelectorAll("[data-guest-redirect]").forEach((link) => {
      link.setAttribute("href", "./login.html");
      link.setAttribute("aria-label", `${link.textContent.trim()}，请先登录`);
    });
  }

  function bindGenerate() {
    const form = document.querySelector("[data-generate-form]");
    const target = document.querySelector("[data-generate-result]");
    const button = document.querySelector("[data-generate-button]");
    const status = document.querySelector("[data-generate-status]");
    if (!form || !target) return;
    let timer;

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function fieldValue(name, fallback) {
      const field = form.querySelector(`[name='${name}']`);
      return field && field.value.trim() ? field.value.trim() : fallback;
    }

    function renderLoading() {
      if (button) {
        button.disabled = true;
        button.textContent = "生成中...";
      }
      if (status) {
        status.className = "status pending";
        status.textContent = "生成中";
      }
      target.innerHTML = `
        <div class="loading-state" aria-live="polite">
          <span class="spinner"></span>
          <div>
            <strong>正在生成文案</strong>
            <p>正在根据产品名称、目标用户、卖点和投放渠道生成 mock 结果。</p>
          </div>
        </div>
      `;
    }

    function renderResult() {
      const productName = escapeHtml(fieldValue("productName", "你的产品"));
      const intro = escapeHtml(fieldValue("intro", "一个值得被更多用户看见的新产品"));
      const audience = escapeHtml(fieldValue("audience", "目标用户"));
      const channel = escapeHtml(fieldValue("channel", "官网"));
      const points = [
        escapeHtml(fieldValue("point1", "更快完成营销表达")),
        escapeHtml(fieldValue("point2", "降低内容生产成本")),
        escapeHtml(fieldValue("point3", "适配不同投放渠道"))
      ];

      if (button) {
        button.disabled = false;
        button.textContent = "生成文案";
      }
      if (status) {
        status.className = "status success";
        status.textContent = "已生成";
      }

      target.innerHTML = `
        <article class="result-card marketing-result">
          <div class="result-header">
            <div>
              <h3>${productName} 的 ${channel} 文案</h3>
              <div class="tag-list">
                <span class="tag">${channel}</span>
                <span class="chip">Mock 结果</span>
                <span class="status success">生成成功</span>
              </div>
            </div>
            <small>刚刚</small>
          </div>

          <div class="result-section hero-copy">
            <span>主标题</span>
            <strong>让 ${audience} 更快写出能投放的好文案</strong>
          </div>

          <div class="result-section">
            <span>副标题</span>
            <p>${intro} 输入产品定位、目标用户和 3 个核心卖点，快速得到适合 ${channel} 的营销表达。</p>
          </div>

          <div class="result-section cta-copy">
            <span>CTA</span>
            <strong>立即生成我的第一版文案</strong>
          </div>

          <div class="result-section">
            <span>3 版短文案</span>
            <div class="short-copy-grid">
              <div class="copy-block"><strong>版本 A</strong><br>${productName} 帮你把零散想法整理成清晰 brief，让 ${audience} 少花时间反复改稿。</div>
              <div class="copy-block"><strong>版本 B</strong><br>从产品名称到投放渠道，一次生成标题、CTA 和完整文案，适合快速验证 ${channel} 转化。</div>
              <div class="copy-block"><strong>版本 C</strong><br>${points[0]}，${points[1]}，${points[2]}。把这些卖点变成用户愿意点击的表达。</div>
            </div>
          </div>

          <div class="result-section">
            <span>长文案</span>
            <div class="copy-block">
              ${productName} 是为 ${audience} 准备的 AI 营销文案工作台。它不只是生成一段文本，而是把产品名称、一句话介绍、目标用户和核心卖点组织成一份可复用的营销 brief。<br><br>
              当你需要面向 ${channel} 投放内容时，可以先明确产品解决什么问题，再突出最有说服力的三个价值点：${points.join("、")}。系统会根据这些信息生成主标题、副标题、CTA、短文案和长文案，帮助团队更快拿到第一版可讨论、可修改、可投放的内容。
            </div>
          </div>

          <div class="chip-row">
            <button class="btn primary">保存到历史</button>
            <button class="btn secondary">复制结果</button>
            <button class="btn secondary">继续编辑</button>
          </div>
        </article>
      `;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      window.clearTimeout(timer);
      renderLoading();
      timer = window.setTimeout(renderResult, 900);
    });
  }

  renderScenarios();
  renderPricing();
  renderFaq();
  renderHistory();
  renderMetrics();
  renderUsers();
  renderAdminGenerations();
  renderOrders();
  bindAppSidebarAuth();
  bindPricingCycle();
  bindHistoryFilter();
  bindGenerate();
})();
