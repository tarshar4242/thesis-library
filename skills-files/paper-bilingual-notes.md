---
name: paper-bilingual-notes
description: 學術論文英中雙語對照翻譯＋大綱摘要同步產生器。當使用者上傳英文學術論文（PDF）並提出以下任何需求時，立刻觸發此技能：「翻譯這篇論文」「中英對照」「雙語版本」「論文翻譯」「幫我翻這篇」「做成對照版」「符合原文版面」「保留圖片」「注釋風格」「大綱摘要」「讀書筆記」「幫我整理這篇論文」。本技能同步產出兩個交付物：（1）保留原文版面與圖片、每個英文段落之後緊跟藍框中文注釋的雙語對照 Word 檔（.docx）；（2）以使用者口語口吻、條列結構呈現的大綱摘要 Word 檔（.docx）。即使使用者只說「幫我翻一下」「我要對照版」「做個筆記」也應立即觸發。這是 Tarshar 最常用的論文處理技能，只要涉及學術 PDF 的翻譯或摘要，一律優先呼叫此技能。
---

# 學術論文英中雙語對照翻譯＋大綱摘要同步產生器

## 技能概覽

上傳一份英文學術論文 PDF，同步產出兩個 Word 檔：

**交付物 A：版本 C 注釋風格雙語對照 .docx**
- 英文原文段落完全保留，格式不動
- 論文中的每一張圖片從 PDF 裁切後嵌入原位
- 每個英文段落之後緊跟藍色左邊框中文注釋框
- 圖說同時提供英文原文 + 中文注釋

**交付物 B：口語大綱摘要 .docx**
- 以使用者的口吻（非學術正式語氣）條列整理
- 分章節說明「為什麼寫這篇」「前人研究」「核心貢獻」「實作架構」「比較分析」「帶走重點」
- 使用深藍標題色塊、▸ 條列、重點 callout 框排版

---

## 執行流程

### Step 1：讀取 PDF 文字

```python
import pdfplumber
with pdfplumber.open("/mnt/user-data/uploads/<filename>.pdf") as pdf:
    for page in pdf.pages:
        print(page.extract_text())
```

### Step 2：提取所有圖片

```python
from pdf2image import convert_from_path
from PIL import Image

# 每頁轉成高解析圖片
pages = convert_from_path('/mnt/user-data/uploads/<filename>.pdf', dpi=150)
for i, page in enumerate(pages):
    page.save(f'/home/claude/page_{i+1}.png', 'PNG')

# 預覽各頁，找出圖表位置
# 然後依座標裁切各圖表
fig = Image.open('/home/claude/page_N.png').crop((x1, y1, x2, y2))
fig.save('/home/claude/figN.png')
```

**圖片辨識原則：**
- 逐頁用 `view` 工具預覽，目視確認圖的上下邊界
- Figure 1, 2, 3... 依序裁切，只取圖本身，不含圖說文字
- 裁切後再次預覽確認正確

### Step 3：翻譯原則

**術語處理：**
- 作者自定義術語首次出現時保留英文 + 加括號中文說明，例如：Gen-Ba（現場）
- 縮寫、模型名稱直接保留英文（如 SECI、GenAI、LLM）
- 論文核心新概念在文件開頭加「術語說明」框

**語氣校準（避免常見錯誤）：**
- 原文保守語氣（may, could, suggests）→ 中文不可翻成肯定語氣
- 避免「本研究持有…之立場」這類直譯英文學術腔
- 隱喻或口語比喻（如 "clicking into place"）→ 保留原文意象，不過度文學化

**術語一致性清單（每次翻譯前確認）：**

| 英文 | 建議中文 | 說明 |
|------|---------|------|
| Explicit Knowledge | 顯性知識 | 固定譯法 |
| Tacit Knowledge | 隱性知識 | 固定譯法 |
| Latent Knowledge | 半顯性知識 | 非「潛在」，強調可片段表達 |
| knowledge fragments | 知識片段 | 非「碎片」 |
| Digital Fragmented Knowledge | 數位片段知識 | 非「數位碎片化知識」 |
| symbol grounding | 符號落地 | 非「符號紮根」 |
| auxiliary means | 輔助工具 | 非「輔助手段」 |
| Gen-Ba | Gen-Ba（現場） | 保留英文，括號補充 |

### Step 4：產出交付物 A — 注釋風格雙語 .docx

使用 `docx` npm 套件（`npm install -g docx`）以 JavaScript 產出。

**核心樣式：**

```javascript
// 英文原文段落（完全不動）
function enPara(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Times New Roman', size: 20 })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 160, after: 40 }
  });
}

// 中文注釋框（緊跟在英文後）
function zhPara(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '▶ 中文譯文　', font: 'Arial', size: 16, bold: true, color: '1a5276' }),
      new TextRun({ text, font: '新細明體', size: 20, color: '1a5276' })
    ],
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: '85c1e9' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '85c1e9' },
      left: { style: BorderStyle.THICK, size: 14, color: '1a5276' },
      right: { style: BorderStyle.SINGLE, size: 2, color: '85c1e9' }
    },
    shading: { fill: 'EAF4FB', type: ShadingType.CLEAR },
    indent: { left: 200 },
    spacing: { before: 0, after: 280 }
  });
}

// 圖片插入（從裁切的 PNG 嵌入）
function figPara(imgBuffer, widthPx, heightPx) {
  return new Paragraph({
    children: [new ImageRun({ data: imgBuffer, transformation: { width: widthPx, height: heightPx }, type: 'png' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 60 }
  });
}
```

