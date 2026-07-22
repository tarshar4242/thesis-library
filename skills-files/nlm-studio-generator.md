---
name: nlm-studio-generator
description: NotebookLM 工作室輸出客製化產生器（完整版）。當使用者需要為 NotebookLM 工作室（Studio）客製化任何輸出時使用。涵蓋全部 NLM Studio 輸出類型：語音摘要（深度探索/摘要/評論/辯論）、影片摘要（8種視覺風格）、簡報投影片（詳細版/簡報者版，含 YAML 風格設計規格）、資訊圖表、心智圖、報告（4種格式）、學習卡、測驗、資料表格類（論文萃取/行程/財務）。觸發條件：(1) 說「NLM 工作室」「NotebookLM 輸出」「幫我做 NLM 設定」「語音摘要指令」「簡報提示詞」；(2) 需要為 NLM Studio 任何功能生成客製化提示；(3) 詢問如何讓 NLM 輸出更好或更符合需求。產出：可直接貼入 NLM Studio 的提示文字 + .md 參考規格文件 + 操作 SOP。語言依使用者需求彈性切換（繁中/英文/其他）。
---

# NotebookLM 工作室輸出客製化產生器

## ⚠️ 重要前提：NLM 的格式本質

**NotebookLM Studio 接受的是「自然語言提示詞」，不是程式化 YAML。**

- **語音/影片/報告/學習卡/測驗/資訊圖表**：填入「自然語言描述」的提示文字
- **簡報（Slide Deck）**：可選用 YAML 風格的設計規格（NLM 可解讀結構化設計語法）
- **所有輸出均以來源文件為依據**，不引入外部資訊

詳細範例庫請讀取：
- `references/audio-video-examples.md`（語音/影片類 × 各 10 個真實範例）
- `references/slides-infographic-examples.md`（簡報/資訊圖表 × 各 10 個 YAML 範例）
- `references/docs-data-examples.md`（報告/學習卡/測驗/資料表 × 各 10 個範例）

---

## 執行流程

### Step 1：展示完整輸出類型選單

```
📋 請選擇您需要的 NotebookLM 工作室輸出類型（可多選）：

🎙️ 語音類（Audio Overview）
  [ ] A1 深度探索 Deep Dive（兩位主持人深度對話）
  [ ] A2 摘要型 Brief（快速重點）
  [ ] A3 評論型 Critique（分析評論角度）
  [ ] A4 辯論型 Debate（正反立場交鋒）

🎬 影片類（Video Overview）
  [ ] B1 Classic 標準敘事風格
  [ ] B2 Whiteboard 白板手繪風
  [ ] B3 Kawaii 可愛插畫風
  [ ] B4 Anime 動漫風格
  [ ] B5 Watercooler 輕鬆對話風
  [ ] B6 Retro Print 復古印刷風
  [ ] B7 Heritage 經典典雅風
  [ ] B8 Paper-craft 紙藝剪貼風

📊 簡報類（Slide Deck）
  [ ] C1 詳細版 Detailed Deck（完整資訊，可獨立閱讀）
  [ ] C2 簡報者版 Presenter Slides（精簡要點，搭配口頭報告）

🎨 資訊圖表（Infographic）
  [ ] D1 縱向 Portrait（適合 IG/海報/單頁摘要）
  [ ] D2 橫向 Landscape（適合 LinkedIn/簡報配圖）
  [ ] D3 正方形 Square（社群方形版）

🧠 心智圖（Mind Map）
  [ ] E1 主題概念關係圖（自動生成）

📝 報告（Report）
  [ ] F1 Briefing Doc（重點摘要文件）
  [ ] F2 Study Guide（學習指南）
  [ ] F3 Blog Post（部落格文章格式）
  [ ] F4 自訂結構報告

🃏 學習卡（Flashcards）
  [ ] G1 客製化學習卡

❓ 測驗（Quiz）
  [ ] H1 客製化測驗

📈 資料表（Data Tables — 透過 Chat 生成）
  [ ] I1 一般資料表
  [ ] I2 論文資料萃取表
  [ ] I3 行程表
  [ ] I4 財務表
```

