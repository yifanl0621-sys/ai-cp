# AI营销文案SaaS平台

状态：Draft v0.1

目标：明确产品边界、页面结构、数据模型与支付闭环，再进行开发

## 1. 项目定位

这是一个面向**独立开发者、小团队和内容运营者**的AI营销文案SaaS。它不是单次调用模型的Demo，而是一套带有登录、生成、历史、后台管理的完整产品。支持注册登录、文案生成、历史管理、套餐付费和后台运营的AI营销文案工作台。

![image-20260704222948862](C:\Users\BBG\AppData\Roaming\Typora\typora-user-images\image-20260704222948862.png)

## 1.1 技术选型建议

- 前端框架：`Next.js App Router`
- 用户鉴权：`Supabase Auth`
- 数据库：`Supabase Postgres`
- 支付：`Stripe`
- AI 能力：统一后端适配层对接第三方大模型 API

站点入口约定：

- 官网前台：`www.xxx.com`
- 用户工作台：`app.xxx.com`
- 后台管理台：`admin.xxx.com`

## 1.2 竞品分析

### 1.2.1 结论先行

Jasper 和 Copy.ai 已经不再把自己定位为“AI文案生成器”，而是在向更高价值的 **营销工作流平台 / GTM 自动化平台** 升级。

**Jasper 的核心竞争力** ：“品牌一致性 + 营销内容生产 + 企业级治理”。它强调 Jasper IQ（品牌智能层 / 品牌大脑）、Brand Voice（品牌音色 / 品牌语调）、Style Guide（写作格式规范手册）、Knowledge（ 品牌知识库）、Marketing Agents（营销智能 AI 代理）、Content Pipelines （内容自动化流水线）等能力，适合品牌方、内容团队、市场团队在多渠道批量产出内容时保持统一品牌表达。Jasper 官网明确强调它是为 marketing team 构建的，不是通用聊天机器人，并且通过 Jasper IQ 将品牌声音、风格指南、受众画像、产品知识嵌入到输出中。

**Copy.ai 的核心竞争力** ：“GTM（Go-to-Market市场推广） 工作流自动化”。它从早期 AI copywriting 工具转向 Go-to-Market AI Platform，重点不是单篇文案生成，而是

把销售、市场、运营中的重复流程自动化，例如销售线索研究（主动挖掘、筛选潜在客户（销售线索），分析客户公司、负责人、业务痛点、需求，用来精准写推广文案、冷开发邮件）、CRM enrich（客户管理系统线索补全）、SEO文章（面向搜索引擎优化的长文博客，目标是在搜索页面排名，免费获取自然流量）、销售邮件、ABM（Account-Based Marketing，客户定向营销）、翻译本地化等。Copy.ai 官网把 Workflows（自动化流水线）、Actions（基础动作块）、Agents（专业 AI 代理）、Tables（数据表）、Infobase（企业知识库）、Brand Voice（品牌音色 / 品牌语调）、Chat （AI 对话）作为平台核心组件。

### 1.2.2 竞品对比

| 维度     | Jasper                                                       | Copy.ai                                                      |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 当前定位 | AI/agentic marketing platform，面向市场团队的品牌一致性内容生产和营销执行 | GTM AI Platform，面向销售、市场、运营团队的 go-to-market 工作流自动化 |
| 主要用户 | 内容营销、产品营销、绩效营销、品牌营销、PR、活动营销等市场角色 | Marketing、Sales、Operations、Sales Development 等 GTM 团队  |
| 核心能力 | Jasper IQ、Brand Voice、Style Guide、Knowledge、Marketing Agents、Content Pipelines、Canvas、Grid、AI Studio、API、图片能力 | Workflows、Actions、Agents、Tables、Infobase、Brand Voice、Chat、CRM/GTM集成、批量工作流 |
| 产品重心 | 品牌一致性、内容规模化、多渠道campaign（营销活动）产出、企业治理 | 复杂业务流程编排、销售/市场自动化、系统集成、GTM效率         |
| 定价策略 | Pro 公开价：$59/月年付或 $69/月月付；（包含面向多品牌内容创建和 campaign 协作的高级 AI 功能）<br />Business 为定制价 | Chat：$29/月月付或 $24/月年付；<br />Agents: $211/月付或$249/月年付；<br />Growth：$1,000/月年付；<br />Expansion：$2,000/月年付；<br />Scale：$3,000/月年付；<br />Enterprise 定制 |
| 适合客户 | 品牌方、内容团队、营销团队、内容代理商、中大型企业           | 成长型B2B团队、中大型销售/市场/运营团队、需要流程自动化的企业 |
| 主要壁垒 | 品牌知识层（Brand Voice 品牌语调 + Style Guide 格式规范 + Knowledge 知识库）<br />营销Agent、团队协同、品牌治理、企业级产品体验 | 工作流编排、GTM系统集成、批量处理、企业安全、销售市场流程沉淀（可重复复用） |



