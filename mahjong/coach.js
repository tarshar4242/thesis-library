/* 新手教練「碰碰」：只用玩家看得到的資訊算牌，產生建議與台詞 */
const { shanten, waitsOf, isWinning, sortTiles } = require('./game');

const NAMES = {
  m1:'一萬',m2:'二萬',m3:'三萬',m4:'四萬',m5:'五萬',m6:'六萬',m7:'七萬',m8:'八萬',m9:'九萬',
  p1:'一筒',p2:'二筒',p3:'三筒',p4:'四筒',p5:'五筒',p6:'六筒',p7:'七筒',p8:'八筒',p9:'九筒',
  s1:'一索',s2:'二索',s3:'三索',s4:'四索',s5:'五索',s6:'六索',s7:'七索',s8:'八索',s9:'九索',
  z1:'東',z2:'南',z3:'西',z4:'北',z5:'中',z6:'發',z7:'白',
};
const SUIT = { m: '萬子', p: '筒子', s: '索子', z: '字牌' };
const nm = (t) => NAMES[t] || t;
const KINDS = Object.keys(NAMES);
const isHonor = (t) => t[0] === 'z';
const DRAGONS = ['z5', 'z6', 'z7'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 名詞小教室：每個名詞第一次出現時附上白話解釋
const GLOSSARY = {
  面子: '面子就是一組三張：同花色連號（順子，像一二三萬）或三張一樣（刻子）',
  眼: '「眼」是一對一樣的牌，胡牌要 5 組面子加 1 對眼',
  聽牌: '聽牌是只差一張就能胡的狀態',
  進張: '進張是摸到後能讓牌變好的牌',
  現物: '現物是對手自己打過的牌，打給他絕對不會放槍',
  門清: '門清是沒有吃也沒有碰，胡牌會多算台',
  碰: '碰是別人打出你手上有一對的牌，湊成三張一樣',
  吃: '吃只能吃上家打的牌，湊成順子',
  自摸: '自摸是自己摸到胡牌那張，三家都要付錢',
};

// ---------- 看得到的牌 ----------
function visibleCounts(game, seat) {
  const c = {};
  const add = (t) => { if (NAMES[t]) c[t] = (c[t] || 0) + 1; };
  const me = game.players[seat];
  me.hand.forEach(add);
  for (const p of game.players) {
    p.discards.forEach(add);
    for (const m of p.melds) {
      if (m.type === 'ankong' && p.seat !== seat) continue; // 別人的暗槓看不到
      m.tiles.forEach(add);
    }
  }
  return c;
}
const unseenOf = (vis, t) => Math.max(0, 4 - (vis[t] || 0));

// 打掉 d 之後，還有幾張牌能讓牌變好
function discardStats(hand, d, vis) {
  const rest = hand.slice();
  rest.splice(rest.indexOf(d), 1);
  const s = shanten(rest);
  let ukeire = 0;
  const useful = [];
  for (const t of KINDS) {
    const left = unseenOf(vis, t);
    if (!left) continue;
    if (shanten(rest.concat(t)) < s) { ukeire += left; useful.push({ t, left }); }
  }
  // 場上剩越多張的越容易摸到，排前面
  useful.sort((a, b) => b.left - a.left);
  return { tile: d, shanten: s, ukeire, useful: useful.map(u => u.t), rest };
}

// 一張牌在手上的處境，用來說明為什麼打它
function tileRole(hand, t) {
  const cnt = hand.filter(x => x === t).length;
  if (cnt >= 2) return '拆對';
  if (isHonor(t)) return '孤張字牌';
  const n = Number(t[1]);
  const near = [-2, -1, 1, 2].some(k => hand.includes(t[0] + (n + k)));
  if (!near) return (n === 1 || n === 9) ? '孤張邊牌' : '孤張';
  return '拆搭子';
}

// ---------- 讀對手 ----------
function readOpponents(game, seat) {
  const notes = [];
  for (const p of game.players) {
    if (p.seat === seat) continue;
    const open = p.melds.filter(m => m.type !== 'ankong');
    const suits = new Set(open.flatMap(m => m.tiles).filter(t => !isHonor(t)).map(t => t[0]));
    const note = { name: p.name, seat: p.seat, ting: p.ting || null, melds: p.melds.length, hint: null, safe: [] };
    if (p.ting) note.hint = `已經宣告${p.ting}`;
    else if (open.length >= 2 && suits.size === 1) note.hint = `碰吃的都是${SUIT[[...suits][0]]}，可能在做一色`;
    else if (open.filter(m => DRAGONS.includes(m.tiles[0])).length >= 2) note.hint = '亮了兩組三元牌，小心大三元';
    else if (p.melds.length >= 3) note.hint = `已經亮了 ${p.melds.length} 組，離胡牌不遠`;
    note.danger = !!(p.ting || p.melds.length >= 3);
    note.safe = [...new Set(p.discards)];
    note.suit = suits.size === 1 && open.length >= 2 ? [...suits][0] : null;
    if (note.hint) notes.push(note);
  }
  return notes;
}

// ---------- 主分析 ----------
function analyze(game, seat) {
  const me = game.players[seat];
  const vis = visibleCounts(game, seat);
  const unseenTotal = KINDS.reduce((a, t) => a + unseenOf(vis, t), 0);
  const myDraws = Math.max(1, Math.floor(game.wall.length / 4));
  const opponents = readOpponents(game, seat);
  const dangerFoes = opponents.filter(o => o.danger);
  const facts = {
    hand: sortTiles(me.hand), melds: me.melds.length, ting: me.ting || null,
    wallLeft: game.wall.length, opponents: opponents.map(({ name, hint, ting }) => ({ name, hint, ting })),
    situation: 'wait',
  };
  const chance = (waits) => {
    const left = waits.reduce((a, t) => a + unseenOf(vis, t), 0);
    const p = 1 - Math.pow(1 - left / Math.max(1, unseenTotal), 1.6 * myDraws);
    return { left, pct: Math.min(95, Math.round(p * 100)) };
  };

  if (game.finished) return { ...facts, situation: 'end' };

  // 輪到我出牌
  if (game.phase === 'action' && game.turn === seat) {
    const opts = game.actionOptions(seat);
    if (opts && opts.tsumo) return { ...facts, situation: 'tsumo' };
    if (me.ting) {
      const rest = me.hand.slice(); rest.splice(rest.lastIndexOf(me.lastDraw), 1);
      const w = waitsOf(rest);
      return { ...facts, situation: 'locked', suggest: me.lastDraw, waits: w.map(nm), ...chance(w) };
    }
    const cands = [...new Set(me.hand)].map(d => discardStats(me.hand, d, vis));
    const safeFor = (t) => dangerFoes.every(o => o.safe.includes(t));
    const best = Math.min(...cands.map(c => c.shanten));
    // 先比離聽牌步數，再比進張；有人快胡時，同步數優先挑現物
    const score = (c) => (c.shanten - best) * 1000 - c.ukeire + (dangerFoes.length && !safeFor(c.tile) ? 6 : 0)
      + (isHonor(c.tile) ? -0.5 : 0);
    cands.sort((a, b) => score(a) - score(b));
    const top = cands[0];
    const out = {
      ...facts, situation: 'discard',
      suggest: top.tile, suggestName: nm(top.tile), role: tileRole(me.hand, top.tile),
      shanten: top.shanten, ukeire: top.ukeire,
      safe: dangerFoes.length ? safeFor(top.tile) : null,
      danger: dangerFoes.map(o => o.name),
    };
    if (top.shanten === 0) {
      const w = waitsOf(top.rest);
      Object.assign(out, { waits: w.map(nm), ...chance(w), canTing: opts && opts.ting && opts.ting.includes(top.tile) });
    } else {
      out.goodTiles = top.useful.slice(0, 4).map(nm);
    }
    // 對手在做一色：提醒那個花色別亂打
    const flush = opponents.find(o => o.suit && top.tile[0] === o.suit);
    if (flush) out.warnSuit = { name: flush.name, suit: SUIT[flush.suit] };
    return out;
  }

  // 別人打牌，我可以吃碰胡
  const pend = game.phase === 'reaction' && game.pending && game.pending[seat];
  if (pend && !pend.resp) {
    const o = pend.opts, tile = game.ctx.tile;
    const base = { ...facts, situation: 'react', tile: nm(tile), from: game.players[game.ctx.from].name };
    if (o.hu) return { ...base, advice: 'hu' };
    if (o.kong) return { ...base, advice: 'kong' };
    const now = shanten(me.hand);
    const after = (used) => {
      const rest = me.hand.slice(); used.forEach(u => rest.splice(rest.indexOf(u), 1));
      return Math.min(...[...new Set(rest)].map(d => { const r = rest.slice(); r.splice(r.indexOf(d), 1); return shanten(r); }));
    };
    const menqing = me.melds.every(m => m.type === 'ankong');
    if (o.pon) {
      const gain = now - after([tile, tile]);
      const valuable = DRAGONS.includes(tile) || tile === game.roundWind || tile === game.seatWind(seat) || WIND_PUNG(tile);
      if (gain > 0 || valuable) return { ...base, advice: 'pon', gain, valuable, menqing };
    }
    if (o.chi) {
      for (const combo of o.chi) {
        const others = combo.slice(); others.splice(others.indexOf(tile), 1);
        if (now - after(others) > 0) return { ...base, advice: 'chi', combo: combo.map(nm).join(''), menqing };
      }
    }
    return { ...base, advice: 'pass', menqing, shanten: now };
  }

  // 等別人出牌
  return { ...facts, situation: 'wait', shanten: shanten(me.hand.length % 3 === 2 ? me.hand.slice(0, -1) : me.hand) };
}
// 見風見台：任何風刻都有台
const WIND_PUNG = (t) => ['z1', 'z2', 'z3', 'z4'].includes(t);

// ---------- 範本台詞 (沒有 AI 時使用，也是 AI 回來前先顯示的話) ----------
function template(f, learned = []) {
  const teach = [];
  const tip = (term) => { if (!learned.includes(term) && GLOSSARY[term]) teach.push(term); };
  let text = '';
  const stepTxt = (s) => s === 0 ? '已經聽牌' : s === 1 ? '再一步就聽牌' : `離聽牌還差 ${s} 步`;

  switch (f.situation) {
    case 'tsumo':
      text = pick(['摸到了！按「自摸胡」收錢啦💰', '就是這張！快按自摸，三家一起付🎉', '叮咚～自摸！別猶豫，按下去！']);
      tip('自摸');
      break;
    case 'locked':
      text = `你已經聽牌，手牌鎖住了，打出摸進來的${nm(f.suggest)}就好。聽 ${f.waits.join('、')}，場上還剩 ${f.left} 張，胡牌機會約 ${Math.round(f.pct / 10)} 成，穩住🙏`;
      break;
    case 'discard': {
      const why = {
        孤張字牌: pick([`「${f.suggestName}」孤零零沒朋友，先請它離開👋`, `${f.suggestName}這張字牌湊不起來，留著佔位子，打掉吧`]),
        孤張邊牌: `${f.suggestName}是邊邊的孤張，最難湊成順子，先打它`,
        孤張: `${f.suggestName}旁邊沒有鄰居，很難湊成一組，打掉它`,
        拆對: `${f.suggestName}雖然是一對，但拆掉它反而讓整副牌更順`,
        拆搭子: `打${f.suggestName}，留下來的牌比較容易湊成組`,
      }[f.role];
      text = why;
      if (f.shanten === 0) {
        text += `。打完就聽 ${f.waits.join('、')}！場上還剩 ${f.left} 張，胡牌機會約 ${Math.round(f.pct / 10)} 成`;
        if (f.canTing) text += '，記得先按「聽牌」再打，多賺 1 台✨';
        tip('聽牌');
      } else {
        text += f.ukeire > 40
          ? `。打完${stepTxt(f.shanten)}，現在很多牌都幫得上忙，慢慢湊就好`
          : `。打完${stepTxt(f.shanten)}，場上還有 ${f.ukeire} 張牌能讓你更進一步`;
        if (f.goodTiles && f.goodTiles.length) text += `，等等摸到${f.goodTiles.slice(0, 2).join('或')}會很開心`;
        tip('進張');
        if (f.shanten >= 2) tip('面子');
      }
      if (f.danger && f.danger.length) {
        text += f.safe ? `。${f.danger.join('、')}快胡了，這張是現物很安全🛡️` : `。注意${f.danger.join('、')}快胡了⚠️`;
        if (f.safe) tip('現物');
      }
      if (f.warnSuit) text += `。${f.warnSuit.name}在做${f.warnSuit.suit}，這門的牌打出去要小心`;
      break;
    }
    case 'react':
      if (f.advice === 'hu') text = pick([`${f.from}打的${f.tile}正是你要的！快按「胡」🎉`, `胡啦胡啦！${f.tile}就是你在等的那張！`]);
      else if (f.advice === 'kong') text = `你手上有三張${f.tile}，可以槓！槓完還會多摸一張`;
      else if (f.advice === 'pon') {
        text = f.valuable && !f.gain ? `${f.tile}碰下去就有台，值得碰！` : `碰${f.tile}可以讓你快一步`;
        if (f.menqing) { text += '，不過碰了就不是門清，會少 1 台，自己衡量'; tip('門清'); }
        tip('碰');
      } else if (f.advice === 'chi') {
        text = `可以吃成${f.combo}，讓牌更接近聽牌`;
        if (f.menqing) text += '，但會失去門清';
        tip('吃');
      } else {
        text = pick(['這張對你幫助不大，按「過」就好', '吃碰這張反而會打亂牌型，先過', `先忍住，${f.menqing ? '保持門清胡牌會多 1 台' : '這張不划算'}`]);
        if (f.menqing) tip('門清');
      }
      break;
    case 'wait': {
      const op = f.opponents.find(o => o.hint);
      text = op ? `觀察一下：${op.name}${op.hint}` : pick([
        `等別人出牌中～你現在${stepTxt(f.shanten)}`,
        '趁空檔看看大家打了什麼，打過的牌就是線索🔍',
        `手牌整理好了嗎？你現在${stepTxt(f.shanten)}，加油💪`,
      ]);
      break;
    }
    case 'end':
      text = pick(['這局結束了，下一局再接再厲！', '不管輸贏，每一局都是練習🍀']);
      break;
  }
  const lesson = teach.slice(0, 1).map(t => ({ term: t, text: GLOSSARY[t] }));
  return { text, lesson };
}

module.exports = { analyze, template, GLOSSARY };
