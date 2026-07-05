# 生成营销文案并保存：0 基础接入说明

## 这次实现了什么

用户在 `app/generate.html` 填写表单后，前端会请求后端接口：

```text
POST /api/generations
```

后端会做 4 件事：

1. 验证当前用户是否已登录。
2. 接收产品名、介绍、目标用户、卖点、投放渠道。
3. 调用 OpenAI 模型生成营销文案。
4. 把输入和输出一起保存到 Supabase 的 `generations` 表。

用户下次进入 `app/history.html`，页面会读取当前登录用户自己的历史记录。

## 文件位置

前端页面：

- `app/generate.html`：生成工作台页面。
- `app/history.html`：历史记录页面。
- `assets/generations.js`：生成按钮、loading、错误提示、历史记录读取逻辑。

后端接口：

- `api/generations.js`：`POST /api/generations` 接口。

数据库 SQL：

- `supabase/generations.sql`：创建 `generations` 表和 RLS 权限。

环境变量模板：

- `.env.example`：后端需要的环境变量示例。

## generations 表字段设计

`generations` 表会保存：

- `id`：生成记录 ID。
- `user_id`：当前登录用户 ID。
- `product_name`：产品名称。
- `intro`：一句话介绍。
- `audience`：目标用户。
- `selling_points`：卖点数组，JSON 格式。
- `channel`：投放渠道。
- `input`：完整输入 JSON。
- `output`：模型输出 JSON。
- `status`：生成状态。
- `error_message`：错误信息，预留字段。
- `model`：使用的模型名称。
- `created_at`：创建时间。

## 第 1 步：在 Supabase 创建 generations 表

需要你手动操作：

1. 打开 Supabase 项目后台。
2. 进入 `SQL Editor`。
3. 点击 `New query`。
4. 打开本项目文件 `supabase/generations.sql`。
5. 复制全部 SQL。
6. 粘贴到 Supabase SQL Editor。
7. 点击 `Run`。

执行成功后，进入 `Table Editor`，应该能看到 `generations` 表。

## 第 2 步：配置后端环境变量

后端接口不能把密钥写在代码里，所以要配置环境变量。

需要准备这 3 个值：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

可选：

```text
OPENAI_MODEL
```

默认模型是：

```text
gpt-4.1-mini
```

注意：

- `SUPABASE_SERVICE_ROLE_KEY` 只能放在后端环境变量里。
- 不要把 `service_role` key 写进 `assets/supabase-config.js`。
- 前端 `assets/supabase-config.js` 只能放 `anon public key`。

## 第 3 步：测试完整生成链路

1. 确认你已经登录。
2. 打开：

```text
http://127.0.0.1:5050/app/generate.html
```

3. 填写产品名称、介绍、目标用户、卖点、投放渠道。
4. 点击 `生成文案`。
5. 按钮会显示 `生成中...`。
6. 成功后，右侧会展示：
   - 主标题
   - 副标题
   - CTA
   - 3 版短文案
   - 长文案
7. 打开 Supabase 后台 `Table Editor > generations`，应该能看到刚保存的记录。
8. 打开：

```text
http://127.0.0.1:5050/app/history.html
```

9. 应该能看到当前用户的历史生成记录。

## 生成失败时怎么看

如果生成失败，工作台右侧会出现错误提示。

常见原因：

- 没有登录。
- 没有执行 `supabase/generations.sql`。
- 后端缺少 `OPENAI_API_KEY`。
- 后端缺少 `SUPABASE_URL`。
- 后端缺少 `SUPABASE_SERVICE_ROLE_KEY`。
- OpenAI API Key 无效或余额不足。

## 本地 5050 测试方式

如果你只用普通静态预览打开页面，`/api/generations` 不会运行，页面会看到类似：

```text
Not found
```

正确方式是启动本项目提供的本地开发服务器：

```bash
node scripts/dev-server.mjs
```

然后打开：

```text
http://127.0.0.1:5050/app/login.html
```

这个开发服务器会同时处理：

- 前端页面
- `/api/generations` 后端接口

## 部署后的接口地址

部署到 Vercel 这类支持 `api/` 目录的平台后，接口会自动变成：

```text
https://你的域名/api/generations
```
