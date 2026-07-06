(function () {
  const data = window.MockSaaS || { scenarios: [], plans: [], faq: [] };

  function money(value) {
    return value === 0 ? "$0" : `$${value}`;
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
        const suffix = price === 0 ? "/月" : cycle === "yearly" ? "/年" : "/月";
        const actionClass = plan.highlight ? "primary" : "secondary";
        return `
          <article class="pricing-card ${plan.highlight ? "highlight" : ""}">
            <div class="plan-title-row">
              <h3>${plan.name}</h3>
              ${plan.highlight ? '<span class="tag">推荐</span>' : ""}
            </div>
            <p>${plan.desc}</p>
            <div class="price"><strong>${money(price)}</strong><span>${suffix}</span></div>
            <ul class="feature-list">
              ${plan.features.map((feature) => `<li>${feature}</li>`).join("")}
            </ul>
            <a class="btn ${actionClass} full" href="../app/billing.html">${plan.cta}</a>
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

  renderScenarios();
  renderPricing();
  renderFaq();
  bindPricingCycle();
})();
