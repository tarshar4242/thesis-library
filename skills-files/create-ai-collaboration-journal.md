---
name: create-ai-collaboration-journal
description: Create a complete Traditional Chinese AI collaboration journal that preserves the user's original thinking, AI interpretations, corrections, decisions, co-created ideas, professional learning keywords, research or thesis connections, evidence status, outputs, unresolved issues, and next action, then optionally render it as a Tarshar-branded 小D版手冊 PDF/HTML. Use when the user says「AI協作日誌」「整理今天的協作歷程」「把過程完整留下」「記錄AI被我修正的地方」「整理成小D版協作日誌」or asks for a reusable record of a substantial project, system design, research, analysis, or human-AI co-creation session.
---

# AI協作日誌

把真實工作歷程整理成「可以接力、可以學習、可以回看決策、可以擷取論文素材」的完整日誌。不要只寫最後成果，也不要逐字貼聊天紀錄。

## 載入順序

1. 讀取 `references/content-standard.md`。
2. 讀取 `references/voice-learning-research.md`。
3. 需要完整成品時，複製並填寫 `assets/journal-template.md`。
4. 若可使用 `$ai-coevolution-journal`，用它保存 Idea Gate、決策與 AI 修正，不重建另一套判斷系統。
5. 若需品牌 PDF／HTML，使用 `$create-xiaod-manual` 套用小D版視覺與 PDF 驗證。

若兄弟 Skill 無法載入，仍依本 Skill 的兩份 references 與模板完成，不得以依賴缺失為由省略核心內容。

## 工作流程

### 1. 先完成真實工作

- 先推進使用者當下的主線，不為寫日誌而中斷工作。
- 在工作中保存重要轉折、修正、決策與火花。
- 不要求使用者重述對話或檔案中已存在的資訊。
- 只有使用者要求「先整理日誌」時，日誌才成為當前主成果。

### 2. 建立內容邊界

先確認：

- 本次主線與完成定義。
- 使用者的角色、專業經驗與真正困境。
- AI 的角色與不可越界事項。
- 已確認、AI 建議、模擬假設、待驗證事實。
- 哪些內容涉及機密、個資或不可對外資訊。

不要把後見之明改寫成「一開始就知道答案」。

### 3. 保存演化，不保存流水帳

只記錄會改變理解、方向或未來做法的事件：

- 使用者原本怎麼想。
- AI 一開始怎麼理解。
- 哪個訊號或現場經驗推翻原理解。
- 使用者怎麼修正。
- AI 如何重整。
- 最後決定、未選路線與原因。
- 因此形成的新規則、火花或待驗證假設。

刪除純寒暄、重複確認、無影響的操作細節與冗長工具輸出。

### 4. 使用 Tarshar 的聲音

- 以自然第一人稱呈現 Tarshar 的想法與轉折。
- 保留「我原本以為」「我後來發現」「我把 AI 拉回來」等真實思考感。
- 不把口語改成生硬公文，也不模仿錯字或語音辨識錯誤。
- 專業結論可由 AI 整理，但不得假裝成使用者原本就說過的話。

### 5. 加入學習鷹架

遇到重要專業概念時，依需要加入：

1. 生活比喻。
2. 白話原理。
3. 正式名詞（中英文）。
4. 本案例子。
5. 一句重點整理。

建立可搜尋的「學習關鍵字辭典」，每個詞至少包含白話定義與本案例子。不要為了湊數加入與本案無關的術語。

### 6. 建立論文／研究連結

只在內容確實可連結研究時加入，固定記錄：

- 可搜尋標題。
- 中文與英文關鍵字。
- 本案具體例子。
- 可放入研究背景、動機、文獻、方法、變項、案例或討論的哪個位置。
- 證據狀態：現場經驗／模擬假設／初步資料／官方資料／研究證據。
- 尚需補什麼證據。

不得把共現、主管經驗或模擬結果寫成已證明因果。

### 7. 做證據與狀態標示

重要結論分成：

- `已確認`：使用者明確決定或有可靠資料。
- `AI 建議`：專業候選方案，尚未由使用者或業主確認。
- `模擬假設`：為了沙盤推演暫定。
- `待驗證`：需要資料、訪談、法務、技術或試辦驗證。
- `未採用`：曾考慮但已明確放棄，保留原因。

不得把完整文字造成的「看起來很確定」誤當成證據。

### 8. 組成完整日誌

依 `assets/journal-template.md` 組織內容。允許依專案調整章節數，但不得省略：

- 為什麼開始與真正困境。
- 主線、角色與安全界線。
- 主要工作內容與演化。
- 偏航與 AI 修正。
- 決策帳。
- 學習關鍵字。
- 論文／研究連結（有適用內容時）。
- 產出與狀態。
- 待確認。
- 正確下一步。
- 本次演化一句話。

長度由內容決定。完整日誌以「沒有漏掉重要轉折」為優先，不以固定頁數為目標。

### 9. 驗證內容

執行：

```bash
python3 scripts/validate_journal.py <journal.md>
```

人工再檢查：

- 是否像 Tarshar 的自然表達，而不是 AI 公文。
- 是否分清使用者觀點、AI 建議與證據。
- 是否保留重要錯誤、反轉與未採用路線。
- 是否有可搜尋的學習與研究入口。
- 是否沒有機密、個資、舊專案名稱或不可反推的對象資訊。

驗證器只檢查結構，不代替內容判斷。

### 10. 製作小D版成品

使用 `$create-xiaod-manual` 時：

- 封面保持清爽，不把內頁摘要塞上封面。
- 小型系列名：`AI協作日誌 01`、`02`……
- 主標只用一至兩行成果導向文字。
- 《AI協作日誌》封面使用「芫荽 Iansui」並嵌入 PDF。
- 正式 Logo 預設小尺寸置於封面與內頁底部中央。
- 正文使用高可讀性的繁體中文字型。
- 圖像與標題文字分開製作。
- 完成 PDF 後逐頁渲染檢查。

若使用者未要求視覺成品，先交付 Markdown，不自行擴大為 PDF。

## 隱私與專案用語

- 遵循目前 repository 的 `AGENTS.md` 與匿名規則。
- 客戶個資、密碼、API keys、原始錄音與未核准內部資料不寫入日誌。
- 必要時改用角色、代碼、範圍值、模擬資料及匿名專案名稱。
- 對外版與內部版必須分開；內部日誌不可直接當成業主版。

## 交付

先給結果，再簡短回報：

```text
日誌：<名稱／編號／版本>
範圍：<本次保存的主線>
包含：協作歷程／AI修正／決策／學習／研究連結／產出狀態
驗證：結構／證據狀態／匿名化／PDF版面（如有）
檔案：<Markdown、PDF、HTML、封面預覽>
同步：<本機／GitHub／Google Drive／Claude>
下一步：<唯一下一個行動>
```

只有實際同步並回讀成功，才能稱為已完成跨 AI 或雲端交班。
