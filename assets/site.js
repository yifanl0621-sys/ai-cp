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

  function bindGenerate() {
    const form = document.querySelector("[data-generate-form]");
    const target = document.querySelector("[data-generate-result]");
    if (!form || !target) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const product = form.querySelector("[name='product']").value || "你的产品";
      const channel = form.querySelector("[name='channel']").value;
      const tone = form.querySelector("[name='tone']").value;
      const taskName = `${channel}营销文案`;
      target.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <div>
              <h3>${taskName}</h3>
              <div class="tag-list">
                <span class="tag">${channel}</span>
                <span class="chip">${tone}</span>
                <span class="status success">模拟生成成功</span>
              </div>
            </div>
            <small>刚刚</small>
          </div>
          <div class="copy-block">
            ${product} 不只是一个功能点，而是一套可以被用户立刻理解的解决方案。把真实痛点说清楚，再给出明确行动理由，转化就不会只靠一句夸张口号。
          </div>
          <div class="copy-block">
            标题备选：<br>
            1. 让${product}成为你本周最省心的增长动作<br>
            2. 少写一小时，多拿一版能投放的营销文案<br>
            3. 从卖点到成稿，给团队一个稳定的内容工作台
          </div>
          <div class="chip-row">
            <button class="btn primary">保存到历史</button>
            <button class="btn secondary">复制结果</button>
            <button class="btn secondary">继续编辑</button>
          </div>
        </div>
      `;
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
  bindPricingCycle();
  bindHistoryFilter();
  bindGenerate();
})();
