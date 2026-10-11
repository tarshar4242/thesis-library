/* 台式麻將 前端 */
const socket = io();

const GLYPHS = {
  m1:'🀇',m2:'🀈',m3:'🀉',m4:'🀊',m5:'🀋',m6:'🀌',m7:'🀍',m8:'🀎',m9:'🀏',
  p1:'🀙',p2:'🀚',p3:'🀛',p4:'🀜',p5:'🀝',p6:'🀞',p7:'🀟',p8:'🀠',p9:'🀡',
  s1:'🀐',s2:'🀑',s3:'🀒',s4:'🀓',s5:'🀔',s6:'🀕',s7:'🀖',s8:'🀗',s9:'🀘',
  z1:'🀀',z2:'🀁',z3:'🀂',z4:'🀃',z5:'🀄︎',z6:'🀅',z7:'🀆',
  f1:'🀦',f2:'🀧',f3:'🀨',f4:'🀩',f5:'🀢',f6:'🀣',f7:'🀤',f8:'🀥',
};
const NAMES = {
  m1:'一萬',m2:'二萬',m3:'三萬',m4:'四萬',m5:'五萬',m6:'六萬',m7:'七萬',m8:'八萬',m9:'九萬',
  p1:'一筒',p2:'二筒',p3:'三筒',p4:'四筒',p5:'五筒',p6:'六筒',p7:'七筒',p8:'八筒',p9:'九筒',
  s1:'一索',s2:'二索',s3:'三索',s4:'四索',s5:'五索',s6:'六索',s7:'七索',s8:'八索',s9:'九索',
  z1:'東',z2:'南',z3:'西',z4:'北',z5:'中',z6:'發',z7:'白',
  f1:'春',f2:'夏',f3:'秋',f4:'冬',f5:'梅',f6:'蘭',f7:'竹',f8:'菊',
};
const WINDLABEL = { z1:'東', z2:'南', z3:'西', z4:'北' };
function g(t) { return GLYPHS[t] || t; }
function nm(t) { return NAMES[t] || t; }

let mySeat = -1;
let isHost = false;
let lastView = null;
let tingMode = false; // 按下「聽牌」後，下一張打出的牌同時宣告聽牌

// ---------- 音效 (Web Audio 合成，免外部檔) ----------
let audioCtx = null;
let soundOn = true;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
// 播放一段音符：freqs 依序，每個 dur 秒
function playNotes(notes, type = 'triangle', gain = 0.18) {
  const ctx = ensureAudio();
  if (!ctx || !soundOn) return;
  let t = ctx.currentTime;
  for (const [freq, dur] of notes) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
    t += dur * 0.9;
  }
}
// 木頭敲擊感的短噪音 (打牌聲)
function playClack(gain = 0.14) {
  const ctx = ensureAudio();
  if (!ctx || !soundOn) return;
  const dur = 0.08;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = gain;
  const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 900; filt.Q.value = 1.2;
  src.connect(filt).connect(g).connect(ctx.destination);
  src.start();
}
const SFX = {
  discard: () => playClack(0.10),
  chi: () => playNotes([[520, 0.09], [700, 0.12]], 'triangle', 0.2),          // 吃：上揚兩音
  pon: () => playNotes([[300, 0.10], [300, 0.12]], 'square', 0.16),          // 碰：兩記低沉
  kong: () => playNotes([[240, 0.10], [200, 0.10], [160, 0.16]], 'square', 0.16), // 槓：三記下降
  ankong: () => playNotes([[240, 0.10], [200, 0.10], [160, 0.16]], 'square', 0.16),
  addkong: () => playNotes([[240, 0.10], [200, 0.10], [160, 0.16]], 'square', 0.16),
  hu: () => playNotes([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.22]], 'triangle', 0.2), // 胡：勝利琶音
};
socket.on('sfx', ({ type }) => { (SFX[type] || (() => {}))(); });
// 首次互動時解鎖音訊 (瀏覽器政策)
window.addEventListener('pointerdown', () => ensureAudio(), { once: true });

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const screens = { lobby: $('lobby'), waiting: $('waiting'), table: $('table') };
function show(name) {
  for (const k in screens) screens[k].classList.toggle('hidden', k !== name);
}