### Step 2：收集核心參數

**必問（所有類型共通）**：
1. **主題**：這份 NLM 筆記的核心內容是什麼？
2. **目標受眾**：學生 / 研究者 / 政策決策者 / 一般大眾 / 商業主管？
3. **使用語言**：繁體中文 / 英文 / 其他？

**依選擇的類型追加詢問**（見各 references 檔案中的參數列表）

### Step 3：產出三份文件

**① 可直接貼入 NLM Studio 的提示指令**
**② 放進 NLM 來源的 .md 規格參考文件**（讓 NLM 精煉用）
**③ 操作 SOP**（3 步驟圖解說明）

---

## 輸出格式規則

### 語音/影片/報告/學習卡/測驗 → 自然語言提示

格式為純文字段落，清楚說明焦點、受眾、風格、語言等。

### 簡報 Slide Deck → YAML 風格設計規格

```yaml
# presentation_design_spec_[style_name].yaml
# Style: [風格名稱]
# Topic: [主題]

Global Design Settings:
  Tone: "[整體氣質描述]"
  Language: "[語言]"
  Target Audience: "[受眾]"

Visual Identity:
  Background Color: "[色號] — [描述]"
  Text Color: "[色號]"
  Accent Color: "[色號] — [用途說明]"
  Typography:
    Headings: "[字型] — [字重/大小]"
    Body: "[字型] — [字重/大小]"

Layout Rules:
  Cover:
    Layout Type: "[版型名稱]"
    Design Details:
      - "[細節1]"
      - "[細節2]"
  Content Slides:
    Layout Type: "[版型名稱]"
    Design Details:
      - "[細節]"
  Closing:
    Layout Type: "[版型名稱]"

Content Focus:
  Key Topics:
    - "[主題1]"
    - "[主題2]"
  Emphasis: "[強調重點]"
  Deck Length: "[Short / Default]"
  Format: "[Detailed / Presenter]"
```

---

## 快速索引：各類型範例位置

| 類型 | 範例數 | 參考檔案 |
|------|--------|---------|
| A 語音摘要（4 種格式） | 各 10 個 | `references/audio-video-examples.md` |
| B 影片摘要（8 種風格） | 各 10 個 | `references/audio-video-examples.md` |
| C 簡報（YAML 風格） | 10 個完整規格 | `references/slides-infographic-examples.md` |
| D 資訊圖表 | 12 個分類提示 | `references/slides-infographic-examples.md` |
| F 報告（4 種格式） | 各 10 個 | `references/docs-data-examples.md` |
| G 學習卡 | 10 個 | `references/docs-data-examples.md` |
| H 測驗 | 10 個 | `references/docs-data-examples.md` |
| I 資料表（4 種） | 各 5 個 | `references/docs-data-examples.md` |

---

## NLM Studio UI 操作速查

| 輸出類型 | 操作路徑 | 提示填入位置 |
|---------|---------|-----------|
| 語音摘要 A1-A4 | Studio → Audio Overview → 選格式 → Customize ✏️ | 自訂文字框 |
| 影片摘要 B1-B8 | Studio → Video Overview → 選風格 → Customize ✏️ | 自訂文字框 |
| 簡報 C1-C2 | Studio → Slide Deck → 選格式+長度 → ✏️ | 提示輸入框 |
| 資訊圖表 D | Studio → Infographic → 選方向+細節程度 → ✏️ | 描述輸入框 |
| 心智圖 E | Studio → Mind Map → Generate | 無提示欄 |
| 報告 F | Studio → Report → 選格式 → ✏️ | 自訂結構框 |
| 學習卡 G | Studio → Flashcards → ✏️ | 主題/難度/數量 |
| 測驗 H | Studio → Quiz → ✏️ | 主題/難度/題數 |
| 資料表 I | Chat 聊天框直接輸入 | 複製 Chat 輸出 |
