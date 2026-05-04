# Concord

Concord 是一个长者照护语音记录与报告生成 Demo。

当前主流程：

1. 首页选择长者
2. 进入照护模块选择页
3. 进入录音页
4. 使用 Speechmatics 做实时语音转文字
5. 用户手动修改最终文本
6. 调用 Gemini 生成结构化照护报告
7. 跳转到结果页展示
8. 可导出为 Google Form 结构的 Excel 报告

## 当前技术方案

- 前端：Next.js 14 + React 18 + TypeScript
- 实时 ASR：Speechmatics Realtime API
- 报告生成：Google Gemini（Vertex AI）
- 数据：本地 demo 数据
- 导出：`xlsx`

## 关键页面

- `/`
  - 首页，选择长者
- `/report/[id]/modules`
  - 照护模块选择页
- `/report/[id]`
  - ASR 录音与文本确认页
- `/report/[id]/result`
  - 报告结果页

## 关键接口

- `/api/speechmatics/token`
  - 生成 Speechmatics 实时 token
- `/api/report`
  - 生成结构化照护报告
- `/api/report/export`
  - 导出 Google Form 结构 Excel
- `/api/health/google`
  - 检查 Google Cloud / Vertex AI 配置

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制一份环境变量模板：

```bash
cp .env.example .env.local
```

至少需要配置：

```env
SPEECHMATICS_API_KEY=your_speechmatics_api_key
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_CLOUD_LOCATION=us-central1
```

如果要使用 Gemini，还需要本地配置 Google ADC：

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
```

### 3. 启动开发环境

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 本地运行常见问题

### 1. `Module not found: Can't resolve '@/lib/demo-data'`

这是因为之前仓库的 `.gitignore` 错误地忽略了 `src/lib/` 下的核心文件。  
如果你看到这个错误，说明你拉到的是修复前的版本，或本地代码没有同步到最新 `main`。

解决方式：

```bash
git pull origin main
npm install
npm run dev
```

### 2. 可以打开页面，但录音失败

通常是因为没有配置：

- `SPEECHMATICS_API_KEY`

### 3. 可以录音，但生成报告失败

通常是因为没有配置：

- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- 或没有执行 Google ADC 登录

### 4. 结果页导出失败

先确认当前报告已经成功生成，再检查依赖是否安装完整：

```bash
npm install
```

## 当前限制

- 仍然是 Demo 版本
- 长者数据来自本地假数据，不接数据库
- 导出表格已经对齐真实表头，但不是所有列都能自动高质量填满
- Gemini 总结在极端情况下仍可能需要重试
