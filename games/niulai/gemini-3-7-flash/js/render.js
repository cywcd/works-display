/**
 * 《牛来跑酷》 - 渲染引擎 (Render Engine)
 * 包含：8位角色与6x3换装服饰图元分层绘制、5大赛道多层视差滚动、专属障碍物、粒子天气与特效飘字
 */

class GameRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // =========================================================================
  // 1. 赛道视差背景渲染 (Parallax Backgrounds)
  // =========================================================================
  drawBackground(trackKey, scrollOffset, width, height, groundY) {
    const ctx = this.ctx;
    const track = GAME_CONFIG.TRACKS[trackKey] || GAME_CONFIG.TRACKS.forest;

    // 1.1 天空渐变
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, track.skyGradient[0]);
    skyGrad.addColorStop(0.5, track.skyGradient[1]);
    skyGrad.addColorStop(1, track.skyGradient[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 1.2 远景图层 (速度: 0.15)
    this.drawFarLayer(trackKey, scrollOffset * 0.15, width, groundY);

    // 1.3 中景图层 (速度: 0.4)
    this.drawMidLayer(trackKey, scrollOffset * 0.4, width, groundY);

    // 1.4 地面渲染与近景赛道 (速度: 1.0)
    this.drawGround(trackKey, scrollOffset, width, height, groundY);
  }

  // 远景层 (远山、摩天大楼天际线、巨型沙丘、雪峰)
  drawFarLayer(trackKey, offset, width, groundY) {
    const ctx = this.ctx;
    ctx.save();
    const patternWidth = 600;
    const startX = -(offset % patternWidth) - patternWidth;

    for (let x = startX; x < width + patternWidth; x += patternWidth) {
      if (trackKey === 'forest') {
        // 远景晨雾林峰
        ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 150, groundY - 180);
        ctx.lineTo(x + 320, groundY - 120);
        ctx.lineTo(x + 480, groundY - 210);
        ctx.lineTo(x + 600, groundY);
        ctx.fill();
      } else if (trackKey === 'city') {
        // 远景赛博摩天大楼天际线
        ctx.fillStyle = 'rgba(30, 27, 75, 0.6)';
        ctx.fillRect(x + 20, groundY - 240, 90, 240);
        ctx.fillRect(x + 140, groundY - 300, 110, 300);
        ctx.fillRect(x + 280, groundY - 200, 80, 200);
        ctx.fillRect(x + 390, groundY - 270, 120, 270);
        ctx.fillRect(x + 530, groundY - 190, 60, 190);
      } else if (trackKey === 'desert') {
        // 远景连绵沙丘与落日金轮
        ctx.fillStyle = 'rgba(194, 65, 12, 0.35)';
        ctx.beginPath();
        ctx.arc(width * 0.75, groundY - 200, 70, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(254, 215, 170, 0.5)';
        ctx.fill();

        ctx.fillStyle = 'rgba(154, 52, 18, 0.45)';
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.quadraticCurveTo(x + 180, groundY - 140, x + 350, groundY - 70);
        ctx.quadraticCurveTo(x + 480, groundY - 160, x + 600, groundY);
        ctx.fill();
      } else if (trackKey === 'snow') {
        // 远景冰封雪峰
        ctx.fillStyle = 'rgba(14, 116, 144, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 180, groundY - 260);
        ctx.lineTo(x + 360, groundY - 90);
        ctx.lineTo(x + 490, groundY - 240);
        ctx.lineTo(x + 600, groundY);
        ctx.fill();
      } else {
        // 草原蓝天白云与平缓山峦
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.quadraticCurveTo(x + 200, groundY - 130, x + 400, groundY - 60);
        ctx.quadraticCurveTo(x + 520, groundY - 110, x + 600, groundY);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 中景层 (树木、近处建筑、仙人掌丛、雪松、风车)
  drawMidLayer(trackKey, offset, width, groundY) {
    const ctx = this.ctx;
    ctx.save();
    const patternWidth = 400;
    const startX = -(offset % patternWidth) - patternWidth;

    for (let x = startX; x < width + patternWidth; x += patternWidth) {
      if (trackKey === 'forest') {
        // 中景古树
        ctx.fillStyle = '#065f46';
        ctx.fillRect(x + 60, groundY - 140, 22, 140);
        ctx.beginPath();
        ctx.arc(x + 71, groundY - 150, 48, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillRect(x + 260, groundY - 120, 18, 120);
        ctx.beginPath();
        ctx.arc(x + 269, groundY - 130, 40, 0, Math.PI * 2);
        ctx.fill();
      } else if (trackKey === 'city') {
        // 中景霓虹高楼与发光窗户
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x + 40, groundY - 180, 80, 180);
        ctx.fillRect(x + 200, groundY - 150, 100, 150);
        // 窗格荧光
        ctx.fillStyle = '#00e5ff';
        for (let r = 0; r < 4; r++) {
          ctx.fillRect(x + 55, groundY - 160 + r * 30, 12, 14);
          ctx.fillRect(x + 85, groundY - 160 + r * 30, 12, 14);
        }
      } else if (trackKey === 'desert') {
        // 中景枯木与石柱
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(x + 80, groundY - 90, 14, 90);
        ctx.fillRect(x + 65, groundY - 70, 44, 10);
        ctx.fillRect(x + 260, groundY - 110, 20, 110);
      } else if (trackKey === 'snow') {
        // 中景雪松
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(x + 90, groundY - 140);
        ctx.lineTo(x + 50, groundY);
        ctx.lineTo(x + 130, groundY);
        ctx.fill();
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(x + 90, groundY - 140);
        ctx.lineTo(x + 70, groundY - 90);
        ctx.lineTo(x + 110, groundY - 90);
        ctx.fill();
      } else {
        // 中景农场风车与草坡
        ctx.fillStyle = '#4d7c0f';
        ctx.beginPath();
        ctx.arc(x + 160, groundY + 120, 160, Math.PI, 0);
        ctx.fill();
        // 小风车柱
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x + 155, groundY - 70, 10, 70);
      }
    }
    ctx.restore();
  }

  // 1.5 地面绘制与跑道线条
  drawGround(trackKey, scrollOffset, width, height, groundY) {
    const ctx = this.ctx;
    const track = GAME_CONFIG.TRACKS[trackKey] || GAME_CONFIG.TRACKS.forest;

    // 地面渐变填充
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, track.groundGradient[0]);
    groundGrad.addColorStop(0.3, track.groundGradient[1]);
    groundGrad.addColorStop(1, track.groundGradient[2]);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // 地表发光跑道顶边线
    ctx.strokeStyle = track.particleColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // 动态跑道纹理网格（跑酷向右疾驰感）
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    const dashStep = 80;
    const dashOffset = scrollOffset % dashStep;
    for (let dx = -dashOffset; dx < width; dx += dashStep) {
      ctx.beginPath();
      ctx.moveTo(dx, groundY);
      ctx.lineTo(dx - 30, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // 2. 8大角色分层与骨骼动画渲染
  // =========================================================================
  drawCharacter(charKey, x, y, state, frameCount, wardrobe = {}, isFever = false) {
    const ctx = this.ctx;
    const char = GAME_CONFIG.CHARACTERS[charKey] || GAME_CONFIG.CHARACTERS.niulai;
    const isJumping = state.isJumping;
    const isDucking = state.isDucking;
    const scale = char.scale || 1.0;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 狂热冲刺加速拖尾光环特效
    if (isFever) {
      this.drawFeverAura(frameCount);
    }

    // 跑步上下起伏晃动计算 (仅在着地奔跑时)
    let bounceY = 0;
    let legAngle = 0;
    if (!isJumping && !isDucking) {
      bounceY = Math.sin(frameCount * 0.35) * 4;
      legAngle = Math.sin(frameCount * 0.35) * 0.55;
    } else if (isDucking) {
      bounceY = 22; // 滑铲贴地
    } else if (isJumping) {
      bounceY = -6;
    }

    // 根据不同物种特征分派渲染
    switch (char.species) {
      case 'bird':
        this.renderBird(char, bounceY, isJumping, isDucking, frameCount, wardrobe);
        break;
      case 'snake':
        this.renderSnake(char, bounceY, isJumping, isDucking, frameCount, wardrobe);
        break;
      case 'leopard':
        this.renderLeopard(char, bounceY, isJumping, isDucking, legAngle, wardrobe);
        break;
      case 'wolf':
        this.renderWolf(char, bounceY, isJumping, isDucking, legAngle, wardrobe);
        break;
      case 'cow':
      case 'calf':
      case 'calf_friend':
      case 'bull_leader':
      default:
        this.renderBovine(char, bounceY, isJumping, isDucking, legAngle, wardrobe);
        break;
    }

    ctx.restore();
  }

  // 狂热冲刺拖尾流光
  drawFeverAura(frameCount) {
    const ctx = this.ctx;
    ctx.save();
    const glowSize = 50 + Math.sin(frameCount * 0.4) * 10;
    const grad = ctx.createRadialGradient(0, -30, 10, 0, -30, glowSize);
    grad.addColorStop(0, 'rgba(255, 235, 59, 0.7)');
    grad.addColorStop(0.5, 'rgba(255, 87, 34, 0.4)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -30, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // 喷射粒子线
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const trailX = -25 - i * 18 - (frameCount * 4 % 15);
      const trailY = -20 + (i * 15) - bounceOffset(i, frameCount);
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(trailX - 35, trailY);
      ctx.stroke();
    }
    ctx.restore();

    function bounceOffset(idx, f) {
      return Math.sin(f * 0.5 + idx) * 8;
    }
  }

  // 2.1 牛族基础图元渲染 (牛来、牛妈妈、牛二、牛爸爸)
  renderBovine(char, bounceY, isJumping, isDucking, legAngle, wardrobe) {
    const ctx = this.ctx;

    // 滑铲姿态压缩
    if (isDucking) {
      ctx.save();
      ctx.scale(1.2, 0.6);
      ctx.translate(0, 25);
    }

    // 后腿
    this.drawLimb(ctx, -15, -15 + bounceY, -legAngle, char.primaryColor, wardrobe.shoes);
    this.drawLimb(ctx, 15, -15 + bounceY, legAngle, char.primaryColor, wardrobe.shoes);

    // 身体躯干 (椭圆壮硕)
    ctx.fillStyle = char.primaryColor;
    ctx.beginPath();
    ctx.ellipse(0, -38 + bounceY, 32, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // 角色特有斑纹
    ctx.fillStyle = char.secondaryColor;
    if (char.id === 'niumama') {
      // 奶牛黑白花斑
      ctx.beginPath();
      ctx.ellipse(-10, -42 + bounceY, 12, 10, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, -34 + bounceY, 10, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (char.id === 'niubaba') {
      // 首领雄壮金鬃毛
      ctx.beginPath();
      ctx.ellipse(-5, -45 + bounceY, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (char.id === 'niulai' || char.id === 'nier') {
      // 小牛腹部软白斑
      ctx.beginPath();
      ctx.ellipse(5, -34 + bounceY, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 衣服/战袍渲染层
    if (wardrobe.suit && wardrobe.suit.id !== 'suit_none') {
      this.drawSuit(ctx, 0, -38 + bounceY, 32, 24, wardrobe.suit);
    }

    // 前腿
    this.drawLimb(ctx, -8, -15 + bounceY, legAngle, char.primaryColor, wardrobe.shoes);
    this.drawLimb(ctx, 22, -15 + bounceY, -legAngle, char.primaryColor, wardrobe.shoes);

    // 头部 (向右前方抬起)
    const headX = 26;
    const headY = -54 + bounceY;

    // 头部轮廓
    ctx.fillStyle = char.primaryColor;
    ctx.beginPath();
    ctx.arc(headX, headY, 20, 0, Math.PI * 2);
    ctx.fill();

    // 萌嫩鼻吻
    ctx.fillStyle = char.muzzleColor;
    ctx.beginPath();
    ctx.ellipse(headX + 12, headY + 5, 12, 9, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // 鼻孔
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(headX + 16, headY + 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // 灵动大眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(headX + 6, headY - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = char.eyeColor;
    ctx.beginPath();
    ctx.arc(headX + 8, headY - 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // 眼神高光
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(headX + 9, headY - 5.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 耳朵
    ctx.fillStyle = char.primaryColor;
    ctx.beginPath();
    ctx.ellipse(headX - 12, headY - 6, 10, 5, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // 牛角 (牛爸爸巨角，牛来萌嫩小角)
    ctx.fillStyle = char.hornColor;
    if (char.id === 'niubaba') {
      // 首领雄伟威严弯角
      ctx.beginPath();
      ctx.moveTo(headX - 6, headY - 14);
      ctx.quadraticCurveTo(headX - 15, headY - 38, headX + 10, headY - 40);
      ctx.quadraticCurveTo(headX - 5, headY - 30, headX + 2, headY - 14);
      ctx.fill();
    } else {
      // 俏皮可爱小角
      ctx.beginPath();
      ctx.moveTo(headX - 4, headY - 14);
      ctx.lineTo(headX - 8, headY - 28);
      ctx.lineTo(headX + 4, headY - 15);
      ctx.fill();
    }

    // 帽子/头饰渲染层
    if (wardrobe.hat && wardrobe.hat.id !== 'hat_none') {
      this.drawHat(ctx, headX, headY, wardrobe.hat);
    }

    // 摇摆尾巴
    ctx.strokeStyle = char.primaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-28, -42 + bounceY);
    ctx.quadraticCurveTo(-42, -48 + bounceY + Math.sin(legAngle * 2) * 6, -38, -32 + bounceY);
    ctx.stroke();

    if (isDucking) {
      ctx.restore();
    }
  }

  // 2.2 云雀渲染 (轻灵飞羽)
  renderBird(char, bounceY, isJumping, isDucking, frameCount, wardrobe) {
    const ctx = this.ctx;
    const wingFlap = Math.sin(frameCount * 0.45) * 0.7;

    // 身体
    ctx.fillStyle = char.primaryColor;
    ctx.beginPath();
    ctx.ellipse(0, -35 + bounceY, 24, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 金黄羽毛腹部
    ctx.fillStyle = char.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(6, -30 + bounceY, 14, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 衣服
    if (wardrobe.suit && wardrobe.suit.id !== 'suit_none') {
      this.drawSuit(ctx, 0, -35 + bounceY, 24, 18, wardrobe.suit);
    }

    // 展翅飞羽
    ctx.fillStyle = char.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-5, -40 + bounceY);
    ctx.lineTo(-28, -60 + bounceY + wingFlap * 20);
    ctx.lineTo(15, -45 + bounceY);
    ctx.fill();

    // 鸟喙与眼睛
    const headX = 18;
    const headY = -48 + bounceY;
    ctx.fillStyle = char.primaryColor;
    ctx.beginPath();
    ctx.arc(headX, headY, 14, 0, Math.PI * 2);
    ctx.fill();

    // 尖喙
    ctx.fillStyle = char.muzzleColor;
    ctx.beginPath();
    ctx.moveTo(headX + 10, headY - 4);
    ctx.lineTo(headX + 26, headY + 2);
    ctx.lineTo(headX + 10, headY + 7);
    ctx.fill();

    // 亮眼
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(headX + 5, headY - 3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = char.eyeColor;
    ctx.beginPath();
    ctx.arc(headX + 7, headY - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 帽子
    if (wardrobe.hat && wardrobe.hat.id !== 'hat_none') {
      this.drawHat(ctx, headX, headY, wardrobe.hat);
    }

    // 细长小鸟腿 & 跑鞋
    this.drawLimb(ctx, -6, -20 + bounceY, wingFlap * 0.5, '#f97316', wardrobe.shoes);
    this.drawLimb(ctx, 8, -20 + bounceY, -wingFlap * 0.5, '#f97316', wardrobe.shoes);
  }

  // 2.3 蛇渲染 (贴地疾行)
  renderSnake(char, bounceY, isJumping, isDucking, frameCount, wardrobe) {
    const ctx = this.ctx;
    const slither = Math.sin(frameCount * 0.4) * 8;

    // 蛇形蜿蜒身躯
    ctx.strokeStyle = char.primaryColor;
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-35, -15 + bounceY + slither);
    ctx.quadraticCurveTo(-10, -35 + bounceY - slither, 15, -20 + bounceY + slither);
    ctx.stroke();

    // 蛇腹纹理
    ctx.strokeStyle = char.secondaryColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-32, -12 + bounceY + slither);
    ctx.quadraticCurveTo(-10, -30 + bounceY - slither, 12, -18 + bounceY + slither);
    ctx.stroke();

    // 衣服
    if (wardrobe.suit && wardrobe.suit.id !== 'suit_none') {
      this.drawSuit(ctx, -5, -24 + bounceY, 20, 14, wardrobe.suit);
    }

    // 蛇头
    const headX = 26;
    const headY = -34 + bounceY + slither * 0.5;
    ctx.fillStyle = char.primaryColor;
    ctx.beginPath();
    ctx.ellipse(headX, headY, 16, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 蛇信子
    ctx.strokeStyle = char.muzzleColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(headX + 14, headY);
    ctx.lineTo(headX + 24, headY);
    ctx.lineTo(headX + 29, headY - 3);
    ctx.moveTo(headX + 24, headY);
    ctx.lineTo(headX + 29, headY + 3);
    ctx.stroke();

    // 蛇眸
    ctx.fillStyle = char.eyeColor;
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(headX + 4, headY - 6, 1.5, 4.5);

    // 帽子与鞋靴
    if (wardrobe.hat && wardrobe.hat.id !== 'hat_none') {
      this.drawHat(ctx, headX, headY, wardrobe.hat);
    }
    if (wardrobe.shoes && wardrobe.shoes.id !== 'shoes_none') {
      this.drawShoes(ctx, -20, -6 + bounceY, wardrobe.shoes);
    }
  }

  // 2.4 豹拉渲染 (敏捷猎豹)
  renderLeopard(char, bounceY, isJumping, isDucking, legAngle, wardrobe) {
    const ctx = this.ctx;
    this.renderBovine(char, bounceY, isJumping, isDucking, legAngle, wardrobe);

    // 豹纹黑斑点缀
    ctx.fillStyle = char.secondaryColor;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-15 + i * 10, -42 + bounceY + (i % 2) * 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2.5 狼渲染 (野性灰狼)
  renderWolf(char, bounceY, isJumping, isDucking, legAngle, wardrobe) {
    const ctx = this.ctx;
    this.renderBovine(char, bounceY, isJumping, isDucking, legAngle, wardrobe);

    // 尖锐竖耳
    const headX = 26;
    const headY = -54 + bounceY;
    ctx.fillStyle = char.primaryColor;
    ctx.beginPath();
    ctx.moveTo(headX - 10, headY - 14);
    ctx.lineTo(headX - 6, headY - 32);
    ctx.lineTo(headX + 2, headY - 14);
    ctx.fill();
  }

  // 四肢与跑鞋通用绘制
  drawLimb(ctx, x, y, angle, limbColor, shoesConfig) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.strokeStyle = limbColor;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 22);
    ctx.stroke();

    // 绘制跑鞋
    if (shoesConfig && shoesConfig.id !== 'shoes_none') {
      this.drawShoes(ctx, 0, 22, shoesConfig);
    }

    ctx.restore();
  }

  // =========================================================================
  // 3. 跑酷专属服饰渲染 (帽子、战袍、跑鞋)
  // =========================================================================
  drawHat(ctx, headX, headY, hat) {
    ctx.save();
    ctx.fillStyle = hat.color;
    ctx.strokeStyle = '#ffffff';

    switch (hat.style) {
      case 'visor': // 动感遮阳帽
        ctx.beginPath();
        ctx.ellipse(headX + 4, headY - 14, 18, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(headX + 12, headY - 14);
        ctx.lineTo(headX + 30, headY - 9);
        ctx.lineTo(headX + 18, headY - 4);
        ctx.fill();
        break;

      case 'snapback': // 反戴街舞棒球帽
        ctx.beginPath();
        ctx.arc(headX, headY - 10, 16, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        // 反向鸭舌帽檐
        ctx.beginPath();
        ctx.moveTo(headX - 14, headY - 10);
        ctx.lineTo(headX - 28, headY - 6);
        ctx.lineTo(headX - 12, headY - 4);
        ctx.fill();
        break;

      case 'goggles': // 极速护目镜
        ctx.fillStyle = 'rgba(0, 229, 255, 0.75)';
        ctx.fillRect(headX - 6, headY - 8, 22, 9);
        ctx.strokeStyle = hat.color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(headX - 6, headY - 8, 22, 9);
        break;

      case 'headband': // 冠军金头带
        ctx.fillStyle = hat.color;
        ctx.fillRect(headX - 16, headY - 14, 32, 6);
        // 飘带
        ctx.beginPath();
        ctx.moveTo(headX - 16, headY - 14);
        ctx.lineTo(headX - 32, headY - 8);
        ctx.lineTo(headX - 16, headY - 8);
        ctx.fill();
        break;

      case 'halo': // 能量星环
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(headX, headY - 26, 20, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }
    ctx.restore();
  }

  drawSuit(ctx, x, y, width, height, suit) {
    ctx.save();
    ctx.fillStyle = suit.color;
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.9, height * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 衣服花纹与饰边
    ctx.strokeStyle = suit.patternColor || '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.5, y);
    ctx.lineTo(x + width * 0.5, y);
    ctx.stroke();
    ctx.restore();
  }

  drawShoes(ctx, x, y, shoes) {
    ctx.save();
    ctx.fillStyle = shoes.color;
    // 鞋身
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 2, 16, 8, [3, 6, 3, 3]);
    ctx.fill();

    // 气垫 / 鞋底
    ctx.fillStyle = shoes.soleColor || '#ffffff';
    ctx.fillRect(x - 4, y + 4, 16, 3);

    // 喷气战靴火焰特效
    if (shoes.style === 'lava' || shoes.style === 'hover') {
      ctx.fillStyle = shoes.style === 'lava' ? '#ff5722' : '#00e5ff';
      ctx.beginPath();
      ctx.arc(x + 4, y + 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // =========================================================================
  // 4. 障碍物渲染 (5大赛道专属障碍)
  // =========================================================================
  drawObstacle(obs, groundY) {
    const ctx = this.ctx;
    ctx.save();
    const x = obs.x;
    const y = groundY - obs.yOffset - obs.height;

    switch (obs.type) {
      // --- 森林障碍 ---
      case 'log': // 倒伏古木
        ctx.fillStyle = '#854d0e';
        ctx.beginPath();
        ctx.roundRect(x, y, obs.width, obs.height, 8);
        ctx.fill();
        // 年轮
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + obs.width - 10, y + obs.height / 2, 12, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'thorns': // 剧毒荆棘
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.moveTo(x + i * 14, y + obs.height);
          ctx.lineTo(x + i * 14 + 7, y);
          ctx.lineTo(x + i * 14 + 14, y + obs.height);
        }
        ctx.fill();
        break;

      case 'mushroom_high': // 悬空高位巨蘑菇
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x + obs.width / 2, y + 16, 28, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + obs.width / 2 - 10, y + 10, 5, 0, Math.PI * 2);
        ctx.arc(x + obs.width / 2 + 10, y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      // --- 城市障碍 ---
      case 'barrier': // 施工警示路障
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(x, y, obs.width, obs.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 10, y + 10, obs.width - 20, 10);
        ctx.fillRect(x + 10, y + 28, obs.width - 20, 10);
        break;

      case 'hydrant': // 消防栓
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(x + 6, y, obs.width - 12, obs.height);
        ctx.beginPath();
        ctx.arc(x + obs.width / 2, y, 14, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'signboard_high': // 悬空霓虹路牌
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, obs.width, obs.height);
        ctx.fillRect(x, y, obs.width, obs.height);
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('⚠ 极速', x + 15, y + 26);
        break;

      // --- 沙漠障碍 ---
      case 'cactus': // 仙人掌
        ctx.fillStyle = '#15803d';
        ctx.fillRect(x + 16, y, 18, obs.height);
        ctx.fillRect(x, y + 15, 16, 12);
        ctx.fillRect(x, y + 5, 10, 20);
        ctx.fillRect(x + 34, y + 22, 16, 12);
        ctx.fillRect(x + 40, y + 12, 10, 20);
        break;

      case 'quicksand': // 流沙尖石
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(x, y + obs.height);
        ctx.lineTo(x + 20, y);
        ctx.lineTo(x + 45, y + obs.height);
        ctx.lineTo(x + 65, y + 10);
        ctx.lineTo(x + obs.width, y + obs.height);
        ctx.fill();
        break;

      case 'vulture_high': // 秃鹰
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.ellipse(x + 35, y + 20, 30, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(x + 60, y + 18);
        ctx.lineTo(x + 75, y + 22);
        ctx.lineTo(x + 60, y + 26);
        ctx.fill();
        break;

      // --- 雪山障碍 ---
      case 'snowball': // 雪球
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + obs.width / 2, y + obs.height / 2, obs.width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'ice_spikes': // 冰刺
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          ctx.moveTo(x + i * 18, y + obs.height);
          ctx.lineTo(x + i * 18 + 9, y);
          ctx.lineTo(x + i * 18 + 18, y + obs.height);
        }
        ctx.fill();
        break;

      case 'icicle_high': // 倒挂冰锥
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + obs.width / 2, y + obs.height);
        ctx.lineTo(x + obs.width, y);
        ctx.fill();
        break;

      // --- 草原障碍 ---
      case 'fence': // 木栅栏
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + 4, y, 10, obs.height);
        ctx.fillRect(x + obs.width - 14, y, 10, obs.height);
        ctx.fillRect(x, y + 12, obs.width, 8);
        ctx.fillRect(x, y + 28, obs.width, 8);
        break;

      case 'haybale': // 草垛
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(x + obs.width / 2, y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      default:
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x, y, obs.width, obs.height);
        break;
    }

    ctx.restore();
  }

  // =========================================================================
  // 5. 金币与金苹果道具渲染
  // =========================================================================
  drawCoin(coin, frameCount) {
    const ctx = this.ctx;
    ctx.save();
    const spin = Math.cos(frameCount * 0.12 + coin.x * 0.05);
    const radius = 15;

    ctx.translate(coin.x, coin.y);
    ctx.scale(Math.abs(spin) < 0.1 ? 0.1 : spin, 1);

    // 金币主体
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 金币内环与璀璨流光
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // 币面字符 "¥" 或 "★"
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 1);

    ctx.restore();
  }

  drawApple(apple, frameCount) {
    const ctx = this.ctx;
    ctx.save();
    const pulse = 1 + Math.sin(frameCount * 0.2) * 0.12;

    ctx.translate(apple.x, apple.y);
    ctx.scale(pulse, pulse);

    // 苹果外圈金色辉光
    const haloGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 26);
    haloGrad.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    haloGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    // 纯金苹果本体
    const appleGrad = ctx.createLinearGradient(-12, -12, 12, 12);
    appleGrad.addColorStop(0, '#ffe082');
    appleGrad.addColorStop(0.5, '#ffb300');
    appleGrad.addColorStop(1, '#ff6f00');
    ctx.fillStyle = appleGrad;
    ctx.beginPath();
    ctx.arc(-7, -2, 11, 0, Math.PI * 2);
    ctx.arc(7, -2, 11, 0, Math.PI * 2);
    ctx.fill();

    // 苹果绿叶与果蒂
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.ellipse(3, -16, 7, 3.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(2, -15, 0, -18);
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // 6. 浮动飘字与粒子系统 (Score Popups & Weather Particles)
  // =========================================================================
  drawScorePopups(popups) {
    const ctx = this.ctx;
    ctx.save();
    for (const pop of popups) {
      ctx.fillStyle = pop.color || '#ffd700';
      ctx.font = `900 ${pop.size || 20}px "Fredoka", "Noto Sans SC", sans-serif`;
      ctx.globalAlpha = Math.max(0, pop.opacity);
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.restore();
  }

  drawParticles(particles) {
    const ctx = this.ctx;
    ctx.save();
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// 导出全局单例或类
window.GameRenderer = GameRenderer;
