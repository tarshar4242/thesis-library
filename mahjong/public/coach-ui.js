/* 新手教練碰碰：場邊對話框、標亮建議的牌、名詞小教室、問碰碰 */
const Coach = (() => {
  const $ = (id) => document.getElementById(id);
  let aiReady = false;
  let lastKey = '', lastWaitAsk = 0, current = 0, highlight = null, speakTimer = null;
  let learned = [];
  try { learned = JSON.parse(localStorage.getItem('mjLearned') || '[]'); } catch (e) {}
  const saveLearned = () => { try { localStorage.setItem('mjLearned', JSON.stringify(learned)); } catch (e) {} };

  const on = () => FX.settings.coach;

  function show(text, lesson) {
    $('coachPanel').classList.remove('hidden');
    const el = $('coachText');
    el.textContent = text;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    const box = $('coachLesson');
    if (lesson && lesson.length) {
      box.innerHTML = lesson.map(l => `📖 <b>${l.term}</b>：${l.text}`).join('<br>');
      box.classList.remove('hidden');
      lesson.forEach(l => { if (!learned.includes(l.term)) learned.push(l.term); });
      saveLearned();
    } else box.classList.add('hidden');
  }
  function paintHighlight() {
    document.querySelectorAll('#myHand .coach-pick').forEach(e => e.classList.remove('coach-pick'));
    if (!highlight || !on()) return;
    const tiles = [...document.querySelectorAll(`#myHand .tile[data-tile="${highlight}"]`)];
    if (tiles.length) tiles[tiles.length - 1].classList.add('coach-pick');
  }
  function say(text, delay = 0) {
    clearTimeout(speakTimer);
    speakTimer = setTimeout(() => FX.speak(text.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '')), delay);
  }

  function ask(question) {
    socket.emit('coachAsk', { question, learned }, (r) => {
      if (!r || r.error) return;
      current = r.id;
      highlight = r.highlight;
      paintHighlight();
      show(r.text, question ? null : r.lesson);
      $('coachText').classList.toggle('thinking', !!r.ai);
      // 有 AI 時先等它一下再唸，免得唸兩次
      if (r.ai) {
        say(r.text, 6000);
        setTimeout(() => { if (current === r.id) $('coachText').classList.remove('thinking'); }, 8000);
      } else say(r.text);
    });
  }

  socket.on('coachSay', ({ id, text }) => {
    if (id !== current || !on()) return;
    $('coachText').classList.remove('thinking');
    show(text, null);
    say(text);
  });

  // 牌桌每次更新都會呼叫：判斷要不要開口
  function onView(v) {
    const panel = $('coachPanel');
    if (!on() || !v || !v.me) { panel.classList.add('hidden'); highlight = null; paintHighlight(); return; }
    panel.classList.remove('hidden');
    const me = v.me;
    const myTurn = v.phase === 'action' && v.turn === me.seat && !v.finished;
    const react = v.phase === 'reaction' && me.reaction;
    const key = [v.handNo, v.turn, v.phase, me.hand.join(''), JSON.stringify(me.reaction), v.finished].join('|');
    if (key === lastKey) { paintHighlight(); return; }
    lastKey = key;
    if (!myTurn) { highlight = null; paintHighlight(); }
    if (myTurn || react) return ask();
    // 等別人出牌時偶爾聊一下牌況，不要太吵
    if (!v.finished && Date.now() - lastWaitAsk > 25000) { lastWaitAsk = Date.now(); ask(); }
  }

  function syncToggle() {
    const b = $('btnCoach');
    if (b) {
      b.textContent = on() ? '✅ 碰碰陪打中（點一下請它休息）' : '🐦 請碰碰來陪打';
      b.classList.toggle('on', on());
    }
    const sw = $('setCoach');
    if (sw) sw.checked = on();
    lastKey = '';
    if (typeof lastView !== 'undefined' && lastView) onView(lastView);
    else $('coachPanel').classList.add('hidden');
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('btnCoach').onclick = () => {
      FX.settings.coach = !FX.settings.coach; FX.save(); syncToggle();
      if (FX.settings.coach) FX.speak('嗨，我是碰碰，開打後我會在旁邊陪你！');
    };
    $('coachMin').onclick = () => $('coachPanel').classList.toggle('mini');
    $('coachAvatar').onclick = () => $('coachPanel').classList.toggle('mini');
    // 問碰碰的輸入框平常收起來，按了才展開
    $('coachAskBtn').onclick = () => {
      const f = $('coachAskForm');
      f.classList.toggle('hidden');
      if (!f.classList.contains('hidden')) { $('coachPanel').classList.remove('mini'); $('coachQ').focus(); }
    };
    $('coachAskForm').onsubmit = (e) => {
      e.preventDefault();
      const q = $('coachQ').value.trim();
      if (!q) return;
      $('coachQ').value = '';
      $('coachAskForm').classList.add('hidden');
      ask(q);
    };
    fetch('/api/serverinfo').then(r => r.json()).then(info => {
      aiReady = !!info.coachAI;
      $('coachAskBtn').classList.toggle('hidden', !aiReady);
    }).catch(() => {});
    syncToggle();
  });

  return { onView, syncToggle, paintHighlight };
})();
