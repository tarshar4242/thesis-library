/* 台式十六張麻將 牌局邏輯 (後端重建版) */

const NAMES = {
  m1:'一萬',m2:'二萬',m3:'三萬',m4:'四萬',m5:'五萬',m6:'六萬',m7:'七萬',m8:'八萬',m9:'九萬',
  p1:'一筒',p2:'二筒',p3:'三筒',p4:'四筒',p5:'五筒',p6:'六筒',p7:'七筒',p8:'八筒',p9:'九筒',
  s1:'一索',s2:'二索',s3:'三索',s4:'四索',s5:'五索',s6:'六索',s7:'七索',s8:'八索',s9:'九索',
  z1:'東',z2:'南',z3:'西',z4:'北',z5:'中',z6:'發',z7:'白',
  f1:'春',f2:'夏',f3:'秋',f4:'冬',f5:'梅',f6:'蘭',f7:'竹',f8:'菊',
};
const nm = (t) => NAMES[t] || t;
const HIDDEN = '🀫';
const WINDS = ['z1', 'z2', 'z3', 'z4'];
const DRAGONS = ['z5', 'z6', 'z7'];
const ALL_KINDS = [];
for (const s of ['m', 'p', 's']) for (let n = 1; n <= 9; n++) ALL_KINDS.push(s + n);
for (let n = 1; n <= 7; n++) ALL_KINDS.push('z' + n);

// ---------- 牌的基本工具 ----------
const SUIT_ORDER = { m: 0, p: 1, s: 2, z: 3, f: 4 };
const tv = (t) => SUIT_ORDER[t[0]] * 10 + Number(t.slice(1));
const sortTiles = (arr) => arr.slice().sort((a, b) => tv(a) - tv(b));
const isFlower = (t) => t[0] === 'f';
const isHonor = (t) => t[0] === 'z';
const isSuited = (t) => 'mps'.includes(t[0]);
const shift = (t, k) => t[0] + (Number(t.slice(1)) + k);

function buildWall() {
  const w = [];
  for (const t of ALL_KINDS) for (let i = 0; i < 4; i++) w.push(t);
  for (let n = 1; n <= 8; n++) w.push('f' + n);
  for (let i = w.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [w[i], w[j]] = [w[j], w[i]];
  }
  return w;
}

function countOf(tiles) {
  const c = {};
  for (const t of tiles) c[t] = (c[t] || 0) + 1;
  return c;
}
function removeTiles(hand, tiles) {
  for (const t of tiles) hand.splice(hand.indexOf(t), 1);
}

// 拆解成「一對眼 + 若干面子」的所有方式
function decompose(tiles) {
  if (tiles.length % 3 !== 2) return [];
  const c = countOf(tiles);
  const kinds = sortTiles(Object.keys(c));
  const results = [];
  const sets = [];
  function findSets() {
    const t = kinds.find(k => c[k] > 0);
    if (!t) { results.push(sets.slice()); return; }
    if (c[t] >= 3) {
      c[t] -= 3; sets.push({ type: 'pung', tile: t });
      findSets();
      sets.pop(); c[t] += 3;
    }
    if (isSuited(t) && Number(t[1]) <= 7 && c[shift(t, 1)] > 0 && c[shift(t, 2)] > 0) {
      c[t]--; c[shift(t, 1)]--; c[shift(t, 2)]--;
      sets.push({ type: 'chow', tile: t });
      findSets();
      sets.pop();
      c[t]++; c[shift(t, 1)]++; c[shift(t, 2)]++;
    }
  }
  const out = [];
  for (const p of kinds) {
    if (c[p] < 2) continue;
    c[p] -= 2;
    findSets();
    c[p] += 2;
    while (results.length) out.push({ pair: p, sets: results.shift() });
  }
  return out;
}
const isWinning = (tiles) => decompose(tiles).length > 0;
const waitsOf = (hand) => ALL_KINDS.filter(t => isWinning(hand.concat(t)));

