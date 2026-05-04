# Concord 项目汇报简版

## 1. 项目定位

Concord 是一个面向长者照护场景的语音记录与报告生成 Demo。  
目标是把看护者的口述服务记录，转成可编辑、可结构化展示、可导出为服务表格的报告结果。

---

## 2. 当前产品流程

1. 首页选择长者
2. 进入照护模块选择页
3. 勾选本次服务涉及的模块
4. 进入 ASR 录音页
5. Speechmatics 实时语音转文字
6. 用户手动修改转写文本
7. 点击“生成报告”
8. Gemini 生成结构化照护报告
9. 跳转到报告结果页展示
10. 支持导出为 Google Form 结构的 Excel 报告

---

## 3. 技术栈

### 前端

- Next.js 14（App Router）
- React 18
- TypeScript
- CSS Modules
- Lucide React 图标库

### 后端

- Next.js Route Handlers（`src/app/api/*`）
- Node.js 自定义启动入口（`server.mjs`）
- Zod 参数校验

### AI / 模型

- 实时 ASR：Speechmatics Realtime API
- 报告总结：Google Gemini（Vertex AI）

### 数据与导出

- Demo 数据源：本地内存假数据
- Excel 导出：`xlsx`

### 工程工具

- TypeScript 类型检查：`npm run typecheck`
- 包管理：npm

---

## 4. 当前使用的模型与能力

### 4.1 语音识别模型

- 服务商：Speechmatics
- 方式：前端通过短期 token 直连 Speechmatics Realtime WebSocket
- 当前语言：粤语 `yue`
- 当前特点：
  - 支持实时 partial / final transcript
  - 用户可边说边看到文字
  - 比之前 Google StreamingRecognize 的粤语实时反馈更快
- 迭代方向： 
  - 目前demo只用了粤语，但是在试验中发现会夹杂普通话粤语和英语，纯粤语模型无法识别，后续要采用多语言并发模型

### 4.2 报告生成模型

- 服务商：Google Vertex AI
- 模型：`gemini-2.5-flash`
- 用途：
  - 根据最终确认的转写文本
  - 结合已选照护模块
  - 生成结构化照护服务报告

### 4.3 报告生成方式

- 结构化生成报告
  1. Gemini 先输出固定格式文本
  2. 后端再解析为结构化 report

这样做的原因是：

- 比直接让模型吐复杂 JSON 更稳定
- 更适合真实表单风格的护理报告

---

## 5. 当前系统结构

### 页面

- `/`
  - 首页，选择长者
- `/report/[id]/modules`
  - 照护模块选择页
- `/report/[id]`
  - ASR 录音与文字编辑页
- `/report/[id]/result`
  - 报告结果页

### 主要接口

- `/api/speechmatics/token`
  - 生成 Speechmatics 实时 token
- `/api/report`
  - 生成结构化照护报告
- `/api/report/export`
  - 导出 Google Form 结构 Excel 报告
- `/api/health/google`
  - 检查 Google Cloud / Vertex AI 配置

---

## 6. 当前报告能力

### 结果页展示内容

当前结果页会展示：

- 长者状态
- 已完成服务
- 模块化记录
- 总结 / 特别事故 / 建议

### 返回逻辑

- 从结果页返回 ASR 页时：
  - 已录入文本保留
  - 已选模块保留
  - 日期保留

### 状态保存方式

- 使用浏览器 `sessionStorage`
- 适合当前 Demo 阶段，不依赖数据库

---

## 7. Google Form 导出能力

当前已支持导出一份 `.xlsx` 报告：

- 工作表名：`Form Responses 1`
- 表头结构：对齐真实服务报告附件
- 列数：57 列

当前策略：

- 能稳定从 AI 报告中映射出的字段会自动填入
- 无法可靠判断的字段先留空
- 不编造数据

---

## 8. 数据层现状

当前项目仍是 Demo 结构：

- 长者数据来自本地 demo 数据
- 没有接数据库
- 没有服务记录持久化

所以当前报告结果是：

- 页面内可展示
- 可导出
- 但不会自动保存到数据库

---

## 9. 关键代码入口

### 页面与交互

- `src/app/page.tsx`
- `src/app/report/[id]/modules/page.tsx`
- `src/app/report/[id]/page.tsx`
- `src/app/report/[id]/result/page.tsx`

### 核心组件

- `src/components/care-module-picker.tsx`
- `src/components/report-session.tsx`
- `src/components/report-result-page.tsx`
- `src/components/report-result-view.tsx`

### AI 与导出

- `src/lib/speechmatics.ts`
- `src/lib/report-ai.ts`
- `src/lib/google-form-export.ts`
- `src/lib/report-session-storage.ts`

### API

- `src/app/api/speechmatics/token/route.ts`
- `src/app/api/report/route.ts`
- `src/app/api/report/export/route.ts`

---

## 10. 当前项目边界

### 已完成

- 模块选择
- 粤语实时 ASR
- 手动文本修正
- AI 结构化总结
- 独立报告结果页
- 返回后状态保留
- Google Form Excel 导出

### 尚未完成 / 当前限制

- 还未接真实数据库
- 导出表格虽已对齐真实表头，但并非 57 列都能高质量自动填充
- 报告生成依赖 Gemini，极端情况下仍可能需要重试
- 当前仍是 Demo 版本，适合汇报和验证流程，不是最终生产系统
