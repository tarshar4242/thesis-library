/* 台式麻將 伺服器 (後端重建版) */
console.log('🀄 伺服器啟動中…');
const path = require('path');
const os = require('os');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { Game } = require('./game');
const coach = require('./coach');
const coachAI = require('./coach-ai');

const PORT = Number(process.env.PORT) || 4100;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// 列出本機的區網位址，給大廳的「邀請好友」使用
function lanUrls() {
  const urls = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) urls.push(`http://${a.address}:${PORT}`);
    }
  }
  // 192.168.x.x 通常是家裡 Wi-Fi，排最前面
  return urls.sort((a, b) => (b.includes('//192.168.') - a.includes('//192.168.')));
}
// 放上雲端時 (Render 會自動提供 RENDER_EXTERNAL_URL) 改給公開網址，好友不必同一個 Wi-Fi
const PUBLIC_URL = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
app.get('/api/serverinfo', (req, res) => res.json({
  ...(PUBLIC_URL ? { port: PORT, urls: [PUBLIC_URL], public: true } : { port: PORT, urls: lanUrls() }),
  coachAI: coachAI.available(),
}));

// 碰碰 AI 的狀態 (不含金鑰)，方便排查
app.get('/api/coach-health', (req, res) => res.json(coachAI.health()));

// ---------- 房間 ----------
const rooms = new Map();
// 京劇角色（生、三位旦、淨、丑）：每桌每個角色只能一個人用；電腦玩家拿剩下的
const ROLES = ['sheng', 'dan', 'jing', 'chou', 'qingyi', 'huadan'];
const AI_NAMES = { sheng: '電腦小生', dan: '電腦貴妃', jing: '電腦花臉', chou: '電腦小丑', qingyi: '電腦青衣', huadan: '電腦花旦' };
const takenRoles = (room) => room.seats.filter(Boolean).map(s => s.avatar);
const pickRole = (room, wanted) => {
  const taken = takenRoles(room);
  if (ROLES.includes(wanted) && !taken.includes(wanted)) return wanted;
  return ROLES.find(r => !taken.includes(r));
};

function newRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id;
  do { id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
  while (rooms.has(id));
  return id;
}

function lobbyOf(room) {
  return {
    roomId: room.id,
    seats: room.seats.map((s, i) => ({ seat: i, name: s ? s.name : null, avatar: s ? s.avatar : null })),
  };
}

function broadcastState(room) {
  const lobby = lobbyOf(room);
  room.seats.forEach((s, seat) => {
    if (s && s.socketId) {
      io.to(s.socketId).emit('state', { view: room.game.getView(seat), lobby, log: room.game.log });
    }
  });
}

function createRoom(socket, name) {
  const room = { id: newRoomId(), seats: [null, null, null, null], hostId: socket.id, game: null };
  rooms.set(room.id, room);
  return room;
}

function seatPlayer(socket, room, seat, name, avatar) {
  room.seats[seat] = { name, avatar: pickRole(room, avatar), socketId: socket.id, isAI: false };
  socket.data.roomId = room.id;
  socket.data.seat = seat;
  socket.join(room.id);
}

function startGame(room) {
  const seats = room.seats.slice();
  seats.forEach((s, i) => {
    if (s) return;
    const avatar = pickRole({ seats }, null);
    seats[i] = { name: AI_NAMES[avatar], avatar, socketId: null, isAI: true };
  });
  room.seats = seats;
  room.game = new Game(seats, {
    onUpdate: () => broadcastState(room),
    onResult: (res) => io.to(room.id).emit('result', res),
    onSfx: (type, seat) => io.to(room.id).emit('sfx', { type, seat }),
  });
  room.game.startHand();
}

const reply = (cb, data) => { if (typeof cb === 'function') cb(data); };
const cleanName = (n) => String(n || '').trim().slice(0, 8) || '玩家' + Math.floor(Math.random() * 900 + 100);

