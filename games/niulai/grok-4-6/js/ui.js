const UI = (() => {
  const els = {};
  const pick = {
    character: CHARACTERS[0],
    track: TRACKS[4],
    difficulty: DIFFICULTIES[1],
    gear: { hat: 0, suit: 0, shoe: 0 },
  };

  function $(id) {
    return document.getElementById(id);
  }

  function best() {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  }

  function saveBest(score) {
    if (score > best()) localStorage.setItem(STORAGE_KEY, String(score));
  }

  function syncEngine() {
    Engine.applySettings({
      character: pick.character,
      track: pick.track,
      difficulty: pick.difficulty,
      gear: pick.gear,
    });
  }

  function setActive(nodeList, el) {
    nodeList.forEach((n) => n.classList.toggle("active", n === el));
  }

  function renderCast() {
    const box = els.cast;
    box.innerHTML = "";
    CHARACTERS.forEach((ch) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cast-btn" + (ch.id === pick.character.id ? " active" : "");
      const cv = document.createElement("canvas");
      cv.width = 88;
      cv.height = 88;
      const label = document.createElement("div");
      label.innerHTML = `<strong>${ch.name}</strong><span>${ch.title}</span>`;
      btn.append(cv, label);
      btn.addEventListener("click", () => {
        pick.character = ch;
        box.querySelectorAll(".cast-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        refresh();
      });
      box.appendChild(btn);
      const g = cv.getContext("2d");
      g.fillStyle = "#efe0c0";
      g.fillRect(0, 0, 88, 88);
      Sprites.drawCharacter(g, ch, 44, 70, 1.02, 0.35, {}, { hat: 0, suit: 0, shoe: 0 });
    });
  }

  function thumbCanvas(cssW, cssH) {
    const cv = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.floor(cssW * dpr);
    cv.height = Math.floor(cssH * dpr);
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cv, g };
  }

  function swatches(row, items, key, nameEl) {
    row.innerHTML = "";
    items.forEach((item, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (pick.gear[key] === i ? " active" : "");
      b.title = item.name;
      const { cv, g } = thumbCanvas(88, 72);
      cv.className = "swatch-thumb";
      Sprites.drawGearThumb(g, key, i, 88, 72);
      b.appendChild(cv);
      b.addEventListener("click", () => {
        pick.gear[key] = i;
        row.querySelectorAll(".swatch").forEach((n) => n.classList.remove("active"));
        b.classList.add("active");
        refresh();
      });
      row.appendChild(b);
    });
    nameEl.textContent = items[pick.gear[key]].name;
  }

  function renderTracks() {
    els.tracks.innerHTML = "";
    TRACKS.forEach((tr) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "track-card" + (tr.id === pick.track.id ? " active" : "");
      b.title = tr.name;
      const { cv, g } = thumbCanvas(160, 78);
      cv.className = "track-thumb";
      Sprites.drawTrackThumb(g, tr, 160, 78);
      const meta = document.createElement("div");
      meta.className = "track-meta";
      meta.innerHTML = `<strong>${tr.name}</strong><span>${tr.motto}</span>`;
      b.append(cv, meta);
      b.addEventListener("click", () => {
        pick.track = tr;
        els.tracks.querySelectorAll(".track-card").forEach((n) => n.classList.remove("active"));
        b.classList.add("active");
        refresh();
      });
      els.tracks.appendChild(b);
    });
  }

  function renderDiff() {
    els.diff.innerHTML = "";
    DIFFICULTIES.forEach((d) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "diff-btn" + (d.id === pick.difficulty.id ? " active" : "");
      const desc = d.id === "easy"
        ? "慢速，障碍少，适合熟悉跳跃和滑铲"
        : d.id === "hard"
          ? "高速高密，坑和悬空障碍更多"
          : "速度与障碍适中，有少量连招";
      b.innerHTML = `<strong>${d.name}</strong><span>${desc}</span>`;
      b.addEventListener("click", () => {
        pick.difficulty = d;
        els.diff.querySelectorAll(".diff-btn").forEach((n) => n.classList.remove("active"));
        b.classList.add("active");
        refresh();
      });
      els.diff.appendChild(b);
    });
  }

  function refresh() {
    syncEngine();
    swatches(els.hats, HATS, "hat", els.hatName);
    swatches(els.suits, SUITS, "suit", els.suitName);
    swatches(els.shoes, SHOES, "shoe", els.shoeName);
    els.caption.textContent = `${pick.character.name} · ${pick.character.blurb}`;
    els.best.textContent = `最高纪录：${best()}`;
  }

  function show(id, on) {
    $(id).hidden = !on;
  }

  function onStart() {
    show("menu", false);
    show("over", false);
    show("pause", false);
    show("hud", true);
    show("touch", true);
    Engine.start();
  }

  function onMenu() {
    show("menu", true);
    show("over", false);
    show("pause", false);
    show("hud", false);
    show("touch", false);
    refresh();
    renderCast();
  }

  function onOver(snap) {
    saveBest(snap.score);
    show("hud", false);
    show("touch", false);
    show("pause", false);
    show("over", true);
    $("over-score").textContent = String(snap.score);
    $("over-meta").textContent = `金币 ${snap.coins} · ${snap.dist} 米 · ${snap.character.name} / ${snap.track.name} / ${snap.difficulty.name}`;
    $("over-best").textContent = `最高纪录：${best()}`;
  }

  function onHud(snap, world) {
    $("hud-score").textContent = String(snap.score);
    $("hud-meta").textContent = `金币 ${snap.coins} · ${snap.dist} 米`;
    $("hud-runinfo").textContent = `${snap.character.name} · ${snap.track.name} · ${snap.difficulty.name}`;
    const boost = $("hud-boost");
    if (world.appleLeft > 0) {
      boost.hidden = false;
      $("hud-boost-text").textContent = `苹果×${world.appleStacks}  每币${APPLE_COIN_VALUE * world.appleStacks}分  ${world.appleLeft.toFixed(1)}s`;
    } else {
      boost.hidden = true;
    }
  }

  function bind() {
    els.cast = $("cast-list");
    els.tracks = $("track-row");
    els.diff = $("diff-row");
    els.hats = $("hat-swatches");
    els.suits = $("suit-swatches");
    els.shoes = $("shoe-swatches");
    els.hatName = $("hat-name");
    els.suitName = $("suit-name");
    els.shoeName = $("shoe-name");
    els.caption = $("preview-caption");
    els.best = $("best-hint");

    $("btn-start").addEventListener("click", onStart);
    $("btn-retry").addEventListener("click", onStart);
    $("btn-over-menu").addEventListener("click", () => Engine.toMenu());
    $("btn-pause").addEventListener("click", () => {
      Engine.pause();
      show("pause", true);
    });
    $("btn-resume").addEventListener("click", () => {
      show("pause", false);
      Engine.resume();
    });
    $("btn-pause-menu").addEventListener("click", () => Engine.toMenu());
    $("btn-jump").addEventListener("pointerdown", (e) => { e.preventDefault(); Engine.jump(); });
    $("btn-slide").addEventListener("pointerdown", (e) => { e.preventDefault(); Engine.slide(true); });
    $("btn-slide").addEventListener("pointerup", (e) => { e.preventDefault(); Engine.slide(false); });
    $("btn-slide").addEventListener("pointerleave", () => Engine.slide(false));
    $("btn-slide").addEventListener("pointercancel", () => Engine.slide(false));

    window.addEventListener("keydown", (e) => {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        if (Engine.getState() === "menu") onStart();
        else Engine.jump();
      }
      if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        if (!e.repeat) Engine.slide(true);
      }
      if (e.code === "Enter" && Engine.getState() === "menu") onStart();
      if (e.code === "Escape") {
        if (Engine.getState() === "playing") {
          Engine.pause();
          Engine.slide(false);
          show("pause", true);
        } else if (Engine.getState() === "paused") {
          show("pause", false);
          Engine.resume();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        Engine.slide(false);
      }
    });

    $("game").addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      if (Engine.getState() === "playing") Engine.jump();
    });
  }

  function init() {
    bind();
    renderCast();
    renderTracks();
    renderDiff();
    refresh();
  }

  return { init, onMenu, onOver, onHud, pick };
})();
