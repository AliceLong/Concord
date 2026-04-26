你的项目是一个 **Next.js 全栈项目**：前端和后端在同一个代码仓库里，不是传统的“前端一个项目、后端一个项目”分离结构。

整体可以这样看：

```txt
Concord
├─ server.mjs                         # 自定义 Node/Next 启动入口
├─ server/
│  └─ asr-websocket.mjs               # Google ASR WebSocket 实时转写服务
├─ src/
│  ├─ app/                            # Next.js App Router：页面 + API
│  │  ├─ page.tsx                     # 首页：选择长者
│  │  ├─ report/[id]/page.tsx         # 报告页面：某个长者的录音/报告页
│  │  ├─ api/                         # 后端 HTTP API
│  │  │  ├─ report/route.ts           # 生成护理报告 API
│  │  │  ├─ asr/route.ts              # 上传音频转文字 API
│  │  │  ├─ speechmatics/token/route.ts # 获取 Speechmatics 实时转写 token
│  │  │  └─ health/google/route.ts    # Google 配置健康检查
│  │  └─ *.css                        # 页面样式
│  ├─ components/                     # 前端组件
│  │  └─ report-session.tsx           # 录音、实时转写、生成报告的主要交互组件
│  ├─ lib/                            # 通用逻辑/第三方服务封装
│  │  ├─ asr-client.ts                # Google Speech-to-Text 普通音频转写
│  │  ├─ speechmatics.ts              # Speechmatics token/config 封装
│  │  ├─ google-client.ts             # Google Speech/Gemini 客户端
│  │  ├─ report-ai.ts                 # 调 Gemini 生成结构化报告
│  │  ├─ report-builder.ts            # 无 Google 配置时的本地规则报告生成
│  │  └─ demo-data.ts                 # 示例长者数据
│  ├─ server/                         # 后端业务层
│  │  ├─ services/                    # 服务逻辑
│  │  └─ repositories/                # 数据读取逻辑
│  └─ types/                          # TypeScript 类型定义
└─ public/
   └─ audio-worklet-recorder.js       # 浏览器录音 AudioWorklet
```

**前端结构**

前端主要在这几块：

- [src/app/page.tsx](/Users/alicelong/Desktop/Concord/src/app/page.tsx)  
  首页，显示长者列表。点击某个长者后进入 `/report/[id]`。

- [src/app/report/[id]/page.tsx](/Users/alicelong/Desktop/Concord/src/app/report/[id]/page.tsx)  
  某个长者的报告页面。它先根据 URL 里的 `id` 找长者资料，然后渲染 `ReportSession`。

- [src/components/report-session.tsx](/Users/alicelong/Desktop/Concord/src/components/report-session.tsx)  
  这是核心前端交互组件，负责：
  - 调用浏览器麦克风
  - 使用 `AudioWorklet` 处理音频
  - 连接 Speechmatics 实时转写
  - 把转写文字显示在 textarea
  - 调 `/api/report` 生成结构化报告
  - 展示生成后的 JSON 和报告文本

- CSS module 文件  
  比如 `page.module.css`、`report-session.module.css`，负责页面和组件样式。

这里有一个重点：  
`page.tsx` 和 `report/[id]/page.tsx` 默认是 **Server Component**，而 `report-session.tsx` 顶部有 `"use client"`，所以它是 **Client Component**，浏览器录音、状态更新、按钮点击都在这里做。

**后端结构**

后端主要分成四层：

1. 启动层

[server.mjs](/Users/alicelong/Desktop/Concord/server.mjs)

它负责启动整个 Next.js 应用，并额外挂载 `/ws/asr` WebSocket 服务。

2. API 路由层

这些是浏览器可以通过 `fetch()` 调用的接口：

- [src/app/api/report/route.ts](/Users/alicelong/Desktop/Concord/src/app/api/report/route.ts)  
  接收转写文本，生成护理报告。

- [src/app/api/asr/route.ts](/Users/alicelong/Desktop/Concord/src/app/api/asr/route.ts)  
  接收上传音频文件，调用 Google Speech-to-Text 转文字。

- `src/app/api/speechmatics/token/route.ts`  
  给前端实时转写生成 Speechmatics token。当前 `ReportSession` 主要用的是这个接口。

- [src/app/api/health/google/route.ts](/Users/alicelong/Desktop/Concord/src/app/api/health/google/route.ts)  
  检查 Google Cloud / Speech / Gemini 配置是否正常。

3. 业务服务层

- [src/server/services/asr.ts](/Users/alicelong/Desktop/Concord/src/server/services/asr.ts)  
  包装音频转写逻辑。

- [src/server/services/report.ts](/Users/alicelong/Desktop/Concord/src/server/services/report.ts)  
  根据长者 ID 和转写文本生成报告。

- [src/server/repositories/elder.ts](/Users/alicelong/Desktop/Concord/src/server/repositories/elder.ts)  
  读取长者资料。目前是从 demo data 里读，不是真数据库。

4. 第三方服务封装层

- [src/lib/google-client.ts](/Users/alicelong/Desktop/Concord/src/lib/google-client.ts)  
  初始化 Google Speech 和 Gemini 客户端。

- [src/lib/asr-client.ts](/Users/alicelong/Desktop/Concord/src/lib/asr-client.ts)  
  调 Google Speech-to-Text，把音频文件转文字。

- `src/lib/speechmatics.ts`  
  生成 Speechmatics 实时转写 token。

- [src/lib/report-ai.ts](/Users/alicelong/Desktop/Concord/src/lib/report-ai.ts)  
  调 Gemini，根据转写文本生成结构化护理报告。

- [src/lib/report-builder.ts](/Users/alicelong/Desktop/Concord/src/lib/report-builder.ts)  
  如果 Google 配置不存在，就用本地规则生成一个报告。

**当前主要数据流**

现在核心流程大概是：

```txt
用户打开首页
  ↓
src/app/page.tsx 读取 demo 长者列表
  ↓
点击长者
  ↓
src/app/report/[id]/page.tsx 读取长者资料
  ↓
ReportSession 在浏览器启动录音
  ↓
前端调用 /api/speechmatics/token
  ↓
前端直接连接 Speechmatics 实时转写
  ↓
转写文本进入 textarea
  ↓
点击“生成报告”
  ↓
前端 POST /api/report
  ↓
src/server/services/report.ts
  ↓
src/lib/report-ai.ts 调 Gemini 或 fallback 到 report-builder
  ↓
返回结构化报告给前端展示
```

所以一句话总结：

你的项目前端在 `src/app` 和 `src/components`，后端在 `server.mjs`、`src/app/api`、`src/server` 和部分 `src/lib` 里。它是一个 Next.js 全栈应用，前后端没有拆成两个独立项目。