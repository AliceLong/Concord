# Concord

面向护工的云端 WebApp MVP：将每日照护语音记录转写为结构化报告，并与老人资料形成可追溯时间线。

## 1. 技术框架（已按你确认方案搭好骨架）
- 前端与后端：`Next.js + TypeScript`（单仓库）
- 数据库与存储：`Supabase Postgres + Storage`
- 语音转写：`OpenAI Speech-to-Text`（后端调用）
- 报告生成：`固定 JSON Schema + 可读报告文本`
- 安全起步：`机构 PIN`（`x-org-pin`）

该仓库已包含 MVP 基础目录、API、数据模型和页面雏形。

## 2. 当前目录结构
```text
.
├── docs/
│   └── architecture.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts
│   │   │   └── reports/
│   │   │       ├── route.ts
│   │   │       └── [id]/process/route.ts
│   │   ├── elders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── report-timeline.tsx
│   │   └── voice-report-form.tsx
│   ├── lib/
│   │   ├── env.ts
│   │   ├── openai.ts
│   │   ├── security.ts
│   │   └── supabase/admin.ts
│   ├── server/
│   │   ├── repositories/
│   │   │   ├── elderly-repository.ts
│   │   │   └── report-repository.ts
│   │   └── services/
│   │       ├── report-generator.ts
│   │       ├── report-workflow.ts
│   │       └── transcription.ts
│   └── types/
│       ├── elderly.ts
│       └── report.ts
├── supabase/
│   └── migrations/
│       └── 202603010001_init.sql
├── .env.example
├── next.config.mjs
└── README.md
```

## 3. 已实现的 MVP 闭环（基础版）
1. 打开 `/elders` 直接进入老人列表。
2. 点击老人进入详情页，显示基础资料、时间线、历史报告。
3. 详情页支持语音录音或手工文本输入。
4. `POST /api/reports`：
   - 上传音频到 Supabase Storage（若已配置）
   - 调 OpenAI 转写（支持 `language=yue`）
   - 写入 `care_reports(status=processing)`
   - 同步处理生成 `report_structured + report_text`
   - 更新 `status=ready`
   - 写入时间线事件
5. 可手动重试处理：`POST /api/reports/:id/process`

## 4. 数据模型（Supabase/Postgres）
核心三表：
- `elderly_profiles`：老人基础资料
- `care_reports`：语音转写、结构化报告、文本报告、状态
- `timeline_events`：可追溯事件流

完整 SQL 见：`supabase/migrations/202603010001_init.sql`

## 5. 快速启动
### 5.1 安装依赖
```bash
npm install
```

### 5.2 环境变量
```bash
cp .env.example .env.local
```

至少配置：
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5.3 运行开发环境
```bash
npm run dev
```

打开 [http://localhost:3000/elders](http://localhost:3000/elders)

## 6. Supabase 初始化
1. 在 Supabase Cloud 创建项目。
2. 在 SQL Editor 执行 `supabase/migrations/202603010001_init.sql`。
3. 创建 Storage bucket（默认：`care-audio`）。
4. 将项目 URL 和 keys 写入 `.env.local`。

## 7. 部署建议（云端）
- Web + API：Vercel Hobby
- DB + Storage：Supabase Free
- 语音转写：OpenAI 按量

> 小规模 MVP 一般可落在 free plan 范围内；需要重点监控的是 OpenAI 音频调用成本和函数执行时长。

## 8. 下一步优先级建议
1. 改为异步任务处理（避免长音频触发超时）。
2. 加入编辑确认页（report 生成后人工校对再发布）。
3. 增加筛选/导出（按日期、风险、关键词）。
4. 启用 Supabase Auth + RLS，替换 PIN 保护。
5. 增加统计看板（趋势、风险预警）。
