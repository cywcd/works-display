/**
 * 《牛来跑酷》 - 游戏核心逻辑与物理引擎 (Game Engine)
 * 包含：物理跳跃与滑铲、障碍物与道具生成、精确碰撞检测、10秒苹果狂热加速、计分与最高分持久化
 */

class ParkourGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = new GameRenderer(this.ctx);

    // 基础状态
    this.state = 'IDLE'; // IDLE, RUNNING, PAUSED, GAMEOVER
    this.selectedChar = 'niulai';
    this.selectedTrack = 'forest';
    this.selectedDiff = 'normal';
    this.wardrobe = {
      hat: GAME_CONFIG.WARDROBE.hats[0],
      suit: GAME_CONFIG.WARDROBE.suits[0],
      shoes: GAME_CONFIG.WARDROBE.shoes[0]
    };

    // 玩家物理属性
    this.player = {
      x: 180,
      y: GAME_CONFIG.GROUND_Y,
      vy: 0,
      width: 58,
      height: 68,
      isJumping: false,
      isDucking: false,
      duckTimer: 0
    };

    // 赛道与动态对象集合
    this.scrollOffset = 0;
    this.currentSpeed = 7.5;
    this.obstacles = [];
    this.coins = [];
    this.apples = [];
    this.particles = [];
    this.popups = [];
    this.spawnTimer = 0;
    this.nextSpawnInterval = 120;

    // 苹果狂热冲刺状态 (10秒加速与10倍金币)
    this.feverTimer = 0;
    this.isFever = false;

    // 游戏统计数据
    this.score = 0;
    this.coinsCount = 0;
    this.applesCount = 0;
    this.distance = 0;
    this.frameCount = 0;
    this.bestScore = parseInt(localStorage.getItem('niulai_parkour_best') || '0', 10);

    // 动画帧句柄
    this.animationId = null;
    this.lobbyAnimationId = null;
    this.lastTime = 0;
    this.lobbyScrollOffset = 0;
    this.lobbyParticles = [];

    // 回调通知
    this.onStateChange = null;
  }

  // 设置角色、赛道、难度与穿搭
  setConfig(charKey, trackKey, diffKey, wardrobe) {
    this.selectedChar = charKey || this.selectedChar;
    this.selectedTrack = trackKey || this.selectedTrack;
    this.selectedDiff = diffKey || this.selectedDiff;
    if (wardrobe) {
      this.wardrobe = { ...this.wardrobe, ...wardrobe };
    }
  }

  // 大厅专属：设置并实时预览赛道背景
  setTrackPreview(trackKey) {
    this.selectedTrack = trackKey || this.selectedTrack;
    // 重新初始化大厅环境粒子
    this.initLobbyParticles();
  }

  // 初始化大厅赛道环境粒子
  initLobbyParticles() {
    this.lobbyParticles = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.lobbyParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: -(1.5 + Math.random() * 2.5),
        vy: (Math.random() - 0.5) * 1.5,
        size: 2 + Math.random() * 3.5,
        alpha: 0.3 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2
      });
    }
  }

  // 启动大厅动态赛道背景循环
  startLobbyLoop() {
    if (this.state === 'RUNNING') return;
    if (this.lobbyAnimationId) {
      cancelAnimationFrame(this.lobbyAnimationId);
    }
    this.initLobbyParticles();

    const loop = () => {
      if (this.state === 'RUNNING') {
        this.lobbyAnimationId = null;
        return;
      }

      this.lobbyScrollOffset += 3.2; // 动态平滑滚动速度
      const width = this.canvas.width;
      const height = this.canvas.height;
      const groundY = GAME_CONFIG.GROUND_Y;

      // 1. 绘制当前赛道视差背景与动态跑道
      this.renderer.drawBackground(this.selectedTrack, this.lobbyScrollOffset, width, height, groundY);

      // 2. 绘制与更新大厅环境微粒
      this.updateAndDrawLobbyParticles(width, height);

      this.lobbyAnimationId = requestAnimationFrame(loop);
    };

    this.lobbyAnimationId = requestAnimationFrame(loop);
  }

  // 停止大厅动态背景循环
  stopLobbyLoop() {
    if (this.lobbyAnimationId) {
      cancelAnimationFrame(this.lobbyAnimationId);
      this.lobbyAnimationId = null;
    }
  }

  // 更新与绘制大厅天气粒子
  updateAndDrawLobbyParticles(width, height) {
    const ctx = this.ctx;
    const track = GAME_CONFIG.TRACKS[this.selectedTrack] || GAME_CONFIG.TRACKS.forest;
    const particleColor = track.particleColor || '#ffffff';

    ctx.save();
    this.lobbyParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // 越界循环重置
      if (p.x < -20) {
        p.x = width + 20;
        p.y = Math.random() * height;
      }
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.fillStyle = particleColor;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // 开始新游戏
  start() {
    const diffConfig = GAME_CONFIG.DIFFICULTIES[this.selectedDiff] || GAME_CONFIG.DIFFICULTIES.normal;
    this.currentSpeed = diffConfig.baseSpeed;
    this.scrollOffset = 0;
    this.score = 0;
    this.coinsCount = 0;
    this.applesCount = 0;
    this.distance = 0;
    this.frameCount = 0;
    this.feverTimer = 0;
    this.isFever = false;

    this.obstacles = [];
    this.coins = [];
    this.apples = [];
    this.particles = [];
    this.popups = [];
    this.spawnTimer = 0;
    this.nextSpawnInterval = 90;

    const charConfig = GAME_CONFIG.CHARACTERS[this.selectedChar] || GAME_CONFIG.CHARACTERS.niulai;
    this.player.x = 180;
    this.player.y = GAME_CONFIG.GROUND_Y;
    this.player.vy = 0;
    this.player.isJumping = false;
    this.player.isDucking = false;
    this.player.duckTimer = 0;
    this.player.width = 56 * (charConfig.scale || 1.0);
    this.player.height = 66 * (charConfig.scale || 1.0);

    this.state = 'RUNNING';
    window.gameAudio.setFeverMode(false);
    window.gameAudio.startBGM();

    if (this.onStateChange) this.onStateChange(this.state, this);

    this.lastTime = performance.now();
    cancelAnimationFrame(this.animationId);
    this.loop = this.loop.bind(this);
    this.animationId = requestAnimationFrame(this.loop);
  }

  // 暂停与继续
  pause() {
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      window.gameAudio.stopBGM();
      if (this.onStateChange) this.onStateChange(this.state, this);
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'RUNNING';
      this.lastTime = performance.now();
      window.gameAudio.startBGM();
      if (this.onStateChange) this.onStateChange(this.state, this);
      this.animationId = requestAnimationFrame(this.loop);
    }
  }

  // 玩家控制：跳跃
  jump() {
    if (this.state !== 'RUNNING') return;
    if (!this.player.isJumping) {
      const char = GAME_CONFIG.CHARACTERS[this.selectedChar];
      const jumpBonus = (char && char.jumpBonus) ? char.jumpBonus : 1.0;
      this.player.vy = GAME_CONFIG.JUMP_FORCE * jumpBonus;
      this.player.isJumping = true;
      this.player.isDucking = false;
      window.gameAudio.playJump();

      // 跳跃扬尘粒子
      this.createGroundDust(this.player.x, GAME_CONFIG.GROUND_Y);
    }
  }

  // 玩家控制：滑铲
  duck() {
    if (this.state !== 'RUNNING') return;
    if (!this.player.isDucking) {
      this.player.isDucking = true;
      this.player.duckTimer = 34; // 约 0.55 秒滑铲时间
      if (this.player.isJumping) {
        // 空中快速下踩
        this.player.vy = 16;
      }
      window.gameAudio.playSlide();
    } else {
      // 延续滑铲时长
      this.player.duckTimer = 34;
    }
  }

  // 游戏主循环
  loop(timestamp) {
    if (this.state !== 'RUNNING') return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  }

  // =========================================================================
  // 核心状态更新 (Physics, Items, Spawning, Fever)
  // =========================================================================
  update(dt) {
    this.frameCount++;
    const diff = GAME_CONFIG.DIFFICULTIES[this.selectedDiff] || GAME_CONFIG.DIFFICULTIES.normal;

    // 1. 狂热冲刺加速计算 (金苹果 10秒狂热)
    if (this.isFever) {
      this.feverTimer -= dt;
      if (this.feverTimer <= 0) {
        this.isFever = false;
        this.feverTimer = 0;
        window.gameAudio.setFeverMode(false);
      }
    }

    // 基础速度根据难度平滑增长
    const baseSpeed = Math.min(diff.baseSpeed + this.distance * diff.speedGrowth, diff.maxSpeed);
    this.currentSpeed = this.isFever ? baseSpeed * GAME_CONFIG.APPLE_FEVER_SPEED_BOOST : baseSpeed;
    this.scrollOffset += this.currentSpeed;
    this.distance += this.currentSpeed * 0.05;

    // 2. 玩家垂直物理与重力
    if (this.player.isJumping) {
      this.player.vy += GAME_CONFIG.GRAVITY;
      this.player.y += this.player.vy;

      if (this.player.y >= GAME_CONFIG.GROUND_Y) {
        this.player.y = GAME_CONFIG.GROUND_Y;
        this.player.vy = 0;
        this.player.isJumping = false;
        this.createGroundDust(this.player.x, GAME_CONFIG.GROUND_Y);
      }
    }

    // 滑铲计时器更新
    if (this.player.isDucking) {
      this.player.duckTimer--;
      if (this.player.duckTimer <= 0) {
        this.player.isDucking = false;
      }
    }

    // 3. 障碍物与道具生成器
    this.spawnTimer++;
    if (this.spawnTimer >= this.nextSpawnInterval) {
      this.spawnTimer = 0;
      this.generateWave(diff);
    }

    // 4. 更新与清理障碍物
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.currentSpeed;

      // 碰撞检测
      if (this.checkCollision(this.player, obs)) {
        this.gameOver(obs);
        return;
      }

      if (obs.x + obs.width < -100) {
        this.obstacles.splice(i, 1);
      }
    }

    // 5. 更新金币拾取与移动
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= this.currentSpeed;

      // 磁吸效应 (牛二特性微增)
      const dist = Math.hypot(coin.x - this.player.x, coin.y - (this.player.y - 30));
      const pickupRadius = this.selectedChar === 'nier' ? 65 : 45;

      if (dist < pickupRadius) {
        // 吃金币得分：狂热状态 10分/枚，普通 1分/枚
        const coinPoints = this.isFever ? GAME_CONFIG.FEVER_COIN_MULTIPLIER : 1;
        this.score += coinPoints;
        this.coinsCount++;
        window.gameAudio.playCoin(this.isFever);

        // 生成拾取特效与飘字
        this.addPopup(coin.x, coin.y, `+${coinPoints}${this.isFever ? ' 🔥' : ''}`, this.isFever ? '#ffd700' : '#facc15', 22);
        this.createSparkles(coin.x, coin.y, '#ffd700', 8);

        this.coins.splice(i, 1);
        continue;
      }

      if (coin.x < -50) {
        this.coins.splice(i, 1);
      }
    }

    // 6. 更新金苹果拾取与移动
    for (let i = this.apples.length - 1; i >= 0; i--) {
      const apple = this.apples[i];
      apple.x -= this.currentSpeed;

      const dist = Math.hypot(apple.x - this.player.x, apple.y - (this.player.y - 30));
      if (dist < 52) {
        // 吃到金苹果，触发 10 秒狂热加速！
        this.isFever = true;
        this.feverTimer = GAME_CONFIG.APPLE_FEVER_DURATION;
        this.applesCount++;
        this.score += 50; // 苹果本身奖励50分

        window.gameAudio.playAppleFever();
        window.gameAudio.setFeverMode(true);

        this.addPopup(apple.x, apple.y - 20, '⚡ 10秒极速狂热 (10x金币) ⚡', '#00e5ff', 26);
        this.createSparkles(apple.x, apple.y, '#00e5ff', 25);

        this.apples.splice(i, 1);
        continue;
      }

      if (apple.x < -50) {
        this.apples.splice(i, 1);
      }
    }

    // 7. 更新浮动飘字与粒子
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.y -= 1.4;
      p.opacity -= 0.02;
      if (p.opacity <= 0) {
        this.popups.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx - this.currentSpeed * 0.3;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 环境天气粒子微尘生成
    if (this.frameCount % 4 === 0) {
      this.generateWeatherParticle();
    }
  }

  // =========================================================================
  // 障碍物与道具波次生成逻辑
  // =========================================================================
  generateWave(diff) {
    const track = GAME_CONFIG.TRACKS[this.selectedTrack] || GAME_CONFIG.TRACKS.forest;
    const hazards = track.hazards;
    const canvasW = GAME_CONFIG.CANVAS_WIDTH;

    // 随机挑选该赛道专属障碍物
    const hazardTemplate = hazards[Math.floor(Math.random() * hazards.length)];
    const obs = {
      ...hazardTemplate,
      x: canvasW + 40
    };
    this.obstacles.push(obs);

    // 在障碍物前后生成弧形金币群
    if (Math.random() < diff.coinGroupChance) {
      const coinCount = 5;
      const startX = canvasW + 160;
      for (let c = 0; c < coinCount; c++) {
        // 抛物线金币弧
        const coinX = startX + c * 38;
        const arcY = GAME_CONFIG.GROUND_Y - 50 - Math.sin((c / (coinCount - 1)) * Math.PI) * 75;
        this.coins.push({ x: coinX, y: arcY });
      }
    }

    // 随机生成金苹果狂热道具 (稀有强力道具)
    if (Math.random() < diff.appleSpawnChance && !this.isFever) {
      this.apples.push({
        x: canvasW + 360,
        y: GAME_CONFIG.GROUND_Y - 110
      });
    }

    // 动态计算下一个生成间隔
    this.nextSpawnInterval = Math.floor(
      Math.random() * (diff.obstacleIntervalMax - diff.obstacleIntervalMin) + diff.obstacleIntervalMin
    );
  }

  // =========================================================================
  // 精确碰撞检测 (AABB + 滑铲/跳跃高度自适应)
  // =========================================================================
  checkCollision(player, obs) {
    const groundY = GAME_CONFIG.GROUND_Y;
    const isDucking = player.isDucking;

    // 玩家实际包围盒 (根据滑铲形态动态收缩)
    const pWidth = player.width * 0.75;
    const pHeight = isDucking ? player.height * 0.45 : player.height * 0.85;
    const pLeft = player.x - pWidth / 2;
    const pRight = player.x + pWidth / 2;
    const pBottom = player.y;
    const pTop = player.y - pHeight;

    // 障碍物包围盒 (留出 6px 宽容度保证良好操作手感)
    const oLeft = obs.x + 4;
    const oRight = obs.x + obs.width - 4;
    const oBottom = groundY - obs.yOffset;
    const oTop = oBottom - obs.height + 4;

    // AABB 交叉检测
    return (
      pRight > oLeft &&
      pLeft < oRight &&
      pBottom > oTop &&
      pTop < oBottom
    );
  }

  // =========================================================================
  // 粒子与飘字特效
  // =========================================================================
  createGroundDust(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x - 15 + Math.random() * 30,
        y: y - 4,
        vx: -2 + Math.random() * -3,
        vy: -1 - Math.random() * 2,
        size: 3 + Math.random() * 3,
        color: 'rgba(255, 255, 255, 0.4)',
        life: 18,
        maxLife: 18
      });
    }
  }

  createSparkles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: color,
        life: 24,
        maxLife: 24
      });
    }
  }

  generateWeatherParticle() {
    const track = GAME_CONFIG.TRACKS[this.selectedTrack] || GAME_CONFIG.TRACKS.forest;
    this.particles.push({
      x: GAME_CONFIG.CANVAS_WIDTH + 20,
      y: Math.random() * GAME_CONFIG.GROUND_Y,
      vx: -2 - Math.random() * 3,
      vy: Math.sin(this.frameCount * 0.05) * 1.5,
      size: 2.5 + Math.random() * 3,
      color: track.particleColor || '#ffffff',
      life: 140,
      maxLife: 140
    });
  }

  addPopup(x, y, text, color = '#ffd700', size = 20) {
    this.popups.push({ x, y, text, color, size, opacity: 1.0 });
  }

  // =========================================================================
  // 游戏结束与最高分存储
  // =========================================================================
  gameOver(obs) {
    this.state = 'GAMEOVER';
    window.gameAudio.stopBGM();
    window.gameAudio.playHit();

    // 碰撞爆发特效
    this.createSparkles(this.player.x, this.player.y - 30, '#ef4444', 35);

    // 检查刷新最高分
    const finalScore = this.score + Math.floor(this.distance * 0.1);
    let isNewRecord = false;
    if (finalScore > this.bestScore) {
      this.bestScore = finalScore;
      localStorage.setItem('niulai_parkour_best', this.bestScore.toString());
      isNewRecord = true;
    }

    if (this.onStateChange) {
      this.onStateChange(this.state, {
        finalScore,
        coins: this.coinsCount,
        apples: this.applesCount,
        distance: Math.floor(this.distance),
        bestScore: this.bestScore,
        isNewRecord,
        hitObstacle: obs.name
      });
    }
  }

  // =========================================================================
  // 渲染画卷
  // =========================================================================
  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const groundY = GAME_CONFIG.GROUND_Y;

    // 1. 视差背景
    this.renderer.drawBackground(this.selectedTrack, this.scrollOffset, w, h, groundY);

    // 2. 障碍物
    for (const obs of this.obstacles) {
      this.renderer.drawObstacle(obs, groundY);
    }

    // 3. 金币
    for (const coin of this.coins) {
      this.renderer.drawCoin(coin, this.frameCount);
    }

    // 4. 金苹果
    for (const apple of this.apples) {
      this.renderer.drawApple(apple, this.frameCount);
    }

    // 5. 角色
    this.renderer.drawCharacter(
      this.selectedChar,
      this.player.x,
      this.player.y,
      this.player,
      this.frameCount,
      this.wardrobe,
      this.isFever
    );

    // 6. 天气粒子与特效
    this.renderer.drawParticles(this.particles);

    // 7. 浮动计分飘字
    this.renderer.drawScorePopups(this.popups);
  }
}

// 导出全局引擎
window.ParkourGame = ParkourGame;
