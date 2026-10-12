// Giả lập N người chơi trên server thật: node --env-file=.env sim.js https://xxx.trycloudflare.com [30]
// Có HOST_KEY thì tự bắt đầu ván, không thì chờ host bấm Space.
const WebSocket = require('ws');
const base = process.argv[2], N = +process.argv[3] || 30;
if (!base) { console.error('Thiếu URL'); process.exit(1); }
const url = base.replace(/^http/, 'ws');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const bots = [];
let raced = false, phase = '', full = 0, last = Date.now(), maxGap = 0;
for (let i = 0; i < N; i++) {
  const ws = new WebSocket(url), b = { ws, msgs: 0 };
  ws.on('message', raw => {
    const m = JSON.parse(raw);
    if (m.full) full++;
    if (m.phase) { b.msgs++; b.state = m; if (i === 0) { maxGap = Math.max(maxGap, Date.now() - last); last = Date.now(); phase = m.phase; if (phase === 'race') raced = true; } }
  });
  ws.on('open', () => ws.send(JSON.stringify({ join: 'Bot' + i })));
  ws.on('error', e => console.error('Bot' + i, e.message));
  bots.push(b);
}

(async () => {
  await sleep(1500);
  console.log(`Đã join: ${bots.filter(b => b.state).length}/${N}, bị báo đầy: ${full}, phase: ${phase}`);
  if (process.env.HOST_KEY) bots[0].ws.send(JSON.stringify({ start: process.env.HOST_KEY }));
  else console.log('Không có HOST_KEY, chờ host bấm Space…');
  // mỗi bot bấm nhịp ngẫu nhiên 80–200ms như người thật
  for (const b of bots) { const ms = 80 + Math.random() * 120; b.timer = setInterval(() => b.ws.readyState === 1 && b.ws.send('{"taps":1}'), ms); }
  const t0 = Date.now(); maxGap = 0;
  while (!(raced && phase === 'done') && Date.now() - t0 < 120000) await sleep(200);
  bots.forEach(b => clearInterval(b.timer));
  const top = bots.map(b => b.state).filter(s => s?.place).sort((a, b) => a.place - b.place);
  console.log(`Kết thúc: phase=${phase} sau ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('Về đích:', top.map(s => `#${s.place} làn ${s.lane}`).join(', '));
  console.log(`Tin nhận/bot: min ${Math.min(...bots.map(b => b.msgs))}, max ${Math.max(...bots.map(b => b.msgs))}; khoảng trống state lớn nhất: ${maxGap}ms (server gửi mỗi 50ms)`);
  bots.forEach(b => b.ws.close());
  process.exit(phase === 'done' ? 0 : 1);
})();