// ---------- 台數計算 (依明星3缺1「見花見字」台數表) ----------
// 莊家與連莊拉莊的台數依付錢的人而不同，在 Game.win() 另外處理
function scoreHand(game, seat, ctx) {
  const p = game.players[seat];
  const concealed = ctx.tsumo ? p.hand.slice() : p.hand.concat(ctx.winTile);
  const menqing = p.melds.every(m => m.type === 'ankong');
  const allTiles = concealed.concat(...p.melds.map(m => m.tiles));
  const suits = new Set(allTiles.filter(isSuited).map(t => t[0]));
  const hasHonor = allTiles.some(isHonor);
  const fl = p.flowers;

  // 與牌型拆法無關的台
  const common = [];
  const add = (list, name, tai) => list.push({ name, tai });
  if (ctx.tianhu) add(common, '天胡', 24);
  if (ctx.dihu) add(common, '地胡', 16);
  if (fl.length === 8) add(common, '八仙過海', 8);
  if (fl.length) add(common, '見花見台', fl.length);
  if (['f1', 'f2', 'f3', 'f4'].every(f => fl.includes(f))) add(common, '春夏秋冬', 2);
  if (['f5', 'f6', 'f7', 'f8'].every(f => fl.includes(f))) add(common, '梅蘭竹菊', 2);
  if (p.ting) add(common, p.ting, { 天聽: 8, 地聽: 4, 聽牌: 1 }[p.ting]);
  const kongs = p.melds.filter(m => m.type === 'kong').length;
  const ankongs = p.melds.filter(m => m.type === 'ankong').length;
  if (kongs) add(common, '槓牌', kongs);
  if (ankongs) add(common, '暗槓', ankongs * 2);
  if (ctx.replacementDraw) add(common, '槓上開花', 1);
  if (ctx.robKong) add(common, '搶槓胡', 1);
  if (ctx.tsumo && ctx.lastTile) add(common, '海底撈月', 1);

  const decs = decompose(concealed);
  // 八仙過海可以直接喊胡，手牌不必成胡
  if (!decs.length) return { tai: common.reduce((a, b) => a + b.tai, 0), breakdown: common };

  if (menqing && ctx.tsumo) add(common, '門清自摸', 3);
  else if (ctx.tsumo) add(common, '自摸', 1);
  else if (menqing) add(common, '門清', 1);
  if (!fl.length && !hasHonor) add(common, '無字無花', 2);

  // 胡牌前只聽一張 = 獨聽
  const before = ctx.tsumo ? (() => { const h = p.hand.slice(); removeTiles(h, [ctx.winTile]); return h; })() : p.hand;
  const singleWait = waitsOf(before).length === 1;
  const quanqiu = p.melds.length === 5 && p.melds.every(m => m.type !== 'ankong') && !ctx.tsumo;
  if (quanqiu) add(common, '全求', 2);
  else if (singleWait) add(common, '獨聽', 1);

  let best = null;
  for (const d of decs) {
    const items = common.slice();
    const sets = p.melds.map(m => ({
      kind: m.type === 'chi' ? 'chow' : 'pung',
      tile: m.type === 'chi' ? sortTiles(m.tiles)[0] : m.tiles[0],
      concealed: m.type === 'ankong',
    }));
    const handSets = d.sets.map(s => ({ kind: s.type, tile: s.tile, concealed: true }));
    // 胡別人打的牌湊成的刻子不算暗刻
    if (!ctx.tsumo) {
      const inChow = handSets.some(s => s.kind === 'chow' && s.tile[0] === ctx.winTile[0] &&
        Number(ctx.winTile[1]) - Number(s.tile[1]) >= 0 && Number(ctx.winTile[1]) - Number(s.tile[1]) <= 2);
      const pung = handSets.find(s => s.kind === 'pung' && s.tile === ctx.winTile);
      if (pung && !inChow && d.pair !== ctx.winTile) pung.concealed = false;
    }
    sets.push(...handSets);

    if (sets.every(s => s.kind === 'chow') && !hasHonor && !fl.length && !singleWait && !ctx.tsumo) add(items, '平胡', 2);
    if (sets.every(s => s.kind === 'pung')) add(items, '碰碰胡', 4);

    if (suits.size === 0 || (suits.size === 1 && !hasHonor)) add(items, '清一色', 8);
    else if (suits.size === 1) add(items, '混一色', 4);

    const dragonPungs = sets.filter(s => s.kind === 'pung' && DRAGONS.includes(s.tile)).length;
    if (dragonPungs === 3) add(items, '大三元', 8);
    else if (dragonPungs === 2 && DRAGONS.includes(d.pair)) add(items, '小三元', 4);
    else if (dragonPungs) add(items, '三元牌', dragonPungs);

    const windPungs = sets.filter(s => s.kind === 'pung' && WINDS.includes(s.tile)).length;
    if (windPungs === 4) add(items, '大四喜', 16);
    else if (windPungs === 3 && WINDS.includes(d.pair)) add(items, '小四喜', 8);
    else if (windPungs) add(items, '見風見台', windPungs);

    const anke = sets.filter(s => s.kind === 'pung' && s.concealed).length;
    if (anke >= 5) add(items, '五暗刻', 8);
    else if (anke === 4) add(items, '四暗刻', 5);
    else if (anke === 3) add(items, '三暗刻', 2);

    const tai = items.reduce((a, b) => a + b.tai, 0);
    if (!best || tai > best.tai) best = { tai, breakdown: items };
  }
  return best;
}

