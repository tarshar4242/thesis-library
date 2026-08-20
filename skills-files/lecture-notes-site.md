---
name: lecture-notes-site
description: 把 Google Drive 的課程資料夾（講義簡報＋錄影回放）做成「逐幀詳細課堂筆記 HTML」＋「akira 風格多層次互動學習地圖 HTML」。當使用者貼出 Drive 課程資料夾連結、提到晨學講堂 EP 集數、或要求「課堂筆記／學習地圖／逐幀記錄」時使用。
---

# 課堂筆記＋互動學習地圖 產生器

把一個課程 Drive 資料夾變成兩個單檔 HTML 交付物，推上 GitHub 並發佈 Artifact 預覽。
**鐵則（見 repo CLAUDE.md）：資料來源不可自行跳過或降級。拿不到內容就解套，解套不了就 AskUserQuestion，絕不默默用推測內容交差。**

## 輸入

1. Drive 資料夾連結或 EP 集數（必要）
2. 參考 UI 網站（預設 akira.ipas-ai.com 風格：深色霓虹、卡片多層導覽、搜尋、遊戲化進度）

## 流程

### 第 1 步：定位與取得檔案

1. 從連結取出 folderId → `get_file_metadata` 確認標題。
2. `search_files` 用 `parentId = '<folderId>'` 列內容；**共享資料夾常搜不到子項**，
   改用 `sharedWithMe = true and title contains '<關鍵字>'` 與 `fullText contains '<EP編號>'` 交叉找。
3. 找不到就請使用者把檔案「建立副本」到自己的雲端硬碟（歷史有效解法），副本會出現在搜尋。
4. `read_file_content` 讀簡報文字。若簡報是滿版圖片型（抽出文字極少），文字內容要靠影片＋簡報原圖。

### 第 2 步：拿到影片與簡報原圖（逐幀的關鍵）

- Drive MCP 的 `download_file_content` 是 base64 回傳，**大檔不可用**。
- 需要網域 `drive.google.com`、`drive.usercontent.google.com`、`googleusercontent.com`、
  `huggingface.co`、`cdn-lfs.huggingface.co`。先 `curl -sS -o /dev/null -w "%{http_code}" --cacert /root/.ccr/ca-bundle.crt https://drive.usercontent.google.com/` 測（`000`=被擋）。
- 被擋 → AskUserQuestion 給三選項：①開通環境 Network access（claude.ai/code → Environments → Unrestricted）②使用者用 NotebookLM 產逐字稿存成 Google 文件給我讀 ③兩者都做。等待時用背景迴圈每 60s 監測，通了自動開跑。
- 下載（處理大檔確認頁）：
  ```bash
  url="https://drive.usercontent.google.com/download?id=${ID}&export=download&confirm=t"
  curl -sSL --cacert /root/.ccr/ca-bundle.crt -o out.bin "$url"
  # 若 file out.bin 是 HTML：抽 name="uuid" value 再帶 &uuid= 重打一次
  ```
- 簡報 pptx 下載後 `unzip -o ep.pptx 'ppt/media/*'` 取原圖，挑代表圖嵌入筆記。
- 影片抽格：`ffmpeg`（在 /opt/pw-browsers/ffmpeg-*）`-vf "fps=1/N,scale=1280:-2"` 出 jpg，
  用 Read 工具**親眼逐格看**並記錄每頁簡報／示範畫面（這就是「一幀一幀」）。
  **【A・抽格密度分級，依影片總長自動選，目標把總格數壓在 ~200 上下】**
  逐幀的價值是「看得到簡報翻頁與示範」，不是秒數越密越好；主成本＝格數（每格都要用視覺 token 讀），
  格數穩住＝製作時間就穩定。單集若有多支影片，先加總長度再選級距：
  - 總長 ≤ 50 分：`fps=1/15`（每 15 秒一格，~200 格）
  - 總長 50–90 分：`fps=1/25`（每 25 秒一格，~120–216 格）
  - 總長 > 90 分：`fps=1/35`（每 35 秒一格）；> 150 分建議 `fps=1/40` 或先問使用者是否分集。
  （ffmpeg 只吃整數秒，用 1/15、1/25、1/35、1/40。筆記標頭誠實寫實際秒數與總格數。）
- 逐字稿：`pip install faster-whisper` → 16kHz 單聲道 wav → small/int8 模型轉寫（4 核約 30–60 分鐘）。

