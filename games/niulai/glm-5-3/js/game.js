/* ═══════════════════════════════════════════════
   game.js · 横向三行跑道酷引擎（从左向右奔跑）
   角色固定在屏幕左侧约 24% 处，世界向左滚动；
   三条赛道为上/中/下三行，带近大远小的纵深。
   ═══════════════════════════════════════════════ */
"use strict";

const GH = 540;                 // 设计高度（宽度随窗口比例自适应）
let GW = 960;
const ROW_BASE = [318, 392, 470];      // 每条道的地面 y（0=上/远，2=下/近）
const ROW_BAND = [40, 54, 72];         // 每条道地面带高度
const ROW_SCALE = [0.74, 0.87, 1.0];   // 近大远小
const UNIT = 46;                       // 近道每世界单位的像素数
const SKYLINE = 316;                   // 地平线 y
const JUMP_V = 12.4, GRAV = 39;
const PLAYER_H = 1.72, SLIDE_H = .8;

const DIFFS = {
  easy:   { name: "简单", desc: "小步慢跑：速度慢、障碍稀疏，新手友好。", base: 6.5, max: 10,   ramp: .09, gapMin: 1.05, gapMax: 1.6,  dbl: .12, coinGap: [14, 22], appleAt: [140, 210] },
  normal: { name: "正常", desc: "标准节奏：速度适中、障碍均衡，锻炼反应。", base: 8.5, max: 13.5, ramp: .14, gapMin: .85,  gapMax: 1.3,  dbl: .26, coinGap: [17, 25], appleAt: [165, 240] },
  hard:   { name: "困难", desc: "狂奔模式：高速+密集障碍，只有高手敢挑战！", base: 11,  max: 17,   ramp: .2,  gapMin: .7,   gapMax: 1.05, dbl: .42, coinGap: [19, 28], appleAt: [185, 265] },
};