// ---------- 電腦 AI ----------
function tileValue(hand, t) {
  const c = countOf(hand);
  let v = (c[t] - 1) * 5;
  if (isSuited(t)) {
    for (const k of [-2, -1, 1, 2]) {
      const n = Number(t[1]) + k;
      if (n >= 1 && n <= 9 && c[shift(t, k)]) v += Math.abs(k) === 1 ? 3 : 1.5;
    }
    if (t[1] === '1' || t[1] === '9') v -= 0.5;
  }
  return v;
}
// 向聽數：離聽牌還差幾步 (0 = 聽牌)
// 單一花色可以拆出的 [面子數, 搭子數, 有無眼] 組合 (結果快取起來重複使用)
const groupCache = new Map();
function groupOptions(c, suited) {
  const key = (suited ? 's' : 'z') + c.join('');
  if (groupCache.has(key)) return groupCache.get(key);
  const found = new Map();
  function search(i, m, part, pair) {
    while (i < c.length && !c[i]) i++;
    if (i >= c.length) { found.set(`${m},${part},${pair}`, [m, part, pair]); return; }
    if (c[i] >= 3) { c[i] -= 3; search(i, m + 1, part, pair); c[i] += 3; }
    if (suited && i <= 6 && c[i + 1] && c[i + 2]) {
      c[i]--; c[i + 1]--; c[i + 2]--; search(i, m + 1, part, pair); c[i]++; c[i + 1]++; c[i + 2]++;
    }
    if (c[i] >= 2) {
      c[i] -= 2;
      if (!pair) search(i, m, part, 1);
      search(i, m, part + 1, pair);
      c[i] += 2;
    }
    if (suited && i <= 7 && c[i + 1]) { c[i]--; c[i + 1]--; search(i, m, part + 1, pair); c[i]++; c[i + 1]++; }
    if (suited && i <= 6 && c[i + 2]) { c[i]--; c[i + 2]--; search(i, m, part + 1, pair); c[i]++; c[i + 2]++; }
    c[i]--; search(i + 1, m, part, pair); c[i]++;
  }
  search(0, 0, 0, 0);
  const opts = [...found.values()];
  groupCache.set(key, opts);
  return opts;
}

function shanten(tiles) {
  const groups = [new Array(9).fill(0), new Array(9).fill(0), new Array(9).fill(0), new Array(7).fill(0)];
  for (const t of tiles) groups[SUIT_ORDER[t[0]]][Number(t.slice(1)) - 1]++;
  const opts = groups.map((c, i) => groupOptions(c, i < 3));
  const need = Math.floor(tiles.length / 3);
  let best = 99;
  (function combine(g, m, part, pair) {
    if (g === 4) {
      const s = 2 * (need - m) - Math.min(part, need - m) - pair;
      if (s < best) best = s;
      return;
    }
    for (const [om, op, opr] of opts[g]) {
      if (pair && opr) continue;
      combine(g + 1, m + om, part + op, pair || opr);
    }
  })(0, 0, 0, 0);
  return best;
}

