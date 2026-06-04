# Concord 項目彙報簡版

## 1. 項目定位

Concord 是一個面向長者照護場景的語音記錄與報告生成 Demo。  
目標是把看護者的口述服務記錄，轉成可編輯、可結構化展示、可導出為服務表格的報告結果。

---

## 2. 當前產品流程

1. 首頁選擇長者
2. 進入照護模塊選擇頁
3. 勾選本次服務涉及的模塊
4. 進入 ASR 錄音頁
5. Speechmatics 實時語音轉文字
6. 用戶手動修改轉寫文本
7. 點擊“生成報告”
8. Gemini 生成結構化照護報告
9. 跳轉到報告結果頁展示
10. 支持導出為 Google Form 結構的 Excel 報告

---

## 3. 技術棧

### 前端

- Next.js 14（App Router）
- React 18
- TypeScript
- CSS Modules
- Lucide React 圖標庫

### 後端

- Next.js Route Handlers（`src/app/api/*`）
- Node.js 自定義啟動入口（`server.mjs`）
- Zod 參數校驗

### AI / 模型

- 實時 ASR：Speechmatics Realtime API
- 報告總結：Google Gemini（Vertex AI）

### 數據與導出

- Demo 數據源：本地內存假數據
- Excel 導出：`xlsx`

### 工程工具

- TypeScript 類型檢查：`npm run typecheck`
- 包管理：npm

---

## 4. 當前使用的模型與能力

### 4.1 語音識別模型

- 服務商：Speechmatics
- 方式：前端通過短期 token 直連 Speechmatics Realtime WebSocket
- 當前語言：粵語 `yue`
- 當前特點：
  - 支持實時 partial / final transcript
  - 用戶可邊說邊看到文字
  - 比之前 Google StreamingRecognize 的粵語實時反饋更快
- 迭代方向： 
  - 目前demo只用了粵語，但是在試驗中發現會夾雜普通話粵語和英語，純粵語模型無法識別，後續要採用多語言併發模型

### 4.2 報告生成模型

- 服務商：Google Vertex AI
- 模型：`gemini-2.5-flash`
- 用途：
  - 根據最終確認的轉寫文本
  - 結合已選照護模塊
  - 生成結構化照護服務報告

### 4.3 報告生成方式

- 結構化生成報告
  1. Gemini 先輸出固定格式文本
  2. 後端再解析為結構化 report

這樣做的原因是：

- 比直接讓模型吐複雜 JSON 更穩定
- 更適合真實表單風格的護理報告

---

## 5. 當前系統結構

### 頁面

- `/`
  - 首頁，選擇長者
- `/report/[id]/modules`
  - 照護模塊選擇頁
- `/report/[id]`
  - ASR 錄音與文字編輯頁
- `/report/[id]/result`
  - 報告結果頁

### 主要接口

- `/api/speechmatics/token`
  - 生成 Speechmatics 實時 token
- `/api/report`
  - 生成結構化照護報告
- `/api/report/export`
  - 導出 Google Form 結構 Excel 報告
- `/api/health/google`
  - 檢查 Google Cloud / Vertex AI 配置

---

## 6. 當前報告能力

### 結果頁展示內容

當前結果頁會展示：

- 長者狀態
- 已完成服務
- 模塊化記錄
- 總結 / 特別事故 / 建議

### 返回邏輯

- 從結果頁返回 ASR 頁時：
  - 已錄入文本保留
  - 已選模塊保留
  - 日期保留

### 狀態保存方式

- 使用瀏覽器 `sessionStorage`
- 適合當前 Demo 階段，不依賴數據庫

---

## 7. Google Form 導出能力

當前已支持導出一份 `.xlsx` 報告：

- 工作表名：`Form Responses 1`
- 表頭結構：對齊真實服務報告附件
- 列數：57 列

當前策略：

- 能穩定從 AI 報告中映射出的字段會自動填入
- 無法可靠判斷的字段先留空
- 不編造數據

---

## 8. 數據層現狀

當前項目仍是 Demo 結構：

- 長者數據來自本地 demo 數據
- 沒有接數據庫
- 沒有服務記錄持久化

所以當前報告結果是：

- 頁面內可展示
- 可導出
- 但不會自動保存到數據庫

---

## 9. 關鍵代碼入口

### 頁面與交互

- `src/app/page.tsx`
- `src/app/report/[id]/modules/page.tsx`
- `src/app/report/[id]/page.tsx`
- `src/app/report/[id]/result/page.tsx`

### 核心組件

- `src/components/care-module-picker.tsx`
- `src/components/report-session.tsx`
- `src/components/report-result-page.tsx`
- `src/components/report-result-view.tsx`

### AI 與導出

- `src/lib/speechmatics.ts`
- `src/lib/report-ai.ts`
- `src/lib/google-form-export.ts`
- `src/lib/report-session-storage.ts`

### API

- `src/app/api/speechmatics/token/route.ts`
- `src/app/api/report/route.ts`
- `src/app/api/report/export/route.ts`

---

## 10. 當前項目邊界

### 已完成

- 模塊選擇
- 粵語實時 ASR
- 手動文本修正
- AI 結構化總結
- 獨立報告結果頁
- 返回後狀態保留
- Google Form Excel 導出

### 尚未完成 / 當前限制

- 還未接真實數據庫
- 導出表格雖已對齊真實表頭，但並非 57 列都能高質量自動填充
- 報告生成依賴 Gemini，極端情況下仍可能需要重試
- 當前仍是 Demo 版本，適合彙報和驗證流程，不是最終生產系統
