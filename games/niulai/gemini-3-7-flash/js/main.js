/**
 * 《牛来跑酷》 - 主程序入口与UI交互控制器 (Main Controller)
 * 包含：DOM数据注入、更衣室实时换装预览、赛道/难度切换、HUD实时同步与事件调度
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素获取
  const gameCanvas = document.getElementById('game-canvas');
  const previewCanvas = document.getElementById('preview-canvas');

  // 模态遮罩层
  const menuOverlay = document.getElementById('menu-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const gameoverOverlay = document.getElementById('gameover-overlay');
  const gameHud = document.getElementById('game-hud');
  const touchControls = document.getElementById('touch-controls');

  // HUD 元素
  const hudAvatar = document.getElementById('hud-avatar');
  const hudCharName = document.getElementById('hud-char-name');
  const hudTrackBadge = document.getElementById('hud-track-badge');
  const hudScore = document.getElementById('hud-score');
  const hudCoins = document.getElementById('hud-coins');
  const hudDistance = document.getElementById('hud-distance');
  const hudFeverCard = document.getElementById('hud-fever-card');
  const feverTimerText = document.getElementById('fever-timer-text');
  const feverProgressFill = document.getElementById('fever-progress-fill');

  // 结算页元素
  const goFinalScore = document.getElementById('go-final-score');
  const goCoins = document.getElementById('go-coins');
  const goApples = document.getElementById('go-apples');
  const goDistance = document.getElementById('go-distance');
  const goBestScore = document.getElementById('go-best-score');
  const goNewRecord = document.getElementById('go-new-record');
  const goTip = document.getElementById('gameover-tip');

  // 换装与预览容器
  const previewRoleName = document.getElementById('preview-role-name');
  const wardrobeItemsContainer = document.getElementById('wardrobe-items-container');
  const charSelectContainer = document.getElementById('char-select-container');
  const trackSelectContainer = document.getElementById('track-select-container');
  const diffSelectContainer = document.getElementById('diff-select-container');

  // 当前用户选择状态
  let currentCharKey = 'niulai';
  let currentTrackKey = 'forest';
  let currentDiffKey = 'normal';
  let currentWardrobeTab = 'hat';
  let selectedWardrobe = {
    hat: GAME_CONFIG.WARDROBE.hats[0],
    suit: GAME_CONFIG.WARDROBE.suits[0],
    shoes: GAME_CONFIG.WARDROBE.shoes[0]
  };

  // 初始化游戏引擎
  const game = new ParkourGame(gameCanvas);
  const previewRenderer = new GameRenderer(previewCanvas.getContext('2d'));
  let previewFrameCount = 0;

  // 角标与提示元素
  const currentCharBadge = document.getElementById('current-char-badge');
  const currentTrackBadge = document.getElementById('current-track-badge');

  // 更衣间换装动效粒子
  let wardrobeFlashAlpha = 0;

  // =========================================================================
  // 1. 初始化换装、角色、赛道与难度列表
  // =========================================================================
  function initLobbyUI() {
    // 1.1 渲染 8 位角色卡片
    charSelectContainer.innerHTML = '';
    Object.values(GAME_CONFIG.CHARACTERS).forEach(char => {
      const card = document.createElement('div');
      card.className = `char-card ${char.id === currentCharKey ? 'selected' : ''}`;
      card.dataset.char = char.id;
      card.innerHTML = `
        <div class="char-avatar-box">${char.avatar}</div>
        <span class="char-name">${char.name}</span>
        <span class="char-desc-tag">${char.specialTrait}</span>
      `;
      card.addEventListener('click', () => {
        currentCharKey = char.id;
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        previewRoleName.textContent = `${char.title} · ${char.name}`;
        if (currentCharBadge) currentCharBadge.textContent = `${char.avatar} ${char.name}`;
        wardrobeFlashAlpha = 1.0; // 触发换装高光爆发
      });
      charSelectContainer.appendChild(card);
    });

    // 1.2 渲染 5 大赛道卡片
    trackSelectContainer.innerHTML = '';
    Object.values(GAME_CONFIG.TRACKS).forEach(track => {
      const card = document.createElement('div');
      card.className = `track-card ${track.id === currentTrackKey ? 'selected' : ''}`;
      card.dataset.track = track.id;
      card.innerHTML = `
        <span class="track-icon">${track.icon}</span>
        <span class="track-title">${track.name}</span>
        <span class="track-feature">${track.feature.split('·')[0]}</span>
      `;
      card.addEventListener('click', () => {
        currentTrackKey = track.id;
        document.querySelectorAll('.track-card').forEach(t => t.classList.remove('selected'));
        card.classList.add('selected');
        if (currentTrackBadge) currentTrackBadge.textContent = `${track.icon} ${track.name}`;
        // 实时更新底层主画布动态赛道背景
        game.setTrackPreview(currentTrackKey);
      });
      trackSelectContainer.appendChild(card);
    });

    // 1.3 难度切换绑定
    diffSelectContainer.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentDiffKey = btn.dataset.diff;
        diffSelectContainer.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 1.4 更衣室 Tab 切换绑定
    document.querySelectorAll('.wardrobe-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        currentWardrobeTab = tabBtn.dataset.tab;
        document.querySelectorAll('.wardrobe-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        renderWardrobeItems();
      });
    });

    renderWardrobeItems();
  }

  // 渲染换装物品网格 (每类6种)
  function renderWardrobeItems() {
    wardrobeItemsContainer.innerHTML = '';
    const items = currentWardrobeTab === 'hat' 
      ? GAME_CONFIG.WARDROBE.hats 
      : currentWardrobeTab === 'suit' 
      ? GAME_CONFIG.WARDROBE.suits 
      : GAME_CONFIG.WARDROBE.shoes;

    items.forEach(item => {
      const card = document.createElement('div');
      const isSelected = selectedWardrobe[currentWardrobeTab].id === item.id;
      card.className = `wardrobe-item-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="item-swatch" style="background: ${item.color || '#ff9800'}">${item.icon}</div>
        <span class="item-title">${item.name}</span>
      `;
      card.addEventListener('click', () => {
        selectedWardrobe[currentWardrobeTab] = item;
        wardrobeFlashAlpha = 0.9; // 触发换装高光爆发
        renderWardrobeItems();
      });
      wardrobeItemsContainer.appendChild(card);
    });
  }

  // =========================================================================
  // 2. 更衣室实时预览动画循环 (高品质 3D 霓虹舞台与换装光效)
  // =========================================================================
  function loopWardrobePreview() {
    previewFrameCount++;
    const ctx = previewCanvas.getContext('2d');
    const cw = previewCanvas.width;
    const ch = previewCanvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const cx = cw / 2;
    const cy = ch * 0.74;

    // 1. 绘制顶部深色聚光灯锥束
    const spotGrad = ctx.createRadialGradient(cx, 0, 10, cx, cy, cw * 0.65);
    spotGrad.addColorStop(0, 'rgba(255, 152, 0, 0.22)');
    spotGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.08)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 40, 0);
    ctx.lineTo(cx + 40, 0);
    ctx.lineTo(cw, ch);
    ctx.lineTo(0, ch);
    ctx.closePath();
    ctx.fill();

    // 2. 绘制炫彩发光地台 (双层发光光环)
    const ringPulse = Math.sin(previewFrameCount * 0.06) * 4;
    
    // 外层霓虹光晕
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, cw * 0.32 + ringPulse, ch * 0.09 + ringPulse * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 内部舞台高光地毯
    const stageGrad = ctx.createRadialGradient(cx, cy + 12, 5, cx, cy + 12, cw * 0.28);
    stageGrad.addColorStop(0, 'rgba(255, 152, 0, 0.35)');
    stageGrad.addColorStop(0.7, 'rgba(30, 41, 59, 0.8)');
    stageGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    ctx.fillStyle = stageGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, cw * 0.28, ch * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. 放大特写绘制角色与穿戴
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.4, 1.4); // 角色特写放大 1.4x，模型穿搭清晰震撼

    previewRenderer.drawCharacter(
      currentCharKey,
      0,
      0,
      { isJumping: false, isDucking: false },
      previewFrameCount,
      selectedWardrobe,
      false
    );
    ctx.restore();

    // 4. 换装光波爆发动效 (点击服饰/角色时扩散)
    if (wardrobeFlashAlpha > 0.02) {
      ctx.save();
      const flashRadius = (1 - wardrobeFlashAlpha) * (cw * 0.5);
      ctx.strokeStyle = `rgba(255, 215, 0, ${wardrobeFlashAlpha})`;
      ctx.lineWidth = 4 * wardrobeFlashAlpha;
      ctx.beginPath();
      ctx.arc(cx, cy - 35, flashRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${wardrobeFlashAlpha * 0.25})`;
      ctx.fill();
      ctx.restore();

      wardrobeFlashAlpha *= 0.88;
    }

    requestAnimationFrame(loopWardrobePreview);
  }

  // =========================================================================
  // 3. 游戏生命周期与 HUD 同步调度
  // =========================================================================
  game.onStateChange = (state, data) => {
    if (state === 'RUNNING') {
      menuOverlay.classList.add('hidden');
      pauseOverlay.classList.add('hidden');
      gameoverOverlay.classList.add('hidden');
      gameHud.classList.remove('hidden');

      // 更新 HUD 静态卡片
      const char = GAME_CONFIG.CHARACTERS[currentCharKey];
      const track = GAME_CONFIG.TRACKS[currentTrackKey];
      hudAvatar.textContent = char.avatar;
      hudCharName.textContent = char.name;
      hudTrackBadge.textContent = `${track.icon} ${track.name}`;

      // 检测是否为触控设备
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        touchControls.classList.remove('hidden');
      }
    } else if (state === 'PAUSED') {
      pauseOverlay.classList.remove('hidden');
      document.getElementById('pause-score').textContent = game.score;
      document.getElementById('pause-coins').textContent = game.coinsCount;
    } else if (state === 'GAMEOVER') {
      gameHud.classList.add('hidden');
      touchControls.classList.add('hidden');
      gameoverOverlay.classList.remove('hidden');

      // 填充结算数据
      goFinalScore.textContent = data.finalScore;
      goCoins.textContent = data.coins;
      goApples.textContent = data.apples;
      goDistance.textContent = `${data.distance} m`;
      goBestScore.textContent = data.bestScore;
      goTip.textContent = `在奔跑中撞到了【${data.hitObstacle || '障碍物'}】，再接再厉！`;

      if (data.isNewRecord) {
        goNewRecord.classList.remove('hidden');
      } else {
        goNewRecord.classList.add('hidden');
      }
    }
  };

  // HUD 实时循环刷新
  function syncHUD() {
    if (game.state === 'RUNNING') {
      hudScore.textContent = game.score;
      hudCoins.textContent = game.coinsCount;
      hudDistance.textContent = `${Math.floor(game.distance)} m`;

      if (game.isFever) {
        hudFeverCard.classList.add('active-fever');
        feverTimerText.textContent = `${game.feverTimer.toFixed(1)}s`;
        const pct = (game.feverTimer / GAME_CONFIG.APPLE_FEVER_DURATION) * 100;
        feverProgressFill.style.width = `${pct}%`;
      } else {
        hudFeverCard.classList.remove('active-fever');
        feverTimerText.textContent = '0.0s';
        feverProgressFill.style.width = '0%';
      }
    }
    requestAnimationFrame(syncHUD);
  }

  // =========================================================================
  // 4. 用户交互与输入绑定 (键盘 + 按钮 + 触屏)
  // =========================================================================
  // 开始按钮
  document.getElementById('btn-start-game').addEventListener('click', () => {
    window.gameAudio.init();
    game.setConfig(currentCharKey, currentTrackKey, currentDiffKey, selectedWardrobe);
    game.start();
  });

  // 结算页：直接再来一局
  document.getElementById('btn-restart-direct').addEventListener('click', () => {
    game.start();
  });

  // 结算页：返回大厅
  document.getElementById('btn-return-lobby').addEventListener('click', () => {
    gameoverOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
    game.state = 'IDLE';
    game.setTrackPreview(currentTrackKey);
    game.startLobbyLoop();
  });

  // 暂停控制
  document.getElementById('btn-hud-pause').addEventListener('click', () => {
    game.pause();
  });
  document.getElementById('btn-resume').addEventListener('click', () => {
    game.resume();
  });
  document.getElementById('btn-pause-restart').addEventListener('click', () => {
    pauseOverlay.classList.add('hidden');
    game.start();
  });
  document.getElementById('btn-pause-menu').addEventListener('click', () => {
    pauseOverlay.classList.add('hidden');
    gameHud.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
    game.state = 'IDLE';
    game.setTrackPreview(currentTrackKey);
    game.startLobbyLoop();
  });

  // 音效开关
  const btnHudAudio = document.getElementById('btn-hud-audio');
  btnHudAudio.addEventListener('click', () => {
    const isEnabled = window.gameAudio.toggleAudio();
    btnHudAudio.textContent = isEnabled ? '🔊' : '🔇';
  });

  // 键盘操作响应
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (game.state === 'RUNNING') {
        game.jump();
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      if (game.state === 'RUNNING') {
        game.duck();
      }
    } else if (e.code === 'KeyP') {
      if (game.state === 'RUNNING') game.pause();
      else if (game.state === 'PAUSED') game.resume();
    }
  });

  // 移动端触屏虚拟按键绑定
  const btnTouchJump = document.getElementById('touch-btn-jump');
  const btnTouchSlide = document.getElementById('touch-btn-slide');

  btnTouchJump.addEventListener('touchstart', (e) => {
    e.preventDefault();
    game.jump();
  });
  btnTouchSlide.addEventListener('touchstart', (e) => {
    e.preventDefault();
    game.duck();
  });

  // 触屏手势滑动支持 (向上滑跳跃，向下滑铲)
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (game.state !== 'RUNNING') return;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (deltaY < -30) {
      game.jump();
    } else if (deltaY > 30) {
      game.duck();
    }
  }, { passive: true });

  // 启动主逻辑
  initLobbyUI();
  loopWardrobePreview();
  syncHUD();
  game.setTrackPreview(currentTrackKey);
  game.startLobbyLoop();
});
