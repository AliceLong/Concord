# Concord

Concord 是一个长者照护语音记录、模块化分析、报告生成与 WhatsApp 汇报 Demo。

## 当前 Demo 流程

1. 首页显示护工当天任务和未完成事项。
2. 点击任务进入活动选择页。
3. 选择照护模块。长者必选模块会强制选中，非必选模块可手动勾选或取消。
4. 进入语音录入页，查看已选模块提示。
5. 按住说话进行 ASR 录入，识别文字会进入文本框，也可以手动修改。
6. 点击下一步后调用 `/api/report/analyze`，用阿里百炼按模块分析文本。
7. 分析页会把未识别模块排在上方，已识别模块显示绿色。每张卡片可点开编辑，也可按住底部录音按钮对当前模块补充语音。
8. 如果选择了模块 10，会进入耆力 / 防跌运动次数页，手动填写各项次数。
9. 点击确认后调用 `/api/report/finalize`，用阿里百炼生成最终详细报告。
10. 报告详情页可修改老人资料、日期、体征、模块报告内容，并可下载 Google Form 结构的 Excel。
11. 进入 WhatsApp 报告页，可编辑口述版报告、选择图片、打开 WhatsApp。
12. 在 WhatsApp 中选择联系人并发送后，回到 app 点击右侧确认按钮，进入完成页并更新任务状态。

## 技术方案

- 前端：Next.js 14 + React 18 + TypeScript
- 本地服务：`server.mjs`
- 实时 ASR：Speechmatics Realtime API
- 模块分析：阿里百炼国际站 DashScope OpenAI-compatible API，默认 `qwen-flash`
- 最终报告：阿里百炼国际站 DashScope OpenAI-compatible API，默认 `qwen-plus`
- Demo 数据：本地假数据
- 会话暂存：浏览器 `localStorage`
- 导出：`xlsx`，下载 Google Form 结构 Excel
- WhatsApp：使用 `https://wa.me/?text=...` 打开 WhatsApp，由用户自行选择联系人

## 关键页面

- `/`
  - 首页任务看板
- `/report/[id]/modules`
  - 活动选择页
- `/report/[id]`
  - 语音录入页
- `/report/[id]/analysis`
  - 模块分析与补充页
- `/report/[id]/exercise`
  - 模块 10 耆力 / 防跌运动次数页
- `/report/[id]/result`
  - 报告详情页
- `/report/[id]/whatsapp`
  - WhatsApp 报告页
- `/report/[id]/done`
  - 完成页，更新任务状态

## 关键接口

- `/api/speechmatics/token`
  - 生成 Speechmatics 实时 token
- `/api/report/analyze`
  - 第一次 LLM 调用，按已选模块分析 ASR 文本
- `/api/report/finalize`
  - 第二次 LLM 调用，生成最终详细报告
- `/api/report/export`
  - 导出 Google Form 结构 Excel
- `/api/report`
  - 旧版报告生成接口，仍保留兼容

## 本地启动

### 0. 前置要求

本地需要安装：

- Node.js 20 或更高版本
- npm
- Git

检查命令：

```bash
node -v
npm -v
git --version
```

如果 `node` 或 `npm` 不存在，先安装 Node.js。Windows 用户安装后如果命令仍不可用，关闭当前 PowerShell / Terminal，重新打开后再检查。

### 1. 拉取代码

第一次下载项目：

```bash
git clone https://github.com/AliceLong/Concord.git
cd Concord
```

已有项目时更新最新代码：

```bash
git pull origin main
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制模板：

```bash
cp .env.example .env.local
```

Windows PowerShell 可用：

```powershell
Copy-Item .env.example .env.local
```

然后打开 `.env.local`，至少填写：

```env
NEXT_PUBLIC_APP_NAME=Concord
NEXT_PUBLIC_ASR_PROVIDER=speechmatics

AI_PROVIDER=dashscope
AI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
AI_API_KEY=your_dashscope_api_key
AI_ANALYSIS_MODEL=qwen-flash
AI_REPORT_MODEL=qwen-plus
AI_ANALYSIS_TIMEOUT_MS=60000
AI_REPORT_TIMEOUT_MS=90000

