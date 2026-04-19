# Concord 技术文档

这份文档的目标不是介绍产品，而是让后续开发者快速知道：

1. 现在这套代码的结构是什么  
2. 每个接口负责什么  
3. 前端每个页面/模块应该调用哪个接口  
4. 外部依赖要接什么  
5. 如果以后要替换语音转写、LLM 或数据库，应该改哪一层  

---

## 1. 当前技术栈

- 前端：Next.js App Router + React + TypeScript
- 后端：Next.js Route Handlers + TypeScript
- 数据库：Supabase Postgres
- 文件存储：Supabase Storage
- 语音转写：OpenAI Speech-to-Text
- AI 对话：OpenAI Responses API
- 本地演示：内置 demo fallback（不配云资源也能跑页面）

这意味着：

- 前端和后端在同一个项目里
- 没有单独的 Python 服务
- 所有后端接口都挂在 `src/app/api/*`
- 真正业务逻辑不写在 `api` 里，而是写在 `src/server/*`

---

## 2. 目录怎么理解

### `src/app`

这里是 Next.js 的页面和接口入口。

- `src/app/page.tsx`
  - 根页面
  - 当前加载的是移动端工作台壳子：`Home / AI Chat / Report`
- `src/app/api/*`
  - 后端接口入口
  - 这里只做请求解析、参数校验、错误处理
  - 真正业务逻辑会调用 `src/server/*`

### `src/components`

这里放前端组件。

- `workstation-shell.tsx`
  - 当前主工作台 UI
  - 负责 `home / ai chat / report` 三个主视图的交互
- `voice-report-form.tsx`
  - 旧版老人详情页里的录音/提交表单
- `report-timeline.tsx`
  - 旧版老人详情页里的时间线和报告展示

### `src/server/services`

这里放业务服务层，解决“系统要做什么”。

- `dashboard.ts`
  - 组装首页需要的数据
- `chat.ts`
  - 处理 AI 对话
- `transcription.ts`
  - 调 OpenAI 做语音转文字
- `report-generator.ts`
  - 把转写文本变成结构化报告和可读报告
- `report-workflow.ts`
  - 管理 report 的状态流转：`processing -> ready/failed`

### `src/server/repositories`

这里放数据访问层，解决“数据从哪里来、写到哪里去”。

- `elderly-repository.ts`
  - 老人资料、老人上下文查询
- `report-repository.ts`
  - report 创建、查询、更新、时间线写入
- `demo-store.ts`
  - 没配数据库时的内存 demo 数据

### `src/lib`

这里放底层公共能力。

- `env.ts`
  - 环境变量判断
- `security.ts`
  - PIN 校验
- `openai.ts`
  - OpenAI 客户端
- `supabase/admin.ts`
  - Supabase 服务端客户端

### `src/types`

这里放前后端共享类型。

- `elderly.ts`
- `report.ts`
- `workstation.ts`
- `database.ts`

### `supabase/migrations`

这里放数据库结构。

- `202603010001_init.sql`
  - 建表、索引、触发器、seed 数据

---

## 3. 系统整体数据流

### 首页 Home

流程：

1. 前端访问 `/`
2. `WorkstationShell` 请求 `GET /api/dashboard`
3. 后端调用 `getDashboardPayload()`
4. `dashboard.ts` 内部再调用：
   - `listElders()`
   - `listReports()`
5. 返回首页排班、状态统计、最近报告状态

### AI Chat

流程：

1. 前端在 `AI Chat` 输入问题
2. 前端请求 `POST /api/chat`
3. 后端调用 `getChatReply()`
4. `chat.ts` 会：
   - 读取当前长者上下文
   - 如果有 OpenAI key，就调 OpenAI
   - 如果没有，就走本地 fallback 回复
5. 返回 AI 回复和建议问题

### Report

流程：

