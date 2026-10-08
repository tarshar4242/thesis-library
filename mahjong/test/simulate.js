/* 自動測試：四台電腦連打多局，檢查牌數守恆與台數計算 */
const assert = require('assert');
const realTimeout = global.setTimeout;
global.setTimeout = (fn) => realTimeout(fn, 0); // 測試時不等待
const { Game, decompose, scoreHand } = require('../game');

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

let r = scoreHand(fakeGame(t('m1 m1 m1 m2 m2 m2 m3 m3 m3 m4 m4 m4 m5 m5 m5 m9 m9')), 0, { tsumo: true, winTile: 'm9' });
const names = r.breakdown.map(b => b.name);
assert.ok(names.includes('清一色') && names.includes('五暗刻') && names.includes('門清自摸'), '清一色五暗刻：' + names);

r = scoreHand(fakeGame(t('m2 m3 p4 p5 p6 s1 s2 s3 s7 s8 s9 m7 m8 m9 p9 p9')), 0, { tsumo: false, winTile: 'm4' });
assert.ok(r.breakdown.some(b => b.name === '平胡'), '平胡：' + JSON.stringify(r));

r = scoreHand(fakeGame(t('z5 z5 z5 z6 z6 z6 z7 z7 z7 m1 m2 m3 p1 p1 p1 s9 s9')), 0, { tsumo: true, winTile: 's9' });
assert.ok(r.breakdown.some(b => b.name === '大三元' && b.tai === 8), '大三元');
console.log('✓ 台數計算測試通過');

// ---- 整局模擬 ----
const HANDS = Number(process.argv[2]) || 60;
let results = { win: 0, draw: 0 };
const seats = [0, 1, 2, 3].map(i => ({ name: 'AI' + i, isAI: true }));
let game;
function check() {
  const total = game.wall.length + game.players.reduce((n, p) =>
    n + p.hand.length + p.flowers.length + p.discards.length +
    p.melds.reduce((k, m) => k + m.tiles.length, 0), 0);
  // 被吃碰槓的牌已從河裡移到副露，胡的那張也只算一次
  assert.strictEqual(total, 144, `牌數不守恆：${total}`);
  for (let s = 0; s < 4; s++) game.getView(s);
}
game = new Game(seats, {
  onUpdate: () => check(),
  onSfx: () => {},
  onResult: (res) => {
    results[res.kind]++;
    if (results.win + results.draw >= HANDS) {
      game.stop();
      const scores = game.players.map(p => p.score);
      assert.strictEqual(scores.reduce((a, b) => a + b, 0), 0, '分數總和應為 0');
      console.log(`✓ 模擬 ${HANDS} 局：胡 ${results.win} 局、流局 ${results.draw} 局，分數 ${scores.join(' / ')}`);
      console.log(`  最後在 ${game.roundWind} 風圈第 ${game.handNo} 局`);
      process.exit(0);
    }
  },
});
game.startHand();
realTimeout(() => { console.error('✗ 逾時，牌局可能卡住了'); process.exit(1); }, 60000);
