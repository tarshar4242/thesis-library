/* 自動測試：四台電腦連打多局，檢查牌數守恆與台數計算 */
const assert = require('assert');
const realTimeout = global.setTimeout;
global.setTimeout = (fn, ms) => realTimeout(fn, ms >= 10000 ? ms : 0); // 測試時不等電腦思考，但保留 20 秒逾時
const { Game, decompose, scoreHand, shanten, waitsOf } = require('../game');
const ALL = [];
for (const s of 'mps') for (let n = 1; n <= 9; n++) ALL.push(s + n);
for (let n = 1; n <= 7; n++) ALL.push('z' + n);

// ---- 台數單元測試 ----
function fakeGame(hand, melds = [], flowers = []) {
  return {
    dealer: 1, roundWind: 'z1', seatWind: () => 'z2',
    players: [{ hand, melds, flowers }],
  };
}
const t = (s) => s.split(' ');
assert.ok(decompose(t('m1 m1 m2 m3 m4 p5 p6 p7 s7 s8 s9 z5 z5 z5 z1 z1 z1')).length > 0, '基本胡牌');
assert.strictEqual(decompose(t('m1 m1 m2 m3 m4 p5 p6 p7 s7 s8 s9 z5 z5 z5 z1 z1 z2')).length, 0, '不成胡');

const names = (r) => r.breakdown.map(b => b.name);
const taiOf = (r, n) => (r.breakdown.find(b => b.name === n) || {}).tai;

let r = scoreHand(fakeGame(t('m1 m1 m1 m2 m2 m2 m3 m3 m3 m4 m4 m4 m5 m5 m5 m9 m9')), 0, { tsumo: true, winTile: 'm9' });
assert.ok(names(r).includes('清一色') && names(r).includes('五暗刻'), '清一色五暗刻：' + names(r));
assert.strictEqual(taiOf(r, '門清自摸'), 3, '門清自摸合併 3 台');
assert.ok(!names(r).includes('自摸') && !names(r).includes('門清'), '門清自摸不重複計');

r = scoreHand(fakeGame(t('m2 m3 p4 p5 p6 s1 s2 s3 s7 s8 s9 m7 m8 m9 p9 p9')), 0, { tsumo: false, winTile: 'm4' });
assert.ok(names(r).includes('平胡') && names(r).includes('無字無花'), '平胡+無字無花：' + names(r));

// 卡張只聽一張：獨聽，且不算平胡
r = scoreHand(fakeGame(t('m2 m4 p4 p5 p6 s1 s2 s3 s7 s8 s9 m7 m8 m9 p9 p9')), 0, { tsumo: false, winTile: 'm3' });
assert.ok(names(r).includes('獨聽') && !names(r).includes('平胡'), '獨聽：' + names(r));

r = scoreHand(fakeGame(t('z5 z5 z5 z6 z6 z6 z7 z7 z7 m1 m2 m3 p1 p1 p1 s9 s9')), 0, { tsumo: true, winTile: 's9' });
assert.strictEqual(taiOf(r, '大三元'), 8, '大三元');

r = scoreHand(fakeGame(t('z1 z1 z1 z2 z2 z2 z5 z5 z5 z6 z6 z6 z7 z7 z7 z4 z4')), 0, { tsumo: true, winTile: 'z4' });
assert.strictEqual(taiOf(r, '清一色'), 8, '字一色併入清一色 8 台：' + names(r));
assert.strictEqual(taiOf(r, '見風見台'), 2, '每組風刻 1 台');

r = scoreHand(fakeGame(t('m1 m2 m3 m4 m5 m6 p1 p2 p3 s4 s5 s6 s7 s8 s9 p9 p9'), [], t('f1 f2 f3 f4 f6')), 0, { tsumo: true, winTile: 'p9' });
assert.strictEqual(taiOf(r, '見花見台'), 5, '每張花 1 台');
assert.strictEqual(taiOf(r, '春夏秋冬'), 2, '湊齊春夏秋冬');

