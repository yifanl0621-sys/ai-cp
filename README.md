# AI 营销文案 SaaS 前端骨架

这是基于 `AI营销文案SaaS平台_PRD.md` 生成的静态前端骨架。当前只使用本地假数据，不连接真实接口。

## 入口

- `www/index.html`：官网首页
- `www/pricing.html`：官网定价
- `www/faq.html`：官网 FAQ
- `app/login.html`：登录
- `app/register.html`：注册
- `app/generate.html`：生成工作台
- `app/history.html`：历史记录
- `app/billing.html`：用户套餐页
- `admin/index.html`：后台首页
- `admin/users.html`：用户管理
- `admin/generations.html`：生成记录
- `admin/billing.html`：支付订单

## 共享文件

- `assets/styles.css`：全站样式
- `assets/data.js`：假数据
- `assets/site.js`：轻量页面交互

后续如果迁移到 Next.js App Router，可以把 `www`、`app`、`admin` 映射为三套入口或三组路由，并把 `assets/data.js` 中的数据替换为接口请求。
