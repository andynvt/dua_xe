// Self-check: chạy server thật, giả lập màn hình + 2 bot + 1 kẻ gian lận, kiểm tra cả cuộc đua.
const { spawn } = require('child_process');
const assert = require('assert');
const WebSocket = require('ws');

const PORT = 3999, URL = `ws://localhost:${PORT}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT, HOST_KEY: 'test' }, stdio: 'inherit' });

function client(onMsg) {
  return new Promise(res => { const ws = new WebSocket(URL); ws.on('open', () => res(ws)); ws.on('message', m => onMsg(JSON.parse(m))); });
}

(async () => {
  await sleep(500);
  let screen = {}, cheat = {};
  const s = await client(m => (screen = m));
  s.send(JSON.stringify({ screen: true }));
  const bots = [await client(() => {}), await client(() => {})];
  bots.forEach((b, i) => b.send(JSON.stringify({ join: 'Bot' + i })));
  const c = await client(m => { if (!m.you) cheat = m; });
  c.send(JSON.stringify({ join: 'Gian lận' }));
  c.send('không phải json');          // không được làm sập server
  s.send(JSON.stringify({ start: 'sai' })); // sai key thì không được bắt đầu
  await sleep(200);
  assert.equal(screen.phase, 'lobby');
  assert.equal(screen.players.length, 3);

  s.send(JSON.stringify({ start: 'test' }));
  await sleep(3200);
  assert.equal(screen.phase, 'race');

  for (let i = 0; i < 10; i++) c.send(JSON.stringify({ taps: 99999 }));
  await sleep(150);
  assert(cheat.pos <= 5, `gian lận đi được ${cheat.pos}, phải ≤ 5`);
  c.close(); // rời đua, để 2 bot về đích là xong ván

  const t = setInterval(() => bots.forEach(b => b.send(JSON.stringify({ taps: 1 }))), 70);
  const deadline = Date.now() + 20000;
  while (screen.phase !== 'done' && Date.now() < deadline) await sleep(100);
  clearInterval(t);
  assert.equal(screen.phase, 'done');
  assert.deepEqual(screen.players.filter(p => p.place).map(p => p.place).sort(), [1, 2]);
  console.log('✅ OK: lobby, start key, chống gian lận, ổ gà, về đích đều chạy đúng');
  srv.kill(); process.exit(0);
})().catch(e => { console.error('❌', e.message); srv.kill(); process.exit(1); });