## 1.2.3 Jasper

#### 1.2.3.1 产品定位

为**营销团队**提供品牌一致、可规模化、可治理的AI内容生产平台。

#### 1.2.3.2 核心功能拆解

- 品牌资产管理：可以根据品牌内容本身细调voice，tone，style和visual guidelines
- 营销Agent与工作流：支持具体营销任务如SEO，email，社媒等，可自定义agent
- 内容生产系统：Canvas营销画布、Grid智能表格、内容流水线、图像流水线（批量自动化）、API、MCP等
- 企业集成与安全：提供API用于集成到现有应用或营销技术栈

#### 1.2.3.3 优势

- 品牌一致性
- 面向营销团队
- 企业化能力

#### 1.2.3.4 不足与可切入机会

- 价格门槛高
- 适合英文与国际化营销环境
- 需要人工复核

## 1.2.4 Copy.ai

#### 1.2.4.1 产品定位

面向销售、市场、运营团队自动化Go-To-Market(GTM)流程的AI内容生产平台。

#### 1.2.4.2 核心功能拆解

- workflows：串联流程与最佳实践
- Actions、Agents、Tables：平台组件，Actions是工作流的积木，Agents自动执行任务，Tables是平台内置结构化统一数据层（所有功能数据源）
- GTM场景覆盖：Sales，Marketing、Operations
- 企业级安全与实施：AICPA SOC 2（美国SaaS安全审计报告）、GDPR（个人隐私法律合规）、SSO （账号权限管控技术）等安全能力

#### 1.2.3.3 优势

- 业务流程自动化：找客户-研究客户-生成个性化触达-同步CRM-沉淀数据
- GTM视角：不只marketing
- 团队和企业定价激进：chat计划给5 seats和unlimited words in chat，Growth价格为$1,000/月年付，主动筛选更高客单客户

#### 1.2.3.4 不足与可切入机会

- 中小客户过重：workflow定价
- 产品复杂，对于只想快速生成营销内容的用户，学习成本高
- 文案质量不是重心，GTM自动化是重心

## 1.2.5 产品借鉴点

- 借鉴 `Jasper` 的官网表达方式：强调营销团队场景、价值主张、平台能力和 CTA 转化

  ![image-20260705111038790](C:\Users\BBG\AppData\Roaming\Typora\typora-user-images\image-20260705111038790.png)

  - **Free Trial 7 天免费试用**：自己注册账号，独立登录后台完整实操产品，自主测试全部功能，面向个人创作者、中小市场团队，自助体验转化；

  - **Book a Demo 产品演示**：预约销售 1v1 线上讲解，销售按你的行业、营销流程定制演示，**不给你独立账号实操**，面向中大型企业、代理商、多团队采购客户，用于企业采购尽调、定制方案洽谈

- 借鉴 `Jasper` 的工作台思路：让“生成”不是一个孤立按钮，而是一个带上下文和多种产出类型的工作空间

- 借鉴 `Copy.ai` 的产品形态：把不同输出场景拆成清晰工作流，而不是把所有功能堆在一个输入框里

- 因此本项目的首页、工作台、套餐页和后台运营页，都应该更像一个真实营销 SaaS，而不是单页工具

## 1.2.6 竞品页面拆解

- `Jasper` 官网首页
  - Hero、品牌价值表达、工作流/Agent 介绍、演示 CTA、企业化信任背书
