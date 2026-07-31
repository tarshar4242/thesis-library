---
name: pdf-to-video
description: 把簡報 PDF 做成有配音與同步字幕的教學影片（台灣中文語音，逐句字幕，1080p MP4）。當使用者上傳簡報 PDF 並說「做成影片」「簡報變影片」「配音影片」「加字幕跟語音做成影片」「PDF 轉影片」時觸發。流程：讀懂每頁內容寫口播稿 → edge-tts 合成語音 → 逐句字幕 → ffmpeg 組裝。大於 20 頁的簡報先做前幾頁示範給使用者確認風格再跑完整版。
---

# 簡報變影片（pdf-to-video）

把一份簡報 PDF 變成「每頁一段旁白＋逐句同步字幕」的教學影片。2026-07-30 首次在
Claude Code on the web 遠端環境為 Power BI 簡報（13 頁 → 5 分 21 秒影片）驗證成功。

## 環境準備（遠端環境每次新 session 都要做）

1. 安裝工具：`apt-get update && apt-get install -y poppler-utils ffmpeg`
   （中文字幕字型用系統內建的文泉驛正黑 WenQuanYi Zen Hei 即可；若無則 `apt-get install -y fonts-wqy-zenhei`）
2. 安裝語音套件：`pip3 install edge-tts`
3. **關鍵解套**：遠端環境外連走 egress proxy，edge-tts 會因憑證驗證失敗連不上。
   把 proxy 的 CA 加進 certifi 就通了：
   `cat /root/.ccr/ca-bundle.crt >> $(python3 -c "import certifi; print(certifi.where())")`
4. 先用一句話測試 TTS 能出聲音檔再往下做。

## 流程

1. **確認頁數**：`pdfinfo <pdf>` 看真實頁數。不要相信上傳時系統顯示的頁數
   （曾把 13 頁誤報成 172 頁，那是內部圖層數）。
2. **讀懂每頁、寫口播稿**：用 Read 工具（pages 參數，一次最多 20 頁）親眼看每頁，
   寫成 `narration.json`：`[{"page": 1, "text": "…"}, ...]`。口播稿規則：
   - 繁體中文（台灣）講課口吻，像老師在旁邊講解，不是照唸投影片；每頁 2～4 句、60～120 字。
   - 數字寫成中文讀法（「百分之二十」不寫「20%」）；英文專有名詞保留英文。
   - 忠實根據頁面實際內容，不可編造。過場頁 1～2 句即可。
   - 頁數多時可分派多個 subagent 平行撰寫，但**第 1 頁到示範過的頁面必須沿用使用者已核可的版本**，
     且合併時注意檔案載入順序不要讓後面的檔蓋掉已核可的稿子。
3. **先做示範**（簡報超過 20 頁時）：先做前 5～8 頁的短片給使用者過目，
   確認聲音、語速、字幕樣式後再跑完整版。
4. **組裝**：`python3 scripts/pdf2video.py <pdf> narration.json <輸出.mp4>`
   （預設聲音 zh-TW-HsiaoChenNeural「曉臻」；可中斷續跑，已完成頁面自動沿用）。
5. **交付前驗證**：抽 2～3 個時間點截圖 read-back，確認字幕有燒上、與該頁內容同步；
   `ffprobe` 確認有 video＋audio 兩軌。驗證過才交付。

## 技術備忘

- edge-tts 7.x 預設只回句邊界，要逐句精準字幕必須 `boundary="WordBoundary"`。
- 字幕時間軸做法：用逐字時間點對回口播稿的子句（以中文字數對齊），每頁再加上該頁在全片的起始位移。
- 每頁影片段：圖片 loop 15fps + 旁白前 0.4 秒、後 0.8 秒留白；libx264 veryfast + stillimage；
  全部段落 concat 後最後一次性把 SRT 燒進畫面。
- 想換使用者本人聲音：流程與稿子全部可保留，只要把 synth 換成聲音複製服務（如 ElevenLabs，
  需使用者自備金鑰）重新配音一次即可，屬 cost:'key' 等級，動工前先讓使用者拍板算力誰出。
