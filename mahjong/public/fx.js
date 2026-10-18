/* 牌桌氣氛：公仔、喊牌特效、慶祝動畫、背景音樂、語音喊牌 */
const FX = (() => {
  // ---------- 設定 (存在這台瀏覽器) ----------
  const DEFAULTS = { sfx: true, bgm: false, music: 'guzheng', voice: true, mood: 'festive', coach: false };
  let settings = { ...DEFAULTS };
  try { settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem('mjSettings') || '{}') }; } catch (e) {}
  function save() { try { localStorage.setItem('mjSettings', JSON.stringify(settings)); } catch (e) {} }

  // 京劇四角色：生、旦 (Tarshar 的公仔)、淨、丑
  const ROLE_IMG = { sheng: 'sheng.svg', dan: 'opera.jpg', jing: 'jing.svg', chou: 'chou.svg' };
  const ORDER = ['dan', 'sheng', 'jing', 'chou'];
  const mascot = (seat, avatar) => 'img/' + (ROLE_IMG[avatar] || ROLE_IMG[ORDER[seat % 4]]);

  const CALLS = {
    chi: '吃！', pon: '碰！', kong: '槓！', ankong: '暗槓！', addkong: '加槓！',
    ting: '聽牌！', hu: '胡！', tsumo: '自摸！',
  };
  const SPEECH = { chi: '吃', pon: '碰', kong: '槓', ankong: '槓', addkong: '槓', ting: '聽牌', hu: '胡了', tsumo: '自摸' };

  const layer = () => document.getElementById('fxLayer');

  // ---------- 語音喊牌 ----------
  let zhVoice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    const voices = speechSynthesis.getVoices();
    zhVoice = voices.find(v => /zh[-_]TW/i.test(v.lang)) || voices.find(v => /^zh/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!settings.voice || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    if (zhVoice) u.voice = zhVoice;
    u.rate = 1.15;
    u.pitch = settings.mood === 'cute' ? 1.5 : 1.1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  // ---------- 公仔對話框與表情 ----------
  // 牌桌每次更新都會重畫卡片，所以表情與對話框記在這裡，重畫時照著畫回去
  const bubbles = {}; // seat -> { text, cls, until }
  const moods = {};   // seat -> { cls, until }
  const avatarWrap = (seat) => document.querySelector(`.player-card[data-seat="${seat}"] .avatar-wrap`);
  function paint(seat) {
    const wrap = avatarWrap(seat);
    if (!wrap) return;
    const now = Date.now();
    const img = wrap.querySelector('.avatar');
    img.classList.remove('happy', 'sad', 'win');
    if (moods[seat] && moods[seat].until > now) { void img.offsetWidth; img.classList.add(moods[seat].cls); }
    wrap.querySelectorAll('.bubble').forEach(b => b.remove());
    const b = bubbles[seat];
    if (b && b.until > now) {
      const el = document.createElement('span');
      el.className = 'bubble ' + b.cls;
      el.textContent = b.text;
      wrap.appendChild(el);
    }
  }
  function bubble(seat, text, cls = '', ms = 1800) {
    bubbles[seat] = { text, cls, until: Date.now() + ms };
    paint(seat);
    setTimeout(() => paint(seat), ms + 20);
  }
  function mood(seat, cls, ms = 1800) {
    moods[seat] = { cls, until: Date.now() + ms };
    paint(seat);
    setTimeout(() => paint(seat), ms + 20);
  }
  // 給 client.js 重畫卡片時用
  function avatarHtml(seat, isTurn, avatar) {
    const now = Date.now();
    const m = moods[seat] && moods[seat].until > now ? moods[seat].cls : '';
    const b = bubbles[seat] && bubbles[seat].until > now
      ? `<span class="bubble ${bubbles[seat].cls}">${bubbles[seat].text}</span>` : '';
    return `<span class="avatar-wrap"><img class="avatar ${isTurn ? 'thinking' : ''} ${m}" src="${mascot(seat, avatar)}" alt="">${b}</span>`;
  }
  function callout(type, seat) {
    const text = CALLS[type];
    if (!text) return;
    const big = document.createElement('div');
    big.className = 'fx-callout fx-' + type + ' mood-' + settings.mood;
    big.textContent = text;
    layer().appendChild(big);
    setTimeout(() => big.remove(), 1100);
    bubble(seat, text);
    mood(seat, 'happy');
    speak(SPEECH[type]);
  }

  // ---------- 慶祝 ----------
  const PIECES = {
    festive: ['🧨', '🧧', '💰', '🎆', '🏮', '✨'],
    cute: ['🌸', '⭐', '💖', '🍀', '🎀', '🍬'],
  };
  const COLORS = { festive: ['#e23b3b', '#f5c542', '#ff8a3d', '#ffd96a'], cute: ['#ff9fc2', '#9fd8ff', '#ffe08a', '#b8f2c9'] };
  function burst(count) {
    const L = layer();
    const set = PIECES[settings.mood], colors = COLORS[settings.mood];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      const emoji = Math.random() < 0.45;
      el.className = 'fx-piece' + (emoji ? ' emoji' : '');
      if (emoji) el.textContent = set[i % set.length];
      else el.style.background = colors[i % colors.length];
      el.style.left = Math.random() * 100 + 'vw';
      el.style.setProperty('--drift', (Math.random() * 40 - 20) + 'vw');
      el.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      el.style.animationDuration = 2.2 + Math.random() * 1.8 + 's';
      el.style.animationDelay = Math.random() * 0.6 + 's';
      L.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }
  }
  function celebrate(res, view) {
    if (res.kind !== 'win' || !view) return;
    const seatOf = (name) => (view.players.find(p => p.name === name) || {}).seat;
    const w = res.winners[0];
    const ws = seatOf(w.name);
    burst(Math.min(140, 40 + w.tai * 6));
    if (settings.mood === 'festive') playFirecrackers(Math.min(14, 5 + w.tai));
    if (ws !== undefined) { mood(ws, 'win', 5000); bubble(ws, settings.mood === 'cute' ? '耶～💖' : '發財啦！', 'big', 5000); }
    if (res.from) {
      const fs = seatOf(res.from);
      if (fs !== undefined) { mood(fs, 'sad', 5000); bubble(fs, '💦', 'big', 5000); }
    }
  }

  // ---------- 聲音合成工具 ----------
  function ctx() { return typeof ensureAudio === 'function' ? ensureAudio() : null; }
  function tone(c, dest, freq, t, dur, type = 'triangle', vol = 0.3, attack = 0.005) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }
  let noiseBuf = null;
  function noise(c, dest, t, dur, vol, filterType, freq) {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    s.buffer = noiseBuf; f.type = filterType; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f).connect(g).connect(dest);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function playFirecrackers(n) {
    const c = ctx();
    if (!c || !settings.sfx) return;
    let t = c.currentTime + 0.05;
    for (let i = 0; i < n; i++) {
      noise(c, c.destination, t, 0.09, 0.35, 'highpass', 900 + Math.random() * 900);
      t += 0.05 + Math.random() * 0.12;
    }
  }

  // ---------- 背景音樂 (即時合成，無版權問題) ----------
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  // 以固定種子產生旋律，每次播放都一樣好聽
  function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  function walk(scale, len, seed, start = 4) {
    const r = seeded(seed); let i = start; const out = [];
    for (let k = 0; k < len; k++) {
      i = Math.max(0, Math.min(scale.length - 1, i + [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)]));
      out.push(r() < 0.18 ? null : scale[i]);
    }
    return out;
  }
  const STYLES = {
    // 國樂古箏：D 宮調五聲音階，撥弦音色
    guzheng: (() => {
      const scale = [62, 64, 66, 69, 71, 74, 76, 78, 81];
      const mel = walk(scale, 32, 7);
      const bass = [50, 50, 45, 47, 50, 50, 43, 45];
      return {
        step: 60 / 84 / 2,
        play(c, out, s, t) {
          const n = mel[s % 32];
          if (n) { tone(c, out, hz(n), t, 0.9, 'triangle', 0.22); tone(c, out, hz(n) * 2.005, t, 0.35, 'sine', 0.05); }
          if (s % 4 === 0) tone(c, out, hz(bass[(s / 4) % 8]), t, 1.4, 'sine', 0.18, 0.02);
          if (s % 8 === 6) noise(c, out, t, 0.05, 0.12, 'bandpass', 2400);
        },
      };
    })(),
    // 過年鑼鼓：C 宮調，熱鬧節奏加鑼聲
    festive: (() => {
      const scale = [72, 74, 76, 79, 81, 84, 86, 88];
      const mel = walk(scale, 16, 21, 3);
      return {
        step: 60 / 126 / 2,
        play(c, out, s, t) {
          const n = mel[s % 16];
          if (n) tone(c, out, hz(n), t, 0.28, 'square', 0.07);
          if (s % 2 === 0) noise(c, out, t, 0.12, s % 4 === 0 ? 0.5 : 0.25, 'lowpass', 180);
          if (s % 4 === 3) noise(c, out, t, 0.06, 0.18, 'highpass', 5000);
          if (s % 16 === 0) { noise(c, out, t, 1.6, 0.16, 'bandpass', 700); tone(c, out, 165, t, 1.6, 'sine', 0.08); }
          if (s % 4 === 0) tone(c, out, hz(48 + [0, 0, 7, 5][(s / 4) % 4]), t, 0.4, 'triangle', 0.16);
        },
      };
    })(),
    // 輕鬆爵士：ii-V-I 和弦、走路貝斯、搖擺鈸聲
    jazz: (() => {
      const chords = [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 61, 64, 67]];
      const walkBass = [38, 41, 43, 45, 43, 47, 50, 49, 48, 43, 40, 43, 45, 44, 43, 40];
      return {
        step: 60 / 96 / 2,
        swing: 0.18,
        play(c, out, s, t) {
          const bar = Math.floor(s / 8) % 4;
          if (s % 8 === 0 || s % 8 === 5) chords[bar].forEach(n => tone(c, out, hz(n), t, 0.9, 'sine', 0.05, 0.02));
          if (s % 2 === 0) tone(c, out, hz(walkBass[(s / 2) % 16]), t, 0.45, 'triangle', 0.16, 0.01);
          if (s % 2 === 1 || s % 4 === 0) noise(c, out, t, 0.08, 0.06, 'highpass', 7000);
        },
      };
    })(),
  };
  let bgm = null;
  function startMusic() {
    stopMusic();
    const c = ctx();
    if (!c) return;
    const style = STYLES[settings.music] || STYLES.guzheng;
    const out = c.createGain();
    out.gain.value = 0.55;
    out.connect(c.destination);
    let step = 0, next = c.currentTime + 0.1;
    const timer = setInterval(() => {
      while (next < c.currentTime + 0.35) {
        const t = next + (style.swing && step % 2 ? style.swing * style.step : 0);
        style.play(c, out, step, t);
        next += style.step;
        step++;
      }
    }, 90);
    bgm = { timer, out, c };
  }
  function stopMusic() {
    if (!bgm) return;
    clearInterval(bgm.timer);
    const { out, c } = bgm;
    out.gain.setTargetAtTime(0, c.currentTime, 0.15);
    setTimeout(() => out.disconnect(), 800);
    bgm = null;
  }
  function syncMusic() { if (settings.bgm) startMusic(); else stopMusic(); }

  // ---------- 設定面板 ----------
  function initSettings() {
    const $ = (id) => document.getElementById(id);
    const bindSwitch = (id, key, after) => {
      const el = $(id);
      el.checked = settings[key];
      el.onchange = () => { settings[key] = el.checked; save(); if (after) after(); };
    };
    const bindSeg = (id, key, after) => {
      const box = $(id);
      const paint = () => box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === settings[key]));
      box.querySelectorAll('button').forEach(b => {
        b.onclick = () => { settings[key] = b.dataset.v; save(); paint(); if (after) after(); };
      });
      paint();
    };
    bindSwitch('setSfx', 'sfx');
    bindSwitch('setCoach', 'coach', () => Coach.syncToggle());
    bindSwitch('setBgm', 'bgm', syncMusic);
    bindSwitch('setVoice', 'voice', () => settings.voice && speak('碰'));
    bindSeg('setMusic', 'music', () => { if (settings.bgm) startMusic(); });
    bindSeg('setMood', 'mood', () => burst(30));
    const open = () => $('settingsModal').classList.remove('hidden');
    document.querySelectorAll('.btn-settings').forEach(b => { b.onclick = open; });
    $('btnCloseSettings').onclick = () => $('settingsModal').classList.add('hidden');
    // 瀏覽器規定要先點一下畫面才能出聲，點了之後若有開背景音樂就開始播
    window.addEventListener('pointerdown', () => { if (settings.bgm && !bgm) startMusic(); }, { once: true });
  }
  document.addEventListener('DOMContentLoaded', initSettings);

  return { settings, save, speak, mascot, avatarHtml, callout, celebrate, burst };
})();
