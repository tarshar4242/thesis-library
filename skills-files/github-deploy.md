---
name: github-deploy
description: >
  把本地檔案（HTML、README.md、論文包等）推送到 GitHub repo 並部署到 GitHub Pages，最後回傳可點擊的網址。
  當使用者說「幫我部署」「push 到 GitHub」「上傳到 GitHub」「丟到 GitHub」「推上去」「給我網址」「放到 GitHub」，
  或是丟了一個 HTML 檔案、論文包、ZIP 檔並要求放上 GitHub 時，立刻觸發此 skill。
  不需要等使用者確認，直接執行整個流程直到給出網址才算完成。
---

# GitHub Deploy Skill

## 目標
把使用者的檔案推送到 GitHub repo，自動生成 README（若未提供），最後給出可分享的連結。

---

## 預設設定
- 本地資料夾：`~/kt-site`
- GitHub 帳號：`tarshar4242`
- 分支：`main`

### 論文包專用設定（優先使用）
- 論文包統一放進：`~/kt-site/thesis-library/<編號>/`（如 `A07/`、`B02/`）
- 統一 repo：`tarshar4242/thesis-library`
- 每次新增論文包後，**必須更新 `index.html` 總覽頁**，加入新論文的卡片
- GitHub Pages 網址：`https://tarshar4242.github.io/thesis-library/`

若使用者指定不同 repo 或資料夾，以使用者說的為準。

---

## 執行流程

### Step 1｜確認檔案與資料夾
```bash
ls <目標資料夾>/
```
若資料夾不存在就建立。若給的是 ZIP，先解壓縮：
```bash
unzip -o <file>.zip -d <目標資料夾>
```

---

### Step 2｜判斷 README 是否存在

**有 README** → 直接使用，跳到 Step 3。

**沒有 README** → 根據下方規則自動生成。

---

## README 生成規則

### 🔍 判斷類型

先看檔案特徵：

| 條件 | 類型 |
|------|------|
| 檔名含「文獻」「論文」「A0X」「paper」「thesis」，或有 PDF+DOCX 組合 | **論文包** |
| 主要是 `.html` 檔案 | **網頁專案** |
| 其他（工具、資料、腳本等） | **一般專案** |

---

### 📄 論文包 README 模板

從檔案內容（PDF/DOCX）中盡量讀取以下資訊，讀不到的欄位留 `—` 請使用者補填：

```markdown
# 📄 論文標題（中文）
> **Title:** Paper Title in English

---

## 📋 基本資訊

| 欄位 | 內容 |
|------|------|
| 作者 | |
| 期刊／研討會 | |
| 出版年份 | |
| DOI | |
| 原文連結 | |

---

## 📦 檔案清單

| 檔案 | 說明 |
|------|------|
| `檔名.pdf` | 原文 PDF |
| `檔名.pptx` | 研讀簡報 |
| `檔名.docx` | 段落中英對照 |

---

## 🔑 重點摘要

> 用 3–5 點條列，涵蓋研究問題、方法、主要發現、結論。

- 
- 
- 

---

## 🔗 與本論文主題的關聯

> 說明這篇文獻如何支撐或對話使用者自己的論文研究方向（生成式 AI、知識管理、SECI 模型等）。

- 
```

---

### 🌐 網頁專案 README 模板

```markdown
# 專案名稱

> 一句話說明這個網頁是做什麼的。

---

## 🗂 檔案說明

| 檔案 | 說明 |
|------|------|
| `index.html` | 主頁面 |

---

## 🚀 使用方式

直接點擊以下網址開啟：

👉 [開啟網頁](https://<owner>.github.io/<repo>/<file>.html)

---

## 📝 更新記錄

| 日期 | 更新內容 |
|------|----------|
| YYYY-MM-DD | 初始版本 |
```

---

### 📁 一般專案 README 模板

```markdown
# 專案名稱

> 簡短說明這個專案的用途。

---

## 📦 內容清單

| 檔案／資料夾 | 說明 |
|-------------|------|
| | |

---

## 🛠 使用說明

（步驟或備註）

---

## 📝 備註

更新日期：YYYY-MM-DD
```

---

### Step 3｜初始化 git 並推送

```bash
git init（若尚未初始化）
git remote add origin https://github.com/tarshar4242/<repo-name>.git
git add .
git commit -m "<自動或使用者指定的 commit 訊息>"
git push origin main
```

若 push 被拒（遠端有舊版）：先 `pull --rebase`，若還有衝突則 `push --force`（本地版本優先）。

若 repo 不存在，先建立：
```bash
gh repo create tarshar4242/<repo-name> --public --description "<說明>"
```

---

### Step 4｜確認 GitHub Pages（僅限 HTML 網頁專案）

論文包與一般專案**不需要開啟 GitHub Pages**，直接給 repo 網址即可。

HTML 網頁專案才需要：
```bash
gh api repos/tarshar4242/<repo>/pages --method POST -f source='{"branch":"main","path":"/"}'
```

---

### Step 5｜回傳結果

**論文包／一般專案：**
```
✅ 上傳完成！

📁 GitHub Repo：https://github.com/tarshar4242/<repo-name>
```

**HTML 網頁專案：**
```
✅ 部署完成！

🌐 可分享網址：https://tarshar4242.github.io/<repo>/<file>.html
📁 GitHub Repo：https://github.com/tarshar4242/<repo-name>
```

---

## 重要原則
- **不需要暫停確認**，直接執行整個流程
- 沒有 README 就自動生成，不要問使用者
- README 必須有視覺化結構（表格、標題層次、emoji 輔助分類），看起來清楚易懂
- 論文包 README 必須包含：標題中英文、作者、期刊、DOI、重點摘要、與論文主題的關聯
- push 失敗自動處理，不停下來問
- 最後一定給出可點擊的連結，這樣才算任務完成
