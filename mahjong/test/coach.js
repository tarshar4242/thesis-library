/* 新手教練碰碰的測試：建議合理、不偷看、AI 串接、照建議打勝率較高 */
const assert = require('assert');
const realTimeout = global.setTimeout;
const { Game, waitsOf } = require('../game');
const coach = require('../coach');
const coachAI = require('../coach-ai');
const t = (s) => s.split(' ');

// 建一桌凍結的牌局，再手動擺好牌
function table(hand, setup = () => {}) {
  const g = new Game([0, 1, 2, 3].map(i => ({ name: '玩家' + i, isAI: false })), { onUpdate() {}, onSfx() {}, onResult() {} });
  g.startHand();
  g.stop();
  g.players.forEach(p => { p.melds = []; p.discards = []; p.flowers = []; p.ting = null; });
  g.players[0].hand = t(hand);
  g.players[0].lastDraw = g.players[0].hand[g.players[0].hand.length - 1];
  g.turn = 0; g.phase = 'action'; g.finished = false;
  setup(g);
  return g;
}

// 1. 孤張字牌優先打掉
let f = coach.analyze(table('m1 m2 m3 p4 p5 p6 s7 s8 s9 m5 m6 p2 p3 s4 s5 z4 m9'), 0);
assert.strictEqual(f.situation, 'discard');
assert.strictEqual(f.suggest, 'z4', '應該建議打孤張的北：' + f.suggest);
assert.ok(coach.template(f).text.includes('北'), '台詞要提到北');

// 2. 打一張就聽牌：要說出聽哪幾張，且等待牌正確
f = coach.analyze(table('m1 m2 m3 p4 p5 p6 s7 s8 s9 m5 m6 p2 p3 p4 s5 s5 z1'), 0);
assert.strictEqual(f.suggest, 'z1');
assert.strictEqual(f.shanten, 0, '打東之後應該聽牌');
const rest = t('m1 m2 m3 p4 p5 p6 s7 s8 s9 m5 m6 p2 p3 p4 s5 s5');
assert.strictEqual(f.waits.length, waitsOf(rest).length, '等待牌數量要和實際聽的牌一致');
assert.ok(f.waits.includes('四萬') && f.waits.includes('七萬'), '聽四萬七萬：' + f.waits);
assert.ok(f.pct > 0 && f.pct <= 95, '胡牌機率合理：' + f.pct);

// 3. 有人聽牌時，同樣好的選擇裡挑他打過的牌（現物）
f = coach.analyze(table('m1 m2 m3 p4 p5 p6 s7 s8 s9 m5 m6 p2 p3 p4 s5 z2 z3', g => {
  g.players[1].ting = '聽牌';
  g.players[1].discards = ['z3'];
}), 0);
assert.strictEqual(f.suggest, 'z3', '應優先打現物西：' + f.suggest);
assert.strictEqual(f.safe, true);
assert.ok(coach.template(f).text.includes('現物'));

// 4. 別人打中，我有一對中：建議碰
f = coach.analyze(table('m1 m2 m3 p4 p5 p6 s7 s8 s9 m5 m6 p2 p3 z5 z5 s1', g => {
  g.phase = 'reaction'; g.turn = 1;
  g.ctx = { type: 'discard', tile: 'z5', from: 1 };
  g.pending = { 0: { opts: { pon: true }, resp: null } };
}), 0);
assert.strictEqual(f.situation, 'react');
assert.strictEqual(f.advice, 'pon');

// 5. 不偷看：別人的手牌換掉，分析結果完全一樣
const g5 = table('m1 m2 m3 p4 p5 p6 s7 s8 s9 m5 m6 p2 p3 p4 s5 s5 z1');
const a = JSON.stringify(coach.analyze(g5, 0));
g5.players[1].hand = t('z1 z1 z1 z2 z2 z2 z3 z3 z3 z4 z4 z4 z5 z5 z5 z6');
g5.players[2].hand = t('m9 m9 m9 p9 p9 p9 s9 s9 s9 m8 m8 m8 p8 p8 p8 s8');
assert.strictEqual(JSON.stringify(coach.analyze(g5, 0)), a, '分析不能用到對手手牌');

// 6. 名詞小教室：學過的不再教
const lessonOnce = coach.template(coach.analyze(table('m1 m2 m3 p4 p5 p6 s7 s8 s9 m5 m6 p2 p3 p4 s5 s5 z1'), 0), []);
assert.strictEqual(lessonOnce.lesson[0].term, '聽牌');
const lessonAgain = coach.template(coach.analyze(table('m1 m2 m3 p4 p5 p6 s7 s8 s9 m5 m6 p2 p3 p4 s5 s5 z1'), 0), ['聽牌']);
assert.strictEqual(lessonAgain.lesson.length, 0);
console.log('✓ 碰碰的建議測試通過');