function aiChooseDiscard(hand, game, seat) {
  let best = null, bestS = Infinity, bestV = Infinity;
  for (const t of new Set(hand)) {
    const rest = hand.slice(); rest.splice(rest.indexOf(t), 1);
    const s = shanten(rest);
    let v = tileValue(hand, t);
    if (isHonor(t) && (DRAGONS.includes(t) || t === game.roundWind || t === game.seatWind(seat))) v += 0.5;
    if (s < bestS || (s === bestS && v < bestV)) { bestS = s; bestV = v; best = t; }
  }
  return best;
}

// ---------- 牌局 ----------
class Game {
  constructor(seats, hooks) {
    this.players = seats.map((s, i) => ({
      seat: i, name: s.name, isAI: s.isAI, score: 0,
      hand: [], melds: [], flowers: [], discards: [], lastDraw: null,
    }));
    this.hooks = hooks;
    this.dealer = 0;
    this.roundWind = 'z1';
    this.handNo = 1;
    this.rotations = 0;
    this.streak = 0; // 連莊次數，上限 10
    this.log = [];
    this.version = 0;
    this.dead = false;
  }

  seatWind(seat) { return WINDS[(seat - this.dealer + 4) % 4]; }
  addLog(msg) { this.log.push(msg); if (this.log.length > 200) this.log.shift(); }
  stop() { this.dead = true; clearTimeout(this.reactionTimer); clearTimeout(this.nextHandTimer); }

  update() {
    if (this.dead) return;
    this.version++;
    this.hooks.onUpdate();
    this.tick();
  }

  startHand() {
    this.wall = buildWall();
    for (const p of this.players) {
      p.hand = []; p.melds = []; p.flowers = []; p.discards = []; p.lastDraw = null; p.ting = null;
    }
    for (let i = 0; i < 4; i++) {
      const p = this.players[(this.dealer + i) % 4];
      p.hand = this.wall.splice(0, 16);
    }
    for (let i = 0; i < 4; i++) {
      const p = this.players[(this.dealer + i) % 4];
      while (p.hand.some(isFlower)) {
        const f = p.hand.find(isFlower);
        removeTiles(p.hand, [f]);
        p.flowers.push(f);
        p.hand.push(this.wall.pop());
      }
    }
    this.turn = this.dealer;
    this.phase = 'action';
    this.finished = false;
    this.pending = null;
    this.claimHappened = false;
    this.discardCount = 0;
    this.addLog(`── 第 ${this.handNo} 局開始，莊家：${this.players[this.dealer].name} ──`);
    this.drawTile(this.dealer);
    this.update();
  }

  // 摸牌，花牌自動補花；牌牆摸完回傳 null
  drawTile(seat, fromBack = false) {
    const p = this.players[seat];
    for (;;) {
      if (!this.wall.length) return null;
      const t = fromBack ? this.wall.pop() : this.wall.shift();
      if (isFlower(t)) {
        p.flowers.push(t);
        this.addLog(`${p.name} 補花 ${nm(t)}`);
        fromBack = true;
        continue;
      }
      p.hand.push(t);
      p.lastDraw = t;
      this.replacementDraw = fromBack; // 槓或補花後補進的牌，胡了算槓上開花
      return t;
    }
  }

