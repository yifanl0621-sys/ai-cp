(function () {
  const auth = window.CopyPilotAuth;
  const client = auth && auth.client;
  let currentPlan = "Free";

  function showMessage(message, type) {
    const target = document.querySelector("[data-billing-message]");
    if (!target) return;
    target.hidden = false;
    target.className = `panel billing-message ${type || ""}`.trim();
    target.innerHTML = `<strong>${message}</strong>`;
  }

  async function getSession() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session || null;
  }

  async function readJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return response.json();
    return { error: await response.text() };
  }

  function normalizePlan(plan) {
    return String(plan || "Free").trim().toLowerCase();
  }

  function updateProButton(plan) {
    currentPlan = plan || currentPlan;
    const isPro = normalizePlan(currentPlan) === "pro";
    document.querySelectorAll("[data-upgrade-plan='pro']").forEach((button) => {
      if (isPro) {
        button.disabled = true;
        button.textContent = "当前已是 Pro";
        button.classList.remove("primary");
        button.classList.add("secondary");
      }
    });
    if (isPro) {
      showMessage("你当前已经是 Pro 套餐，无需重复购买。", "success");
    }
  }

  async function createCheckoutSession(button) {
    const session = await getSession();
    if (!session) {
      window.location.href = "./login.html";
      return;
    }

    if (normalizePlan(currentPlan) === "pro") {
      updateProButton(currentPlan);
      return;
    }

    const defaultText = button.textContent;
    button.disabled = true;
    button.textContent = "正在跳转...";

    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ plan_code: "pro", billing_cycle: "monthly" })
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error || "创建支付页面失败。");
      window.location.href = data.url;
    } catch (error) {
      button.disabled = false;
      button.textContent = defaultText;
      showMessage(error.message || "创建支付页面失败。", "error");
    }
  }

  function bindCheckoutButtons() {
    document.querySelectorAll("[data-upgrade-plan='pro']").forEach((button) => {
      button.addEventListener("click", () => createCheckoutSession(button));
    });
  }

  function showCheckoutReturnMessage() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      showMessage("支付已完成。Stripe webhook 处理成功后，你的套餐会自动更新为 Pro。", "success");
    }
    if (params.get("checkout") === "cancel") {
      showMessage("你已取消支付，当前套餐没有变化。", "error");
    }
  }

  document.addEventListener("copypilot:profile-ready", (event) => {
    updateProButton(event.detail.profile?.plan || "Free");
  });

  document.addEventListener("DOMContentLoaded", () => {
    showCheckoutReturnMessage();
    bindCheckoutButtons();
  });
})();