(async () => {
  // 7. AI 串接：檢查送出的請求格式，並確認失敗時會退回範本
  let sent = null;
  coachAI.setClient({ beta: { messages: { create: async (body) => { sent = body; return { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: '打北啦～它沒朋友👋' }] }; } } } });
  assert.strictEqual(await coachAI.say({ situation: 'discard' }, { draft: '打北' }), '打北啦～它沒朋友👋');
  assert.strictEqual(sent.model, coachAI.MODEL);
  assert.deepStrictEqual(sent.betas, ['server-side-fallback-2026-07-01']);
  assert.strictEqual(sent.fallbacks, 'default');
  assert.ok(sent.system.includes('碰碰') && sent.messages[0].role === 'user');
  coachAI.setClient({ beta: { messages: { create: async () => ({ stop_reason: 'refusal', content: [] }) } } });
  assert.strictEqual(await coachAI.say({}, {}), null, '拒答時退回範本');
  coachAI.setClient({ beta: { messages: { create: async () => { throw new Error('網路斷了'); } } } });
  const warn = console.warn; console.warn = () => {};
  assert.strictEqual(await coachAI.say({}, {}), null, '連線失敗時退回範本');
  console.warn = warn;
  // 帳號不支援 fallback 參數 (400) 時，拿掉再試一次
  const SDK = require('@anthropic-ai/sdk'); const A = SDK.default || SDK;
  let plainCalled = false;
  coachAI.setClient({
    beta: { messages: { create: async () => { throw new A.BadRequestError(400, { error: { message: 'fallbacks: Extra inputs are not permitted' } }, 'fallbacks: Extra inputs are not permitted', new Headers()); } } },
    messages: { create: async (body) => { plainCalled = !body.fallbacks; return { stop_reason: 'end_turn', content: [{ type: 'text', text: '重試成功' }] }; } },
  });
  console.warn = () => {};
  assert.strictEqual(await coachAI.say({}, {}), '重試成功');
  console.warn = warn;
  assert.ok(plainCalled, '重試時不能再帶 fallbacks');
  assert.ok(coachAI.health().lastError.status === 400 && !JSON.stringify(coachAI.health()).includes('sk-ant'));
  // 額度保護：同一人 5 秒內只能問一次
  assert.strictEqual(coachAI.allow('s1'), true);
  assert.strictEqual(coachAI.allow('s1'), false);
  console.log('✓ AI 串接測試通過');

  // 8. 照碰碰建議打 vs 亂打：座位 0 的胡牌率
  global.setTimeout = (fn, ms) => realTimeout(fn, ms >= 10000 ? ms : 0);
  const run = (useCoach, hands) => new Promise((resolve) => {
    let n = 0, wins = 0;
    const g = new Game([0, 1, 2, 3].map(i => ({ name: 'P' + i, isAI: true })), {
      onUpdate() {}, onSfx() {},
      onResult(res) {
        if (res.kind === 'win' && res.winners[0].name === 'P0') wins++;
        if (++n >= hands) { g.stop(); resolve(wins / hands); }
      },
    });
    const aiAct = g.aiAct.bind(g), aiReact = g.aiReact.bind(g);
    g.aiAct = (seat) => {
      if (seat !== 0) return aiAct(seat);
      const o = g.actionOptions(0);
      if (!o) return;
      if (o.tsumo) return g.doAction(0, { type: 'tsumo' });
      if (!useCoach) {
        const h = g.players[0].hand;
        return g.doAction(0, { type: 'discard', tile: o.locked || h[Math.floor(Math.random() * h.length)] });
      }
      const fx = coach.analyze(g, 0);
      return g.doAction(0, { type: 'discard', tile: fx.suggest, ting: !!fx.canTing });
    };
    g.aiReact = (seat) => {
      if (seat !== 0) return aiReact(seat);
      const fx = coach.analyze(g, 0);
      if (fx.advice === 'hu') return { type: 'hu' };
      if (!useCoach) return { type: 'pass' };
      if (fx.advice === 'pon' || fx.advice === 'kong') return { type: fx.advice };
      if (fx.advice === 'chi') return { type: 'chi', tiles: g.pending[0].opts.chi[0] };
      return { type: 'pass' };
    };
    g.startHand();
  });
  const N = Number(process.argv[2]) || 80;
  const coached = await run(true, N), random = await run(false, N);
  console.log(`✓ ${N} 局模擬：照碰碰建議胡牌率 ${Math.round(coached * 100)}%，亂打 ${Math.round(random * 100)}%`);
  assert.ok(coached > random, '照建議打應該比亂打更常胡牌');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
