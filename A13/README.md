# 📄 人機溝通中的詞彙問題
> **Title:** The vocabulary problem in human-system communication

---

## 📋 基本資訊

| 欄位 | 內容 |
|------|------|
| 作者 | G. W. Furnas, T. K. Landauer, L. M. Gomez & S. T. Dumais（Bell Communications Research） |
| 期刊 | *Communications of the ACM*（CACM，ACM 旗艦期刊） |
| 出版年份 | 1987 年 11 月 |
| 卷期頁碼 | Vol. 30, No. 11, pp. 964–971 |
| 期刊等級 | ACM 同儕審查，Research Contributions 專欄 |
| 文章類型 | 實證研究（多領域行為實驗＋模擬） |
| 研讀者 | 羅靜娟｜學號 714630117 |
| 查證狀態 | ✅ 2026-08-23 已調閱原文並讀過；篇名／作者／卷期／起始頁四項逐一核對相符 |

---

## 🔑 三個關鍵數字（報告與寫作只要記這三個）

| 數字 | 原文 | 白話 |
|------|------|------|
| **< 0.20** | "In every case two people favored the same term with probability <0.20" | 任兩人替同一對象取同一個名字的機率不到兩成 |
| **80–90%** | "access is via one designer's favorite single word will result in 80-90 percent failure rates in many common situations" | 只認一個「正確關鍵字」的系統，八到九成查詢會失敗 |
| **3–5 倍** | "rich, probabilistically weighted indexes or alias lists can improve success rates by factors of three to five" | 替同一對象掛上大量別名，命中率可拉高三到五倍 |

**研究設計**：五個應用領域的自發性命名實驗；另有一個命名小測驗問過**超過一千對**受試者（含程式設計師、資工系學生、人因專家），兩人答案相同的**不到十二對**。

---

## 📌 最貼近本論文的一句原文

> "In information retrieval systems, the keywords that are assigned by indexers are often at odds with those tried by searchers."
>
> 檢索系統中，索引者所指派的關鍵字，經常與搜尋者實際嘗試的關鍵字不一致。

這句話等於用學術語言描述了研究者自己遇到的兩個情境：找不到圖檔（自己存的、自己也猜不中字面），
以及同仁用非專業用語存檔、另一位同仁用專業術語查詢。

---

## 🔗 與本論文主題的關聯

| 關聯面向 | 說明 |
|----------|------|
| **第一章 研究動機** | 把個人檢索經驗接上一個有名字、有實證的既有現象（詞彙不匹配問題），回應「這只是你自己的問題吧」的質疑 |
| **第二章 2.3 兩種檢索的差別** | 提供機制解釋：關鍵字檢索的成敗取決於查詢者能否重現文件端的字面表述，而非文件是否存在 |
| **第二章 2.4 研究缺口** | 本篇的解法是「無限別名」（人工標註），組織文件情境不可行；語意向量檢索等於將其自動化，**惟成效未經實證**——即本研究缺口 |
| **第三章 題庫設計** | 同義改寫題的設計依據；「語意改寫成功率」指標的文獻來源 |

⚠️ **本篇不進入研究方法（第三章方法論）**，只作問題界定與題型設計依據。

---

## 🧬 學術系譜（口試可畫）

```
1987  Furnas, Landauer, Gomez & Dumais ── 發現問題：詞彙不匹配（本篇）
          ↓  同一作者群
1990  Deerwester, Dumais, Landauer, Furnas & Harshman ── 提出解法：潛在語意索引 LSI／LSA
          ↓  三十餘年演進
2020s embedding／語意檢索／RAG／NotebookLM
          ↓
2027  本研究：把這條線放進「隱性知識外化文件」實測成效
```

- Dumais、Landauer、Furnas 三位作者同時出現在 1987 與 1990 兩篇上。
- 1990 書目：Deerwester, S., Dumais, S. T., Landauer, T. K., Furnas, G. W., & Harshman, R. (1990).
  Indexing by latent semantic analysis. *Journal of the American Society for Information Science, 41*(6), 391–407.
- ⚠️ **1990 那篇尚未調閱原文**，書目已用兩個獨立來源核對（Wiley 官方頁面、EconPapers/RePEc）；引用前須自行取得原文。

---

## 🤝 與其他文獻的分工

| 文獻 | 分工 |
|------|------|
| **A12**（Zheng et al., 2024） | A13 給名字與理論，A12 給當代證據與評估方法 |
| **A09**（Karakurt & Akbulut, 2026） | A13 說明「為什麼需要 RAG」，A09 說明「RAG 研究做到哪」 |
| **A05**（Nonaka, 1994） | A05 管「知識為什麼要外化」，A13 管「外化之後為什麼還是找不到」 |
| **A11**（Cerchione et al., 2025） | 人工掛別名做不到的事、機器做到了——正是機器維度的具體內容 |

---

## 📦 研讀包檔案

| 檔案 | 說明 |
|------|------|
| `A13_original_Vocabulary_Problem_Furnas1987.pdf` | 論文原文 PDF |
| `A13_bilingual.docx` | 依既有研讀庫版型重建：英文原文後緊接藍框中文譯文、雙語章節帶、重點螢光標示與統一術語表 |
| `A13_bilingual.pdf` | 手機與網站閱讀用中英對照 PDF（A4，16 頁） |
| `A13_reading_summary.docx` | 口語研讀摘要 Word |
| `A13_reading_summary.pdf` | 口語研讀摘要 PDF（4 頁） |

## ✅ 翻譯與驗收狀態

- Codex 依 `paper-bilingual-notes` 流程重建，並以論文研讀庫 A04、A08、A10 的實際成品作為版型基準。
- 版面改為英文原文後緊接淺藍框繁體中文譯文；章節標題中英並列，關鍵數據採螢光標示，摘要另檔交付。
- 掃描版英文文字層可能有少量 OCR 字形誤辨；正式引用一律回查原文印刷頁碼 964–971，圖表與數據以原始 PDF 為準。
- 已完成 A4 頁面、中文字型、段落邊框、分頁與全部 16 頁雙語 PDF、4 頁摘要 PDF 的視覺檢查。
- 現代語意搜尋、向量資料庫與 RAG 的連結皆標示為研讀延伸，不是作者原始主張。

---

## 📚 參考文獻格式（APA）

> Furnas, G. W., Landauer, T. K., Gomez, L. M., & Dumais, S. T. (1987). The vocabulary problem in human-system communication. *Communications of the ACM, 30*(11), 964–971.

---

*重建與自檢日期：2026-08-23*
