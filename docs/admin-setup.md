# 管理后台设置说明

## 后台页面在哪里

后台入口：

```text
http://127.0.0.1:5050/admin/index.html
```

后台包含 3 个 Tab：

- 用户列表：显示 `email`、`plan`、创建时间。
- 生成记录：显示用户、产品名、渠道、创建时间。
- 订阅状态：显示用户、套餐、支付状态。

## 第 1 步：执行后台权限 SQL

需要你在 Supabase 后台手动操作：

1. 打开 Supabase 项目。
2. 进入 `SQL Editor`。
3. 新建 Query。
4. 复制本项目里的 `supabase/admin_policies.sql`。
5. 点击 `Run`。

这一步会创建一个 `is_admin()` 函数，并允许 `role = admin` 的用户读取：

- `profiles`
- `generations`
- `billing_records`

## 第 2 步：把你的账号设为 admin

需要你在 Supabase SQL Editor 执行：

```sql
update public.profiles
set role = 'admin'
where email = '你的登录邮箱';
```

例子：

```sql
update public.profiles
set role = 'admin'
where email = 'demo@example.com';
```

执行后，你可以检查一下：

```sql
select id, email, role, plan
from public.profiles
where email = '你的登录邮箱';
```

看到 `role` 是 `admin` 就可以访问后台了。

## 第 3 步：测试后台访问

1. 用 admin 邮箱登录网站。
2. 打开：

```text
http://127.0.0.1:5050/admin/index.html
```

3. 应该能看到用户列表、生成记录、订阅状态。

如果你用普通用户访问后台，会被自动跳回工作台。