  actionOptions(seat) {
    if (this.finished || this.phase !== 'action' || this.turn !== seat) return null;
    const p = this.players[seat];
    const c = countOf(p.hand);
    // 八張花全拿 (八仙過海) 可直接喊胡
    const tsumo = p.lastDraw != null && (isWinning(p.hand) || p.flowers.length === 8);
    // 聽牌後手牌鎖住：只能自摸或打出摸進的牌
    if (p.ting) return { discard: true, tsumo, ankong: [], addkong: [], ting: [], locked: p.lastDraw };
    return {
      discard: true,
      tsumo,
      ankong: Object.keys(c).filter(t => c[t] === 4),
      addkong: p.melds.filter(m => m.type === 'pon' && c[m.tiles[0]]).map(m => m.tiles[0]),
      // 打出哪幾張後會聽牌 (可宣告聽牌)
      ting: [...new Set(p.hand)].filter(t => {
        const rest = p.hand.slice(); removeTiles(rest, [t]); return shanten(rest) === 0;
      }),
    };
  }

  getView(seat) {
    const players = this.players.map(p => ({
      seat: p.seat, name: p.name, wind: this.seatWind(p.seat), score: p.score,
      handCount: p.hand.length,
      melds: p.melds.map(m => ({
        type: m.type,
        tiles: m.type === 'ankong' && p.seat !== seat ? [HIDDEN, HIDDEN, HIDDEN, HIDDEN] : m.tiles,
      })),
      flowers: p.flowers, discards: p.discards, ting: p.ting,
    }));
    let me = null;
    if (seat >= 0) {
      const p = this.players[seat];
      const pend = this.phase === 'reaction' && this.pending && this.pending[seat];
      me = {
        seat, hand: sortTiles(p.hand), lastDraw: p.lastDraw, melds: p.melds, flowers: p.flowers, ting: p.ting,
        options: this.actionOptions(seat),
        reaction: pend && !pend.resp ? pend.opts : null,
      };
    }
    return {
      roundWind: this.roundWind, handNo: this.handNo, dealer: this.dealer, streak: this.streak,
      turn: this.turn, phase: this.phase, finished: this.finished,
      wallLeft: this.wall.length, players, me,
    };
  }

  doAction(seat, a) {
    if (this.finished) return { error: '本局已結束' };
    if (!a || !a.type) return { error: '無效動作' };
    if (this.phase === 'reaction') return this.react(seat, a);
    if (this.turn !== seat) return { error: '還沒輪到你' };
    const p = this.players[seat];
    const opts = this.actionOptions(seat);

    if (a.type === 'discard') {
      if (!p.hand.includes(a.tile)) return { error: '手上沒有這張牌' };
      if (p.ting && a.tile !== p.lastDraw) return { error: '聽牌後只能打出摸進的牌' };
      if (a.ting) {
        if (p.ting || !opts.ting.includes(a.tile)) return { error: '打這張不會聽牌' };
        // 天聽：莊家第一張就聽；地聽：海底打進八張內且四家沒吃碰槓
        const clean = !this.claimHappened;
        p.ting = seat === this.dealer && this.discardCount === 0 && clean ? '天聽'
          : this.discardCount < 8 && clean ? '地聽' : '聽牌';
      }
      removeTiles(p.hand, [a.tile]);
      p.discards.push(a.tile);
      p.lastDraw = null;
      this.discardCount++;
      this.addLog(`${p.name} 打出 ${nm(a.tile)}${a.ting ? `，宣告${p.ting}！` : ''}`);
      this.hooks.onSfx('discard');
      this.openReactions(a.tile, seat);
      return {};
    }
    if (a.type === 'tsumo') {
      if (!opts.tsumo) return { error: '還不能胡' };
      this.win(seat, { tsumo: true, winTile: p.lastDraw });
      return {};
    }
    if (a.type === 'ankong') {
      if (!opts.ankong.includes(a.tile)) return { error: '不能暗槓' };
      removeTiles(p.hand, [a.tile, a.tile, a.tile, a.tile]);
      p.melds.push({ type: 'ankong', tiles: [a.tile, a.tile, a.tile, a.tile] });
      this.addLog(`${p.name} 暗槓`);
      this.hooks.onSfx('ankong');
      this.kongReplace(seat);
      return {};
    }
    if (a.type === 'addkong') {
      if (!opts.addkong.includes(a.tile)) return { error: '不能加槓' };
      // 先看有沒有人搶槓
      const pending = {};
      for (let i = 0; i < 4; i++) {
        if (i !== seat && isWinning(this.players[i].hand.concat(a.tile))) pending[i] = { opts: { hu: true }, resp: null };
      }
      if (Object.keys(pending).length) {
        this.ctx = { type: 'rob', tile: a.tile, from: seat };
        this.enterReaction(pending);
      } else {
        this.completeAddKong(seat, a.tile);
      }
      return {};
    }
    return { error: '無效動作' };
  }

