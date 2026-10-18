/* 首頁名片：選角色、記住稱呼、桌號查詢、邀請卡 */
const Lobby = (() => {
  const ROLES = {
    sheng: { img: 'img/sheng.jpg', label: '生 · 小生' },
    qingyi: { img: 'img/qingyi.jpg', label: '旦 · 青衣' },
    huadan: { img: 'img/huadan.jpg', label: '旦 · 花旦' },
    dan: { img: 'img/opera.jpg', label: '旦 · 貴妃' },
    jing: { img: 'img/jing.jpg', label: '淨 · 花臉' },
    chou: { img: 'img/chou.jpg', label: '丑 · 小丑' },
  };
  const $ = (id) => document.getElementById(id);
  const load = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  let role = ROLES[load('mjRole', '')] ? load('mjRole', '') : 'dan';
  let taken = [];
  let inviteText = '';

  function paint() {
    $('myAvatar').src = ROLES[role].img;
    $('myRoleName').textContent = ROLES[role].label;
    document.querySelectorAll('#rolePicker .role').forEach(b => {
      const r = b.dataset.role;
      b.classList.toggle('on', r === role);
      b.classList.toggle('taken', taken.includes(r));
      b.disabled = taken.includes(r);
      b.title = taken.includes(r) ? '這桌已經有人選了' : '';
    });
  }
  function choose(r) {
    if (!ROLES[r] || taken.includes(r)) return;
    role = r; store('mjRole', r); paint();
  }
  // 這桌被選走的角色變灰；自己的角色被選走了就自動換一個空的
  function markTaken(list) {
    taken = Array.isArray(list) ? list : [];
    if (taken.includes(role)) {
      const free = Object.keys(ROLES).find(r => !taken.includes(r));
      if (free) role = free;
    }
    paint();
  }

  function setInvite(roomId) {
    const url = ($('connectAddr').textContent || location.origin).trim();
    inviteText = `來我家三缺一！桌號 ${roomId}，打開這個網址輸入桌號就能入座 👉 ${url}`;
    $('btnLine').href = 'https://line.me/R/msg/text/?' + encodeURIComponent(inviteText);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#rolePicker .role').forEach(b => { b.onclick = () => choose(b.dataset.role); });
    const name = $('nameInput');
    name.value = load('mjName', '');
    name.addEventListener('change', () => store('mjName', name.value.trim()));

    $('btnJoinOpen').onclick = () => {
      $('joinBox').classList.toggle('hidden');
      if (!$('joinBox').classList.contains('hidden')) $('roomInput').focus();
    };
    // 桌號打滿 4 碼就先問伺服器：這桌在不在、哪些角色被選了
    $('roomInput').addEventListener('input', () => {
      const id = $('roomInput').value.trim().toUpperCase();
      if (id.length < 4) { markTaken([]); $('lobbyMsg').textContent = ''; return; }
      socket.emit('peekRoom', { roomId: id }, (r) => {
        if (!r || r.error) { $('lobbyMsg').textContent = r ? r.error : ''; return; }
        markTaken(r.taken);
        $('lobbyMsg').textContent = r.started ? '這桌已經開打了' : r.full ? '這桌已經坐滿了'
          : r.taken.length ? '灰色的角色已經有人選了' : '';
      });
    });

    // 複製整段邀請文字（含桌號），不只網址
    $('btnCopyAddr').onclick = () => {
      const btn = $('btnCopyAddr');
      copyText(inviteText || $('connectAddr').textContent, null).then(ok => {
        const orig = btn.textContent;
        btn.textContent = ok ? '✓ 已複製' : '請手動複製';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    };
    paint();
  });

  return { avatar: () => role, name: () => $('nameInput').value.trim(), markTaken, setInvite, remember: () => store('mjName', $('nameInput').value.trim()) };
})();
