/* 台式麻將 伺服器 (後端重建版) */
const path = require('path');
const os = require('os');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { Game } = require('./game');

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
app.get('/api/serverinfo', (req, res) => res.json(
  PUBLIC_URL ? { port: PORT, urls: [PUBLIC_URL], public: true } : { port: PORT, urls: lanUrls() }
));

// ---------- 房間 ----------
const rooms = new Map();
const AI_NAMES = ['電腦-東', '電腦-南', '電腦-西', '電腦-北'];

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
    seats: room.seats.map((s, i) => ({ seat: i, name: s ? s.name : null })),
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

function seatPlayer(socket, room, seat, name) {
  room.seats[seat] = { name, socketId: socket.id, isAI: false };
  socket.data.roomId = room.id;
  socket.data.seat = seat;
  socket.join(room.id);
}

function startGame(room) {
  const seats = room.seats.map((s, i) => s || { name: AI_NAMES[i], socketId: null, isAI: true });
  room.seats = seats;
  room.game = new Game(seats, {
    onUpdate: () => broadcastState(room),
    onResult: (res) => io.to(room.id).emit('result', res),
    onSfx: (type) => io.to(room.id).emit('sfx', { type }),
  });
  room.game.startHand();
}

const reply = (cb, data) => { if (typeof cb === 'function') cb(data); };
const cleanName = (n) => String(n || '').trim().slice(0, 8) || '玩家' + Math.floor(Math.random() * 900 + 100);

io.on('connection', (socket) => {
  socket.on('quickPlay', ({ name } = {}, cb) => {
    if (socket.data.roomId) return reply(cb, { error: '你已經在房間裡了' });
    const room = createRoom(socket);
    seatPlayer(socket, room, 0, cleanName(name));
    reply(cb, { seat: 0, roomId: room.id });
    startGame(room);
  });

  socket.on('createRoom', ({ name } = {}, cb) => {
    if (socket.data.roomId) return reply(cb, { error: '你已經在房間裡了' });
    const room = createRoom(socket);
    seatPlayer(socket, room, 0, cleanName(name));
    reply(cb, { seat: 0, roomId: room.id });
    io.to(room.id).emit('lobby', lobbyOf(room));
  });

  socket.on('joinRoom', ({ roomId, name } = {}, cb) => {
    if (socket.data.roomId) return reply(cb, { error: '你已經在房間裡了' });
    const room = rooms.get(String(roomId || '').toUpperCase());
    if (!room) return reply(cb, { error: '找不到這個房號' });
    if (room.game) return reply(cb, { error: '這桌已經開打了' });
    const seat = room.seats.findIndex(s => !s);
    if (seat < 0) return reply(cb, { error: '房間已滿' });
    seatPlayer(socket, room, seat, cleanName(name));
    reply(cb, { seat, roomId: room.id });
    io.to(room.id).emit('lobby', lobbyOf(room));
  });

  socket.on('startGame', (_data, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return reply(cb, { error: '房間不存在' });
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

  socket.on('disconnect', () => {
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

server.listen(PORT, '0.0.0.0', () => {
  console.log('🀄 台式十六張麻將 已啟動');
  console.log(`   本機遊玩：http://localhost:${PORT}`);
  if (PUBLIC_URL) console.log(`   公開網址：${PUBLIC_URL}`);
  else for (const u of lanUrls()) console.log(`   區網好友：${u}`);
});
