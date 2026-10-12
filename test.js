// Self-check: chạy server thật, giả lập màn hình + 2 bot + 1 kẻ gian lận, kiểm tra cả cuộc đua.
const { spawn } = require('child_process');
const assert = require('assert');
const WebSocket = require('ws');

const PORT = 3999, URL = `ws://localhost:${PORT}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const srv = spawn('node', ['server.js'], { env: { ...process.env, PORT, HOST_KEY: 'test', OPENAI_API_KEY: '' }, stdio: 'inherit' });

function client(onMsg) {
  return new Promise(res => { const ws = new WebSocket(URL); ws.on('open', () => res(ws)); ws.on('message', m => onMsg(JSON.parse(m))); });
}

(async () => {
  await sleep(500);
  for (const name of ['scooter', 'pothole', 'impact', 'scooter-hurt']) {
    const res = await fetch(`http://localhost:${PORT}/assets/${name}.png`);
    assert.equal(res.status, 200, `${name}: asset phải tải được`);
    assert.equal(res.headers.get('content-type'), 'image/png');
    const bytes = Buffer.from(await res.arrayBuffer());
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  }
  const animationScript = await fetch(`http://localhost:${PORT}/assets/hurt-animation.js`);
  assert.equal(animationScript.status, 200, 'script animation phải tải được');
  assert.equal(animationScript.headers.get('content-type'), 'text/javascript; charset=utf-8');
  const HurtAnimation = require('./assets/hurt-animation.js');
  const hurt = new HurtAnimation();
  assert.equal(hurt.frame(1, false, 0), null);
  assert.equal(hurt.frame(1, true, 100).x, 0);
  assert.equal(hurt.frame(1, true, 299).x, 0);
  assert.equal(hurt.frame(1, true, 300).x, 256);
  assert.equal(hurt.frame(1, true, 500).x, 512);
  assert.equal(hurt.frame(1, true, 700).x, 768);
  assert.equal(hurt.frame(1, true, 1500).x, 768, 'animation không được tự lặp');
  assert.equal(hurt.frame(2, true, 1500).x, 0, 'mỗi xe có thời điểm va chạm riêng');
  assert.equal(hurt.frame(1, false, 1600), null);
  assert.equal(hurt.frame(1, true, 1700).x, 0, 'lần va chạm kế tiếp bắt đầu lại từ frame đầu');
  for (const pathname of ['/assets/missing.png', '/assets/../server.js', '/assets/%2e%2e%2fserver.js']) {
    const res = await fetch(`http://localhost:${PORT}${pathname}`);
    assert.equal(res.status, 404, `${pathname}: không được phục vụ file ngoài danh sách asset`);
  }
  let screen = {}, cheat = {};
  const says = [];
  const s = await client(m => (m.say ? says.push(m.say) : (screen = m)));
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
  const deadline = Date.now() + 45000;
  while (screen.phase !== 'done' && Date.now() < deadline) await sleep(100);
  clearInterval(t);
  assert.equal(screen.phase, 'done');
  assert.deepEqual(screen.players.filter(p => p.place).map(p => p.place).sort(), [1, 2]);
  for (let i = 0; i < 40 && !/Kết thúc|Hết giờ|Race over|Time is up/.test(says.at(-1)); i++) await sleep(100); // chờ câu vô địch đọc xong
  console.log('🎙️ ', says.join(' | '));
  assert(says.length >= 4, `bình luận viên chỉ nói ${says.length} câu`);
  assert(/Kết thúc|Hết giờ|Race over|Time is up/.test(says.at(-1)), 'câu cuối phải là tổng kết ván');

  // còn 2 bot, thêm 28 người cho đủ 30 thì người thứ 31 phải được báo phòng đầy
  for (let i = 0; i < 28; i++) (await client(() => {})).send(JSON.stringify({ join: 'Fill' + i }));
  let late = {};
  (await client(m => (late = m))).send(JSON.stringify({ join: 'Trễ' }));
  await sleep(200);
  assert.equal(screen.players.length, 30);
  assert.equal(late.full, 30);
  console.log('✅ OK: lobby, start key, chống gian lận, ổ gà, về đích, bình luận viên, giới hạn 30 người đều chạy đúng');
  srv.kill(); process.exit(0);
})().catch(e => { console.error('❌', e.message); srv.kill(); process.exit(1); });
