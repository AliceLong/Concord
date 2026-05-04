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

下面这套步骤按顺序执行即可。  
如果是第一次在新电脑上跑项目，**不要跳步骤**。

### 0. 前置要求

本地需要先装好：

- Node.js 20 或更高版本
- npm
- Google Cloud CLI（`gcloud`）

可用下面命令简单检查：

```bash
node -v
npm -v
gcloud -v
```

如果 `gcloud` 不存在，需要先安装 Google Cloud CLI。

### 1. 拉最新代码

```bash
git pull origin main
```

如果是第一次拉项目：

```bash
git clone https://github.com/AliceLong/Concord.git
cd Concord
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

这一步的意思是：

- `.env.example` 是模板
- `.env.local` 是你自己电脑真正会被项目读取的配置文件

先复制模板：

```bash
cp .env.example .env.local
```

然后打开 `.env.local`，至少填这几个字段：

```env
NEXT_PUBLIC_APP_NAME=Concord
NEXT_PUBLIC_ASR_PROVIDER=speechmatics

GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_ASR_LOCATION=asia-southeast1
GOOGLE_ASR_MODEL=chirp_3
GOOGLE_ASR_LANGUAGE=yue-Hant-HK
GOOGLE_VERTEX_MODEL=gemini-2.5-flash

ASR_PROVIDER=speechmatics
SPEECHMATICS_API_KEY=your_speechmatics_api_key
SPEECHMATICS_RT_URL=wss://eu2.rt.speechmatics.com/v2
SPEECHMATICS_RT_LANGUAGE=yue
SPEECHMATICS_RT_MAX_DELAY=0.7
SPEECHMATICS_RT_TTL_SECONDS=60
```

其中最关键的是：

- `SPEECHMATICS_API_KEY`
  - 没有它就不能实时录音转写
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
  - 没有这两个就不能生成 Gemini 报告

### 4. 配置 Google ADC

如果要使用 Gemini 生成报告，需要让你本地电脑有权限调用 Google Cloud。

先登录：

```bash
gcloud auth application-default login
```

然后把 quota project 设成你的 GCP project：

```bash
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
```

这里的 `YOUR_PROJECT_ID` 要和 `.env.local` 里的：

```env
GOOGLE_CLOUD_PROJECT=...
```

保持一致。

你还可以额外验证一下登录是否成功：

```bash
gcloud auth application-default print-access-token
```

如果能打印出一长串 token，说明 ADC 基本可用。

### 5. 启动开发环境

```bash
npm run dev
```

启动成功后，终端通常会看到类似：

```text
Ready on http://0.0.0.0:3000
```

### 6. 打开页面

```text
http://localhost:3000
```

### 7. 建议的本地验证顺序

建议按这个顺序验证：

1. 先打开首页，确认页面能正常加载
2. 选择一个长者
3. 选择照护模块
4. 进入录音页
5. 点击开始录音，确认实时文字会出现
6. 停止录音后手动改几句
7. 点击“生成报告”
8. 确认会跳转到结果页
9. 在结果页点击导出，确认能下载 `.xlsx`

## 当前限制

- 仍然是 Demo 版本
- 长者数据来自本地假数据，不接数据库
- 导出表格已经对齐真实表头，但不是所有列都能自动高质量填满
- Gemini 总结在极端情况下仍可能需要重试
