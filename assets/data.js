window.MockSaaS = {
  scenarios: [
    {
      title: "新品上市",
      summary: "把产品定位、核心卖点和受众画像拆成结构化输入，生成落地页首屏、广告标题和小红书种草文。",
      color: "teal"
    },
    {
      title: "投放测试",
      summary: "为同一产品批量准备不同语气、利益点和渠道版本，让市场团队更快做 A/B 测试。",
      color: "coral"
    },
    {
      title: "内容复用",
      summary: "从历史记录中打开高表现文案，二次编辑为朋友圈、公众号摘要或短视频口播稿。",
      color: "yellow"
    }
  ],
  plans: [
    {
      name: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      desc: "适合刚开始验证内容场景的个人用户。",
      features: ["每月 20 次生成", "基础渠道模板", "历史记录保留 7 天"],
      cta: "开始试用"
    },
    {
      name: "Pro",
      priceMonthly: 99,
      priceYearly: 79,
      desc: "适合需要稳定产出广告、社媒和落地页文案的小团队。",
      features: ["每月 800 次生成", "品牌语气预设", "历史记录长期保存", "优先生成队列"],
      cta: "升级 Pro",
      highlight: true
    },
    {
      name: "Team",
      priceMonthly: 299,
      priceYearly: 239,
      desc: "适合内容代理商和多项目运营团队。",
      features: ["每月 3000 次生成", "多品牌工作区", "运营报表", "专属模板配置"],
      cta: "联系演示"
    }
  ],
  faq: [
    {
      q: "这个产品和普通 AI 聊天工具有什么不同？",
      a: "它围绕营销工作流设计，把产品信息、受众、渠道、语气和输出类型拆成稳定结构，便于保存、复用和运营统计。"
    },
    {
      q: "第一版会接入真实模型和支付吗？",
      a: "当前前端骨架只使用假数据，不接真实接口。后续可按 PRD 的 auth、generation、history、billing、admin 模块逐步接入。"
    },
    {
      q: "支持哪些文案类型？",
      a: "骨架中预设了小红书种草、朋友圈短文、落地页首屏、信息流广告、短视频口播和邮件触达。"
    },
    {
      q: "管理员后台能看到什么？",
      a: "后台提供用户、生成记录、支付订单和关键经营指标的页面结构，用于后续接入真实运营数据。"
    }
  ],
  history: [
    {
      id: "GEN-2407",
      title: "敏感肌修护面霜小红书种草",
      channel: "小红书",
      tone: "真实体验",
      status: "success",
      createdAt: "2026-07-05 10:30",
      output: "换季泛红时，我会先停掉复杂护肤，只留这支修护面霜。它不是一上脸就假滑的厚重感，而是把干痒和紧绷慢慢压下去。"
    },
    {
      id: "GEN-2398",
      title: "AI 简历工具落地页首屏",
      channel: "落地页",
      tone: "高转化",
      status: "success",
      createdAt: "2026-07-04 21:18",
      output: "用 5 分钟把普通简历改成面试官愿意读下去的版本。AI 帮你提炼岗位关键词、重写项目成果，并给出可直接修改的建议。"
    },
    {
      id: "GEN-2389",
      title: "本地咖啡店周末活动文案",
      channel: "朋友圈",
      tone: "温暖",
      status: "success",
      createdAt: "2026-07-04 15:42",
      output: "这个周末，给自己留一杯慢下来的咖啡。到店点任意手冲，可领取一张下次半价券。"
    },
    {
      id: "GEN-2371",
      title: "SaaS 客户唤醒邮件",
      channel: "邮件",
      tone: "专业",
      status: "failed",
      createdAt: "2026-07-03 18:05",
      output: "模型超时，未生成内容。"
    }
  ],
  admin: {
    metrics: [
      { label: "用户总数", value: "12,480", delta: "+8.4%" },
      { label: "今日生成", value: "4,126", delta: "+12.7%" },
      { label: "MRR", value: "¥86,420", delta: "+5.2%" },
      { label: "套餐转化率", value: "9.8%", delta: "+1.1%" }
    ],
    users: [
      { email: "founder@brightapp.cn", role: "user", plan: "Pro", status: "active", lastActive: "2026-07-05 16:22", generations: 128 },
      { email: "ops@rivercrm.cn", role: "user", plan: "Team", status: "active", lastActive: "2026-07-05 15:48", generations: 462 },
      { email: "maker@sideproject.io", role: "user", plan: "Free", status: "active", lastActive: "2026-07-04 22:19", generations: 17 },
      { email: "admin@copylab.cn", role: "admin", plan: "Team", status: "active", lastActive: "2026-07-05 17:04", generations: 39 },
      { email: "risk@example.com", role: "user", plan: "Free", status: "blocked", lastActive: "2026-07-02 09:11", generations: 5 }
    ],
    generations: [
      { id: "GEN-2407", user: "founder@brightapp.cn", channel: "小红书", tone: "真实体验", status: "success", cost: "1.8k tokens", createdAt: "2026-07-05 10:30" },
      { id: "GEN-2406", user: "ops@rivercrm.cn", channel: "信息流广告", tone: "高转化", status: "success", cost: "2.4k tokens", createdAt: "2026-07-05 10:12" },
      { id: "GEN-2402", user: "maker@sideproject.io", channel: "落地页", tone: "专业", status: "pending", cost: "排队中", createdAt: "2026-07-05 09:51" },
      { id: "GEN-2371", user: "founder@brightapp.cn", channel: "邮件", tone: "专业", status: "failed", cost: "超时", createdAt: "2026-07-03 18:05" }
    ],
    orders: [
      { id: "BILL-8912", user: "ops@rivercrm.cn", plan: "Team", cycle: "yearly", amount: "¥2,868", status: "paid", createdAt: "2026-07-05 14:02" },
      { id: "BILL-8896", user: "founder@brightapp.cn", plan: "Pro", cycle: "monthly", amount: "¥99", status: "paid", createdAt: "2026-07-04 20:33" },
      { id: "BILL-8870", user: "maker@sideproject.io", plan: "Pro", cycle: "monthly", amount: "¥99", status: "failed", createdAt: "2026-07-03 12:28" },
      { id: "BILL-8821", user: "olduser@example.com", plan: "Pro", cycle: "monthly", amount: "¥99", status: "refunded", createdAt: "2026-07-01 09:10" }
    ]
  }
};
