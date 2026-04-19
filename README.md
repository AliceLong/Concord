# Concord

最小可验证版本，只保留两页：

- `Home`：选择长者
- `Report`：录音、ASR 转写、编辑确认、生成 report

## 当前验证流程

1. 在首页点击某位长者
2. 进入该长者的 `Report` 页面
3. 开始录音
4. 调用 `/api/asr` 把音频转成文字
5. 护工在文本框中修改确认内容
6. 调用 `/api/report` 生成：
   - `report_structured`
   - `report_text`

## 目录

```text
src/
├── app/
│   ├── api/
│   │   ├── asr/route.ts
│   │   ├── health/google/route.ts
│   │   └── report/route.ts
│   ├── report/
│   │   ├── [id]/page.tsx
│   │   └── report-page.module.css
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   ├── page.module.css
│   └── page.tsx
├── components/
│   ├── report-session.module.css
│   └── report-session.tsx
├── lib/
│   ├── asr-client.ts
│   ├── demo-data.ts
│   ├── google-client.ts
│   ├── report-ai.ts
│   └── report-builder.ts
├── server/
│   ├── repositories/
│   │   └── elder.ts
│   └── services/
│       ├── asr.ts
│       └── report.ts
└── types/
    ├── elderly.ts
    └── report.ts
```

## 启动

```bash
npm install
gcloud auth application-default login
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
npm run dev
```

打开：

```text
http://localhost:3000
```

## 说明

- 这版不接数据库
- 这版不保留 AI Chat / Dashboard / 时间线 / 多余 API
- 前端只负责录音，ASR 与结构化总结都走后端接口
- `/api/asr` 负责音频转写
- `/api/report` 负责结构化纪要生成
- `/api/health/google` 用于快速检查 Google Cloud 配置与 ADC
- ASR 使用 Google Cloud Speech-to-Text V2
- 报告生成使用 Gemini on Vertex AI
- 本地认证使用 ADC（`gcloud auth application-default login`）
- `demo-data.ts` 只保留 demo 数据源，页面和 service 统一经 `repository` 访问数据
- route 只处理 HTTP 和参数校验，业务逻辑下沉到 `src/server/services`
- 未配置 `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION` 时，`/api/report` 会回退到本地规则生成，`/api/asr` 会直接报错