  completeAddKong(seat, t) {
    const p = this.players[seat];
    const meld = p.melds.find(m => m.type === 'pon' && m.tiles[0] === t);
    meld.type = 'kong';
    meld.tiles.push(t);
    removeTiles(p.hand, [t]);
    this.addLog(`${p.name} 加槓 ${nm(t)}`);
    this.hooks.onSfx('addkong');
    this.kongReplace(seat);
  }

  kongReplace(seat) {
    this.claimHappened = true;
    if (!this.drawTile(seat, true)) return this.exhaust();
    this.turn = seat;
    this.phase = 'action';
    this.update();
  }

  openReactions(tile, from) {
    const pending = {};
    for (let i = 0; i < 4; i++) {
      if (i === from) continue;
      const p = this.players[i];
      const cnt = p.hand.filter(t => t === tile).length;
      const opts = {};
      if (isWinning(p.hand.concat(tile))) opts.hu = true;
      if (this.wall.length && !p.ting) {
        if (cnt >= 2) opts.pon = true;
        if (cnt >= 3) opts.kong = true;
        if (i === (from + 1) % 4 && isSuited(tile)) {
          const n = Number(tile[1]);
          const combos = [];
          for (const start of [n - 2, n - 1, n]) {
            if (start < 1 || start > 7) continue;
            const combo = [0, 1, 2].map(k => tile[0] + (start + k));
            const others = combo.slice(); others.splice(others.indexOf(tile), 1);
            if (others.every(t => p.hand.includes(t))) combos.push(combo);
          }
          if (combos.length) opts.chi = combos;
        }
      }
      if (Object.keys(opts).length) pending[i] = { opts, resp: null };
    }
    if (!Object.keys(pending).length) return this.nextTurn(from);
    this.ctx = { type: 'discard', tile, from };
    this.enterReaction(pending);
  }

  enterReaction(pending) {
    this.pending = pending;
    this.phase = 'reaction';
    clearTimeout(this.reactionTimer);
    // 真人 20 秒沒反應就自動「過」
    this.reactionTimer = setTimeout(() => {
      if (this.dead || this.phase !== 'reaction' || this.pending !== pending) return;
      for (const s in this.pending) {
        if (!this.pending[s].resp && !this.players[s].isAI) this.pending[s].resp = { type: 'pass' };
      }
      if (Object.values(this.pending).every(x => x.resp)) this.resolveReactions();
      else this.update();
    }, 20000);
    this.update();
  }

  react(seat, a) {
    const pend = this.pending && this.pending[seat];
    if (!pend || pend.resp) return { error: '現在不能動作' };
    const o = pend.opts;
    const ok = a.type === 'pass' || (a.type === 'hu' && o.hu) || (a.type === 'pon' && o.pon) ||
      (a.type === 'kong' && o.kong) ||
      (a.type === 'chi' && o.chi && Array.isArray(a.tiles) && o.chi.some(c => c.join() === sortTiles(a.tiles).join()));
    if (!ok) return { error: '不能這樣做' };
    // 天聽、地聽不得過水：能胡卻不胡就降為一般聽牌
    const p = this.players[seat];
    if (a.type === 'pass' && o.hu && (p.ting === '天聽' || p.ting === '地聽')) p.ting = '聽牌';
    pend.resp = a;
    if (Object.values(this.pending).every(x => x.resp)) this.resolveReactions();
    else this.update();
    return {};
  }

