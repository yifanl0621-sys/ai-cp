# Stripe Pro 付费接入步骤

这次先跑通最小主流程：Free / Pro / Team 展示，Pro 点击后跳转 Stripe Checkout，支付成功后通过 webhook 写入数据库并升级 `profiles.plan`。

## 本次改了哪些文件

- `app/billing.html`：套餐页，展示 Free / Pro / Team。
- `assets/billing.js`：点击 Pro 升级，创建 Stripe Checkout 并跳转。
- `api/billing/create-checkout-session.js`：创建 Stripe Checkout Session。
- `api/billing/webhook.js`：接收 Stripe 支付成功事件，写入 `billing_records`，更新 `profiles.plan`。
- `supabase/billing_records.sql`：创建支付记录表。
- `api/generations.js`：Free 用户每日最多生成 3 次，Pro/Team 不限制。
- `scripts/dev-server.mjs`：本地开发服务器增加 Stripe API 路由。
- `.env.example`：增加 Stripe 环境变量模板。

## 第 1 步：创建 billing_records 表

在 Supabase 后台手动操作：

1. 打开 Supabase 项目。
2. 进入 `SQL Editor`。
3. 新建 Query。
4. 复制 `supabase/billing_records.sql` 的全部内容。
5. 点击 `Run`。

这会创建：

```sql
billing_records (
  id uuid primary key,
  user_id uuid,
  plan_code text,
  billing_cycle text,
  amount_cents int,
  status text,
  created_at timestamptz
)
```

代码里还额外保存了 Stripe session id，用来避免重复写入。

## 第 2 步：Stripe 后台创建 Pro 价格

在 Stripe 后台手动操作：

1. 打开 Stripe Dashboard。
2. 切到 `Test mode`。
3. 进入 `Product catalog`。
4. 创建产品，例如 `CopyPilot Pro`。
5. 添加价格，例如每月 29 元。
6. 复制价格 ID，它通常长这样：

```text
price_xxxxxxxxx
```

把它填入 `.env.local`：

```text
STRIPE_PRO_PRICE_ID=price_xxxxxxxxx
```

## 第 3 步：配置 .env.local

项目根目录的 `.env.local` 至少需要这些 Stripe 变量：

```text
APP_URL=http://127.0.0.1:5050
STRIPE_SECRET_KEY=sk_test_xxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
STRIPE_CHECKOUT_MODE=subscription
```

注意：

- `STRIPE_SECRET_KEY` 必须是测试模式的 secret key。
- `STRIPE_PRO_PRICE_ID` 必须是 Stripe 后台 Pro 套餐的 price id。
- `STRIPE_WEBHOOK_SECRET` 需要下一步通过 Stripe CLI 获取。

## 第 4 步：本地启动网站

在项目根目录运行：

```bash
node scripts/dev-server.mjs
```

打开：

```text
http://127.0.0.1:5050/app/billing.html
```

## 第 5 步：本地接收 Stripe webhook

本地开发时，Stripe 不能直接访问你的电脑，所以需要 Stripe CLI 转发 webhook。

安装并登录 Stripe CLI 后运行：

```bash
stripe listen --forward-to http://127.0.0.1:5050/api/billing/webhook
```

命令行会显示一个 webhook secret，类似：

```text
whsec_xxxxxxxxx
```

把它填入 `.env.local`：

```text
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

然后重启本地服务器：

```bash
Ctrl+C
node scripts/dev-server.mjs
```

## 第 6 步：测试完整支付流程

1. 登录网站。
2. 打开 `http://127.0.0.1:5050/app/billing.html`。
3. 点击 Pro 的 `升级到 Pro`。
4. 页面会跳转到 Stripe Checkout。
5. 使用 Stripe 测试卡：

```text
4242 4242 4242 4242
```

过期时间填未来日期，CVC 随便填 3 位。

6. 支付成功后会返回：

```text
http://127.0.0.1:5050/app/billing.html?checkout=success
```

7. 去 Supabase `billing_records` 表查看是否新增记录。
8. 去 Supabase `profiles` 表查看该用户的 `plan` 是否变成 `Pro`。
9. 回到生成工作台，Pro 用户不再受每日 3 次限制。

## 常见问题

如果支付成功但数据库没变化：

- 检查 `stripe listen` 是否还在运行。
- 检查 `.env.local` 的 `STRIPE_WEBHOOK_SECRET` 是否是当前 `stripe listen` 显示的值。
- 修改 `.env.local` 后是否重启了 `node scripts/dev-server.mjs`。
- 检查 Supabase 是否执行了 `supabase/billing_records.sql`。
