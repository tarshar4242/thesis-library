/* 戰績紀錄：每局結束記一筆，給 /api/stats 和 /stats.html 看 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'stats.jsonl');
const MAX = 5000;
let records = [];
const startedAt = new Date().toISOString();

// 伺服器重開時，盡量把同一台機器上已存的紀錄讀回來（Render 免費方案重新部署會清空）
try {
  records = fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).slice(-MAX);
} catch (e) { /* 沒有舊紀錄 */ }

function add(rec) {
  records.push(rec);
  if (records.length > MAX) records = records.slice(-MAX);
  console.log('[戰績]', JSON.stringify(rec));
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.appendFileSync(FILE, JSON.stringify(rec) + '\n');
  } catch (e) { /* 寫不進去就只留在記憶體 */ }
}

// 依難度、碰碰模式統計真人的胡牌率與放槍率
function summary() {
  const groups = {};
  const bump = (key, p, r) => {
    const g = groups[key] || (groups[key] = { hands: 0, wins: 0, dealIns: 0, draws: 0 });
    g.hands++;
    if (r.kind === 'draw') g.draws++;
    if (r.winner === p.seat) g.wins++;
    if (r.from === p.seat) g.dealIns++;
  };
  for (const r of records) {
    for (const p of r.players.filter(x => x.human)) {
      bump(`${r.difficulty}|全部`, p, r);
      bump(`${r.difficulty}|${p.coach || 'off'}`, p, r);
    }
  }
  const rows = Object.entries(groups).map(([k, g]) => {
    const [difficulty, coach] = k.split('|');
    return { difficulty, coach, ...g, winRate: g.hands ? Math.round(g.wins / g.hands * 100) : 0, dealInRate: g.hands ? Math.round(g.dealIns / g.hands * 100) : 0 };
  }).sort((a, b) => (a.difficulty + a.coach).localeCompare(b.difficulty + b.coach));
  return { since: records[0] ? records[0].t : startedAt, serverStartedAt: startedAt, totalHands: records.length, rows, recent: records.slice(-50).reverse() };
}

module.exports = { add, summary };
