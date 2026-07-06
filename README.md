# AI 营销文案 SaaS 平台

这是一个 AI 营销文案 SaaS MVP，包含三个入口：

- `www/`：官网首页、定价页、FAQ
- `app/`：登录、注册、生成工作台、历史记录、套餐页
- `admin/`：后台首页、用户管理、生成记录、支付与订阅

当前项目使用静态前端页面 + 本地 Node API：

- 前端页面在 `www/`、`app/`、`admin/`
- 后端接口在 `api/`
- Supabase SQL 在 `supabase/`
- 本地开发服务器在 `scripts/dev-server.mjs`

## 本地启动方式

### 1. 确认已安装 Node.js

在命令行里运行：

```bash
node -v
```

能看到版本号就说明已经安装。

### 2. 创建本地环境变量文件

项目根目录需要有：

```text
.env.local
```

这个文件只给本地电脑使用，不要提交到 GitHub。

### 3. 启动本地服务器

在项目根目录运行：

```bash
node scripts/dev-server.mjs
```

然后打开：

```text
http://127.0.0.1:5050/app/login.html
```

本地服务器会同时处理：

- 前端页面
- `/api/generations`
- `/api/billing/create-checkout-session`
- `/api/billing/webhook`

## `.env.local` 说明

`.env.local` 保存后端密钥和本地配置，必须继续保留在 `.gitignore` 里，不要上传 GitHub。

示例：

```text
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的 service_role key

AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=你的 DashScope API Key
DASHSCOPE_MODEL=qwen-max
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

APP_URL=http://127.0.0.1:5050

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_CHECKOUT_MODE=subscription
```

如果你使用 OpenAI，而不是 DashScope，可以改成：

```text
AI_PROVIDER=openai
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

注意：

- `SUPABASE_SERVICE_ROLE_KEY` 只能放在后端环境变量里。
- 不要把 `SUPABASE_SERVICE_ROLE_KEY` 写进任何前端文件。
- 前端可以公开使用的是 `assets/supabase-config.js` 里的 `anonKey`。

## 前端 Supabase 配置

浏览器登录需要读取：

```text
assets/supabase-config.js
```

文件内容应该是：

```js
window.CopyPilotSupabaseConfig = {
  url: "https://你的项目.supabase.co",
  anonKey: "你的 anon public key"
};
```

这里的 `anonKey` 是前端公开 key，可以提交到 GitHub。

不要在这个文件里放：

```text
SUPABASE_SERVICE_ROLE_KEY
service_role
```

## Supabase SQL 执行顺序

进入 Supabase 后台：

```text
SQL Editor > New query
```

按顺序执行下面 4 个文件里的 SQL。

### 1. 创建 profiles 表

执行：

```text
supabase/profiles.sql
```

作用：

- 创建 `profiles` 表
- 开启 RLS
- 创建注册后自动写入 profile 的触发器

### 2. 创建 generations 表

执行：

```text
supabase/generations.sql
```

作用：

- 保存用户输入
- 保存 AI 生成结果
- 支持历史记录读取

### 3. 创建 billing_records 表

执行：

```text
supabase/billing_records.sql
```

作用：

- 保存 Stripe 支付记录
- 记录套餐、金额、状态、时间

### 4. 创建 admin 读取权限

执行：

```text
supabase/admin_policies.sql
```

作用：

- 允许 `role = admin` 的用户读取后台数据
- 后台页面才能看到用户、生成记录、支付记录

## 设置管理员账号

先注册一个普通账号，然后在 Supabase SQL Editor 执行：

```sql
update public.profiles
set role = 'admin'
where email = '你的登录邮箱';
```

检查是否成功：

```sql
select id, email, role, plan
from public.profiles
where email = '你的登录邮箱';
```

看到 `role = admin` 后，就可以访问：

```text
http://127.0.0.1:5050/admin/index.html
```

## Stripe webhook 配置

### 本地 webhook

本地电脑不能直接被 Stripe 访问，所以本地测试要使用 Stripe CLI。

启动本地服务器：

```bash
node scripts/dev-server.mjs
```

再开一个命令行窗口，运行：

```bash
stripe listen --forward-to http://127.0.0.1:5050/api/billing/webhook
```

命令行会显示一个 webhook secret，长这样：

```text
whsec_xxxxx
```

把它填到 `.env.local`：

```text
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

修改后需要重启本地服务器。

### 线上 webhook

部署上线后，进入 Stripe Dashboard：

```text
Developers > Webhooks > Add endpoint
```

Endpoint URL 填：

```text
https://你的线上域名/api/billing/webhook
```

监听事件至少包含：

```text
checkout.session.completed
invoice.paid
invoice.payment_succeeded
```

创建后复制线上 webhook secret：

```text
whsec_xxxxx
```

把它填到部署平台的环境变量：