**文件結構順序：**
1. 封面（英文標題、中文標題、作者、術語說明框）
2. 各章節：英文原文段落 → 中文注釋框，圖片保留原位
3. 參考文獻（保留原文格式不翻譯）

**頁面設定：**
```javascript
page: {
  size: { width: 11906, height: 16838 },  // A4
  margin: { top: 1080, right: 1080, bottom: 1080, left: 1440 }
}
```

### Step 5：產出交付物 B — 口語大綱摘要 .docx

**章節結構（依論文內容彈性調整）：**

1. 為什麼要寫這篇？（問題意識）
2. 前人研究在哪裡？（文獻回顧）
3. 這篇到底提出什麼？（核心貢獻）
4. 怎麼實際做到？（系統架構或方法）
5. 跟其他研究比有什麼不同？（比較分析）
6. 這篇值得帶走什麼？（結論與帶走重點）

**口語化原則：**
- 像在跟同學解釋，不用學術腔
- 使用「這篇在說…」「簡單說就是…」「關鍵在於…」
- 每個章節結尾點出 1-2 個最重要的帶走概念

**排版樣式（與讀書筆記格式一致）：**

```javascript
// 深藍色章節標題（白字色塊）
function h1(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '　', font: '新細明體', size: 24 }),
      new TextRun({ text, font: '新細明體', size: 26, bold: true, color: 'FFFFFF' }),
    ],
    shading: { fill: '1a5276', type: ShadingType.CLEAR },
    spacing: { before: 320, after: 80 },
  });
}

// 子標題（藍字底線）
function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: '新細明體', size: 23, bold: true, color: '1a5276' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '2980b9' } },
    spacing: { before: 240, after: 60 }
  });
}

// ▸ 條列項目
function bullet(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '▸  ', font: '新細明體', size: 21, color: '2980b9', bold: true }),
      new TextRun({ text, font: '新細明體', size: 21, color: '1a1a1a' })
    ],
    spacing: { before: 60, after: 60 },
    indent: { left: 360 }
  });
}

// 重點 callout 框（淡藍底）
function callout(text, label = '重點') {
  return new Paragraph({
    children: [
      new TextRun({ text: `【${label}】`, font: '新細明體', size: 20, bold: true, color: '1a5276' }),
      new TextRun({ text: `　${text}`, font: '新細明體', size: 20, color: '1a1a1a' })
    ],
    shading: { fill: 'EAF4FB', type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.THICK, size: 14, color: '1a5276' } },
    indent: { left: 160 },
    spacing: { before: 100, after: 100 }
  });
}
```

### Step 6：輸出

```bash
# 兩個檔案都複製到輸出資料夾
cp /home/claude/<論文關鍵字>_雙語對照.docx /mnt/user-data/outputs/
cp /home/claude/<論文關鍵字>_大綱摘要.docx /mnt/user-data/outputs/
```

用 `present_files` 同時呈現兩個檔案。

---

## 品質檢核清單

### 交付物 A（雙語對照）
- [ ] 英文原文段落完全未被修改
- [ ] 所有圖片已從 PDF 裁切並嵌入原位（預覽確認圖片正確）
- [ ] 圖說：英文原文 + 中文注釋各一行
- [ ] 術語一致性：Latent Knowledge = 半顯性知識、symbol grounding = 符號落地等
- [ ] 語氣：原文保守語氣未被翻成肯定語氣
- [ ] 封面包含術語說明框
- [ ] 參考文獻保留原文格式，未翻譯

### 交付物 B（大綱摘要）
- [ ] 口語化，像在跟同學解釋
- [ ] 章節結構完整（6 個主要章節）
- [ ] 有比較表格（如果論文有多模型比較）
- [ ] 每章節末有 callout 框點出帶走重點
- [ ] 結尾有「這篇值得帶走什麼」小結

---

## 常見問題

| 問題 | 處理方式 |
|------|---------|
| PDF 圖片無法提取 | 用 pdf2image 轉圖後目視裁切 |
| 圖片座標抓不準 | 用 `view` 工具預覽，再微調裁切座標 |
| 術語沒有標準譯法 | 首次出現保留英文 + 括號說明，之後全文統一 |
| 論文有複雜表格 | 大型比較表用 docx Table 重製；圖表型表格截圖嵌入 |
| 語氣翻得太硬 | 回到原文確認 modal verb（may/could），中文加「或許」「可能」 |
| 下載失敗 | 同時產出 PDF 備案（LibreOffice 轉換）|

---

## 輸出規格

| 項目 | 規格 |
|------|------|
| 格式 | .docx（主要）+ .pdf（備案） |
| 頁面 | A4 直式 |
| 字型（英文） | Times New Roman 10pt |
| 字型（中文） | 新細明體 10pt |
| 主色 | 深藍 #1a5276 / 淺藍 #EAF4FB |
| 輸出路徑 | /mnt/user-data/outputs/ |
| 檔名格式 | `<論文關鍵字>_雙語對照.docx` / `<論文關鍵字>_大綱摘要.docx` |
