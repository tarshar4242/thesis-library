---
name: health-check
description: 設定健康檢查。檢查已接的平台（FB / IG / LINE / Meta 廣告 / WordPress / Cloudinary）還正不正常，主動測出「已經失效」的 token。當用戶輸入 /health-check，或說「檢查設定」「設定還正常嗎」「token 還能用嗎」「東西壞了」「發不出去」時觸發。預設繁體中文，回應跟隨使用者語言（學員用英文就用英文）。
---

# /health-check · 設定健康檢查

> 「裝好後某天突然不能用」最常見的原因是 **token 失效**。這個指令幫你**實測「現在還能不能用」**，把已經失效的揪出來。

> 🚫 **做得到 vs 做不到（不要騙用戶）：**
> - ✅ **做得到**：實際打一次 API，測出 token「現在有效 / 已失效」。
> - ❌ **做不到**：預測「還剩幾天到期」。Meta 的 `/me/accounts` 只會回「能不能用」，**不會回剩幾天**。所以**絕對不要寫「再 X 天過期」這種數字——那是編的。**
> - 補充：照 Unit 7 正確流程拿到的 Page Token 本來就長期有效（不會自己到期），所以「定期實測還活著沒」就夠了。

## 執行

讀 `~/.claude/skills/_brand/meta-config.md`，**只測裡面有存的平台**，逐一驗證憑證還有沒有效：

| 平台 | 測試方式 |
|------|---------|
| FB 粉專 | `curl "https://graph.facebook.com/v25.0/me/accounts?access_token={TOKEN}"` |
| IG | `curl "https://graph.facebook.com/v25.0/{粉專ID}?fields=instagram_business_account&access_token={TOKEN}"` |
| LINE OA | `curl "https://api.line.me/v2/bot/info" -H "Authorization: Bearer {TOKEN}"` |
| WordPress | `curl -u "帳號:應用程式密碼" "https://{網址}/wp-json/wp/v2/users/me"` |
| Cloudinary | 上傳一張測試圖 |
| Meta 廣告 | 請 Claude「用 Meta Ads MCP 列出我的廣告帳號」（連得到就算正常；工具名各家 MCP 不同，不寫死）|

## 產出格式

```
【設定健康檢查】
✅ FB 粉專：正常（剛實測，token 現在有效）
❌ LINE：token 失效，需重設
✅ IG：正常
✅ WordPress：正常
✅ Meta 廣告：正常

要我帶你修哪一個？（接 /setup 對應流程）
```

## 修復

哪個壞了 → 引導用戶用 `/setup` 跑該平台的防呆子流程重設。

> meta-config.md 讀不到 → 代表還沒設定任何平台，引導用戶先跑 `/setup`。

---

## 🛠️ 平台改版自救（FB／IG 突然全部報錯時先看這個）

如果**原本好好的 FB／IG 指令，某天突然全部一起報錯**，多半不是 token 壞掉，而是 **Meta 的 API 版本過期了**（Meta 每個 API 版本約 2 年後停用）。

- **症狀**：錯誤訊息出現 `Unsupported get request`、`(#2635)`、或 `version ... is deprecated` 之類，且 FB/IG 相關指令**一次全壞**（不是只壞一個）。
- **自救**：本課的指令都打 `graph.facebook.com/v25.0/...`，把網址裡的 **`v25.0` 換成 Meta 當前最新版本**（例如 `v26.0`、`v27.0`…）即可。最簡單——**直接跟 Claude 說「把我指令裡的 Facebook API 版本換成目前最新版」**，它會幫你改。
- 換完版本若還是壞、且只壞某一個平台 → 那才比較可能是該平台 token 失效，回上面跑一次 `/health-check`、再用 `/setup` 重設。

> 💡 一句話分辨：**「全部一起壞」八成是版本過期（換 v 數字）；「只壞一個」才比較像 token 失效（重設）。**