### 第 3 步：產出兩個 HTML（單檔、繁中、手機優先）

**【B・輸出密度分級，預設精簡；使用者說「完整版／詳細版」才做完整】**
逐幀看得多仔細（A）與寫成多少節（B）是兩回事。頁數膨脹＝把每個觀察都撐成獨立一節（EP49 曾爆到 21 節、76K）。預設走精簡：
- **精簡版（預設）**：筆記頁 **8–10 節**、約 25–35K；互動地圖 4–5 章。
  合併同類：一張全景 SVG → 依「主題／工具」分節（不是依畫面分節）→ 課後檢核 → 金句 → 來源。
  一個工具/主題 = 一節，把它的多個功能收在該節的清單／表格裡，不要每個功能各開一節。
- **完整版（使用者指定才做）**：可到 15 節、每個示範獨立成節，就是 EP49 那種厚度。

命名：`ep<NN>-notes.html`（筆記）與 `ep<NN>-<主題slug>.html`（互動地圖）。

**筆記頁**（米白紙感、側欄目錄、可列印）依序含：
0 課程資訊表＋內嵌 Drive 預覽（`https://drive.google.com/file/d/<ID>/preview` iframe：簡報翻頁＋錄影播放）
1 一頁全景 SVG 圖解 → 各章逐節（重點清單/操作步驟/指令範例框/比較表/金句卡/真實簡報截圖）
→ 課後自我檢核表 → 資料來源與整理說明（誠實標註哪些是實錄、哪些是重構）。

**互動地圖頁**（akira 風格）：深色 `#0a0e1a` 底＋青紫霓虹漸層＋星點背景；
首頁章節卡片 → 章節頁（麵包屑）→ 技能手風琴 → 細節區塊，共四層；
全站關鍵字搜尋（點結果跳到該技能並展開）；技能打勾進度存 localStorage
（key 格式 `ep<NN>-skills-v1`）＋總進度條＋各章小進度條＋重置鈕；
內容一律放在 JS 的 `DATA` 物件（章→技能→blocks：ul/steps/prompt/table/tip/warn），由 JS 渲染。

### 第 4 步：驗證、上架網站與交付

1. 無頭 Chromium 截圖驗版面：`/opt/pw-browsers/chromium-*/chrome-linux/chrome --headless --no-sandbox --screenshot=x.png file:///...`；`--dump-dom` 確認 JS 有渲染出內容。
2. **上架共同入口 `lessons.html`（兩層結構）**：第一層是「系列」卡（如「📻 直播電台」）、
   第二層是該系列各集。晨學講堂直播課 → 在 `#view-radio` 卡片區「最前面」插入新課程卡
   （沿用既有 `.course` 卡片結構：`.ep` 標籤寫「直播電台 EP<NN>」、課名、一句簡介、tags、日期、
   兩顆連結鈕 `ep<NN>-notes.html`／`ep<NN>-<slug>.html`；`--c` 輪換 cyan/blue/purple/green）。
   若是新的課程系列：在 `#view-home` 加系列卡＋新增 `#view-<key>` 區塊。
   各集頁面「回入口」連結用 `lessons.html#radio`（直達系列頁）。
3. commit（繁中訊息）→ push 工作分支 → **合併回 main 並 push（使用者已常設授權：
   「一次一個課程放上我的網頁」，見 CLAUDE.md）**，讓 GitHub Pages 生效。
4. 兩檔各發佈 Artifact（favicon 固定：地圖🧠、筆記📝；重發用同檔名同路徑保 URL）。
5. 回覆使用者三組網址：GitHub Pages 正式網址
   （`https://tarshar4242.github.io/kt-sweet-journey/lessons.html` 起點）、
   Artifact 預覽連結、raw.githack 備用連結
   （`https://raw.githack.com/<owner>/<repo>/<branch>/<file>`，Drive iframe 在此可正常內嵌）。

## 品質守則

- 筆記的每一條內容都要能對到來源（簡報頁／影片時間點／逐字稿段落）；對不到的標「系列課程脈絡補充」。
- 逐字稿完成後回頭把筆記逐節替換成實錄內容，附影片時間戳（格式 `[mm:ss]`）。
- SVG 圖解至少 3 張（全景、核心觀念、流程）；表格一律包 `overflow-x:auto` 容器。
