// Rectangles and durations from generated/sprites/scooter-hurt/manifest.json.
const hurtFrames = [
  { x: 0, y: 0, w: 256, h: 192, duration: 200 },
  { x: 256, y: 0, w: 256, h: 192, duration: 200 },
  { x: 512, y: 0, w: 256, h: 192, duration: 200 },
  { x: 768, y: 0, w: 256, h: 192, duration: 200 },
];

class HurtAnimation {
  constructor() { this.started = new Map(); }

  frame(id, stunned, now = performance.now()) {
    if (!stunned) { this.started.delete(id); return null; }
    if (!this.started.has(id)) this.started.set(id, now);
    let elapsed = Math.max(0, now - this.started.get(id));
    for (const frame of hurtFrames) {
      if (elapsed < frame.duration) return frame;
      elapsed -= frame.duration;
    }
    return hurtFrames.at(-1);
  }
}

if (typeof module !== 'undefined') module.exports = HurtAnimation;
