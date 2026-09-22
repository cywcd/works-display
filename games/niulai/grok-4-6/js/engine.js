const Engine = (() => {
  const GRAVITY = 2400;
  const JUMP = -780;
  const DOUBLE_JUMP = -700;
  const SLIDE_TIME = 0.55;
  const STAND_H = 70;
  const SLIDE_H = 22;

  let canvas;
  let ctx;
  let dpr = 1;
  let state = "menu";
  let last = 0;
  let time = 0;
  let shake = 0;

  const settings = {
    character: CHARACTERS[0],
    track: TRACKS[4],
    difficulty: DIFFICULTIES[1],
    gear: { hat: 0, suit: 0, shoe: 0 },
  };

  const player = {
    x: 180,
    y: 0,
    vy: 0,
    w: 54,
    h: 70,
    onGround: true,
    jumps: 2,
    sliding: false,
    slideHeld: false,
    slideLeft: 0,
    dead: false,
  };

  const world = {
    speed: 0,
    dist: 0,
    score: 0,
    coins: 0,
    appleStacks: 0,
    appleLeft: 0,
    objects: [],
    particles: [],
    spawnAt: 400,
    appleAt: 900,
    groundY: 0,
  };

  const callbacks = {};

  function W() {
    return canvas.width / dpr;
  }
  function H() {
    return canvas.height / dpr;
  }

  function camera() {
    const w = Math.max(1, W());
    const h = Math.max(1, H());
    const portrait = h > w * 1.08;
    const minViewW = portrait ? 1000 : 0;
    const viewW = Math.max(w, minViewW);
    const scale = w / viewW;
    const viewH = h / scale;
    return { w, h, viewW, viewH, scale, portrait };
  }

  function syncLayout() {
    const cam = camera();
    const nextGround = cam.viewH * 0.72;
    if (world.groundY) {
      const dy = nextGround - world.groundY;
      if (Math.abs(dy) > 0.5) {
        player.y += dy;
        world.objects.forEach((ob) => { ob.y += dy; });
        world.particles.forEach((p) => { p.y += dy; });
      }
    }
    world.groundY = nextGround;
    player.x = cam.portrait
      ? Math.round(cam.viewW * 0.12)
      : Math.min(180, Math.round(Math.max(140, cam.viewW * 0.14)));
  }

  function actorScale() {
    const cam = camera();
    const body = settings.character.body.scale;
    if (!cam.portrait || cam.scale >= 0.84) return body;
    return body * Math.min(1.58, 0.72 / cam.scale);
  }

  function hitbox() {
    if (player.sliding && player.onGround) {
      return { x: player.x - 30, y: player.y - SLIDE_H, w: 68, h: SLIDE_H };
    }
    return { x: player.x - 22, y: player.y - STAND_H, w: 46, h: STAND_H };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function resetRun() {
    syncLayout();
    player.y = world.groundY;
    player.vy = 0;
    player.onGround = true;
    player.jumps = 2;
    player.sliding = false;
    player.slideHeld = false;
    player.slideLeft = 0;
    player.dead = false;
    world.speed = settings.difficulty.speed;
    world.dist = 0;
    world.score = 0;
    world.coins = 0;
    world.appleStacks = 0;
    world.appleLeft = 0;
    world.objects = [];
    world.particles = [];
    world.spawnAt = settings.difficulty.introGap;
    world.appleAt = settings.difficulty.appleEvery[0];
    shake = 0;
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function makeObstacle(x) {
    const track = settings.track;
    const diff = settings.difficulty;
    const groundY = world.groundY;
    const roll = Math.random();

    if (roll < diff.pitChance) {
      return {
        type: "obstacle",
        kind: "pit",
        track: track.id,
        x,
        y: groundY,
        w: rand(diff.pitW[0], diff.pitW[1]),
        h: 24,
        mode: "pit",
      };
    }

    if (roll < diff.pitChance + diff.airChance) {
      const airKind = { forest: "vine", city: "sign", desert: "cactus", snow: "icicle", grass: "vine" }[track.id];
      const clearance = 58;
      const airH = 92;
      return {
        type: "obstacle",
        kind: airKind,
        track: track.id,
        x,
        y: groundY - clearance - airH,
        w: 56,
        h: airH,
        mode: "air",
      };
    }

    const groundKinds = track.obstacles.filter((k) => !["pit", "vine", "sign", "icicle"].includes(k));
    const kind = pick(groundKinds.length ? groundKinds : track.obstacles);
    const tall = Math.random() < diff.tallChance;
    const hRange = diff.groundH;
    return {
      type: "obstacle",
      kind,
      track: track.id,
      x,
      y: groundY,
      w: rand(36, tall ? 64 : 56),
      h: tall ? rand(hRange[1] * 0.85, hRange[1] + 8) : rand(hRange[0], hRange[1] * 0.78),
      mode: "ground",
    };
  }

  function spawnCluster(x) {
    if (Math.random() < settings.difficulty.obstacleChance) {
      world.objects.push(makeObstacle(x));
      if (Math.random() < settings.difficulty.comboChance) {
        const extra = makeObstacle(x + rand(108, 160));
        if (extra.mode !== world.objects[world.objects.length - 1].mode) world.objects.push(extra);
      }
      return;
    }
    const arc = Math.random() < 0.55;
    for (let i = 0; i < 5; i += 1) {
      const y = arc ? world.groundY - 42 - Math.sin((i / 4) * Math.PI) * 78 : world.groundY - 50;
      world.objects.push({ type: "coin", x: x + i * 36, y, r: 14 });
    }
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      world.particles.push({
        x, y,
        vx: rand(-80, 80),
        vy: rand(-180, -40),
        life: rand(0.3, 0.7),
        color,
      });
    }
  }

  function jump() {
    if (state !== "playing" || player.dead) return;
    AudioBus.unlock();
    if (player.sliding) {
      player.sliding = false;
      player.slideLeft = 0;
    }
    if (player.jumps > 0) {
      player.vy = player.onGround ? JUMP : DOUBLE_JUMP;
      player.onGround = false;
      player.jumps -= 1;
      AudioBus.jump();
    }
  }

  function slide(held) {
    if (held === false) {
      player.slideHeld = false;
      return;
    }
    if (state !== "playing" || player.dead) return;
    const wasSliding = player.sliding;
    player.slideHeld = true;
    player.sliding = true;
    player.slideLeft = SLIDE_TIME;
    if (!player.onGround) player.vy = Math.max(player.vy, 1100);
    if (!wasSliding) AudioBus.slide();
  }

  function die() {
    if (player.dead) return;
    player.dead = true;
    shake = 12;
    AudioBus.crash();
    AudioBus.stopMusic();
    burst(player.x, player.y - 20, "#e24a3b", 14);
    setTimeout(() => {
      state = "over";
      if (callbacks.onOver) callbacks.onOver(snapshot());
    }, 520);
  }

  function snapshot() {
    return {
      score: Math.floor(world.score),
      coins: world.coins,
      dist: Math.floor(world.dist / 8),
      character: settings.character,
      track: settings.track,
      difficulty: settings.difficulty,
    };
  }

  function start() {
    resetRun();
    state = "playing";
    AudioBus.unlock();
    AudioBus.startMusic();
    if (callbacks.onStart) callbacks.onStart(snapshot());
  }

  function pause() {
    if (state === "playing") {
      state = "paused";
      AudioBus.stopMusic();
    }
  }

  function resume() {
    if (state === "paused") {
      state = "playing";
      AudioBus.startMusic();
    }
  }

  function toMenu() {
    state = "menu";
    player.dead = false;
    player.sliding = false;
    player.slideHeld = false;
    AudioBus.stopMusic();
    if (callbacks.onMenu) callbacks.onMenu();
  }

  function applySettings(next) {
    Object.assign(settings, next);
    if (next.gear) settings.gear = { ...settings.gear, ...next.gear };
  }

  function update(dt) {
    time += dt;
    syncLayout();
    if (state === "menu") {
      world.dist += 80 * dt;
      return;
    }
    if (state !== "playing") {
      if (player.dead) {
        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;
      }
      world.particles.forEach((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 700 * dt;
      });
      world.particles = world.particles.filter((p) => p.life > 0);
      return;
    }

    const boost = world.appleLeft > 0 ? APPLE_SPEED : 1;
    const diff = settings.difficulty;
    world.speed = Math.min(world.speed + diff.accel * dt, diff.maxSpeed);
    const spd = world.speed * boost;
    world.dist += spd * dt;

    if (world.appleLeft > 0) {
      world.appleLeft -= dt;
      if (world.appleLeft <= 0) {
        world.appleLeft = 0;
        world.appleStacks = 0;
      }
    }

    if (!player.onGround) player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.y >= world.groundY) {
      player.y = world.groundY;
      player.vy = 0;
      if (!player.onGround) player.jumps = 2;
      player.onGround = true;
    }

    if (player.sliding && player.onGround && Math.random() < 0.65) {
      world.particles.push({
        x: player.x - rand(8, 28),
        y: player.y - rand(2, 10),
        vx: rand(-220, -60),
        vy: rand(-40, 20),
        life: rand(0.12, 0.28),
        color: settings.track.dirt,
      });
    }

    if (player.slideHeld && player.onGround && !player.dead) {
      player.sliding = true;
      player.slideLeft = Math.max(player.slideLeft, 0.12);
    } else if (player.sliding) {
      player.slideLeft -= dt;
      if (player.slideLeft <= 0 || !player.onGround) player.sliding = false;
    }

    world.spawnAt -= spd * dt;
    if (world.spawnAt <= 0) {
      spawnCluster(camera().viewW + 80);
      world.spawnAt = rand(settings.difficulty.gap[0], settings.difficulty.gap[1]);
    }

    world.appleAt -= spd * dt;
    if (world.appleAt <= 0) {
      world.objects.push({ type: "apple", x: camera().viewW + 100, y: world.groundY - 66, r: 16 });
      world.appleAt = rand(settings.difficulty.appleEvery[0], settings.difficulty.appleEvery[1]);
    }

    const box = hitbox();
    world.objects.forEach((ob) => {
      ob.x -= spd * dt;
      if (ob.type === "coin") {
        if (overlaps(box, { x: ob.x - ob.r, y: ob.y - ob.r, w: ob.r * 2, h: ob.r * 2 })) {
          ob.dead = true;
          const value = world.appleStacks > 0 ? APPLE_COIN_VALUE * world.appleStacks : 1;
          world.score += value;
          world.coins += 1;
          AudioBus.coin();
          burst(ob.x, ob.y, "#f0d24a", 6);
        }
      } else if (ob.type === "apple") {
        if (overlaps(box, { x: ob.x - ob.r, y: ob.y - ob.r, w: ob.r * 2, h: ob.r * 2 })) {
          ob.dead = true;
          world.appleStacks += 1;
          world.appleLeft += APPLE_DURATION;
          AudioBus.apple();
          burst(ob.x, ob.y, "#e24a3b", 10);
        }
      } else if (ob.type === "obstacle") {
        if (ob.mode === "pit") {
          const feet = { x: player.x - 10, y: player.y - 4, w: 20, h: 8 };
          if (player.onGround && overlaps(feet, { x: ob.x + 10, y: ob.y - 4, w: ob.w - 20, h: 10 })) die();
        } else {
          const obox = ob.mode === "air"
            ? { x: ob.x + 8, y: ob.y, w: ob.w - 16, h: ob.h - 6 }
            : { x: ob.x + 6, y: ob.y - ob.h, w: ob.w - 12, h: ob.h };
          if (overlaps(box, obox)) die();
        }
      }
    });
    world.objects = world.objects.filter((ob) => !ob.dead && ob.x > -160);

    world.particles.forEach((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 700 * dt;
    });
    world.particles = world.particles.filter((p) => p.life > 0);

    if (callbacks.onHud) callbacks.onHud(snapshot(), world);
    if (shake > 0) shake -= dt * 30;
  }

  function draw() {
    const cam = camera();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cam.w, cam.h);
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    ctx.scale(cam.scale, cam.scale);

    Sprites.drawBackground(ctx, cam.viewW, cam.viewH, settings.track, world.dist, time);

    world.objects.forEach((ob) => {
      if (ob.type === "coin") Sprites.drawCoin(ctx, ob.x, ob.y, time);
      else if (ob.type === "apple") Sprites.drawApple(ctx, ob.x, ob.y, time);
      else Sprites.drawObstacle(ctx, ob);
    });

    world.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    if (player.sliding && player.onGround) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,248,230,0.45)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        const y = player.y - 8 - i * 7;
        ctx.beginPath();
        ctx.moveTo(player.x - 18 - i * 10, y);
        ctx.lineTo(player.x - 42 - i * 16, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    const glow = world.appleLeft > 0;
    if (glow) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(time * 10) * 0.1;
      ctx.fillStyle = "#f0d24a";
      ctx.beginPath();
      ctx.arc(player.x, player.y - (player.sliding ? 14 : 28), player.sliding ? 34 : 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const scale = actorScale();
    Sprites.drawCharacter(
      ctx,
      settings.character,
      player.x,
      player.y,
      scale,
      time,
      { air: !player.onGround, sliding: player.sliding, dead: player.dead },
      settings.gear
    );

    ctx.restore();
  }

  function loop(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
    last = ts;
    syncLayout();
    if (state === "menu") {
      player.y = world.groundY;
      player.onGround = true;
    }
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth || window.innerWidth || 1280;
    const h = rect.height || canvas.clientHeight || window.innerHeight || 720;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    syncLayout();
  }

  function drawPreview(target, char, gear, t) {
    const c = target.getContext("2d");
    const pw = target.width;
    const ph = target.height;
    c.clearRect(0, 0, pw, ph);
    Sprites.drawBackground(c, pw, ph, settings.track, (t || 0) * 40, t || 0);
    Sprites.drawCharacter(c, char, pw * 0.52, ph * 0.74, 2.1, t || 0, { air: false, sliding: false }, gear);
  }

  function init(el, cbs) {
    canvas = el;
    ctx = canvas.getContext("2d");
    Object.assign(callbacks, cbs || {});
    resize();
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", () => setTimeout(resize, 80));
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resize);
    }
    resetRun();
    requestAnimationFrame(loop);
  }

  return {
    init,
    start,
    pause,
    resume,
    toMenu,
    jump,
    slide,
    applySettings,
    drawPreview,
    snapshot,
    settings,
    getState: () => state,
  };
})();