```text
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

注意：`STRIPE_WEBHOOK_SECRET` 必须是 `whsec_...`，不是 `acct_...`。

## 线上部署步骤

下面以 Vercel 为例。

### 1. 推送代码到 GitHub

确保不要提交：

```text
.env
.env.local
.env.*.local
```

可以提交：

```text
assets/supabase-config.js
```

因为它只包含 Supabase URL 和 anon public key。

### 2. 在 Vercel 导入 GitHub 仓库

进入 Vercel：

```text
Add New > Project
```

选择你的 GitHub 仓库。

### 3. 配置生产环境变量

进入：

```text
Project Settings > Environment Variables
```

添加：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AI_PROVIDER
DASHSCOPE_API_KEY
DASHSCOPE_MODEL
DASHSCOPE_BASE_URL
APP_URL
STRIPE_SECRET_KEY
STRIPE_PRO_PRICE_ID
STRIPE_WEBHOOK_SECRET
STRIPE_CHECKOUT_MODE
```

如果你使用 OpenAI，还需要：

```text
OPENAI_API_KEY
OPENAI_MODEL
OPENAI_BASE_URL
```

线上 `APP_URL` 必须是正式域名，例如：

```text
https://你的项目.vercel.app
```

不要用：

```text
http://127.0.0.1:5050
```

### 4. 配置 Supabase 登录地址

进入 Supabase：

```text
Authentication > URL Configuration
```

建议配置：

```text
Site URL:
https://你的线上域名

Additional Redirect URLs:
https://你的线上域名/app/login.html
https://你的线上域名/app/generate.html
http://127.0.0.1:5050
```

### 5. 配置 Stripe 线上 webhook

Endpoint URL：

```text
https://你的线上域名/api/billing/webhook
```

复制 `whsec_...` 到 Vercel 环境变量。

### 6. 重新部署

每次修改线上环境变量后，都需要重新部署。

Vercel 中可以点击：

```text
Deployments > Redeploy
```

## 部署后验证

按顺序测试：

1. 打开官网首页。
2. 注册新用户。
3. 登录后进入 `app/generate.html`。
4. 点击生成文案。
5. 到 Supabase `generations` 表确认有新记录。
6. 打开 `app/history.html`，确认能看到历史记录。
7. 打开 `app/billing.html`，点击 Pro 升级。
8. Stripe 支付成功后返回网站。
9. 到 Supabase `billing_records` 表确认有支付记录。
10. 到 Supabase `profiles` 表确认用户 `plan` 变成 `Pro`。
11. 用 admin 账号访问 `admin/index.html`。

## 常见问题排查

### 1. 登录/注册失效

检查：

- `assets/supabase-config.js` 是否存在
- 里面是否有正确的 `url` 和 `anonKey`
- Supabase Authentication URL Configuration 是否添加了当前访问域名
- 浏览器控制台是否提示 Supabase 配置缺失

### 2. 访问工作台被踢回登录页

说明当前没有有效登录状态。

处理：

- 重新登录
- 确认浏览器没有禁用本地存储
- 确认 Supabase 项目 URL 和 anon key 正确

### 3. 生成失败

检查：

- 是否已经登录
- 是否执行了 `supabase/generations.sql`
- 后端是否配置了 `SUPABASE_URL`
- 后端是否配置了 `SUPABASE_SERVICE_ROLE_KEY`
- 是否配置了 DashScope 或 OpenAI API Key
- 模型账号是否有额度

如果看到：

```text
Not found
```

说明你可能直接打开了 HTML 文件，或者没有使用支持 API 的服务器。请使用：

```bash
node scripts/dev-server.mjs
```

### 4. Free 用户生成次数受限

当前规则：

- Free 用户每天最多生成 3 次
- Pro / Team 用户不限次数

如果要解除限制，需要升级到 Pro，或在 Supabase 修改 `profiles.plan`。

### 5. 支付成功但数据库没有更新

检查：

- Stripe webhook 是否配置正确
- `STRIPE_WEBHOOK_SECRET` 是否是当前 webhook endpoint 的 `whsec_...`
- 本地测试时 `stripe listen` 是否还在运行
- 线上测试时 Stripe webhook URL 是否是正式域名
- 是否执行了 `supabase/billing_records.sql`
- Vercel 修改环境变量后是否重新部署

### 6. 支付成功后跳回了本地地址

检查线上环境变量：

```text
APP_URL
```

线上必须是：

```text
https://你的线上域名
```

不能是：

```text
http://127.0.0.1:5050
```

### 7. 后台打不开

检查：

- 当前账号是否已登录
- `profiles.role` 是否是 `admin`
- 是否执行了 `supabase/admin_policies.sql`

设置 admin：

```sql
update public.profiles
set role = 'admin'
where email = '你的登录邮箱';
```

### 8. 端口 5050 被占用

说明本地服务器可能已经在运行。

可以直接打开：

```text
http://127.0.0.1:5050/app/login.html
```

如果确实要关闭旧服务，可以在命令行找到占用 5050 的进程并结束它。