1. 前端在 `Report` 页选择长者，输入文字或录音
2. 前端请求 `POST /api/reports`
3. 后端依次做：
   - 校验 PIN
   - 解析表单
   - 如果上传了音频，先上传到 Supabase Storage
   - 如果上传了音频，再调用 OpenAI STT 转写
   - 创建 `care_reports`，状态为 `processing`
   - 调 `processPendingReport()`
   - 生成 `report_structured` + `report_text`
   - 更新状态为 `ready`
   - 写入 `timeline_events`
4. 返回最终 report

---

## 4. 页面与接口对应关系

### 页面：`/`

文件：

- `src/app/page.tsx`
- `src/components/workstation-shell.tsx`

这个页面当前包含 3 个前端视图：

#### Home

调用接口：

- `GET /api/dashboard`

用途：

- 展示今日巡查排班
- 展示每位长者的当前状态
- 展示完成/处理中/待处理统计

#### AI Chat

调用接口：

- `GET /api/elders`
- `POST /api/chat`

用途：

- 切换当前对话的长者
- 给护工提供交班语言、风险提示、报告字段建议

#### Report

调用接口：

- `GET /api/elders`
- `GET /api/reports`
- `POST /api/reports`

用途：

- 选择长者
- 录音或输入文字
- 生成报告
- 浏览最近报告

### 页面：`/elders`

文件：

- `src/app/elders/page.tsx`

用途：

- 老人列表页
- 比较偏旧版 CRM 入口
- 仍然可用，但不是当前主工作台

### 页面：`/elders/[id]`

文件：

- `src/app/elders/[id]/page.tsx`

用途：

- 查看某位长者详情
- 查看报告和时间线
- 使用旧版 `voice-report-form.tsx` 录入记录

---

## 5. 接口清单

下面这部分是后续开发最需要看的内容。

---

### 5.1 `GET /api/health`

文件：

- `src/app/api/health/route.ts`

作用：

- 服务健康检查

请求：

- 无参数

返回示例：

