const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 3000;
const HOST_KEY = process.env.HOST_KEY || crypto.randomBytes(3).toString('hex');
const TRACK = 100, COUNTDOWN_MS = 3000, RACE_MAX_MS = 60000, STUN_MS = 800, MAX_PLAYERS = 30;
const TAPS_PER_MS = 0.015, TAP_BURST = 5; // tối đa ~15 tap/giây, người thật tap ~8-12

// Link cho người chơi: PUBLIC_URL > link tunnel hỏi từ cloudflared (`npm run tunnel`) > chính địa chỉ đang mở
async function joinUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  try {
    const r = await fetch('http://127.0.0.1:20241/quicktunnel', { signal: AbortSignal.timeout(500) });
    const { hostname } = await r.json();
    if (hostname) return 'https://' + hostname;
  } catch {}
  return 'http://' + req.headers.host;
}

const pages = { '/': 'phone.html', '/screen': 'screen.html' };
const assets = {
  '/assets/scooter.png': 'assets/scooter.png',
  '/assets/pothole.png': 'assets/pothole.png',
  '/assets/impact.png': 'assets/impact.png',
};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/join') {
    const u = await joinUrl(req);
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ url: u, svg: await QRCode.toString(u, { type: 'svg', margin: 1 }) }));
  }
  if (assets[url.pathname]) {
    try {
      const image = await fs.promises.readFile(path.join(__dirname, assets[url.pathname]));
      res.writeHead(200, { 'content-type': 'image/png' });
      return res.end(image);
    } catch (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      return res.end();
    }
  }
  const page = pages[url.pathname];
  if (!page) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream(path.join(__dirname, page)).pipe(res);
});

const wss = new WebSocketServer({ server, maxPayload: 1024 });
const players = new Map(); // ws -> player
const screens = new Set();
let nextId = 1;
let game = { phase: 'lobby', startAt: 0, finished: 0 };

const randomHoles = () => [20, 45, 70].map(h => h + Math.floor(Math.random() * 15));

function newRace() {
  if (game.phase === 'countdown' || game.phase === 'race') return;
  for (const p of players.values()) Object.assign(p, { pos: 0, place: 0, stunUntil: 0, holes: randomHoles() });
  game = { phase: 'countdown', startAt: Date.now() + COUNTDOWN_MS, finished: 0 };
}

function addTaps(p, n) {
  const now = Date.now();
  p.budget = Math.min(TAP_BURST, p.budget + (now - p.lastTap) * TAPS_PER_MS);
  p.lastTap = now;
  if (game.phase !== 'race' || p.place || now < p.stunUntil) return;
  const k = Math.min(Math.max(n | 0, 0), Math.floor(p.budget));
  p.budget -= k;
  const before = p.pos;
  p.pos = Math.min(TRACK, p.pos + k);
  if (p.holes.some(h => before < h && p.pos >= h)) p.stunUntil = now + STUN_MS;
  if (p.pos >= TRACK) p.place = ++game.finished;
}

wss.on('connection', ws => {
  ws.on('message', raw => {
    let d; try { d = JSON.parse(raw); } catch { return; }
    if (!d || typeof d !== 'object') return;
    if (d.join && !players.has(ws) && players.size < MAX_PLAYERS) {
      // hue theo góc vàng 137.5° để 2 người vào liền nhau có màu khác hẳn
      const p = { id: nextId, hue: nextId++ * 137.5 % 360, name: String(d.join).trim().slice(0, 20) || 'Ẩn danh',
        pos: 0, place: 0, stunUntil: 0, holes: randomHoles(), budget: TAP_BURST, lastTap: Date.now() };
      players.set(ws, p);
      ws.send(JSON.stringify({ you: p.id, hue: p.hue }));
    } else if (d.join && !players.has(ws)) ws.send(JSON.stringify({ full: MAX_PLAYERS }));
    if (d.taps && players.has(ws)) addTaps(players.get(ws), d.taps);
    if (d.screen) screens.add(ws);
    if (d.start === HOST_KEY) newRace();
  });
  ws.on('close', () => { players.delete(ws); screens.delete(ws); });
});

setInterval(() => {
  const now = Date.now();
  const ps = [...players.values()];
  if (game.phase === 'countdown' && now >= game.startAt) game.phase = 'race';
  if (game.phase === 'race' && (game.finished >= 3 || (ps.length && ps.every(p => p.place)) || now - game.startAt > RACE_MAX_MS))
    game.phase = 'done';

  const cd = Math.max(0, game.startAt - now);
  const ranked = [...ps].sort((a, b) => (a.place || 1e9) - (b.place || 1e9) || b.pos - a.pos);
  const rank = new Map(ranked.map((p, i) => [p, i + 1]));

  // màn hình nhận toàn bộ state, điện thoại chỉ nhận phần của mình để tunnel không bị nghẽn
  const full = JSON.stringify({ phase: game.phase, cd, track: TRACK,
    players: ps.map(p => ({ id: p.id, hue: p.hue, name: p.name, pos: p.pos, place: p.place, stun: now < p.stunUntil, holes: p.holes })) });
  for (const s of screens) s.send(full);
  let lane = 0; // cùng thứ tự với ps nên khớp số làn trên màn hình
  for (const [ws, p] of players)
    ws.send(JSON.stringify({ phase: game.phase, cd, track: TRACK, lane: ++lane, pos: p.pos, place: p.place, holes: p.holes,
      stun: now < p.stunUntil, rank: rank.get(p), total: ps.length }));
}, 50);

server.listen(PORT, () => {
  console.log(`Đua Xe Ôm chạy tại http://localhost:${PORT}`);
  console.log(`Màn hình host: http://localhost:${PORT}/screen?key=${HOST_KEY}  (Space = bắt đầu)`);
});