  resolveReactions() {
    clearTimeout(this.reactionTimer);
    const { tile, from, type } = this.ctx;
    const pend = this.pending;
    const order = [1, 2, 3].map(k => (from + k) % 4).filter(s => pend[s]);
    const pick = (types) => order.find(s => types.includes(pend[s].resp.type));
    this.pending = null;

    // 優先順序：胡 > 碰/槓 > 吃
    const huSeat = pick(['hu']);
    if (huSeat !== undefined) {
      return this.win(huSeat, { tsumo: false, winTile: tile, from, robKong: type === 'rob' });
    }
    if (type === 'rob') return this.completeAddKong(from, tile);

    const seat = pick(['kong', 'pon']) ?? pick(['chi']);
    if (seat === undefined) return this.nextTurn(from);
    this.claim(seat, pend[seat].resp, tile, from);
  }

  claim(seat, a, tile, from) {
    const p = this.players[seat];
    this.players[from].discards.pop();
    this.claimHappened = true;
    p.lastDraw = null;
    if (a.type === 'kong') {
      removeTiles(p.hand, [tile, tile, tile]);
      p.melds.push({ type: 'kong', tiles: [tile, tile, tile, tile], from });
      this.addLog(`${p.name} 槓 ${nm(tile)}`);
      this.hooks.onSfx('kong');
      return this.kongReplace(seat);
    }
    if (a.type === 'pon') {
      removeTiles(p.hand, [tile, tile]);
      p.melds.push({ type: 'pon', tiles: [tile, tile, tile], from });
      this.addLog(`${p.name} 碰 ${nm(tile)}`);
      this.hooks.onSfx('pon');
    } else {
      const combo = sortTiles(a.tiles);
      const others = combo.slice(); others.splice(others.indexOf(tile), 1);
      removeTiles(p.hand, others);
      p.melds.push({ type: 'chi', tiles: combo, from });
      this.addLog(`${p.name} 吃 ${combo.map(nm).join('')}`);
      this.hooks.onSfx('chi');
    }
    this.turn = seat;
    this.phase = 'action';
    this.update();
  }

  nextTurn(from) {
    const seat = (from + 1) % 4;
    if (!this.drawTile(seat)) return this.exhaust();
    this.turn = seat;
    this.phase = 'action';
    this.update();
  }

  win(seat, ctx) {
    const p = this.players[seat];
    ctx.lastTile = this.wall.length === 0;
    ctx.tianhu = ctx.tsumo && seat === this.dealer && !this.claimHappened && this.players.every(x => !x.discards.length);
    ctx.dihu = ctx.tsumo && seat !== this.dealer && !this.claimHappened && !p.discards.length && !ctx.tianhu;
    ctx.replacementDraw = ctx.tsumo && this.replacementDraw;
    const { tai: baseTai, breakdown } = scoreHand(this, seat, ctx);

    // 莊家 1 台 + 連N拉N 共 2N 台：莊家胡牌、或莊家付錢時才算
    const dealerTai = 1 + 2 * this.streak;
    const dealerItems = [{ name: '莊家', tai: 1 }];
    if (this.streak) dealerItems.push({ name: `連${this.streak}拉${this.streak}`, tai: 2 * this.streak });
    const payers = ctx.tsumo ? this.players.filter(o => o !== p) : [this.players[ctx.from]];
    let points = 0;
    for (const o of payers) {
      const pay = 1 + baseTai + (seat === this.dealer || o.seat === this.dealer ? dealerTai : 0); // 底 1 + 台數
      o.score -= pay; p.score += pay; points += pay;
    }
    let tai = baseTai;
    if (seat === this.dealer || (!ctx.tsumo && ctx.from === this.dealer)) {
      breakdown.unshift(...dealerItems);
      tai += dealerTai;
    } else if (ctx.tsumo) {
      breakdown.push({ name: '莊家另付', tai: dealerTai });
    }
    if (!ctx.tsumo) {
      p.hand.push(ctx.winTile);
      // 胡的那張牌從放槍者那邊移走 (搶槓則從他手上拿走要加槓的牌)
      if (ctx.robKong) removeTiles(this.players[ctx.from].hand, [ctx.winTile]);
      else this.players[ctx.from].discards.pop();
    }
    const typeLabel = ctx.tsumo ? '自摸' : ctx.robKong ? '搶槓胡' : '胡牌';
    this.addLog(`${p.name} ${typeLabel}！${tai} 台`);
    this.hooks.onSfx('hu');
    this.endHand({
      kind: 'win', typeLabel,
      from: ctx.tsumo ? null : this.players[ctx.from].name,
      winners: [{
        name: p.name, hand: sortTiles(p.hand), melds: p.melds, flowers: p.flowers,
        tai, points, breakdown,
      }],
    }, seat === this.dealer);
  }

