/* ═══════════════════════════════════════════════
   menu.js · 菜单 / HUD / 弹窗 交互
   ═══════════════════════════════════════════════ */
"use strict";

const $ = (id) => document.getElementById(id);

const Menu = {
  els: {}, previewT: 0, previewRaf: 0,

  init() {
    ["menu", "hud", "pause-ov", "over-ov", "help-ov", "btn-start", "btn-pause",
      "btn-resume", "btn-quit", "btn-retry", "btn-tomenu", "btn-help", "btn-help-close",
      "btn-music", "btn-sfx", "hud-score", "hud-coins", "hud-dist", "hud-speed",
      "boost-wrap", "boost-bar", "pv-char", "pv-name", "pv-desc", "pv-tags",
      "char-grid", "outfit-block", "track-grid", "diff-seg", "diff-desc",
      "best-line", "go-score", "go-coins", "go-dist", "go-apples", "go-new", "go-emoji", "go-title",
      "touch-pads", "toast"].forEach(id => this.els[id] = $(id));

    this.buildChars();
    this.buildOutfits();
    this.buildTracks();
    this.buildDiffs();
    this.bindButtons();
    this.refresh();
    this.previewLoop();
    if ("ontouchstart" in window) this.els["touch-pads"].classList.remove("hidden");
  },

  /* ───────── 构建 UI ───────── */
  buildChars() {
    const grid = this.els["char-grid"];
    grid.innerHTML = "";
    for (const ch of CHARS) {
      const cell = document.createElement("div");
      cell.className = "char-cell" + (ch.id === Game.cfg.char ? " sel" : "");
      cell.dataset.id = ch.id;
      const cv = document.createElement("canvas");
      cv.width = 116; cv.height = 116;
      renderCharToCanvas(cv, ch, {}, 0);
      cell.appendChild(cv);
      const nm = document.createElement("div");
      nm.className = "cc-name"; nm.textContent = ch.name;
      cell.appendChild(nm);
      cell.addEventListener("click", () => {
        Game.cfg.char = ch.id; Game.char = ch; Game.saveCfg();
        Sound.click();
        this.refresh();
      });
      grid.appendChild(cell);
    }
  },

  buildOutfits() {
    const block = this.els["outfit-block"];
    block.innerHTML = "";
    const cats = [["hat", "帽子", OUTFITS.hats], ["cloth", "衣服套装", OUTFITS.cloths], ["shoes", "鞋子", OUTFITS.shoes]];
    for (const [key, label, list] of cats) {
      const row = document.createElement("div");
      row.className = "outfit-row";
      const lab = document.createElement("div");
      lab.className = "outfit-row-label"; lab.textContent = label;
      row.appendChild(lab);
      const chips = document.createElement("div");
      chips.className = "outfit-chips";
      for (const it of list) {
        const chip = document.createElement("div");
        chip.className = "chip" + (it.id === Game.cfg[key] ? " sel" : "");
        chip.dataset.key = key; chip.dataset.val = it.id;
        const cv = document.createElement("canvas");
        cv.width = 80; cv.height = 80;
        Outfits.drawIcon(cv, key === "hat" ? "hat" : key === "cloth" ? "cloth" : "shoe", it.id);
        chip.appendChild(cv);
        const nm = document.createElement("div");
        nm.className = "chip-name"; nm.textContent = it.name;
        chip.appendChild(nm);
        chip.addEventListener("click", () => {
          Game.cfg[key] = it.id; Game.saveCfg();
          Sound.click();
          this.refresh();
        });
        chips.appendChild(chip);
      }
      row.appendChild(chips);
      block.appendChild(row);
    }
  },

  buildTracks() {
    const grid = this.els["track-grid"];
    grid.innerHTML = "";
    for (const t of TRACKS) {
      const cell = document.createElement("div");
      cell.className = "track-cell" + (t.id === Game.cfg.track ? " sel" : "");
      cell.dataset.id = t.id;
      const cv = document.createElement("canvas");
      cv.width = 170; cv.height = 104;
      drawTrackPreview(cv, t);
      cell.appendChild(cv);
      const nm = document.createElement("div");
      nm.className = "tc-name"; nm.textContent = t.name;
      cell.appendChild(nm);
      cell.addEventListener("click", () => {
        Game.cfg.track = t.id; Game.track = t; Game.saveCfg();
        Sound.click();
        this.refresh();
      });
      grid.appendChild(cell);
    }
  },

  buildDiffs() {
    const seg = this.els["diff-seg"];
    seg.innerHTML = "";
    for (const key of ["easy", "normal", "hard"]) {
      const b = document.createElement("button");
      b.className = "diff-btn" + (key === Game.cfg.diff ? " sel" : "");
      b.dataset.d = key;
      b.textContent = DIFFS[key].name;
      b.addEventListener("click", () => {
        Game.cfg.diff = key; Game.saveCfg();
        Sound.click();
        this.refresh();
      });
      seg.appendChild(b);
    }
  },

  /* 刷新所有选中态 + 预览 */
  refresh() {
    document.querySelectorAll(".char-cell").forEach(el =>
      el.classList.toggle("sel", el.dataset.id === Game.cfg.char));
    document.querySelectorAll(".chip").forEach(el =>
      el.classList.toggle("sel", el.dataset.val === Game.cfg[el.dataset.key]));
    document.querySelectorAll(".track-cell").forEach(el =>
      el.classList.toggle("sel", el.dataset.id === Game.cfg.track));
    document.querySelectorAll(".diff-btn").forEach(el =>
      el.classList.toggle("sel", el.dataset.d === Game.cfg.diff));
    this.els["diff-desc"].textContent = DIFFS[Game.cfg.diff].desc;
    // 预览面板
    this.els["pv-name"].textContent = Game.char.name;
    this.els["pv-desc"].textContent = Game.char.desc;
    const tags = [];
    tags.push(OUTFITS.hats.find(o => o.id === Game.cfg.hat)?.name);
    tags.push(OUTFITS.cloths.find(o => o.id === Game.cfg.cloth)?.name);
    tags.push(OUTFITS.shoes.find(o => o.id === Game.cfg.shoes)?.name);
    this.els["pv-tags"].innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join("");
    this.updateBest();
  },

  updateBest() {
    const best = localStorage.getItem("nlpk_best_" + Game.cfg.diff) || 0;
    this.els["best-line"].innerHTML =
      `最佳纪录（${DIFFS[Game.cfg.diff].name} · ${Game.track.name}）：<b>${U.fmt(+best)}</b>`;
  },

  /* ───────── 按钮 ───────── */
  bindButtons() {
    this.els["btn-start"].addEventListener("click", () => Game.start());
    this.els["btn-pause"].addEventListener("click", () => Game.pause());
    this.els["btn-resume"].addEventListener("click", () => Game.resume());
    this.els["btn-quit"].addEventListener("click", () => Game.toMenu());
    this.els["btn-retry"].addEventListener("click", () => Game.retry());
    this.els["btn-tomenu"].addEventListener("click", () => Game.toMenu());
    this.els["btn-help"].addEventListener("click", () => { this.show("help-ov"); Sound.click(); });
    this.els["btn-help-close"].addEventListener("click", () => { this.hide("help-ov"); Sound.click(); });
    this.els["btn-music"].addEventListener("click", () => {
      Sound.init(); Sound.musicOn = !Sound.musicOn;
      this.els["btn-music"].classList.toggle("off", !Sound.musicOn);
      if (Sound.musicOn && Game.state === "playing") Sound.startMusic(); else Sound.stopMusic();
      this.toast(Sound.musicOn ? "音乐已开启 ♪" : "音乐已关闭");
    });
    this.els["btn-sfx"].addEventListener("click", () => {
      Sound.init(); Sound.sfxOn = !Sound.sfxOn;
      this.els["btn-sfx"].classList.toggle("off", !Sound.sfxOn);
      this.toast(Sound.sfxOn ? "音效已开启 🔊" : "音效已关闭");
    });
    // 首次交互解锁音频
    const unlock = () => { Sound.init(); Sound.resume(); };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  },

  /* ───────── 显隐 ───────── */
  show(id) { this.els[id].classList.remove("hidden"); },
  hide(id) { this.els[id].classList.add("hidden"); },
  showMenu() {
    this.hideAll();
    this.show("menu");
    this.refresh();
  },
  hideAll() {
    ["menu", "hud", "pause-ov", "over-ov", "help-ov"].forEach(id => this.hide(id));
  },
  showHUD() {
    this.hideAll();
    this.show("hud");
  },
  showPause() { this.show("pause-ov"); },
  showGameOver(g) {
    this.hide("hud");
    const prev = +(localStorage.getItem("nlpk_best_" + g.cfg.diff) || 0);
    const isRecord = g.score > prev;
    if (isRecord) localStorage.setItem("nlpk_best_" + g.cfg.diff, g.score);
    this.els["go-score"].textContent = U.fmt(g.score);
    this.els["go-coins"].textContent = g.coins;
    this.els["go-dist"].textContent = Math.floor(g.dist) + "m";
    this.els["go-apples"].textContent = g.apples;
    this.els["go-new"].classList.toggle("hidden", !isRecord);
    const mood = U.pick(["哎哟，撞到了！", "差一点点！", "牛来摔了个跟头！", "再来一次准能行！", "就差一个金币！"]);
    this.els["go-title"].textContent = mood;
    this.els["go-emoji"].textContent = U.pick(["💫", "🌾", "🤕", "😵", "🐮"]);
    this.show("over-ov");
    if (isRecord) Sound.record();
  },

  /* ───────── HUD ───────── */
  updateHUD(g) {
    this.els["hud-score"].textContent = U.fmt(g.score);
    this.els["hud-coins"].textContent = g.coins;
    this.els["hud-dist"].textContent = Math.floor(g.dist) + " m";
    this.els["hud-speed"].textContent = "×" + (g.speed / DIFFS[g.cfg.diff].base).toFixed(1);
  },
  updateBoost(t) {
    if (t > 0) {
      this.els["boost-wrap"].classList.remove("hidden");
      this.els["boost-bar"].style.width = (U.clamp(t / 10, 0, 1) * 100) + "%";
    } else this.els["boost-wrap"].classList.add("hidden");
  },

  toast(msg) {
    const t = this.els["toast"];
    t.textContent = msg;
    t.classList.remove("hidden");
    t.style.animation = "none";
    void t.offsetWidth;
    t.style.animation = "";
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.add("hidden"), 2300);
  },

  /* 角色预览动画 */
  previewLoop() {
    const draw = () => {
      this.previewRaf = requestAnimationFrame(draw);
      if (this.els["menu"].classList.contains("hidden")) return;
      this.previewT += .016;
      const cv = this.els["pv-char"];
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, cv.width, cv.height);
      // 地面阴影
      const s = cv.height / 2.75 / Game.char.size;
      ctx.save();
      ctx.translate(cv.width / 2, cv.height * .94);
      ctx.fillStyle = "rgba(120,90,40,.18)";
      Draw.ell(ctx, 0, 2, 60, 12); ctx.fill();
      ctx.scale(s, s);
      drawCharFront(ctx, Game.char, {
        hat: Game.cfg.hat, cloth: Game.cfg.cloth, shoes: Game.cfg.shoes,
      }, { idleT: this.previewT });
      ctx.restore();
    };
    draw();
  },
};