const Game = {
  cv: null, ctx: null,
  state: "boot",          // menu | playing | crashing | over | paused
  cfg: { char: "niulai", hat: "none", cloth: "none", shoes: "none", track: "forest", diff: "normal" },
  track: TRACKS[0], char: CHARS[0],

  dist: 0, speed: 8.5, targetLane: 1, laneF: 1, py: 0, vy: 0,
  jumping: false, sliding: false, slideT: 0, runPhase: 0,
  score: 0, coins: 0, apples: 0, boostT: 0,
  obstacles: [], coinsArr: [], applesArr: [], props: [],
  nextObsDist: 0, nextCoinDist: 0, nextAppleDist: 0,
  particles: [], popups: [], ambient: [],
  shakeT: 0, crashT: 0, flashT: 0, deadSpin: 0, deadVy: 0, deadX: 0,
  jumpBufT: 0, time: 0, raf: 0, lastT: 0,
  W: 960, H: 540,

  /* ───────── 初始化 ───────── */
  init() {
    this.cv = document.getElementById("cv");
    this.ctx = this.cv.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.bindInput();
    this.loadCfg();
    this.setMode("menu");
    requestAnimationFrame((t) => this.loop(t));
  },

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    // 保证横向至少可见 640 设计宽（竖屏反应距离），超宽屏最多 1600
    let u = Math.min(h / GH, w / 640);
    u = Math.max(u, w / 1600);
    this.unit = u; this.dpr = dpr;
    GW = w / u;
    this.W = GW; this.H = GH;
    this.viewH = h / u;                      // 可见设计高度（竖屏 > 540）
    this.yOff = (this.viewH - GH) / 2;       // 场景在扩展视口中垂直居中
    SCROLL_W = GW;
  },

  applyCtx() {
    const u = this.unit * this.dpr;
    this.ctx.setTransform(u, 0, 0, u, 0, this.yOff * u);
  },

  loadCfg() {
    try {
      const s = JSON.parse(localStorage.getItem("nlpk_cfg") || "{}");
      Object.assign(this.cfg, s);
    } catch (e) { }
    this.char = charById(this.cfg.char);
    this.track = trackById(this.cfg.track);
  },
  saveCfg() { localStorage.setItem("nlpk_cfg", JSON.stringify(this.cfg)); },

  setMode(m) {
    this.state = m;
    if (m === "menu") { this.resetWorld(true); }
  },

  resetWorld(preview) {
    this.dist = 0; this.speed = DIFFS[this.cfg.diff].base;
    this.targetLane = 1; this.laneF = 1; this.py = 0; this.vy = 0;
    this.jumping = false; this.sliding = false; this.slideT = 0;
    this.score = 0; this.coins = 0; this.apples = 0; this.boostT = 0;
    this.obstacles = []; this.coinsArr = []; this.applesArr = [];
    this.particles = []; this.popups = [];
    this.shakeT = 0; this.flashT = 0; this.deadSpin = 0; this.deadX = 0;
    this.nextObsDist = 18; this.nextCoinDist = 10; this.nextAppleDist = 90;
    // 生成三行路旁景物
    this.props = [];
    for (let lane = 0; lane < 3; lane++) {
      for (let wx = 2; wx < this.aheadMax() + 4; wx += U.rand(2.5, 7)) {
        this.props.push(this.makeProp(lane, wx));
      }
    }
    this.initAmbient();
    if (!preview) Menu.hideAll();
  },

  makeProp(lane, wx) {
    const kinds = Object.keys(this.track.props);
    const total = kinds.reduce((s, k) => s + this.track.props[k], 0);
    let r = Math.random() * total, kind = kinds[0];
    for (const k of kinds) { r -= this.track.props[k]; if (r <= 0) { kind = k; break; } }
    return { lane, wx, kind, seed: U.randi(1, 9999) };
  },

  initAmbient() {
    const amb = ambientFor(this.track.id);
    this.ambient = [];
    for (let i = 0; i < amb.n; i++)
      this.ambient.push(this.newAmbientParticle(amb.type, true));
  },
  newAmbientParticle(type, anywhere) {
    const top = -this.yOff, bot = GH + this.yOff;
    return {
      type,
      x: anywhere ? Math.random() * GW : GW + 12,
      y: anywhere ? U.rand(top, bot) : (type === "snow" || type === "petal" || type === "leaf" ? top - 10 : U.rand(Math.max(top, SKYLINE), bot)),
      vx: type === "snow" ? U.rand(-30, -8) : U.rand(-60, -22),
      vy: type === "snow" ? U.rand(22, 46) : type === "sand" ? U.rand(4, 12) : U.rand(14, 36),
      r: U.rand(1.4, 3.4), rot: Math.random() * 6, vr: U.rand(-2, 2),
    };
  },

  /* ───────── 横向投影 ───────── */
  playerX() { return GW * .24; },
  unitOf(lane) { return UNIT * ROW_SCALE[lane]; },
  screenXOf(wx, lane) { return this.playerX() + (wx - this.dist) * this.unitOf(lane); },
  aheadMax() { return (GW - this.playerX()) / this.unitOf(0) + 3; },
  spawnWx() { return this.dist + this.aheadMax(); },

  /* ───────── 输入 ───────── */
  bindInput() {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (this.state === "playing") {
        if (k === "arrowup" || k === "w") { e.preventDefault(); this.moveLane(-1); }
        else if (k === "arrowdown" || k === "s") { e.preventDefault(); this.moveLane(1); }
        else if (k === " " || k === "j" || k === "enter") { e.preventDefault(); this.tryJump(); }
        else if (k === "k" || k === "x" || k === "shift") this.trySlide();
        else if (k === "p" || k === "escape") this.pause();
      } else if (this.state === "paused" && (k === "p" || k === "escape")) this.resume();
    });
    // 触屏：上下滑切道，点按跳跃
    let ts = null;
    this.cv.addEventListener("touchstart", (e) => {
      const t = e.touches[0]; ts = { x: t.clientX, y: t.clientY, t: performance.now() };
    }, { passive: true });
    this.cv.addEventListener("touchend", (e) => {
      if (!ts || this.state !== "playing") return;
      const t = e.changedTouches[0];
      const dx = t.clientX - ts.x, dy = t.clientY - ts.y;
      if (Math.abs(dx) < 22 && Math.abs(dy) < 22) this.tryJump();       // 点按=跳
      else if (Math.abs(dy) > Math.abs(dx)) this.moveLane(dy > 0 ? 1 : -1); // 上下滑=切道
      else this.trySlide();                                              // 左右滑=滑铲
      ts = null;
    }, { passive: true });
    // 鼠标点按画布 = 跳（桌面休闲玩法）
    this.cv.addEventListener("pointerdown", (e) => {
      if (this.state === "playing" && e.pointerType === "mouse") this.tryJump();
    });
    // 触屏按钮
    document.querySelectorAll("#touch-pads .tpad").forEach(el => {
      el.addEventListener("pointerdown", (ev) => {
        ev.preventDefault();
        const a = el.dataset.act;
        if (a === "up") this.moveLane(-1);
        else if (a === "down") this.moveLane(1);
        else if (a === "jump") this.tryJump();
        else if (a === "slide") this.trySlide();
      });
    });
    window.addEventListener("blur", () => { if (this.state === "playing") this.pause(); });
  },

  moveLane(d) {
    const nl = U.clamp(this.targetLane + d, 0, 2);
    if (nl !== this.targetLane) { this.targetLane = nl; Sound.lane(); }
  },
  tryJump() {
    if (this.sliding) { this.sliding = false; this.slideT = 0; } // 滑铲中起跳
    if (!this.jumping) {
      this.jumping = true; this.vy = JUMP_V;
      Sound.jump();
      this.spawnDust(10);
    } else this.jumpBufT = .14;
  },
  trySlide() {
    if (this.jumping) { this.vy = Math.min(this.vy, -18); return; } // 空中急坠
    if (!this.sliding) {
      this.sliding = true; this.slideT = .68;
      Sound.slide();
      this.spawnDust(14);
    }
  },
  pause() { if (this.state !== "playing") return; this.state = "paused"; Menu.showPause(); },
  resume() { if (this.state !== "paused") return; this.state = "playing"; Menu.hideAll(); this.lastT = 0; },

  /* ───────── 生成逻辑 ───────── */
  spawnStuff() {
    const D = DIFFS[this.cfg.diff];
    // 障碍组
    if (this.dist >= this.nextObsDist) {
      this.nextObsDist = this.dist + this.speed * U.rand(D.gapMin, D.gapMax);
      const lanes = [0, 1, 2];
      const blockCount = Math.random() < D.dbl ? 2 : 1;
      const blocked = [];
      for (let i = 0; i < blockCount; i++) blocked.push(lanes.splice(U.randi(0, lanes.length - 1), 1)[0]);
      let arcDone = false;
      for (const lane of blocked) {
        const jumpObs = this.track.obstacles.filter(o => o.type === "jump");
        const useJump = Math.random() < .66;
        const def = useJump ? U.pick(jumpObs) : this.track.obstacles.find(o => o.type === "slide");
        const wx = this.spawnWx();
        this.obstacles.push({ lane, wx, id: def.id, type: def.type });
        // 跳跃障碍上方金币弧线
        if (def.type === "jump" && !arcDone && Math.random() < .5) {
          arcDone = true;
          const n = 5;
          for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            this.coinsArr.push({ lane, wx: wx - 2.2 + i * 1.1, y: .8 + Math.sin(t * Math.PI) * 1.05 });
          }
        }
      }
    }
    // 直线金币
    if (this.dist >= this.nextCoinDist) {
      this.nextCoinDist = this.dist + U.rand(D.coinGap[0], D.coinGap[1]) + this.speed * .4;
      const lane = U.randi(0, 2), n = U.randi(5, 9);
      const wx = this.spawnWx();
      for (let i = 0; i < n; i++) this.coinsArr.push({ lane, wx: wx + i * 2.1, y: .8 });
    }
    // 苹果
    if (this.dist >= this.nextAppleDist) {
      this.nextAppleDist = this.dist + U.rand(D.appleAt[0], D.appleAt[1]);
      this.applesArr.push({ lane: U.randi(0, 2), wx: this.spawnWx(), y: 1.05, bob: Math.random() * 6 });
    }
  },

  /* ───────── 主循环 ───────── */
  loop(t) {
    this.raf = requestAnimationFrame((tt) => this.loop(tt));
    if (!this.lastT) this.lastT = t;
    let dt = Math.min((t - this.lastT) / 1000, .05);
    this.lastT = t;
    if (this.state === "paused") return;
    this.time += dt;
    if (this.state === "menu") this.updatePreview(dt);
    else this.update(dt);
    this.render();
  },

  updatePreview(dt) {
    const D = DIFFS[this.cfg.diff];
    this.speed = D.base * .8;
    this.dist += this.speed * dt;
    this.runPhase += dt * this.speed * 1.5;
    this.laneF = U.lerp(this.laneF, 1, dt * 8);
    this.recycleProps();
    this.updateAmbient(dt);
  },

  update(dt) {
    const D = DIFFS[this.cfg.diff];
    if (this.state === "crashing") { this.updateCrash(dt); return; }
    if (this.state !== "playing") return;

    // 速度：基础+时间爬升，苹果加速
    const ramped = Math.min(D.base + this.time * D.ramp * 2, D.max);
    this.speed = ramped * (this.boostT > 0 ? 1.28 : 1);
    this.dist += this.speed * dt;

    // 苹果倒计时
    if (this.boostT > 0) this.boostT -= dt;
    Menu.updateBoost(this.boostT);

    // 玩家
    this.runPhase += dt * this.speed * 1.6;
    this.laneF = U.lerp(this.laneF, this.targetLane, Math.min(1, dt * 11));
    if (this.jumping) {
      this.vy -= GRAV * dt;
      this.py += this.vy * dt;
      if (this.py <= 0) {
        this.py = 0; this.jumping = false; this.vy = 0;
        this.spawnDust(8);
        if (this.jumpBufT > 0) { this.jumpBufT = 0; this.tryJump(); }
      }
    }
    this.jumpBufT = Math.max(0, this.jumpBufT - dt);
    if (this.sliding) {
      this.slideT -= dt;
      if (this.slideT <= 0) this.sliding = false;
      if (Math.random() < dt * 30) this.spawnDust(2);
    }

    this.spawnStuff();
    this.recycleEntities();
    this.recycleProps();
    this.checkCollisions();
    this.updateAmbient(dt);
    this.updateParticles(dt);
    Menu.updateHUD(this);
  },

  recycleEntities() {
    const back = this.dist - 4;
    this.obstacles = this.obstacles.filter(o => o.wx > back);
    this.coinsArr = this.coinsArr.filter(c => c.wx > back && !c.got);
    this.applesArr = this.applesArr.filter(a => a.wx > back && !a.got);
  },

  recycleProps() {
    const span = this.aheadMax() + 4;
    for (const p of this.props) {
      if (p.wx < this.dist - 2) {
        p.wx += span + U.rand(0, 5);
        p.kind = this.makeProp(p.lane, p.wx).kind;
        p.seed = U.randi(1, 9999);
      }
    }
  },

  updateCrash(dt) {
    this.crashT += dt;
    this.speed = Math.max(0, this.speed - dt * 16);
    this.dist += this.speed * dt;
    this.deadVy -= GRAV * .55 * dt;
    this.py = Math.max(0, this.py + this.deadVy * dt);
    this.deadX -= dt * 120;
    this.deadSpin += dt * 9;
    this.shakeT = Math.max(0, this.shakeT - dt);
    this.updateParticles(dt);
    if (this.crashT > 1.15) { this.state = "over"; Menu.showGameOver(this); }
  },

  checkCollisions() {
    const pTop = this.py + (this.sliding ? SLIDE_H : PLAYER_H);
    // 障碍
    for (const o of this.obstacles) {
      if (Math.abs(o.wx - this.dist) > .9) continue;
      if (Math.abs(this.laneF - o.lane) > .45) continue;
      if (o.type === "jump") {
        if (this.py < .92) { this.crash(o); return; }
      } else {
        if (pTop > 1.06) { this.crash(o); return; }
      }
    }
    // 金币
    for (const c of this.coinsArr) {
      if (c.got) continue;
      if (Math.abs(c.wx - this.dist) > 1.25) continue;
      if (Math.abs(this.laneF - c.lane) > .45) continue;
      if (Math.abs(c.y - (this.py + .75)) > .8) continue;
      c.got = true;
      this.collectCoin(c);
    }
    // 苹果
    for (const a of this.applesArr) {
      if (a.got) continue;
      if (Math.abs(a.wx - this.dist) > 1.3) continue;
      if (Math.abs(this.laneF - a.lane) > .5) continue;
      a.got = true;
      this.collectApple(a);
    }
  },

  collectCoin(c) {
    const val = this.boostT > 0 ? 10 : 1;
    this.score += val;
    this.coins++;
    const p = this.entScreen(c.lane, c.y, c.wx);
    this.popups.push({ x: p.x, y: p.y, t: 0, text: "+" + val, color: val > 1 ? "#FFE27A" : "#FFFFFF" });
    for (let i = 0; i < (val > 1 ? 12 : 6); i++)
      this.particles.push({ x: p.x, y: p.y, vx: U.rand(-90, 90), vy: U.rand(-140, 30), life: U.rand(.3, .6), t: 0, r: U.rand(1.5, 3.5), color: "#FFD24A", grav: 300 });
    val > 1 ? Sound.bigCoin() : Sound.coin(this.coins % 5);
  },

  collectApple(a) {
    this.apples++;
    this.boostT = Math.min(this.boostT + 10, 30);
    const p = this.entScreen(a.lane, a.y, a.wx);
    this.popups.push({ x: p.x, y: p.y - 10, t: 0, text: "加速！金币×10", color: "#FF9E6A", big: true });
    for (let i = 0; i < 18; i++)
      this.particles.push({ x: p.x, y: p.y, vx: U.rand(-140, 140), vy: U.rand(-180, 60), life: U.rand(.4, .8), t: 0, r: U.rand(2, 4), color: U.pick(["#FF6A3D", "#FFC03A", "#FFE27A"]), grav: 260 });
    Sound.apple();
    this.flashT = .25;
  },

  entScreen(lane, y, wx) {
    const u = this.unitOf(lane);
    return { x: this.screenXOf(wx, lane), y: ROW_BASE[lane] - y * u, u };
  },

  playerScreen() {
    const f = this.laneF;
    const i = U.clamp(Math.floor(f), 0, 1), fr = U.clamp(f - i, 0, 1);
    const rowY = U.lerp(ROW_BASE[i], ROW_BASE[i + 1], fr);
    const sc = U.lerp(ROW_SCALE[i], ROW_SCALE[i + 1], fr);
    return { x: this.playerX() + this.deadX, y: rowY, u: UNIT * sc };
  },

  crash(o) {
    this.state = "crashing";
    this.crashT = 0;
    this.deadVy = 7.5; this.deadSpin = 0; this.deadX = 0;
    this.shakeT = .55;
    this.flashT = .2;
    Sound.crash();
    Sound.stopMusic();
    const p = this.playerScreen();
    for (let i = 0; i < 26; i++)
      this.particles.push({ x: p.x, y: p.y - 60, vx: U.rand(-220, 220), vy: U.rand(-260, 40), life: U.rand(.4, .9), t: 0, r: U.rand(2, 5), color: U.pick(["#fff", "#FFE27A", "#FF9E6A", "#D8D8D8"]), grav: 420 });
  },

  spawnDust(n) {
    const p = this.playerScreen();
    for (let i = 0; i < n; i++)
      this.particles.push({ x: p.x + U.rand(-16, 10), y: p.y - U.rand(0, 8), vx: U.rand(-90, -20), vy: U.rand(-60, -10), life: U.rand(.3, .6), t: 0, r: U.rand(2, 5), color: "rgba(220,205,170,.8)", grav: -60 });
  },

  updateParticles(dt) {
    for (const p of this.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; }
    this.particles = this.particles.filter(p => p.t < p.life);
    for (const p of this.popups) { p.t += dt; p.y -= dt * 46; }
    this.popups = this.popups.filter(p => p.t < 1);
    this.flashT = Math.max(0, this.flashT - dt);
    // 苹果加速拖尾
    if (this.boostT > 0 && this.state === "playing" && Math.random() < dt * 42) {
      const p = this.playerScreen();
      this.particles.push({ x: p.x + U.rand(-10, 4), y: p.y - U.rand(20, 110), vx: U.rand(-160, -60), vy: U.rand(20, 60), life: U.rand(.25, .5), t: 0, r: U.rand(2, 4.5), color: U.pick(["#FFC03A", "#FFE27A", "#FF8A3D"]), grav: 0 });
    }
  },

  updateAmbient(dt) {
    if (!this.ambient.length) return;
    const bot = GH + this.yOff;
    for (const a of this.ambient) {
      a.x += a.vx * dt * (1 + this.speed / 8);
      a.y += a.vy * dt;
      a.rot += a.vr * dt;
      if (a.type === "snow" || a.type === "petal") a.x += Math.sin(a.y * .02 + a.rot) * 12 * dt;
      if (a.y > bot + 14 || a.x < -16) {
        Object.assign(a, this.newAmbientParticle(a.type, false));
      }
    }
  },

  /* ───────── 渲染 ───────── */
  render() {
    const ctx = this.ctx;
    this.applyCtx();
    const W = this.W, H = this.H;
    const T = this.track;
    SCROLL_W = W;

    ctx.save();
    if (this.shakeT > 0) {
      const a = this.shakeT * 26;
      ctx.translate(U.rand(-a, a), U.rand(-a, a));
    }

    /* 天空（竖屏时向上延伸） */
    const topY = -this.yOff;
    const sky = ctx.createLinearGradient(0, topY, 0, SKYLINE + 30);
    sky.addColorStop(0, T.skyTop); sky.addColorStop(1, T.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(-40, topY - 60, W + 80, SKYLINE - topY + 110);
    // 太阳（竖屏时利用上方扩展区）
    const sunY = Math.max(GH * .16, topY + 90);
    Draw.cir(ctx, W * .78, sunY, 40); ctx.fillStyle = T.sun; ctx.fill();
    ctx.save(); ctx.globalAlpha = .25;
    Draw.cir(ctx, W * .78, sunY, 58); ctx.fill(); ctx.restore();
    // 云（向左飘；竖屏时上移利用扩展区）
    const cloudY = Math.max(GH * .1, topY + 70);
    ctx.fillStyle = T.cloud; ctx.globalAlpha = .9;
    scroll(this.dist * 2.2, 430, (x) => {
      if (x < -120 || x > W + 120) return;
      Draw.ell(ctx, x, cloudY, 52, 15); ctx.fill();
      Draw.ell(ctx, x + 34, cloudY - 8, 34, 12); ctx.fill();
      Draw.ell(ctx, x - 30, cloudY - 5, 28, 10); ctx.fill();
    });
    ctx.globalAlpha = 1;

    /* 远景 / 中景（视差向左滚动） */
    T.drawFar(ctx, W, H, SKYLINE, this.dist * 5);
    T.drawMid(ctx, W, H, SKYLINE + 4, this.dist * 12);

    /* 山坡基底（向下延伸到可视底部） */
    const gr = ctx.createLinearGradient(0, SKYLINE, 0, GH + this.yOff);
    gr.addColorStop(0, T.groundDark); gr.addColorStop(1, T.ground);
    ctx.fillStyle = gr;
    ctx.fillRect(-40, SKYLINE, W + 80, this.viewH - SKYLINE + 60);

    /* 三条赛道（远->近） */
    const playerLane = Math.round(this.laneF);
    for (let lane = 0; lane < 3; lane++) {
      this.drawBand(ctx, lane);
      for (const p of this.props) if (p.lane === lane) this.drawProp(ctx, p);
      if (this.state !== "menu") {
        for (const o of this.obstacles) if (o.lane === lane) this.drawObstacle(ctx, o);
        for (const c of this.coinsArr) if (!c.got && c.lane === lane) this.drawCoin(ctx, c);
        for (const a of this.applesArr) if (!a.got && a.lane === lane) this.drawApple(ctx, a);
      }
      if (lane === playerLane && this.state !== "over") this.drawPlayer(ctx);
    }

    /* 地平线雾气 */
    const fog = ctx.createLinearGradient(0, SKYLINE - 26, 0, SKYLINE + 40);
    fog.addColorStop(0, `rgba(${T.fog},.8)`);
    fog.addColorStop(1, `rgba(${T.fog},0)`);
    ctx.fillStyle = fog;
    ctx.fillRect(-40, SKYLINE - 26, W + 80, 66);

    /* 环境粒子 */
    this.drawAmbient(ctx);

    /* 速度感线条（加速时） */
    if (this.boostT > 0 && this.state === "playing") this.drawSpeedLines(ctx, W, H);

    /* 粒子 & 飘字 */
    this.drawParticles(ctx);

    /* 苹果加速金边 */
    if (this.boostT > 0) {
      const vg = this.createRadialCompat(W / 2, GH / 2, this.viewH * .42, W / 2, GH / 2, this.viewH * .82);
      vg.addColorStop(0, "rgba(255,170,40,0)");
      vg.addColorStop(1, `rgba(255,150,30,${.22 + Math.sin(this.time * 8) * .06})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, topY - 60, W, this.viewH + 120);
    }

    /* 撞击白闪 */
    if (this.flashT > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashT * 2})`;
      ctx.fillRect(0, topY - 60, W, this.viewH + 120);
    }

    ctx.restore();
  },

  createRadialCompat(x0, y0, r0, x1, y1, r1) {
    return this.ctx.createRadialGradient(x0, y0, Math.max(1, r0), x1, y1, Math.max(1, r1));
  },

  /* 单条赛道的地面带 */
  drawBand(ctx, lane) {
    const T = this.track;
    const y = ROW_BASE[lane], h = ROW_BAND[lane];
    const lift = [26, 12, 0][lane]; // 远处颜色偏亮（空气透视）
    // 路面
    ctx.fillStyle = shade(T.road, lift);
    ctx.fillRect(-40, y, this.W + 80, h);
    // 路缘
    ctx.fillStyle = shade(T.roadEdge, lift);
    ctx.fillRect(-40, y, this.W + 80, Math.max(3, 4 * ROW_SCALE[lane]));
    ctx.fillStyle = "rgba(0,0,0,.08)";
    ctx.fillRect(-40, y + h - 3, this.W + 80, 3);
    // 滚动的刻度线（速度感）
    const u = this.unitOf(lane);
    const seg = 2.8;
    let wx = Math.floor((this.dist - 4) / seg) * seg;
    ctx.fillStyle = T.stripe;
    for (; ; wx += seg) {
      const sx = this.screenXOf(wx, lane);
      if (sx > this.W + 20) break;
      if (sx < -20) continue;
      const w = Math.max(2, .7 * u);
      ctx.fillRect(sx, y + h * .55, w, Math.max(2, .1 * u));
    }
  },

  drawProp(ctx, p) {
    const u = this.unitOf(p.lane);
    const sx = this.screenXOf(p.wx, p.lane);
    if (sx < -120 || sx > this.W + 120) return;
    ctx.save();
    ctx.globalAlpha = U.clamp((this.W + 40 - sx) / 60, 0, 1); // 右缘淡入
    ctx.translate(sx, ROW_BASE[p.lane]);
    ctx.fillStyle = "rgba(0,0,0,.14)";
    Draw.ell(ctx, 0, 2, .5 * u, .13 * u); ctx.fill();
    ctx.scale(u, u);
    this.track.drawProp(ctx, p.kind, p.seed);
    ctx.restore();
  },

  drawObstacle(ctx, o) {
    const u = this.unitOf(o.lane);
    const sx = this.screenXOf(o.wx, o.lane);
    ctx.save();
    ctx.globalAlpha = U.clamp((this.W + 40 - sx) / 60, 0, 1);
    ctx.translate(sx, ROW_BASE[o.lane]);
    ctx.fillStyle = "rgba(0,0,0,.18)";
    Draw.ell(ctx, 0, 2, .95 * u, .16 * u); ctx.fill();
    ctx.scale(u, u);
    this.track.drawObstacle(ctx, o.id, this.time);
    ctx.restore();
  },

  drawCoin(ctx, c) {
    const bob = Math.sin(this.time * 3 + c.wx) * .06;
    const p = this.entScreen(c.lane, c.y + bob, c.wx);
    const s = p.u, spin = Math.sin(this.time * 5 + c.wx * .5);
    ctx.save();
    ctx.translate(p.x, p.y);
    // 地面影子
    ctx.fillStyle = "rgba(0,0,0,.12)";
    Draw.ell(ctx, 0, ROW_BASE[c.lane] - p.y, .24 * s, .06 * s); ctx.fill();
    ctx.globalAlpha = U.clamp((this.W + 40 - p.x) / 60, 0, 1);
    // 金币本体
    ctx.scale(Math.abs(spin) * .75 + .25, 1);
    Draw.cir(ctx, 0, 0, .3 * s);
    const g = ctx.createLinearGradient(0, -.3 * s, 0, .3 * s);
    g.addColorStop(0, "#FFE590"); g.addColorStop(1, "#E89818");
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "#B87808"; ctx.lineWidth = Math.max(1, .04 * s); ctx.stroke();
    Draw.cir(ctx, 0, 0, .19 * s);
    ctx.strokeStyle = "#F5B82E"; ctx.lineWidth = Math.max(1, .045 * s); ctx.stroke();
    ctx.fillStyle = "#B87808";
    ctx.font = `bold ${.26 * s}px Baloo 2, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("¥", 0, .01 * s);
    ctx.restore();
  },

  drawApple(ctx, a) {
    const bob = Math.sin(this.time * 2.5 + a.bob) * .09;
    const p = this.entScreen(a.lane, a.y + bob, a.wx);
    const s = p.u;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = U.clamp((this.W + 40 - p.x) / 60, 0, 1);
    // 光晕
    ctx.save();
    const gl = .3 + Math.sin(this.time * 4 + a.bob) * .1;
    ctx.globalAlpha *= gl;
    Draw.cir(ctx, 0, 0, .52 * s); ctx.fillStyle = "#FFDF8F"; ctx.fill();
    ctx.restore();
    Draw.cir(ctx, 0, 0, .3 * s);
    const g = ctx.createRadialGradient(-.1 * s, -.12 * s, .04 * s, 0, 0, .34 * s);
    g.addColorStop(0, "#FF8A70"); g.addColorStop(.55, "#F03A28"); g.addColorStop(1, "#C02418");
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "#A01A10"; ctx.lineWidth = Math.max(1, .03 * s); ctx.stroke();
    ctx.strokeStyle = "#7A4A22"; ctx.lineWidth = Math.max(1, .05 * s); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -.28 * s); ctx.quadraticCurveTo(.03 * s, -.4 * s, .1 * s, -.44 * s); ctx.stroke();
    Draw.ell(ctx, .14 * s, -.42 * s, .11 * s, .055 * s, -.5);
    ctx.fillStyle = "#5E9A4A"; ctx.fill();
    ctx.restore();
  },

  drawPlayer(ctx) {
    const p = this.playerScreen();
    const ch = this.char;
    ctx.save();
    ctx.translate(p.x, p.y);
    // 影子（跳起时缩小）
    const shScale = 1 - Math.min(this.py * .3, .55);
    ctx.fillStyle = "rgba(0,0,0,.22)";
    Draw.ell(ctx, 0, 2, .52 * p.u * shScale, .13 * p.u * shScale); ctx.fill();

    ctx.translate(0, -this.py * p.u);
    if (this.state === "crashing") ctx.rotate(this.deadSpin);
    else ctx.rotate(.1); // 奔跑前倾
    ctx.scale(p.u, p.u);
    drawCharSide(ctx, ch, {
      hat: this.cfg.hat, cloth: this.cfg.cloth, shoes: this.cfg.shoes,
    }, {
      run: true, phase: this.runPhase,
      jumpT: this.jumping ? 1 : null,
      slide: this.sliding,
    });
    ctx.restore();
  },

  drawAmbient(ctx) {
    for (const a of this.ambient) {
      ctx.save();
      ctx.translate(a.x, a.y);
      if (a.type === "snow") {
        ctx.globalAlpha = .75;
        Draw.cir(ctx, 0, 0, a.r); ctx.fillStyle = "#fff"; ctx.fill();
      } else if (a.type === "leaf") {
        ctx.rotate(a.rot);
        ctx.globalAlpha = .6;
        Draw.ell(ctx, 0, 0, a.r * 1.6, a.r * .7); ctx.fillStyle = "#7EAE5E"; ctx.fill();
      } else if (a.type === "petal") {
        ctx.rotate(a.rot);
        ctx.globalAlpha = .7;
        Draw.ell(ctx, 0, 0, a.r * 1.3, a.r * .8); ctx.fillStyle = "#F5C5D8"; ctx.fill();
      } else if (a.type === "sand") {
        ctx.globalAlpha = .3;
        Draw.cir(ctx, 0, 0, a.r); ctx.fillStyle = "#E8C078"; ctx.fill();
      }
      ctx.restore();
    }
  },

  drawSpeedLines(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,235,180,.5)";
    ctx.lineWidth = 2;
    const span = this.viewH, top = -this.yOff;
    for (let i = 0; i < 8; i++) {
      const yy = top + (i / 8) * span + 20;
      const len = 36 + (i % 3) * 30;
      const xx = W - ((this.time * 1300 + i * 197) % (W + 260));
      ctx.globalAlpha = .25 + (i % 3) * .12;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + len, yy);
      ctx.stroke();
    }
    ctx.restore();
  },

  drawParticles(ctx) {
    for (const p of this.particles) {
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      Draw.cir(ctx, p.x, p.y, p.r * a + .4); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const p of this.popups) {
      const a = p.t < .7 ? 1 : 1 - (p.t - .7) / .3;
      ctx.globalAlpha = a;
      ctx.font = `bold ${p.big ? 26 : 19}px Baloo 2, sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(60,40,10,.6)"; ctx.lineWidth = 3.5;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  },

  /* ───────── 开始/结束 ───────── */
  start() {
    this.resetWorld(false);
    this.time = 0;
    this.state = "playing";
    this.lastT = 0;
    Menu.showHUD();
    Menu.updateHUD(this);
    Sound.init(); Sound.resume(); Sound.start();
    if (Sound.musicOn) Sound.startMusic();
    if ("vibrate" in navigator) { try { navigator.vibrate(12); } catch (e) { } }
  },

  retry() { this.start(); },
  toMenu() {
    this.state = "menu";
    this.resetWorld(true);
    Menu.showMenu();
    Sound.stopMusic();
  },
};

/* 测试钩子 */
window.NL = {
  game: Game, DIFFS, CHAR: () => Game.char, TRACK: () => Game.track,
  debugCrash() { if (Game.state === "playing") Game.crash(Game.obstacles[0] || {}); },
};