// ---------- 大廳 ----------
$('btnQuick').onclick = () => {
  const name = getName();
  socket.emit('quickPlay', { name }, (r) => {
    if (r.error) return setMsg('lobbyMsg', r.error);
    mySeat = r.seat; isHost = true;
    show('table');
  });
};
$('btnCreate').onclick = () => {
  const name = getName();
  socket.emit('createRoom', { name }, (r) => {
    if (r.error) return setMsg('lobbyMsg', r.error);
    mySeat = r.seat; isHost = true;
    $('waitRoomId').textContent = r.roomId;
    $('btnStart').classList.remove('hidden');
    $('waitMsg').textContent = '湊齊或直接開始，空位由 AI 補上';
    show('waiting');
  });
};
$('btnJoin').onclick = () => {
  const name = getName();
  const roomId = $('roomInput').value.trim().toUpperCase();
  if (!roomId) return setMsg('lobbyMsg', '請輸入房號');
  socket.emit('joinRoom', { roomId, name }, (r) => {
    if (r.error) return setMsg('lobbyMsg', r.error);
    mySeat = r.seat; isHost = false;
    $('waitRoomId').textContent = r.roomId;
    $('btnStart').classList.add('hidden');
    show('waiting');
  });
};
$('btnStart').onclick = () => socket.emit('startGame', {}, (r) => { if (r.error) setMsg('waitMsg', r.error); });
$('btnLeave').onclick = () => location.reload();

function getName() {
  let n = $('nameInput').value.trim();
  if (!n) n = '玩家' + Math.floor(Math.random() * 900 + 100);
  return n;
}
function setMsg(id, m) { $(id).textContent = m; }