r = scoreHand(fakeGame(t('m1 m2 m4 p1 p1'), [], t('f1 f2 f3 f4 f5 f6 f7 f8')), 0, { tsumo: true, winTile: 'm4' });
assert.ok(names(r).includes('八仙過海') && r.tai === 20, '八仙過海 8+花 8+春夏秋冬 2+梅蘭竹菊 2：' + JSON.stringify(r));

r = scoreHand(fakeGame(t('m1 m1'), [
  { type: 'kong', tiles: t('p1 p1 p1 p1') }, { type: 'ankong', tiles: t('s2 s2 s2 s2') },
  { type: 'pon', tiles: t('m5 m5 m5') }, { type: 'chi', tiles: t('s4 s5 s6') }, { type: 'chi', tiles: t('p6 p7 p8') },
]), 0, { tsumo: false, winTile: 'm1' });
assert.ok(taiOf(r, '槓牌') === 1 && taiOf(r, '暗槓') === 2, '明槓 1、暗槓 2：' + names(r));

// 向聽數 0 必須等於「有聽的牌」
for (let i = 0; i < 300; i++) {
  const w = require('../game').sortTiles(Array.from({ length: 16 }, () => ALL[Math.floor(Math.random() * ALL.length)]));
  const ok = Object.values(w.reduce((c, x) => (c[x] = (c[x] || 0) + 1, c), {})).every(n => n <= 4);
  if (!ok) continue;
  assert.strictEqual(shanten(w) === 0, waitsOf(w).length > 0, '向聽數與聽牌判斷不一致：' + w.join(' '));
}
console.log('✓ 台數計算測試通過');

// ---- 整局模擬 ----
const HANDS = Number(process.argv[2]) || 60;
let results = { win: 0, draw: 0 };
const seen = new Set();
let maxStreak = 0;
const seats = [0, 1, 2, 3].map(i => ({ name: 'AI' + i, isAI: true }));
let game;
function check() {
  const total = game.wall.length + game.players.reduce((n, p) =>
    n + p.hand.length + p.flowers.length + p.discards.length +
    p.melds.reduce((k, m) => k + m.tiles.length, 0), 0);
  // 被吃碰槓的牌已從河裡移到副露，胡的那張也只算一次
  assert.strictEqual(total, 144, `牌數不守恆：${total}`);
  for (let s = 0; s < 4; s++) game.getView(s);
  if (!game.finished) for (const p of game.players) if (p.ting) assert.ok(waitsOf(p.hand.length % 3 === 2 ? p.hand.filter((x, i) => i !== p.hand.lastIndexOf(p.lastDraw)) : p.hand).length > 0 || p.flowers.length === 8, '宣告聽牌的人手牌必須在聽');
}
game = new Game(seats, {
  onUpdate: () => check(),
  onSfx: () => {},
  onResult: (res) => {
    results[res.kind]++;
    maxStreak = Math.max(maxStreak, game.streak);
    for (const w of res.winners || []) for (const b of w.breakdown) seen.add(b.name);
    if (results.win + results.draw >= HANDS) {
      game.stop();
      const scores = game.players.map(p => p.score);
      assert.strictEqual(scores.reduce((a, b) => a + b, 0), 0, '分數總和應為 0');
      console.log(`✓ 模擬 ${HANDS} 局：胡 ${results.win} 局、流局 ${results.draw} 局，分數 ${scores.join(' / ')}`);
      console.log(`  最後在 ${game.roundWind} 風圈第 ${game.handNo} 局，最多連莊 ${maxStreak} 次`);
      console.log(`  出現過的台型：${[...seen].join('、')}`);
      process.exit(0);
    }
  },
});
game.startHand();
realTimeout(() => { console.error('✗ 逾時，牌局可能卡住了'); process.exit(1); }, 60000);