- `Jasper` 的 Agent / Workflow 类页面
  - 不是单纯展示一个文本框，而是强调“场景 -> 输入上下文 -> 输出结果”的完整工作流
- `Copy.ai` 的 Workflow / GTM 类页面
  - 不同营销任务如何拆成不同工作区和模板入口

因此本项目建议页面设计不是“一个输入框 + 一个结果框”，而是：

- 首页负责转化
- 工作台负责结构化输入与输出管理
- 历史页负责内容复用
- 套餐页负责商业化
- 后台负责运营视角

## 1.3 目标用户与核心目标

目标用户：

- 想快速生成营销文案的独立开发者
- 需要批量产出广告、落地页、社媒文案的小团队
- 管理套餐、用户和生成记录的管理员

核心目标：

- 用户能在 5 分钟内注册并完成第一次文案生成
- 用户能查看历史生成结果并二次编辑
- 产品能完成从生成到支付升级的基本闭环

## 1.4 MVP 范围

第一版必须包含：

- 官网首页
- 注册/登录
- 文案生成工作台
- 历史记录页
- 套餐页
- 支付/订阅能力
- 后台查看用户、生成记录和支付数据

第一版不做：

- 团队协作
- 多语言翻译链路
- 复杂工作流编排
- 模板市场

## 1.5 角色与权限

| 角色     | 权限                               |
| -------- | ---------------------------------- |
| 游客     | 浏览官网、注册登录                 |
| 注册用户 | 生成文案、查看历史、管理套餐       |
| 管理员   | 查看用户、生成数据、支付和运营数据 |

## 1.6 页面架构

当前 PRD 定义为 `3 套入口，10 个大页面`：

- 官网前台 `1` 个大页面
- 用户工作台 `5` 个大页面
- 后台管理台 `4` 个大页面

### 1.6.1 官网前台

#### 1.6.1.1 官网首页 `www:/`

核心功能：

- Hero 与 CTA（主区域，大标题、副标题、主视觉、2个核心按钮、辅助小字）

- 场景介绍
- 输出示例
- 套餐预览
- FAQ（常见问题 / 问答专区）

### 1.6.2 用户工作台

#### 1.6.2.1 登录页 `app:/login`

核心功能：

- 邮箱密码登录
- 第三方登录
- 跳转注册

#### 1.6.2.2 注册页 `app:/register`

核心功能：

- 新用户注册
- 同意条款
- 注册完成跳转工作台

#### 1.6.2.3 生成工作台 `app:/generate`

核心功能：

- 输入产品信息、受众、渠道、卖点
- 选择输出类型和语气
- 发起生成
- 查看生成结果
- 保存和再次编辑

#### 1.6.2.4 历史记录页 `app:/history`

核心功能：

- 查看历史文案
- 按时间/类型筛选
- 再次打开、复制、删除

#### 1.6.2.5 套餐页 `app:/billing`

核心功能：

- 查看 Free / Pro / Team 套餐
- 月付/年付切换
- 发起支付
- 查看当前套餐权益

### 1.6.3 后台管理台

#### 1.6.3.1 后台首页 `admin:/`

核心功能：

- 用户总数
- 生成次数
- 付费收入
- 转化概览

#### 1.6.3.2 用户管理 `admin:/users`

核心功能：

- 查看用户列表
- 查看套餐状态
- 查看最近活跃
- 封禁/恢复

#### 1.6.3.3 生成记录 `admin:/generations`

核心功能：

- 查看生成内容与次数
- 查看失败记录
- 查看高频模板和渠道（最终要投放的营销载体类型）分布

#### 1.6.3.4 支付与订阅 `admin:/billing`

核心功能：

- 查看支付订单
- 查看订阅状态
- 查看退款与失败订单

![思维导图](C:\Users\BBG\Downloads\思维导图.png)

## 1.7 关键用户链路

关键状态流：

- 游客 -> 注册用户
- 免费用户 -> 付费用户
- 生成中 -> 生成成功 / 生成失败
- 订单处理中 -> 支付成功 / 支付失败

![image-20260705153536451](C:\Users\BBG\AppData\Roaming\Typora\typora-user-images\image-20260705153536451.png)

