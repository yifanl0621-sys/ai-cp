(function () {
  const config = window.CopyPilotSupabaseConfig || {};
  const hasConfig = Boolean(config.url && config.anonKey);
  const client = hasConfig && window.supabase
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  window.CopyPilotAuth = {
    client,
    isConfigured: hasConfig
  };

  const loginPath = "../app/login.html";
  const dashboardPath = "../app/generate.html";

  function isProtectedPage() {
    return document.body.matches("[data-auth-required], [data-admin-required]");
  }

  function setMessage(form, message, type) {
    const target = form && form.querySelector("[data-auth-message]");
    if (!target) return;
    target.textContent = message;
    target.className = `auth-message ${type || ""}`.trim();
    target.hidden = !message;
  }

  function redirectToLogin() {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${loginPath}?next=${next}`;
  }

  function redirectToDashboard() {
    window.location.href = dashboardPath;
  }

  function authErrorMessage(error) {
    if (!error) return "操作失败，请稍后重试。";
    if (error.message && error.message.includes("Invalid login credentials")) {
      return "邮箱或密码不正确，请重新输入。";
    }
    if (error.message && error.message.includes("Email not confirmed")) {
      return "请先打开邮箱，点击 Supabase 发给你的确认链接。";
    }
    return error.message || "操作失败，请稍后重试。";
  }

  function disableSubmit(form, disabled, text) {
    const button = form.querySelector("[type='submit']");
    if (!button) return;
    if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.disabled = disabled;
    button.textContent = disabled ? text : button.dataset.defaultText;
  }

  async function requireSession() {
    if (!isProtectedPage()) return;

    if (!client) {
      redirectToLogin();
      return;
    }

    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      redirectToLogin();
      return;
    }

    renderSession(data.session.user);
  }

  function renderSession(user) {
    if (!user) return;
    const email = user.email || "已登录用户";
    document.querySelectorAll("[data-user-email]").forEach((item) => {
      item.textContent = email;
    });
    document.querySelectorAll("[data-user-avatar]").forEach((item) => {
      item.textContent = email.slice(0, 1).toUpperCase();
    });

    document.querySelectorAll(".sidebar-user").forEach((block) => {
      const avatar = block.querySelector(".avatar");
      const name = block.querySelector("strong");
      const meta = block.querySelector("span");
      if (avatar) avatar.textContent = email.slice(0, 1).toUpperCase();
      if (name) name.textContent = email;
      if (meta && meta.textContent.includes("Pro")) meta.textContent = "当前套餐：Free";
      appendLogoutButton(block);
    });

    document.querySelectorAll(".sidebar-foot").forEach((block) => {
      appendLogoutButton(block);
    });
  }

  function appendLogoutButton(container) {
    if (!container || container.querySelector("[data-logout]")) return;
    const button = document.createElement("button");
    button.className = "btn secondary full auth-logout";
    button.type = "button";
    button.dataset.logout = "";
    button.textContent = "退出登录";
    button.addEventListener("click", signOut);
    container.appendChild(button);
  }

  async function signOut() {
    if (client) await client.auth.signOut({ scope: "local" });
    window.location.href = loginPath;
  }

  function bindLoginForm() {
    const form = document.querySelector("[data-login-form]");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(form, "", "");

      if (!client) {
        setMessage(form, "请先创建 assets/supabase-config.js，并填写 Supabase URL 和 anon key。", "error");
        return;
      }

      disableSubmit(form, true, "登录中...");
      const formData = new FormData(form);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const { error } = await client.auth.signInWithPassword({ email, password });

      disableSubmit(form, false);
      if (error) {
        setMessage(form, authErrorMessage(error), "error");
        return;
      }

      setMessage(form, "登录成功，正在进入工作台...", "success");
      window.setTimeout(redirectToDashboard, 350);
    });
  }

  function bindRegisterForm() {
    const form = document.querySelector("[data-register-form]");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(form, "", "");

      if (!client) {
        setMessage(form, "请先创建 assets/supabase-config.js，并填写 Supabase URL 和 anon key。", "error");
        return;
      }

      const terms = form.querySelector("[name='terms']");
      if (terms && !terms.checked) {
        setMessage(form, "请先勾选服务条款和隐私政策。", "error");
        return;
      }

      disableSubmit(form, true, "注册中...");
      const formData = new FormData(form);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: String(formData.get("name") || "").trim()
          }
        }
      });

      disableSubmit(form, false);
      if (error) {
        setMessage(form, authErrorMessage(error), "error");
        return;
      }

      if (data.session) {
        setMessage(form, "注册成功，正在进入工作台...", "success");
        window.setTimeout(redirectToDashboard, 350);
        return;
      }

      setMessage(form, "注册成功。请打开邮箱点击确认链接，然后回到这里登录。", "success");
    });
  }

  function bindLogout() {
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.addEventListener("click", signOut);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    requireSession();
    bindLoginForm();
    bindRegisterForm();
    bindLogout();
  });
})();
