# Supabase 登录接入步骤

这份文档按 0 基础流程写。你只需要照着做，先不用理解所有细节。

## 这次代码改了哪些文件

- `.gitignore`：忽略本地密钥配置文件 `assets/supabase-config.js`。
- `assets/supabase-config.example.js`：Supabase 配置模板，不放真实密钥。
- `assets/supabase-config.js`：本地配置文件，你需要把 Supabase URL 和 anon key 填到这里。这个文件已被忽略，不会提交到 Git。
- `assets/supabase-auth.js`：Supabase 注册、登录、退出、访问保护逻辑。
- `app/login.html`：接入真实登录表单。
- `app/register.html`：接入真实注册表单。
- `app/generate.html`、`app/history.html`、`app/billing.html`：访问前检查是否登录。
- `admin/index.html`、`admin/users.html`、`admin/generations.html`、`admin/billing.html`：访问前检查是否登录。
- `assets/styles.css`：新增登录/注册提示样式和退出按钮间距。
- `supabase/profiles.sql`：创建 `profiles` 表和注册后自动写入 profile 的 SQL。

## 第 1 步：创建 Supabase 项目

需要你手动操作：

1. 打开 Supabase 官网并登录。
2. 点击 `New project`。
3. 填项目名称，例如 `copypilot`。
4. 设置数据库密码，保存好。
5. 选择离你较近的区域。
6. 等项目创建完成。

## 第 2 步：拿到项目 URL 和 anon key

需要你手动操作：

1. 进入 Supabase 项目后台。
2. 左侧点击 `Project Settings`。
3. 点击 `API`。
4. 复制 `Project URL`。
5. 复制 `Project API keys` 里的 `anon public` key。

然后打开本地文件：

`assets/supabase-config.js`

填成这样：

```js
window.CopyPilotSupabaseConfig = {
  url: "你的 Project URL",
  anonKey: "你的 anon public key"
};
```

注意：不要把 `service_role` key 放进前端。前端只能用 `anon public` key。

## 第 3 步：创建 profiles 表和注册触发器

需要你手动操作：

1. 进入 Supabase 项目后台。
2. 左侧点击 `SQL Editor`。
3. 点击 `New query`。
4. 打开本项目里的 `supabase/profiles.sql`。
5. 把里面全部 SQL 复制到 Supabase SQL Editor。
6. 点击 `Run`。

执行后会创建这张表：

```sql
profiles (
  id uuid primary key,
  email text,
  role text,
  plan text,
  created_at timestamptz
)
```

同时会创建一个触发器：每当 Supabase Auth 新增用户，就自动向 `public.profiles` 插入一条记录。

## 第 4 步：确认登录跳转地址

需要你手动操作：

1. 进入 Supabase 项目后台。
2. 左侧点击 `Authentication`。
3. 点击 `URL Configuration`。
4. 把你的本地访问地址加入允许列表。

如果你直接用静态文件打开，建议先用本地服务器访问项目，例如：

`http://127.0.0.1:5500`

那么可以添加：

```text
http://127.0.0.1:5500
http://localhost:5500
```

如果你之后部署到线上，也要把线上域名加进去。

## 第 5 步：是否开启邮箱确认

需要你手动操作：

1. 进入 Supabase 项目后台。
2. 左侧点击 `Authentication`。
3. 点击 `Providers`。
4. 进入 `Email`。
5. 查看是否开启 `Confirm email`。

两种情况：

- 如果关闭邮箱确认：注册成功后会直接进入工作台。
- 如果开启邮箱确认：注册后会提示去邮箱点击确认链接，确认后再登录。

## 如何验证注册和登录

1. 打开 `app/register.html`。
2. 输入一个真实可用邮箱和至少 6 位密码。
3. 点击注册。
4. 如果关闭邮箱确认，会自动进入 `app/generate.html`。
5. 如果开启邮箱确认，先去邮箱点击确认链接，再打开 `app/login.html` 登录。
6. 登录成功后会跳转到 `app/generate.html`。
7. 打开 Supabase 后台，进入 `Table Editor`，查看 `profiles` 表，应该能看到刚注册用户的记录。
8. 点击页面侧边栏自动出现的 `退出登录`。
9. 退出后再访问 `app/generate.html`、`app/billing.html` 或 `admin/index.html`，应该会自动跳回 `app/login.html`。