ASR_PROVIDER=speechmatics
SPEECHMATICS_API_KEY=your_speechmatics_api_key
SPEECHMATICS_RT_URL=wss://eu2.rt.speechmatics.com/v2
SPEECHMATICS_RT_LANGUAGE=yue
SPEECHMATICS_RT_MAX_DELAY=0.7
SPEECHMATICS_RT_TTL_SECONDS=60
```

说明：

- `AI_API_KEY` 是阿里百炼国际站 API key，用于模块分析和报告生成。
- `AI_ANALYSIS_MODEL=qwen-flash` 适合模块分类，速度优先。
- `AI_REPORT_MODEL=qwen-plus` 适合最终报告，质量优先。
- Demo 阶段建议把超时时间设成 `60000` 和 `90000`，减少现场网络抖动导致的失败。
- `SPEECHMATICS_API_KEY` 用于实时语音转文字。

`.env.local` 只放在本机，不要提交到 GitHub。

### 4. 启动开发环境

```bash
npm run dev
```

启动成功后会看到类似：

```text
Ready on http://0.0.0.0:3000
```

浏览器打开：

```text
http://localhost:3000
```

如果 `3000` 被占用，可以换端口：

```bash
PORT=3010 npm run dev
```

然后打开：

```text
http://localhost:3010
```

### 5. 本地验证顺序

建议按这个顺序跑完整 demo：

1. 打开首页，确认能看到“今日的任务”和“未完成事项”。
2. 点击一个任务进入活动选择页。
3. 确认 10 个模块全部显示，必选模块已选中。
4. 选择需要演示的模块，例如短期记忆、说话流畅度、听觉 / 专注力训练。
5. 进入语音录入页。
6. 可以直接在文本框粘贴测试文案，也可以按住说话录音。
7. 点击下一步，等待模块分析。
8. 确认未识别模块排在上方，已识别模块显示绿色。
9. 点击模块卡片，确认可以手动编辑或按住说话补充。
10. 如果选择模块 10，确认会出现运动次数填写页。
11. 点击确认后进入报告详情页。
12. 修改老人资料、日期、模块报告内容，确认可编辑。
13. 点击上传至 Google Form，确认下载 `.xlsx`。
14. 进入 WhatsApp 报告页，点击发送至 WhatsApp。
15. 在 WhatsApp 中选择联系人并发送；回到 app 后点击右侧绿色确认按钮。
16. 进入完成页后返回首页，确认对应任务从待办中消失。

## 常用命令

```bash
npm run dev
npm run typecheck
npm run build
```

## 常见问题

### `npm` 或 `node` 不存在

说明 Node.js 没装好，或终端没有刷新环境变量。安装 Node.js 后关闭终端重新打开，再运行：

```bash
node -v
npm -v
```

### 阿里百炼连接失败：请求超时

说明请求超过了环境变量中的超时时间。常见原因是网络波动、ASR 文本太长、一次选择模块过多，或模型服务排队。

Demo 建议：

```env
AI_ANALYSIS_TIMEOUT_MS=60000
AI_REPORT_TIMEOUT_MS=90000
```

如果仍然偶发失败，重新点击分析或确认即可重试。

### WhatsApp 打开空白页

项目使用的是 `https://wa.me/?text=...`。如果电脑没有登录 WhatsApp Web，或浏览器没有正确接管链接，可能会看到空白页。

Demo 时建议：

- 电脑提前登录 WhatsApp Web。
- 或在手机浏览器打开同一页面测试。
- 打开 WhatsApp 后由用户自行选择联系人并发送。

### 图片不能自动带入 WhatsApp

浏览器 deeplink 不能把本地图片自动塞进 WhatsApp 输入框。当前 demo 支持在页面选择图片并显示文件名，发送 WhatsApp 时需要用户在 WhatsApp 中手动附加图片。

## 当前限制

- 仍然是 Demo 版本，没有接真实数据库。
- 长者、任务、必选模块来自本地假数据。
- 报告和模块分析依赖阿里百炼网络稳定性。
- WhatsApp 不做后台自动发送，只打开 WhatsApp 并让用户自行选择联系人。
- Google Form 目前是下载 Excel 文件，不是直接写入在线 Google Form。