```json
{
  "ok": true,
  "service": "concord",
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

常见用途：

- 本地启动后检查服务是否正常
- 部署后做 uptime probe

---

### 5.2 `GET /api/dashboard`

文件：

- `src/app/api/dashboard/route.ts`
- `src/server/services/dashboard.ts`

作用：

- 返回首页 `Home` 需要的全部数据

请求：

- 无参数

返回主要字段：

```json
{
  "dashboard": {
    "dateLabel": "4月15日星期三",
    "headline": "今日共 4 位长者需要巡查与记录",
    "completed": 1,
    "inProgress": 1,
    "pending": 2,
    "visits": []
  }
}
```

前端谁在用：

- `src/components/workstation-shell.tsx`

依赖：

- `listElders()`
- `listReports()`

如果以后要改首页逻辑：

- 去改 `src/server/services/dashboard.ts`
- 不要直接在 route 里拼数据

---

### 5.3 `GET /api/elders`

文件：

- `src/app/api/elders/route.ts`
- `src/server/services/dashboard.ts`

作用：

- 给前端返回可选长者列表

请求：

- 无参数

返回主要字段：

```json
{
  "elders": [
    {
      "id": "demo-elder-1",
      "fullName": "陈美玲",
      "roomNo": "A-302",
      "riskLevel": "medium",
      "medicalNotes": "高血压，需按时服药"
    }
  ]
}
```

前端谁在用：

- `AI Chat` 页长者切换
- `Report` 页长者选择

---

### 5.4 `POST /api/chat`

文件：

- `src/app/api/chat/route.ts`
- `src/server/services/chat.ts`

作用：

- 给护工对话式护理助手回复

请求体：

```json
{
  "elderId": "demo-elder-1",
  "messages": [
    {
      "role": "user",
      "content": "帮我总结今天护理重点"
    }
  ]
}
```

字段说明：

- `elderId`
  - 可选
  - 传了之后，AI 会带上该长者的资料和最近时间线
- `messages`
  - 必填
  - 当前对话历史
  - 只允许 `user` / `assistant`

返回：

```json
{
  "reply": "AI 返回的文本",
  "suggestions": [
    "总结成今日护理重点",
    "给我交班版本"
  ]
}
```

当前逻辑：

- 如果配置了 `OPENAI_API_KEY`，会调 OpenAI Responses API
- 如果没配置，会走 fallback 文本回复

后续如果要换模型：

- 直接改 `src/server/services/chat.ts`
- 前端接口不需要变

---

### 5.5 `GET /api/reports`

文件：

- `src/app/api/reports/route.ts`
- `src/server/services/dashboard.ts`
- `src/server/repositories/report-repository.ts`

作用：

- 获取报告列表

查询参数：

- `elderId`
  - 可选
  - 只看某位长者的报告
- `limit`
  - 可选
  - 限制返回条数

请求示例：

```bash
GET /api/reports?elderId=demo-elder-1&limit=10
```

返回：

```json
{
  "reports": [
    {
      "id": "report-id",
      "elderId": "demo-elder-1",
      "status": "ready",
      "reportText": "...",
      "elderName": "陈美玲",
      "elderRoomNo": "A-302",
      "elderRiskLevel": "medium"
    }
  ]
}
```

前端谁在用：

- `Report` 页展示最近报告列表

---

### 5.6 `POST /api/reports`

文件：

- `src/app/api/reports/route.ts`
- `src/server/services/transcription.ts`
- `src/server/services/report-workflow.ts`
- `src/server/services/report-generator.ts`

作用：

- 创建一条新的护理报告
- 支持文字输入和音频输入

请求格式：

- `multipart/form-data`

字段说明：

- `elderId`
  - 必填
- `createdBy`
  - 可选
- `noteText`
  - 可选
- `audio`
  - 可选
- `orgPin`
  - 可选

规则：

- `noteText` 和 `audio` 至少要有一个
- 如果配置了机构 PIN，则需要通过校验

请求示例：

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "x-org-pin: 123456" \
  -F "elderId=demo-elder-1" \
  -F "createdBy=护工A" \
  -F "noteText=今天精神稳定，午餐吃七成，步行需要轻扶。"
```

如果是音频模式，后端会做什么：

1. 上传音频到 Supabase Storage
2. 调 OpenAI 语音转文字
3. 新建 report，状态 `processing`
4. 调 `processPendingReport()`
5. 生成结构化报告和可读报告
6. 更新为 `ready`
7. 写时间线

返回：

```json
{
  "report": {
    "id": "xxx",
    "status": "ready",
    "transcriptionRaw": "...",
    "reportStructured": {},
    "reportText": "..."
  }
}
```

这是当前系统最重要的核心接口。

---

### 5.7 `POST /api/reports/[id]/process`

文件：

- `src/app/api/reports/[id]/process/route.ts`
- `src/server/services/report-workflow.ts`

作用：

- 手动重新处理某一条报告

适用场景：

- 先创建了 `processing` 状态的报告
- 想重新跑一次结构化生成流程

请求：

- Header 可带 `x-org-pin`

返回：

```json
{
  "report": {
    "id": "xxx",
    "status": "ready"
  }
}
```

---

## 6. 报告对象是怎么生成的

报告的核心类型在：

- `src/types/report.ts`

关键字段：

- `transcriptionRaw`
  - 原始转写文本
- `reportStructured`
  - 给机器分析用的结构化 JSON
- `reportText`
  - 给人看的可读版本

结构化字段当前包括：

- `mood`
- `appetite`
- `sleep`
- `mobility`
- `vitals`
- `symptoms`
- `riskFlags`
- `interventions`
- `handover`

当前生成逻辑在：

- `src/server/services/report-generator.ts`

现在的实现方式：

- 不是调用大模型生成 JSON
- 而是用规则关键词把转写文本映射成固定字段

优点：

- 便宜
- 稳定
- 可控

缺点：

- 智能程度一般
- 面对复杂粤语口语时，理解能力有限

