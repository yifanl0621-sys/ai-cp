# 前端 Supabase 配置部署说明

## 推荐方式

当前项目推荐直接提交 `assets/supabase-config.js`。

原因：

- 浏览器登录必须读取 Supabase `url` 和 `anonKey`。
- `anon public key` 是前端公开密钥，可以放在浏览器里。
- 真正不能公开的是 `SUPABASE_SERVICE_ROLE_KEY`，它只能放在后端环境变量里。

## 文件内容应该长这样

```js
window.CopyPilotSupabaseConfig = {
  url: "https://你的项目.supabase.co",
  anonKey: "你的 anon public key"
};
```

## 部署前检查

1. 确认 `assets/supabase-config.js` 存在。
2. 确认里面只有 `url` 和 `anonKey`。
3. 确认不要出现 `service_role`、`SUPABASE_SERVICE_ROLE_KEY`。
4. 确认 Supabase 表已经开启 RLS。
5. 确认已经执行这些 SQL：
   - `supabase/profiles.sql`
   - `supabase/generations.sql`
   - `supabase/billing_records.sql`
   - `supabase/admin_policies.sql`

## 为什么不推荐现在做自动生成

自动生成配置也可以，但需要增加构建脚本和部署平台环境变量。
当前项目是静态页面加轻量 API，先用提交公开配置文件的方式最简单、最稳定。