io.on('connection', (socket) => {
  socket.on('quickPlay', ({ name, avatar } = {}, cb) => {
    if (socket.data.roomId) return reply(cb, { error: '你已經入座了' });
    const room = createRoom(socket);
    seatPlayer(socket, room, 0, cleanName(name), avatar);
    reply(cb, { seat: 0, roomId: room.id });
    startGame(room);
  });

  socket.on('createRoom', ({ name, avatar } = {}, cb) => {
    if (socket.data.roomId) return reply(cb, { error: '你已經入座了' });
    const room = createRoom(socket);
    seatPlayer(socket, room, 0, cleanName(name), avatar);
    reply(cb, { seat: 0, roomId: room.id });
    io.to(room.id).emit('lobby', lobbyOf(room));
  });

  // 輸入桌號時先看看這桌哪些角色被選走了
  socket.on('peekRoom', ({ roomId } = {}, cb) => {
    const room = rooms.get(String(roomId || '').toUpperCase());
    if (!room) return reply(cb, { error: '找不到這個桌號' });
    reply(cb, { taken: takenRoles(room), full: room.seats.every(Boolean), started: !!room.game });
  });

  socket.on('joinRoom', ({ roomId, name, avatar } = {}, cb) => {
    if (socket.data.roomId) return reply(cb, { error: '你已經入座了' });
    const room = rooms.get(String(roomId || '').toUpperCase());
    if (!room) return reply(cb, { error: '找不到這個桌號' });
    if (room.game) return reply(cb, { error: '這桌已經開打了' });
    const seat = room.seats.findIndex(s => !s);
    if (seat < 0) return reply(cb, { error: '這桌已經坐滿了' });
    if (takenRoles(room).includes(avatar)) {
      return reply(cb, { error: '這個角色已經有人選了，換一個吧', taken: takenRoles(room) });
    }
    seatPlayer(socket, room, seat, cleanName(name), avatar);
    reply(cb, { seat, roomId: room.id });
    io.to(room.id).emit('lobby', lobbyOf(room));
  });

  socket.on('startGame', (_data, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return reply(cb, { error: '這桌不存在' });
    if (room.hostId !== socket.id) return reply(cb, { error: '只有房主可以開始' });
    if (room.game) return reply(cb, { error: '已經開始了' });
    reply(cb, {});
    startGame(room);
  });

  socket.on('action', (action, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || !room.game) return reply(cb, { error: '遊戲尚未開始' });
    reply(cb, room.game.doAction(socket.data.seat, action) || {});
  });

  // 新手教練碰碰：先回範本台詞，有 AI 時再補上更生動的說法
  let coachSeq = 0;
  socket.on('coachAsk', ({ question, learned } = {}, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || !room.game) return reply(cb, { error: '遊戲尚未開始' });
    const facts = coach.analyze(room.game, socket.data.seat);
    const draft = coach.template(facts, Array.isArray(learned) ? learned : []);
    const id = ++coachSeq;
    const hasAI = coachAI.available();
    const wantsAI = hasAI && coachAI.allow(socket.id);
    const busyText = hasAI ? '我剛講完話，喘口氣～過 5 秒再問我一次好嗎？🐦' : '我現在只會看牌給建議，問問題要等主人開通 AI 喔🙏';
    reply(cb, {
      id, text: question ? (wantsAI ? '我想想喔…🤔' : busyText) : draft.text,
      lesson: draft.lesson, highlight: facts.situation === 'discard' || facts.situation === 'locked' ? facts.suggest : null,
      situation: facts.situation, ai: wantsAI,
    });
    if (!wantsAI) return;
    coachAI.say(facts, { draft: draft.text, lesson: draft.lesson, question }).then(text => {
      if (text) socket.emit('coachSay', { id, text });
      else if (question) socket.emit('coachSay', { id, text: '哎呀我剛剛恍神了，再問我一次好嗎？😅' });
    });
  });

  socket.on('disconnect', () => {
    coachAI.forget(socket.id);
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    const seat = socket.data.seat;
    if (room.game) {
      // 牌局中斷線：由電腦代打
      const p = room.game.players[seat];
      p.isAI = true;
      p.name += '(代打)';
      room.seats[seat].socketId = null;
      room.game.addLog(`${p.name} 離線，改由電腦代打`);
      room.game.update();
    } else {
      room.seats[seat] = null;
      if (room.hostId === socket.id) {
        const next = room.seats.find(s => s && s.socketId);
        room.hostId = next ? next.socketId : null;
      }
      io.to(room.id).emit('lobby', lobbyOf(room));
    }
    if (!room.seats.some(s => s && s.socketId)) {
      if (room.game) room.game.stop();
      rooms.delete(room.id);
    }
  });
});

server.on('error', (err) => { console.error('❌ 伺服器無法啟動:', err.message); process.exit(1); });
console.log(`   準備在 port ${PORT} 開門，AI 教練：${coachAI.available() ? '已設定金鑰' : '未設定'}，工作區：${coachAI.health().workspaceSet ? '已設定' : '未設定'}`);
server.listen(PORT, '0.0.0.0', () => {
  console.log('🀄 我家三缺一 已啟動');
  console.log(`   本機遊玩：http://localhost:${PORT}`);
  if (PUBLIC_URL) console.log(`   公開網址：${PUBLIC_URL}`);
  else for (const u of lanUrls()) console.log(`   區網好友：${u}`);
});