// ---------- 連線位址 ----------
let primaryAddr = '';
async function loadServerInfo() {
  try {
    const res = await fetch('/api/serverinfo');
    const info = await res.json();
    const urls = info.urls && info.urls.length ? info.urls : [`http://localhost:${info.port}`];
    primaryAddr = urls[0];
    $('connectAddr').textContent = primaryAddr;
    if (info.public) {
      document.querySelector('.ci-label').textContent = '📡 邀請好友連線';
      document.querySelector('.ci-hint').textContent = '把網址傳給好友，用瀏覽器打開就能加入，不必同一個 Wi-Fi';
    }
    // 其餘網路介面位址 (點擊即複製)
    const alt = $('connectAlt');
    alt.innerHTML = '';
    urls.slice(1).forEach(u => {
      const d = document.createElement('div');
      d.className = 'ci-alt-item';
      d.textContent = '↳ ' + u + '（點此複製）';
      d.onclick = () => copyText(u, d);
      alt.appendChild(d);
    });
  } catch (e) {
    $('connectAddr').textContent = `http://localhost:${location.port || 4100}`;
    primaryAddr = $('connectAddr').textContent;
  }
}
async function copyText(text, feedbackEl) {
  let ok = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch (e) { ok = false; }
  if (!ok) {
    // 非安全情境 (http://192.168…) 的備援複製
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }
  if (feedbackEl) {
    const orig = feedbackEl.textContent;
    feedbackEl.textContent = ok ? '✓ 已複製！' : '複製失敗，請手動選取';
    setTimeout(() => { feedbackEl.textContent = orig; }, 1500);
  }
  return ok;
}
$('btnCopyAddr').onclick = () => {
  const btn = $('btnCopyAddr');
  copyText(primaryAddr, null).then(ok => {
    const orig = btn.textContent;
    btn.textContent = ok ? '✓ 已複製' : '請手動複製';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
};
loadServerInfo();

// ---------- 房間大廳更新 ----------
socket.on('lobby', (lobby) => {
  const list = $('seatList');
  list.innerHTML = '';
  lobby.seats.forEach((s) => {
    const li = document.createElement('li');
    if (s.name) {
      li.innerHTML = `<span>座位 ${s.seat + 1}：<b>${s.name}</b></span>` +
        (s.seat === mySeat ? '<span class="badge">你</span>' : '');
    } else {
      li.innerHTML = `<span class="empty">座位 ${s.seat + 1}：空（開局補 AI）</span>`;
    }
    list.appendChild(li);
  });
});

// ---------- 遊戲狀態 ----------
socket.on('state', ({ view, lobby, log }) => {
  if (!view) return;
  if (view.me) mySeat = view.me.seat;
  lastView = view;
  show('table');
  render(view);
  renderLog(log);
});

function render(v) {
  // 頂欄
  $('roundInfo').textContent = `${WINDLABEL[v.roundWind]}風圈 · 第${v.handNo}局 · 莊家:${v.players[v.dealer].name}` +
    (v.streak ? ` 連${v.streak}拉${v.streak}` : '');
  $('wallInfo').textContent = `牌牆剩 ${v.wallLeft} 張`;

  // 中央資訊
  const turnName = v.players[v.turn] ? v.players[v.turn].name : '';
  const phaseTxt = v.finished ? '本局結束' : (v.phase === 'reaction' ? '等待反應…' : `輪到 ${turnName}`);
  $('centerInfo').innerHTML =
    `<div class="big">🀄</div><div class="turn-name">${phaseTxt}</div>` +
    `<div class="sub">底1台1</div>`;

  // 依相對位置擺放
  for (let rel = 0; rel < 4; rel++) {
    const seat = (mySeat + rel + 4) % 4;
    const p = v.players[seat];
    if (rel === 0) renderMe(v, p);
    else renderOpponent(rel, p, v);
    renderDiscards(rel, p, v);
  }

  renderActions(v);
}

function renderOpponent(rel, p, v) {
  const areaSel = { 1: '.right', 2: '.top', 3: '.left' }[rel];
  const area = document.querySelector('.seat-area' + areaSel);
  const isTurn = v.turn === p.seat && !v.finished;
  const isDealer = v.dealer === p.seat;
  const backs = Array.from({ length: p.handCount }, () => '<span class="mini-tile-back"></span>').join('');
  const melds = p.melds.map(m => `<span class="mtile">${m.tiles.map(g).join('')}</span>`).join(' ');
  const flowers = p.flowers.map(g).join('');
  area.innerHTML =
    `<div class="player-card ${isTurn ? 'turn' : ''} ${isDealer ? 'dealer' : ''}">
      <div><span class="pwind">${WINDLABEL[p.wind]}${isDealer ? '莊' : ''}</span><span class="pname">${p.name}</span>${p.ting ? `<span class="ting-badge">${p.ting}</span>` : ''}</div>
      <div class="pscore">${p.score >= 0 ? '+' : ''}${p.score}</div>
      <div class="mini-hand">${backs}</div>
      ${melds ? `<div class="opp-melds">${melds}</div>` : ''}
      ${flowers ? `<div class="opp-flowers">${flowers}</div>` : ''}
    </div>`;
}

function renderMe(v, p) {
  const area = document.querySelector('.seat-area.bottom');
  const isTurn = v.turn === p.seat && !v.finished;
  const isDealer = v.dealer === p.seat;
  area.innerHTML =
    `<div class="player-card ${isTurn ? 'turn' : ''} ${isDealer ? 'dealer' : ''}">
      <span class="pwind">${WINDLABEL[p.wind]}${isDealer ? '莊' : ''}</span>
      <span class="pname">${p.name}(你)</span>${p.ting ? `<span class="ting-badge">${p.ting}</span>` : ''}
      <span class="pscore">　${p.score >= 0 ? '+' : ''}${p.score}</span>
    </div>`;

  // 手牌
  const me = v.me;
  const handEl = $('myHand');
  handEl.innerHTML = '';
  const canDiscard = me.options && me.options.discard && v.turn === mySeat && v.phase === 'action';
  if (!canDiscard) tingMode = false;
  // 哪些牌現在可以點：聽牌後只能打摸進的牌；聽牌模式只能打會聽的牌
  const clickable = (t) => canDiscard &&
    (!me.options.locked || t === me.options.locked) &&
    (!tingMode || me.options.ting.includes(t));

  // 把剛摸到的牌抽出放到最右邊突顯
  const rest = me.hand.slice();
  let drawnTile = null;
  if (canDiscard && me.lastDraw && rest.includes(me.lastDraw)) {
    rest.splice(rest.indexOf(me.lastDraw), 1);
    drawnTile = me.lastDraw;
  }
  rest.forEach((t) => handEl.appendChild(makeTile(t, clickable(t))));
  if (drawnTile) {
    const el = makeTile(drawnTile, clickable(drawnTile));
    el.classList.add('drawn');
    handEl.appendChild(el);
  }

  // 我的副露 / 花
  $('myMelds').innerHTML = me.melds.map(m =>
    `<div class="meld-group">${m.tiles.map(t => `<span class="tile small disabled">${g(t)}</span>`).join('')}</div>`
  ).join('');
  $('myFlowers').innerHTML = me.flowers.map(t => `<span class="ftile" title="${nm(t)}">${g(t)}</span>`).join('');
}

function makeTile(t, clickable) {
  const el = document.createElement('div');
  el.className = 'tile' + (clickable ? (tingMode ? ' ting-ok' : '') : ' disabled');
  el.textContent = g(t);
  el.title = nm(t);
  if (clickable) {
    el.onclick = () => {
      const ting = tingMode;
      tingMode = false;
      socket.emit('action', { type: 'discard', tile: t, ting }, (r) => {
        if (r.error) flashHint(r.error);
      });
    };
  }
  return el;
}

function renderDiscards(rel, p, v) {
  const el = { 0: $('discardBottom'), 1: $('discardRight'), 2: $('discardTop'), 3: $('discardLeft') }[rel];
  el.innerHTML = p.discards.map((t, i) =>
    `<span class="dtile ${i === p.discards.length - 1 ? 'last' : ''}" title="${nm(t)}">${g(t)}</span>`
  ).join('');
}

// ---------- 動作列 ----------
function renderActions(v) {
  const bar = $('actionBar');
  bar.innerHTML = '';
  if (v.finished || !v.me) return;

  // 我的回合動作
  if (v.phase === 'action' && v.turn === mySeat && v.me.options) {
    const o = v.me.options;
    if (o.tsumo) bar.appendChild(btn('🀄 自摸胡', 'act-hu', () => act({ type: 'tsumo' })));
    (o.ankong || []).forEach(t => bar.appendChild(btn(`暗槓 ${g(t)}`, 'act-kong', () => act({ type: 'ankong', tile: t }))));
    (o.addkong || []).forEach(t => bar.appendChild(btn(`加槓 ${g(t)}`, 'act-kong', () => act({ type: 'addkong', tile: t }))));
    if (o.ting && o.ting.length) {
      bar.appendChild(btn(tingMode ? '取消聽牌' : '聽牌', 'act-ting', () => { tingMode = !tingMode; render(lastView); }));
    }
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = o.locked ? '已聽牌，打出摸進的牌' : tingMode ? '選一張發亮的牌打出，宣告聽牌' : '點選手牌打出';
    bar.appendChild(hint);
    return;
  }

  // 反應動作
  if (v.phase === 'reaction' && v.me.reaction) {
    const r = v.me.reaction;
    if (r.hu) bar.appendChild(btn('🀄 胡！', 'act-hu', () => act({ type: 'hu' })));
    if (r.pon) bar.appendChild(btn('碰', 'act-pon', () => act({ type: 'pon' })));
    if (r.kong) bar.appendChild(btn('槓', 'act-kong', () => act({ type: 'kong' })));
    if (r.chi) r.chi.forEach(combo =>
      bar.appendChild(btn(`吃 ${combo.map(g).join('')}`, 'act-chi', () => act({ type: 'chi', tiles: combo }))));
    bar.appendChild(btn('過', 'act-pass', () => act({ type: 'pass' })));
  }
}

function btn(label, cls, fn) {
  const b = document.createElement('button');
  b.className = cls;
  b.innerHTML = label;
  b.onclick = fn;
  return b;
}
function act(action) {
  socket.emit('action', action, (r) => { if (r.error) flashHint(r.error); });
}
function flashHint(msg) {
  const bar = $('actionBar');
  const h = document.createElement('span');
  h.className = 'hint';
  h.textContent = '⚠ ' + msg;
  bar.appendChild(h);
  setTimeout(() => h.remove(), 2000);
}

// ---------- 記錄 ----------
function renderLog(log) {
  if (!log) return;
  const el = $('logBody');
  el.innerHTML = log.slice(-30).map(l => `<div>${l}</div>`).join('');
  el.scrollTop = el.scrollHeight;
}

// 出牌記錄收合 (以 inline style 保證生效，不受樣式表載入順序影響)
function toggleLog() {
  const panel = $('logPanel');
  const body = $('logBody');
  const collapsed = panel.classList.toggle('collapsed');
  if (collapsed) {
    body.style.maxHeight = '0';
    body.style.paddingTop = '0';
    body.style.paddingBottom = '0';
  } else {
    body.style.maxHeight = '40vh';
    body.style.paddingTop = '6px';
    body.style.paddingBottom = '6px';
  }
  $('btnLogToggle').textContent = collapsed ? '＋' : '－';
}
$('btnLogToggle').onclick = (e) => { e.stopPropagation(); toggleLog(); };
document.querySelector('.log-header').onclick = toggleLog;

// ---------- 結算彈窗 ----------
socket.on('result', (res) => {
  const modal = $('resultModal');
  const title = $('resultTitle');
  const body = $('resultBody');
  const scoreRow = res.scores.map(s =>
    `<span style="margin:0 8px">${s.name}: <b style="color:var(--gold)">${s.score >= 0 ? '+' : ''}${s.score}</b></span>`
  ).join('');

  if (res.kind === 'win') {
    title.textContent = '🀄 ' + res.typeLabel + '！';
    body.innerHTML = res.winners.map(w => {
      const tiles = (w.hand || []).map(g).join('') +
        (w.melds || []).map(m => ' [' + m.tiles.map(g).join('') + ']').join('');
      const flowers = (w.flowers || []).length ? '　花:' + w.flowers.map(g).join('') : '';
      const breaks = w.breakdown.map(b => `${b.name} ${b.tai}台`).join('　');
      return `<div class="win-line">
        <div><span class="who">${w.name}</span>${res.from ? `　放槍:${res.from}` : ''}</div>
        <div class="win-tiles">${tiles}</div>
        <div class="win-break">${flowers}</div>
        <div class="tai">${w.tai} 台　共 ${w.points} 點</div>
        <div class="win-break">${breaks || '無台（底胡）'}</div>
      </div>`;
    }).join('') + `<div style="margin-top:12px">${scoreRow}</div>`;
  } else {
    title.textContent = '🀫 流局';
    body.innerHTML = `<div class="win-line">${res.tenpai.map(t =>
      `${t.name}：${t.tenpai ? '<b style="color:var(--gold)">聽牌</b>' : '未聽'}`).join('　')}</div>` +
      `<div style="margin-top:12px">${scoreRow}</div>`;
  }
  modal.classList.remove('hidden');
  clearTimeout(window._resultTimer);
  window._resultTimer = setTimeout(() => modal.classList.add('hidden'), 6500);
});

// ---------- 規則 ----------
// 依明星3缺1「見花見字」台數表
const RULES = [
  ['莊家', 1], ['連N拉N', '2N'], ['自摸', 1], ['門清', 1], ['門清自摸', 3],
  ['見花見台(每張)', 1], ['春夏秋冬', 2], ['梅蘭竹菊', 2], ['八仙過海', 8],
  ['見風見台(每組)', 1], ['三元牌(每組)', 1], ['無字無花', 2],
  ['平胡', 2], ['碰碰胡', 4], ['全求', 2], ['獨聽', 1],
  ['混一色', 4], ['清一色(含字一色)', 8], ['小三元', 4], ['大三元', 8],
  ['小四喜', 8], ['大四喜', 16], ['三暗刻', 2], ['四暗刻', 5], ['五暗刻', 8],
  ['槓牌(每組)', 1], ['暗槓(每組)', 2], ['槓上開花', 1], ['搶槓胡', 1], ['海底撈月', 1],
  ['聽牌', 1], ['地聽', 4], ['天聽', 8], ['地胡', 16], ['天胡', 24],
];
$('btnRules').onclick = () => {
  $('rulesBody').innerHTML = RULES.map(([n, t]) =>
    `<div>${n}</div><div class="r-tai">${t} 台</div>`).join('');
  $('rulesModal').classList.remove('hidden');
};
$('btnCloseRules').onclick = () => $('rulesModal').classList.add('hidden');

$('btnSound').onclick = () => {
  soundOn = !soundOn;
  $('btnSound').textContent = soundOn ? '🔊 音效' : '🔇 靜音';
  if (soundOn) { ensureAudio(); SFX.chi(); }
};