  exhaust() {
    this.addLog('牌牆摸完，流局');
    const tenpai = this.players.map(p => ({
      name: p.name,
      tenpai: waitsOf(p.hand.length % 3 === 2 ? p.hand.slice(0, -1) : p.hand).length > 0,
    }));
    this.endHand({ kind: 'draw', tenpai }, true);
  }

  endHand(res, dealerStays) {
    this.finished = true;
    this.phase = 'end';
    res.scores = this.players.map(p => ({ name: p.name, score: p.score }));
    this.hooks.onResult(res);
    this.update();
    this.nextHandTimer = setTimeout(() => {
      if (this.dead) return;
      if (dealerStays && this.streak < 10) {
        this.streak++;
      } else {
        this.streak = 0;
        this.dealer = (this.dealer + 1) % 4;
        this.rotations++;
        if (this.rotations % 4 === 0) this.roundWind = WINDS[(WINDS.indexOf(this.roundWind) + 1) % 4];
      }
      this.handNo++;
      this.startHand();
    }, 7000);
  }

  // ---------- 電腦行動 ----------
  tick() {
    if (this.dead || this.finished) return;
    const v = this.version;
    if (this.phase === 'action' && this.players[this.turn].isAI) {
      setTimeout(() => { if (!this.dead && this.version === v) this.aiAct(this.turn); }, 700);
    } else if (this.phase === 'reaction') {
      setTimeout(() => {
        if (this.dead || this.version !== v || this.phase !== 'reaction') return;
        for (const s in this.pending) {
          if (this.phase !== 'reaction') break;
          if (this.players[s].isAI && !this.pending[s].resp) this.react(Number(s), this.aiReact(Number(s)));
        }
      }, 400);
    }
  }

  aiAct(seat) {
    const p = this.players[seat];
    const o = this.actionOptions(seat);
    if (!o) return;
    if (o.tsumo) return this.doAction(seat, { type: 'tsumo' });
    if (p.ting) return this.doAction(seat, { type: 'discard', tile: o.locked });
    if (o.ankong.length) return this.doAction(seat, { type: 'ankong', tile: o.ankong[0] });
    if (o.addkong.length) return this.doAction(seat, { type: 'addkong', tile: o.addkong[0] });
    const tile = aiChooseDiscard(p.hand, this, seat);
    return this.doAction(seat, { type: 'discard', tile, ting: o.ting.includes(tile) });
  }

  aiReact(seat) {
    const o = this.pending[seat].opts;
    const t = this.ctx.tile;
    const hand = this.players[seat].hand;
    if (o.hu) return { type: 'hu' };
    if (o.kong) return { type: 'kong' };
    // 吃碰之後要打一張，所以比較「吃碰再打最好的一張」是否比現在更接近聽牌
    const now = shanten(hand);
    const after = (used) => {
      const rest = hand.slice(); removeTiles(rest, used);
      return Math.min(...[...new Set(rest)].map(d => {
        const r = rest.slice(); r.splice(r.indexOf(d), 1); return shanten(r);
      }));
    };
    if (o.pon) {
      const valuable = DRAGONS.includes(t) || t === this.roundWind || t === this.seatWind(seat);
      if (valuable || after([t, t]) < now) return { type: 'pon' };
    }
    if (o.chi) {
      for (const combo of o.chi) {
        const others = combo.slice(); others.splice(others.indexOf(t), 1);
        if (after(others) < now) return { type: 'chi', tiles: combo };
      }
    }
    return { type: 'pass' };
  }
}

module.exports = { Game, decompose, isWinning, waitsOf, scoreHand, shanten, sortTiles };
