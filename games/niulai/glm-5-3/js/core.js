/* ═══════════════════════════════════════════
   core.js · 工具函数 + WebAudio 音效/音乐引擎
   ═══════════════════════════════════════════ */
"use strict";

const U = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  ease: (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  fmt: (n) => n.toLocaleString("en-US"),
};

/* Canvas 绘图小助手 */
const Draw = {
  ell(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  },
  cir(ctx, x, y, r) { this.ell(ctx, x, y, r, r); },
  rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },
  fill(ctx, color) { ctx.fillStyle = color; ctx.fill(); },
  stroke(ctx, color, w) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); },
  /* 圆角多边形（用于异形色块） */
  blob(ctx, pts, smooth = 0.35) {
    ctx.beginPath();
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const m1 = { x: p0.x + (p1.x - p0.x) * .5, y: p0.y + (p1.y - p0.y) * .5 };
      const m2 = { x: p1.x + (p2.x - p1.x) * .5, y: p1.y + (p2.y - p1.y) * .5 };
      if (i === 0) ctx.moveTo(m1.x, m1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, m2.x, m2.y);
    }
    ctx.closePath();
  },
};

/* ═══════════ WebAudio 音效 ═══════════ */
const Sound = {
  ctx: null,
  sfxOn: true,
  musicOn: true,
  _musicTimer: null,
  _musicStep: 0,
  _musicGain: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._musicGain = this.ctx.createGain();
      this._musicGain.gain.value = 0.14;
      this._musicGain.connect(this.ctx.destination);
    } catch (e) { /* 无音频环境 */ }
  },
  resume() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },

  tone(freq, dur, type = "sine", vol = .3, slide = 0, when = 0) {
    if (!this.ctx || !this.sfxOn) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t0); o.stop(t0 + dur + .02);
  },
  noise(dur, vol = .3, low = 400) {
    if (!this.ctx || !this.sfxOn) return;
    const t0 = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = low;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.ctx.destination);
    src.start(t0);
  },

  /* 游戏事件音 */
  coin(pitch = 0) {
    this.tone(880 + pitch * 60, .12, "triangle", .22);
    this.tone(1318 + pitch * 80, .16, "triangle", .18, 0, .05);
  },
  bigCoin() {
    this.tone(880, .1, "triangle", .2);
    this.tone(1108, .1, "triangle", .2, 0, .06);
    this.tone(1318, .14, "triangle", .2, 0, .12);
    this.tone(1760, .22, "triangle", .18, 0, .18);
  },
  apple() {
    this.tone(523, .1, "square", .12);
    this.tone(659, .1, "square", .12, 0, .07);
    this.tone(784, .1, "square", .12, 0, .14);
    this.tone(1046, .3, "square", .14, 0, .21);
  },
  jump() { this.tone(300, .18, "sine", .2, 380); this.noise(.08, .06, 900); },
  slide() { this.noise(.22, .12, 600); },
  lane() { this.tone(500, .06, "sine", .1, 120); },
  crash() {
    this.noise(.4, .4, 500);
    this.tone(160, .35, "sawtooth", .28, -110);
    this.tone(90, .5, "square", .2, -50, .05);
  },
  click() { this.tone(700, .05, "triangle", .15); },
  start() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, .14, "triangle", .2, 0, i * .09));
  },
  record() {
    [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, .2, "triangle", .22, 0, i * .12));
  },

  /* ── 背景音乐：轻快田园小循环 ── */
  _melody: [
    [0, 4], [4, 2], [7, 2], [4, 2], [9, 4], [7, 2], [4, 2], [2, 2],
    [0, 4], [4, 2], [7, 2], [11, 2], [9, 4], [7, 2], [5, 2], [4, 2],
  ],
  _bass: [0, null, -5, null, -7, null, -5, null, 0, null, -5, null, -3, null, -5, null],
  startMusic() {
    if (!this.ctx || !this.musicOn || this._musicTimer) return;
    const bpm = 132, stepDur = 60 / bpm / 2;
    const N = (semi) => 392 * Math.pow(2, semi / 12); // G4 基准
    this._musicStep = 0;
    this._musicTimer = setInterval(() => {
      if (!this.musicOn || !this.ctx) return;
      const i = this._musicStep % 16;
      const m = this._melody[i], b = this._bass[i];
      const t0 = this.ctx.currentTime + .02;
      if (m) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = "triangle"; o.frequency.value = N(m[0]);
        g.gain.setValueAtTime(.5, t0);
        g.gain.exponentialRampToValueAtTime(.001, t0 + stepDur * m[1] * .9);
        o.connect(g); g.connect(this._musicGain);
        o.start(t0); o.stop(t0 + stepDur * m[1]);
      }
      if (b !== null) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = "sine"; o.frequency.value = N(b - 12);
        g.gain.setValueAtTime(.7, t0);
        g.gain.exponentialRampToValueAtTime(.001, t0 + stepDur * 1.7);
        o.connect(g); g.connect(this._musicGain);
        o.start(t0); o.stop(t0 + stepDur * 1.8);
      }
      this._musicStep++;
    }, stepDur * 1000);
  },
  stopMusic() {
    if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
  },
};
