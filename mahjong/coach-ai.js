/* 碰碰的 AI 嘴巴：把算好的牌況交給 Claude，換成貼心又風趣的一句話 */
const SDK = require('@anthropic-ai/sdk');
const Anthropic = SDK.default || SDK;

const MODEL = process.env.COACH_MODEL || 'claude-opus-5-5';
const DAILY_LIMIT = Number(process.env.COACH_DAILY_LIMIT) || 300; // 保護免費額度
const MIN_GAP_MS = 5000; // 每位玩家 5 秒內最多問一次

const SYSTEM = `你是「我家三缺一」台式十六張麻將遊戲裡的新手教練「碰碰」，一隻戴著哨子的小麻雀精靈，站在牌桌邊陪初學者打牌。
說話規則：
- 台灣口語的繁體中文，貼心、幽默、像好朋友在旁邊小聲提點，可以用一兩個表情符號。
- 不使用破折號。
- 只根據使用者訊息裡給的牌況說話，不要自己編造牌、張數或機率；提到要打的牌時，牌名要和資料裡的完全一樣。
- 給「出牌建議」時一到兩句、80 字以內：先說打哪張，再用白話說為什麼。
- 資料裡有 lesson 時，順手用一句白話解釋那個名詞。
- 回答玩家提問時 150 字以內；問題和麻將無關時，俏皮地把話題帶回牌桌。
- 你看不到對手的手牌，不要假裝知道。`;

let client = null;
// 金鑰沒有綁定工作區時，要用 anthropic-workspace-id 標頭指定 (ID 以 wrkspc_ 開頭)
const WORKSPACE_ID = (process.env.ANTHROPIC_WORKSPACE_ID || '').trim();
if (process.env.ANTHROPIC_API_KEY) {
  client = new Anthropic(WORKSPACE_ID ? { defaultHeaders: { 'anthropic-workspace-id': WORKSPACE_ID } } : {});
}
// 測試時可以換成假的 client
function setClient(c) { client = c; }

let day = new Date().toDateString(), used = 0;
let lastError = null, lastOk = null; // 給 /api/coach-health 看，不含金鑰
const lastCall = new Map(); // socketId -> 時間

function available() { return !!client; }

function allow(socketId) {
  const today = new Date().toDateString();
  if (today !== day) { day = today; used = 0; }
  if (used >= DAILY_LIMIT) return false;
  const now = Date.now();
  if (now - (lastCall.get(socketId) || 0) < MIN_GAP_MS) return false;
  lastCall.set(socketId, now);
  used++;
  return true;
}
function forget(socketId) { lastCall.delete(socketId); }

// 回傳一句話；任何失敗都回傳 null，由呼叫端改用範本台詞
async function say(facts, { draft, lesson, question } = {}) {
  if (!client) return null;
  const data = { 牌況: facts, 範本建議: draft, lesson: lesson && lesson.length ? lesson : undefined };
  const content = question
    ? `玩家問你：「${String(question).slice(0, 200)}」\n目前牌況（JSON）：${JSON.stringify(data)}`
    : `請用碰碰的口吻改寫這次的出牌建議。\n${JSON.stringify(data)}`;
  const body = {
    model: MODEL,
    max_tokens: 1024,
    output_config: { effort: 'low' },
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  };
  // 先帶「拒答時自動換模型」；帳號不支援這個參數 (400) 時拿掉再試一次
  for (const withFallback of [true, false]) {
    try {
      const response = withFallback
        ? await client.beta.messages.create({ ...body, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }, { timeout: 15000, maxRetries: 1 })
        : await client.messages.create(body, { timeout: 15000, maxRetries: 1 });
      if (response.stop_reason === 'refusal') { note(null, 'refusal'); return null; }
      const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      if (text) { lastOk = new Date().toISOString(); return text; }
      note(null, `empty response (stop_reason: ${response.stop_reason})`);
      return null;
    } catch (error) {
      note(error);
      if (withFallback && error instanceof Anthropic.BadRequestError) continue;
      return null;
    }
  }
  return null;
}

function note(error, reason) {
  if (error instanceof Anthropic.RateLimitError) console.warn('[碰碰] API 請求太頻繁，先用範本台詞');
  else if (error instanceof Anthropic.AuthenticationError) console.warn('[碰碰] API 金鑰無效，請檢查 ANTHROPIC_API_KEY');
  else if (error instanceof Anthropic.APIError) console.warn(`[碰碰] API 錯誤 ${error.status}: ${error.message}`);
  else if (error) console.warn('[碰碰] 連線失敗:', error.message);
  else console.warn('[碰碰]', reason);
  lastError = {
    at: new Date().toISOString(),
    status: error && error.status || null,
    type: error ? error.constructor.name : 'NoText',
    message: String(error ? error.message : reason).replace(/sk-ant-[\w-]+/g, '[hidden]').slice(0, 300),
  };
}

function health() {
  return { available: !!client, model: MODEL, workspaceSet: !!WORKSPACE_ID, usedToday: used, dailyLimit: DAILY_LIMIT, lastOk, lastError };
}

module.exports = { say, available, allow, forget, setClient, health, MODEL };