## 1.8 后端实现

### 1.8.1 后端模块表

| 后端模块     | 含义               | 功能                                                     |
| ------------ | ------------------ | -------------------------------------------------------- |
| `auth`       | 用户认证与权限管理 | 用户注册、登录、退出、账号权限、管理员权限               |
| `generation` | AI 内容生成模块    | 调用大模型生成的文案                                     |
| `history`    | 历史记录模块       | 保存用户生成过的文案、编辑记录、版本记录等               |
| `billing`    | 计费与订阅模块     | 免费、会员套餐、团队版订阅、支付状态                     |
| `analytics`  | 数据分析模块       | 户使用次数、生成成功率、热门模板、转化漏斗、内容表现数据 |
| `admin`      | 后台管理模块       | 平台管理员查看用户、订单、模板、模型调用情况、异常数据   |

## 1.8.2 数据表

``` profiles (
profiles ( 
  id uuid primary key,
  email text,
  role text,
  plan text,
  created_at timestamptz
)

generation_records (
  id uuid primary key,
  user_id uuid,
  input_payload jsonb,
  output_payload jsonb,
  channel text,
  tone text,
  status text,
  created_at timestamptz
)

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

| 表名                 | 模块                 | 作用                                     | 典型使用场景                                   |
| -------------------- | -------------------- | ---------------------------------------- | ---------------------------------------------- |
| `profiles`           | auth                 | 存储用户基础资料、角色、套餐信息         | 登录后识别用户身份、判断用户权限、判断当前套餐 |
| `generation_records` | generation / history | 存储每一次 AI 文案生成的输入、输出和状态 | 查看历史生成记录、统计生成次数、排查生成失败   |
| `billing_records`    | billing              | 存储用户购买套餐、续费、支付状态等记录   | 判断用户是否付费、查看订单、处理订阅和账单     |

- ER图：

```Mermaid
erDiagram
    profiles {
        uuid id PK
        text email
        text role
        text plan
        timestamptz created_at
    }

    generation_records {
        uuid id PK
        uuid user_id FK
        jsonb input_payload
        jsonb output_payload
        text channel
        text tone
        text status
        timestamptz created_at
    }

    billing_records {
        uuid id PK
        uuid user_id FK
        text plan_code
        text billing_cycle
        int amount_cents
        text status
        timestamptz created_at
    }

    profiles ||--o{ generation_records : "has"
    profiles ||--o{ billing_records : "has"
```



### 1.8.2.1 `profiles`

| 字段名       | 类型          | 是否关键字段 | 含义                                  | 示例                     |
| ------------ | ------------- | ------------ | ------------------------------------- | ------------------------ |
| `id`         | `uuid`        | 主键         | 用户唯一 ID。每个用户只有一个唯一标识 | `a3f2...`                |
| `email`      | `text`        | 是           | 用户邮箱，用于登录、通知、账号识别    | `user@example.com`       |
| `role`       | `text`        | 是           | 用户角色，用于权限控制                | `user` / `admin`         |
| `plan`       | `text`        | 是           | 当前套餐类型，用于判断用户权益        | `free` / `pro` / `team`  |
| `created_at` | `timestamptz` | 是           | 用户创建时间，带时区                  | `2026-07-05 10:00:00+08` |

### 1.8.2.1 ``generation_records``

| 字段名           | 类型          | 是否关键字段 | 含义                                  | 示例                                                    |
| ---------------- | ------------- | ------------ | ------------------------------------- | ------------------------------------------------------- |
| `id`             | `uuid`        | 主键         | 每次生成任务的唯一ID                  | `b7e1...`                                               |
| `user_id`        | `uuid`        | 外键         | 发起生成的用户 ID，对应 `profiles.id` | `a3f2...`                                               |
| `input_payload`  | `jsonb`       | 是           | 用户输入的生成参数，适合存复杂结构    | `{ "product": "修护面霜", "audience": "敏感肌女生" }`   |
| `output_payload` | `jsonb`       | 是           | AI 返回的生成结果，可以包含多条文案   | `{ "titles": [...], "body": "...", "hashtags": [...] }` |
| `channel`        | `text`        | 是           | 生成内容适用的平台/渠道               | `xiaohongshu` / `douyin` / `wechat`                     |
| `tone`           | `text`        | 否           | 文案语气风格                          | `种草` / `专业` / `真实体验` / `高转化`                 |
| `status`         | `text`        | 是           | 生成任务状态                          | `pending` / `success` / `failed`                        |
| `created_at`     | `timestamptz` | 是           | 生成时间                              | `2026-07-05 10:30:00+08`                                |

### 1.8.2.2 `billing_records`

| 字段名          | 类型          | 是否关键字段 | 含义                             | 示例                                                         |
| --------------- | ------------- | ------------ | -------------------------------- | ------------------------------------------------------------ |
| `id`            | `uuid`        | 主键         | 每一条计费记录的唯一 ID          | `c9d4...`                                                    |
| `user_id`       | `uuid`        | 外键         | 付费用户 ID，对应 `profiles.id`  | `a3f2...`                                                    |
| `plan_code`     | `text`        | 是           | 用户购买的套餐代码               | `pro` / `team` / `free`                                      |
| `billing_cycle` | `text`        | 是           | 计费周期                         | `monthly` / `yearly`                                         |
| `amount_cents`  | `int`         | 是           | 支付金额，单位为分，避免小数误差 | `9900` 表示 99 元                                            |
| `status`        | `text`        | 是           | 支付或订阅状态                   | `pending` / `paid` / `failed` / `refunded`<br />(处理中/支付成功/支付失败/已退款) |
| `created_at`    | `timestamptz` | 是           | 订单创建时间                     | `2026-07-05 11:00:00+08`                                     |

## 1.9 后台指标与监控

后台建议至少查看这些指标：

- 新增注册用户数
- 日活跃生成用户数
- 文案生成总次数
- 生成成功率 / 失败率
- 套餐转化率
- 付费收入与退款率
- 高峰时段生成请求量

基础监控建议：

- 模型调用成功率
- 接口平均耗时
- 支付回调成功率
- 数据库连接与慢查询
- 关键任务错误日志

## 1.10 功能清单

必须完成：

- 官网价值展示
- 注册/登录
- 结构化文案输入
- 文案生成结果展示
- 历史记录管理
- 套餐与支付
- 后台用户与生成数据查看

可选增强：

- 文案模板库
- 不同语气/渠道预设
- 结果二次编辑
- 复制和导出
- 团队共享工作区



## 1.11 接口草案

| 方法     | 路径                     | 说明             |
| -------- | ------------------------ | ---------------- |
| `POST`   | `/api/auth/register`     | 注册             |
| `POST`   | `/api/auth/login`        | 登录             |
| `POST`   | `/api/generations`       | 创建文案生成任务 |
| `GET`    | `/api/generations/:id`   | 获取生成结果     |
| `GET`    | `/api/history`           | 获取历史记录     |
| `DELETE` | `/api/history/:id`       | 删除历史记录     |
| `GET`    | `/api/billing/plans`     | 获取套餐         |
| `POST`   | `/api/billing/checkout`  | 创建支付会话     |
| `GET`    | `/api/admin/overview`    | 获取后台总览     |
| `GET`    | `/api/admin/users`       | 获取用户列表     |
| `GET`    | `/api/admin/generations` | 获取生成记录列表 |



## 1.12 非功能要求

- 生成过程要有清晰加载和失败反馈
- 用户历史记录只能自己可见
- 支付状态和套餐状态要一致
- 后台能按日查看生成量和付费数据
- 首页和工作台都需要移动端可用



## 1.13 开发顺序建议

1. 搭官网和登录注册页
2. 实现生成工作台
3. 接入鉴权和数据库
4. 接入模型生成接口
5. 实现历史记录
6. 接入支付与套餐
7. 实现后台运营页



## 1.14 待确认项

- 是否默认只做单次生成，不做批量生成
- 支付是先做月付，还是月付和年付都做
- 是否需要在第一版加入模板库



![image-20260705172023464](C:\Users\BBG\AppData\Roaming\Typora\typora-user-images\image-20260705172023464.png)

