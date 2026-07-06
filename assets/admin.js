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

  function formatTime(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function formatMoney(cents) {
    const amount = Number(cents || 0) / 100;
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  }

  function planBadge(plan) {
    const normalized = String(plan || "Free");
    const statusClass = ["pro", "team"].includes(normalized.toLowerCase()) ? "success" : "pending";
    return `<span class="status ${statusClass}">${escapeHtml(normalized)}</span>`;
  }

  function recordStatusBadge(status) {
    const normalized = String(status || "success");
    const isOk = ["success", "paid", "active", "no_payment_required"].includes(normalized.toLowerCase());
    const isBad = ["failed", "error", "refunded", "canceled"].includes(normalized.toLowerCase());
    return `<span class="status ${isOk ? "success" : isBad ? "failed" : "pending"}">${escapeHtml(normalized)}</span>`;
  }

  function setEmpty(target, colspan, text) {
    if (!target) return;
    target.innerHTML = `<tr><td colspan="${colspan}" class="empty-note">${escapeHtml(text)}</td></tr>`;
  }

  function metricCard(label, value, note) {
    return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
  }

  function metricErrorCard(label, message) {
    return `<article class="metric-card error"><span>${escapeHtml(label)}</span><strong>读取失败</strong><small>${escapeHtml(message)}</small></article>`;
  }

  function card(label, value, note, colorClass = "") {
    return `
      <article class="card">
        <div class="accent-line ${escapeHtml(colorClass)}"></div>
        <h3>${escapeHtml(label)}</h3>
        <p><strong>${escapeHtml(value)}</strong> ${escapeHtml(note)}</p>
      </article>
    `;
  }

  function countBy(rows, field) {
    return rows.reduce((map, row) => {
      const value = row[field] || "未填写";
      map.set(value, (map.get(value) || 0) + 1);
      return map;
    }, new Map());
  }

  function getTopValue(rows, field) {
    const counts = countBy(rows, field);
    let top = ["-", 0];
    counts.forEach((count, label) => {
      if (count > top[1]) top = [label, count];
    });
    return top;
  }

  async function requireAdmin() {
    if (!client) return false;

    const { data } = await client.auth.getSession();
    const user = data.session && data.session.user;
    if (!user) {
      window.location.href = "../app/login.html";
      return false;
    }

    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      window.location.href = "../app/generate.html";
      return false;
    }

    return true;
  }

  async function loadProfiles() {
    const { data, error } = await client
      .from("profiles")
      .select("id,email,plan,role,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function loadGenerations() {
    const { data, error } = await client
      .from("generations")
      .select("id,user_id,product_name,channel,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return data || [];
  }

  async function loadBillingRecords() {
    const { data, error } = await client
      .from("billing_records")
      .select("id,user_id,plan_code,billing_cycle,amount_cents,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return data || [];
  }

  function renderDashboard(profiles, generations, billingRecords, emailMap) {
    const target = document.querySelector("[data-admin-metrics]");
    if (!target) return;

    const paidUsers = profiles.filter((profile) => ["pro", "team"].includes(String(profile.plan || "").toLowerCase())).length;
    const paidRevenue = billingRecords
      .filter((row) => ["paid", "active", "no_payment_required"].includes(String(row.status || "").toLowerCase()))
      .reduce((total, row) => total + Number(row.amount_cents || 0), 0);
    const conversionRate = profiles.length ? `${Math.round((paidUsers / profiles.length) * 100)}%` : "0%";

    target.innerHTML = [
      metricCard("用户总数", profiles.length, "profiles 表"),
      metricCard("生成次数", generations.length, "最近 300 条内统计"),
      metricCard("付费收入", formatMoney(paidRevenue), "billing_records 表"),
      metricCard("付费转化", conversionRate, `${paidUsers} 个付费用户`)
    ].join("");

    renderRecentGenerations(generations.slice(0, 5), emailMap);
    renderRecentBilling(billingRecords.slice(0, 5), emailMap);
  }

  function renderRecentGenerations(rows, emailMap) {
    const target = document.querySelector("[data-admin-recent-generations]");
    if (!target) return;
    if (!rows.length) {
      setEmpty(target, 4, "暂无生成记录。");
      return;
    }

    target.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(emailMap.get(row.user_id) || row.user_id || "-")}</td>
        <td>${escapeHtml(row.product_name || "-")}</td>
        <td><span class="chip">${escapeHtml(row.channel || "-")}</span></td>
        <td>${formatTime(row.created_at)}</td>
      </tr>
    `).join("");
  }

  function renderRecentBilling(rows, emailMap) {
    const target = document.querySelector("[data-admin-recent-billing]");
    if (!target) return;
    if (!rows.length) {
      setEmpty(target, 4, "暂无支付记录。");
      return;
    }

    target.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(emailMap.get(row.user_id) || row.user_id || "-")}</td>
        <td>${planBadge(row.plan_code)}</td>
        <td>${recordStatusBadge(row.status)}</td>
        <td>${formatMoney(row.amount_cents)}</td>
      </tr>
    `).join("");
  }

  function renderUsersPage(profiles, generations) {
    const target = document.querySelector("[data-admin-users-page]");
    if (!target) return;
    if (!profiles.length) {
      setEmpty(target, 6, "暂无用户。");
      return;
    }

    const generationsByUser = countBy(generations, "user_id");
    const latestByUser = generations.reduce((map, row) => {
      if (!row.user_id) return map;
      const current = map.get(row.user_id);
      if (!current || new Date(row.created_at) > new Date(current)) map.set(row.user_id, row.created_at);
      return map;
    }, new Map());

    target.innerHTML = profiles.map((profile) => `
      <tr>
        <td>${escapeHtml(profile.email || "-")}</td>
        <td>${planBadge(profile.plan)}</td>
        <td>${formatTime(profile.created_at)}</td>
        <td>${formatTime(latestByUser.get(profile.id))}</td>
        <td>${escapeHtml(generationsByUser.get(profile.id) || 0)}</td>
        <td><button class="btn secondary" type="button" disabled>封禁</button></td>
      </tr>
    `).join("");
  }

  function renderGenerationsPage(generations, emailMap) {
    const summary = document.querySelector("[data-admin-generation-summary]");
    const table = document.querySelector("[data-admin-generations-page]");
    if (!summary && !table) return;

    const failedCount = generations.filter((row) => {
      const status = String(row.status || "success").toLowerCase();
      return ["failed", "error"].includes(status);
    }).length;
    const [topChannel, topChannelCount] = getTopValue(generations, "channel");

    if (summary) {
      summary.innerHTML = [
        card("生成总数", String(generations.length), "条记录"),
        card("失败记录", String(failedCount), "条需要排查", "coral"),
        card("高频渠道", String(topChannel), `${topChannelCount} 次`, "yellow")
      ].join("");
    }

    if (!table) return;
    if (!generations.length) {
      setEmpty(table, 5, "暂无生成记录。");
      return;
    }

    table.innerHTML = generations.map((row) => `
      <tr>
        <td>${escapeHtml(emailMap.get(row.user_id) || row.user_id || "-")}</td>
        <td>${escapeHtml(row.product_name || "-")}</td>
        <td><span class="chip">${escapeHtml(row.channel || "-")}</span></td>
        <td>${recordStatusBadge(row.status || "success")}</td>
        <td>${formatTime(row.created_at)}</td>
      </tr>
    `).join("");
  }

  function renderBillingPage(billingRecords, profiles, emailMap) {
    const summary = document.querySelector("[data-admin-billing-summary]");
    const table = document.querySelector("[data-admin-billing-page]");
    if (!summary && !table) return;

    const paidRecords = billingRecords.filter((row) => ["paid", "active", "no_payment_required"].includes(String(row.status || "").toLowerCase()));
    const issueRecords = billingRecords.filter((row) => ["failed", "refunded", "canceled"].includes(String(row.status || "").toLowerCase()));
    const paidRevenue = paidRecords.reduce((total, row) => total + Number(row.amount_cents || 0), 0);
    const proUsers = profiles.filter((profile) => String(profile.plan || "").toLowerCase() === "pro").length;

    if (summary) {
      summary.innerHTML = [
        metricCard("付费收入", formatMoney(paidRevenue), "已支付订单合计"),
        metricCard("成功订单", paidRecords.length, "paid / active"),
        metricCard("失败/退款", issueRecords.length, "failed / refunded"),
        metricCard("Pro 用户", proUsers, "profiles.plan")
      ].join("");
    }

    if (!table) return;
    if (!billingRecords.length) {
      setEmpty(table, 6, "暂无支付订单。");
      return;
    }

    table.innerHTML = billingRecords.map((row) => `
      <tr>
        <td>${escapeHtml(emailMap.get(row.user_id) || row.user_id || "-")}</td>
        <td>${planBadge(row.plan_code)}</td>
        <td>${escapeHtml(row.billing_cycle || "-")}</td>
        <td>${formatMoney(row.amount_cents)}</td>
        <td>${recordStatusBadge(row.status)}</td>
        <td>${formatTime(row.created_at)}</td>
      </tr>
    `).join("");
  }

  function renderError(message) {
    const metrics = document.querySelector("[data-admin-metrics]");
    if (metrics) {
      metrics.innerHTML = [
        metricErrorCard("用户总数", message),
        metricErrorCard("生成次数", message),
        metricErrorCard("付费收入", message),
        metricErrorCard("付费转化", message)
      ].join("");
    }

    const generationSummary = document.querySelector("[data-admin-generation-summary]");
    if (generationSummary) {
      generationSummary.innerHTML = [
        '<article class="card"><div class="accent-line coral"></div><h3>生成总数</h3><p class="empty-note">读取失败：' + escapeHtml(message) + '</p></article>',
        '<article class="card"><div class="accent-line coral"></div><h3>失败记录</h3><p class="empty-note">读取失败：' + escapeHtml(message) + '</p></article>',
        '<article class="card"><div class="accent-line coral"></div><h3>高频渠道</h3><p class="empty-note">读取失败：' + escapeHtml(message) + '</p></article>'
      ].join("");
    }

    const billingSummary = document.querySelector("[data-admin-billing-summary]");
    if (billingSummary) {
      billingSummary.innerHTML = [
        metricErrorCard("付费收入", message),
        metricErrorCard("成功订单", message),
        metricErrorCard("失败/退款", message),
        metricErrorCard("Pro 用户", message)
      ].join("");
    }

    setEmpty(document.querySelector("[data-admin-recent-generations]"), 4, message);
    setEmpty(document.querySelector("[data-admin-recent-billing]"), 4, message);
    setEmpty(document.querySelector("[data-admin-users-page]"), 6, message);
    setEmpty(document.querySelector("[data-admin-generations-page]"), 5, message);
    setEmpty(document.querySelector("[data-admin-billing-page]"), 6, message);
  }

  async function loadAdminData() {
    if (!(await requireAdmin())) return;

    try {
      const [profiles, generations, billingRecords] = await Promise.all([
        loadProfiles(),
        loadGenerations(),
        loadBillingRecords()
      ]);
      const emailMap = new Map(profiles.map((profile) => [profile.id, profile.email]));

      renderDashboard(profiles, generations, billingRecords, emailMap);
      renderUsersPage(profiles, generations);
      renderGenerationsPage(generations, emailMap);
      renderBillingPage(billingRecords, profiles, emailMap);
    } catch (error) {
      renderError(error.message || "后台数据读取失败。");
    }
  }

  document.addEventListener("DOMContentLoaded", loadAdminData);
})();