如果以后要升级为真正 LLM 结构化提取：

- 保持 `reportStructuredSchema` 不变
- 只替换 `buildStructuredReport()` 的内部实现

---

## 7. 数据库结构

数据库迁移文件：

- `supabase/migrations/202603010001_init.sql`

当前有 3 张核心表：

### `elderly_profiles`

作用：

- 存长者基础资料

关键字段：

- `full_name`
- `room_no`
- `gender`
- `birth_date`
- `risk_level`
- `medical_notes`

### `care_reports`

作用：

- 存护理报告

关键字段：

- `elder_id`
- `status`
- `audio_path`
- `transcription_raw`
- `report_structured`
- `report_text`
- `created_by`

### `timeline_events`

作用：

- 存时间线事件

关键字段：

- `elder_id`
- `event_type`
- `title`
- `detail`
- `occurred_at`

---

## 8. 环境变量要接什么

配置文件模板：

- `.env.example`

### App

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_ORG_PIN`

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_AUDIO_BUCKET`

### OpenAI

- `OPENAI_API_KEY`
- `OPENAI_TRANSCRIPTION_MODEL`
- `OPENAI_TRANSCRIPTION_LANGUAGE`
- `OPENAI_CHAT_MODEL`
  - 这个字段代码里已经在用，建议补进 `.env.local`

### Demo fallback

- `ENABLE_DEMO_FALLBACK=true`

含义：

- 如果没配 Supabase，也允许系统用内存 demo 数据跑起来

---

## 9. demo 模式和真实云端模式的区别

### Demo 模式

触发条件：

- 没有 Supabase 环境变量
- 且 `ENABLE_DEMO_FALLBACK=true`

表现：

- 页面可以打开
- 首页、聊天、报告列表都有数据
- 报告可以生成
- 但这些数据只存在内存里，服务重启就丢

相关文件：

- `src/server/repositories/demo-store.ts`

### 真实云端模式

触发条件：

- 已配置 Supabase 相关环境变量

表现：

- 老人资料、报告、时间线会读写真实数据库
- 音频会传到 Supabase Storage

---

## 10. 如果后续要换供应商，改哪里

### 换语音转写供应商

改这里：

- `src/server/services/transcription.ts`

不要改这里：

- `POST /api/reports` 的接口协议尽量保持不变

这样前端不会受影响。

### 换 AI 对话模型

改这里：

- `src/server/services/chat.ts`

### 换报告生成方式

改这里：

- `src/server/services/report-generator.ts`

### 换数据库

改这里：

- `src/server/repositories/elderly-repository.ts`
- `src/server/repositories/report-repository.ts`
- `src/lib/supabase/admin.ts`

前端和 service 层尽量不动。

---

## 11. 当前代码的开发优先级建议

如果接下来继续开发，我建议按这个顺序：

1. 给 `Report` 页增加“生成后人工编辑再确认保存”
2. 把 `processing` 改成真正异步任务，不要在一次请求里同步做完
3. 给首页 `Home` 加真实筛选和状态变更
4. 给 `AI Chat` 增加更明确的提示词模板和结构化输出
5. 把 `OpenAI STT` 和 `OpenAI Chat` 抽象成 provider，方便以后切 Deepgram / Groq / Qwen

---

## 12. 后续开发最常看的文件

- 页面入口：`src/components/workstation-shell.tsx`
- 首页数据：`src/server/services/dashboard.ts`
- AI 对话：`src/server/services/chat.ts`
- 报告主接口：`src/app/api/reports/route.ts`
- 转写：`src/server/services/transcription.ts`
- 报告生成：`src/server/services/report-generator.ts`
- 数据读写：`src/server/repositories/report-repository.ts`
- 数据库结构：`supabase/migrations/202603010001_init.sql`

如果只记住一句话：

> `app/api` 是接口入口，`server/services` 是业务逻辑，`server/repositories` 是数据层。
