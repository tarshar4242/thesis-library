# 📄 語意搜尋評估
> **Title:** Semantic Search Evaluation

---

## 📋 基本資訊

| 欄位 | 內容 |
|------|------|
| 作者 | Chujie Zheng, Jeffrey Wang, Shuqian Albee Zhang, Anand Kishore（LinkedIn）；Siddharth Singh（Walmart） |
| 來源 | arXiv 預印本 |
| 日期 | 2024-10-28 |
| arXiv ID | [2410.21549](https://arxiv.org/abs/2410.21549) |
| 發表場合 | CIKM 2024 第 3 屆 Industrial Recommendation Systems Workshop |
| 文章類型 | 工業應用論文（Industry Track）｜LinkedIn 搜尋系統實作 |
| 研讀者 | 羅靜娟｜學號 714630117 |

> ⚠️ 預印本，未經同儕審查，引用時需標明此性質。

---

## 📦 檔案清單

| 檔案 | 說明 |
|------|------|
| `A12原文_Semantic_Search_Evaluation_Zheng2024.pdf` | 論文原文 PDF |

> 📌 中英對照待補（選做）

---

## 🔑 重點摘要

- **核心貢獻**：提出 "on-topic rate" 指標，衡量搜尋結果與查詢語意的相關程度
- **評估流程**：定義黃金查詢集 → 取前 K 筆結果 → 用 GPT-3.5 搭配設計好的 Prompt 判斷相關性
- **離線評估**：設計語意評估 Pipeline，可自動化、持續監測搜尋品質，不依賴線上 A/B 實驗
- **驗證方式**：人工評估 + 驗證集雙管齊下，確保 GPT 評估輸出的品質
- **應用場景**：LinkedIn 內容搜尋系統，覆蓋大規模用戶的語意查詢需求

---

## 🔗 與本論文主題的關聯

| 關聯面向 | 說明 |
|----------|------|
| **評估指標來源** | "on-topic rate" 的設計邏輯是本論文「答案正確率」指標的直接對照 |
| **技術選擇理由** | 以 LLM 進行語意相關性評估的方法，說明本論文採用語意向量搜尋的技術依據 |
| **離線評估設計** | Pipeline 設計思路可作為本論文「標準化題庫 + 要點評分規準」設計的方法論參考 |
| **引用注意** | 預印本公信力低於同儕審查期刊，建議搭配其他已發表文獻共同引用 |

---

*更新日期：2026-06-26*
