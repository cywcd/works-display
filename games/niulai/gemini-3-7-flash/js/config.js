/**
 * 《牛来跑酷》 - 全局配置与数据定义
 * 包含：8位角色设定、6x3套跑酷专属服饰、5大赛道场景参数、3档难度系数及障碍物生成规则
 */

const GAME_CONFIG = {
  // 画布基准分辨率
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  GROUND_Y: 570, // 地面水平基准线

  // 基础物理常量
  GRAVITY: 0.82,
  JUMP_FORCE: -17.5,
  DUCK_COLLIDER_HEIGHT_RATIO: 0.55, // 滑铲时碰撞体高度压缩比

  // 苹果狂热冲刺配置
  APPLE_FEVER_DURATION: 10.0, // 10秒狂热
  APPLE_FEVER_SPEED_BOOST: 1.45, // 速度提升45%
  FEVER_COIN_MULTIPLIER: 10, // 狂热期间10倍金币得分

  // 3档难度配置
  DIFFICULTIES: {
    easy: {
      id: 'easy',
      name: '简单',
      icon: '🌱',
      desc: '速度轻松 · 障碍较少',
      baseSpeed: 6.2,
      maxSpeed: 10.5,
      speedGrowth: 0.0003,
      obstacleIntervalMin: 140, // 生成间隔帧数
      obstacleIntervalMax: 220,
      appleSpawnChance: 0.28,
      coinGroupChance: 0.75
    },
    normal: {
      id: 'normal',
      name: '正常',
      icon: '🔥',
      desc: '节奏畅快 · 标准挑战',
      baseSpeed: 8.5,
      maxSpeed: 14.0,
      speedGrowth: 0.0006,
      obstacleIntervalMin: 95,
      obstacleIntervalMax: 160,
      appleSpawnChance: 0.20,
      coinGroupChance: 0.65
    },
    hard: {
      id: 'hard',
      name: '困难',
      icon: '⚡',
      desc: '极速狂飙 · 考验反应',
      baseSpeed: 11.2,
      maxSpeed: 18.0,
      speedGrowth: 0.0010,
      obstacleIntervalMin: 65,
      obstacleIntervalMax: 115,
      appleSpawnChance: 0.15,
      coinGroupChance: 0.55
    }
  },

  // 8位角色详细定义
  CHARACTERS: {
    niulai: {
      id: 'niulai',
      name: '牛来',
      title: '主角 · 小牛犊',
      avatar: '🐮',
      desc: '活泼勇敢的小牛犊，动作灵活，平衡性绝佳',
      species: 'calf',
      primaryColor: '#c88242', // 金棕毛色
      secondaryColor: '#ffffff', // 白斑纹
      muzzleColor: '#f9c5b2', // 粉嫩鼻吻
      hornColor: '#ffe082', // 萌嫩小金角
      eyeColor: '#1e293b',
      scale: 1.0,
      jumpBonus: 1.0,
      specialTrait: '均衡全能'
    },
    niumama: {
      id: 'niumama',
      name: '牛来妈妈',
      title: '温柔母爱 · 族群守护',
      avatar: '🐄',
      desc: '温柔慈爱的花斑奶牛妈妈，步伐平稳沉着',
      species: 'cow',
      primaryColor: '#f8fafc', // 奶白色
      secondaryColor: '#1e293b', // 经典黑斑
      muzzleColor: '#fecdd3',
      hornColor: '#e2e8f0',
      eyeColor: '#0f172a',
      scale: 1.15,
      jumpBonus: 0.95,
      specialTrait: '稳定沉着'
    },
    yunque: {
      id: 'yunque',
      name: '云雀',
      title: '天际信使 · 飞羽精灵',
      avatar: '🐦',
      desc: '展翅飞翔的灵巧云雀，滞空滑翔时间更长',
      species: 'bird',
      primaryColor: '#38bdf8', // 蔚蓝飞羽
      secondaryColor: '#fef08a', // 金羽点缀
      muzzleColor: '#f97316', // 橙黄小喙
      hornColor: '#0284c7', // 冠羽
      eyeColor: '#0c4a6e',
      scale: 0.85,
      jumpBonus: 1.15,
      specialTrait: '轻盈滞空'
    },
    she: {
      id: 'she',
      name: '蛇',
      title: '灵蛇潜行 · 贴地疾驰',
      avatar: '🐍',
      desc: '柔韧迅捷的灵蛇，身形修长，滑铲判定极佳',
      species: 'snake',
      primaryColor: '#10b981', // 翡翠翠绿
      secondaryColor: '#a7f3d0', // 腹部浅青
      muzzleColor: '#ef4444', // 红芯
      hornColor: '#047857',
      eyeColor: '#fbbf24',
      scale: 0.9,
      jumpBonus: 1.05,
      specialTrait: '极速滑铲'
    },
    baola: {
      id: 'baola',
      name: '豹拉',
      title: '小猎豹 · 牛来的死党',
      avatar: '🐆',
      desc: '身手敏捷的小豹子，金黄猎豹斑点，爆发力惊人',
      species: 'leopard',
      primaryColor: '#f59e0b', // 金黄猎豹色
      secondaryColor: '#78350f', // 豹纹黑斑
      muzzleColor: '#fed7aa',
      hornColor: '#d97706',
      eyeColor: '#15803d',
      scale: 0.95,
      jumpBonus: 1.1,
      specialTrait: '起步爆发'
    },
    lang: {
      id: 'lang',
      name: '狼',
      title: '荒原孤狼 · 狂野劲敌',
      avatar: '🐺',
      desc: '袭击牛群的反派头目，眼神凌厉，狂野霸气',
      species: 'wolf',
      primaryColor: '#475569', // 灰蓝深狼毛
      secondaryColor: '#94a3b8', // 银白胸毛
      muzzleColor: '#334155',
      hornColor: '#1e293b',
      eyeColor: '#ef4444', // 凶悍红眸
      scale: 1.08,
      jumpBonus: 1.02,
      specialTrait: '狂野气场'
    },
    nier: {
      id: 'nier',
      name: '牛二',
      title: '同龄玩伴 · 憨厚小牛',
      avatar: '🐂',
      desc: '牛来的童年伙伴，憨厚可爱，对金币有敏锐感知',
      species: 'calf_friend',
      primaryColor: '#854d0e', // 浓郁赭石色
      secondaryColor: '#fef08a', // 额前小黄星
      muzzleColor: '#fed7aa',
      hornColor: '#fbbf24',
      eyeColor: '#1e293b',
      scale: 1.02,
      jumpBonus: 0.98,
      specialTrait: '财运亨通'
    },
    niubaba: {
      id: 'niubaba',
      name: '牛爸爸',
      title: '族群首领 · 威严如山',
      avatar: '👑',
      desc: '牛来的父亲，牛家族群首领，雄浑壮硕，威震群山',
      species: 'bull_leader',
      primaryColor: '#3b2f2f', // 深褐黑高原毛色
      secondaryColor: '#d97706', // 威严金领毛
      muzzleColor: '#a8a29e',
      hornColor: '#f8fafc', // 巨大白金锐角
      eyeColor: '#f59e0b',
      scale: 1.25,
      jumpBonus: 0.92,
      specialTrait: '首领霸体'
    }
  },

  // 跑酷服饰系统（每个部位 6 种潮流风格）
  WARDROBE: {
    // 1. 帽子/头饰 (6款)
    hats: [
      {
        id: 'hat_none',
        name: '原生自然',
        icon: '🍃',
        color: '#94a3b8',
        style: 'none',
        desc: '展现角色纯天然风采'
      },
      {
        id: 'hat_visor',
        name: '动感遮阳帽',
        icon: '🧢',
        color: '#00e5ff',
        style: 'visor',
        desc: '荧光防晒，赛道焦点'
      },
      {
        id: 'hat_snapback',
        name: '街舞棒球帽',
        icon: '🧢',
        color: '#ff3d00',
        style: 'snapback',
        desc: '反戴潮流，律动街头'
      },
      {
        id: 'hat_goggles',
        name: '极速护目镜',
        icon: '🥽',
        color: '#ffd700',
        style: 'goggles',
        desc: '空气动力学抗风阻'
      },
      {
        id: 'hat_headband',
        name: '冠军金头带',
        icon: '🎗️',
        color: '#e91e63',
        style: 'headband',
        desc: '热血吸汗，冠军意志'
      },
      {
        id: 'hat_halo',
        name: '能量星环',
        icon: '✨',
        color: '#7c4dff',
        style: 'halo',
        desc: '悬浮能量粒子光环'
      }
    ],

    // 2. 衣服套装 (6款)
    suits: [
      {
        id: 'suit_tank',
        name: '暴风运动背心',
        icon: '🎽',
        color: '#ff5722',
        patternColor: '#ffffff',
        style: 'tank',
        desc: '轻盈透气，全力冲刺'
      },
      {
        id: 'suit_windbreaker',
        name: '极光机能夹克',
        icon: '🧥',
        color: '#00e5ff',
        patternColor: '#1e293b',
        style: 'jacket',
        desc: '赛博防风，暗夜闪耀'
      },
      {
        id: 'suit_jersey',
        name: '黄金骑行战袍',
        icon: '🥋',
        color: '#ffd700',
        patternColor: '#e65100',
        style: 'jersey',
        desc: '专业竞速，奢华流金'
      },
      {
        id: 'suit_hoodie',
        name: '烈焰连帽卫衣',
        icon: '👚',
        color: '#d50000',
        patternColor: '#ffeb3b',
        style: 'hoodie',
        desc: '街头不羁，烈火狂潮'
      },
      {
        id: 'suit_camo',
        name: '丛林战术背心',
        icon: '🦺',
        color: '#2e7d32',
        patternColor: '#558b2f',
        style: 'camo',
        desc: '硬核迷彩，野性探险'
      },
      {
        id: 'suit_astral',
        name: '星际银光战甲',
        icon: '🥼',
        color: '#e0e7ff',
        patternColor: '#6366f1',
        style: 'astral',
        desc: '未来纳米科技材料'
      }
    ],

    // 3. 跑鞋/足部 (6款)
    shoes: [
      {
        id: 'shoes_nitro',
        name: '氮气气垫跑鞋',
        icon: '👟',
        color: '#00e5ff',
        soleColor: '#ffffff',
        style: 'nitro',
        desc: '回弹澎湃，落地轻柔'
      },
      {
        id: 'shoes_neon',
        name: '闪电荧光短靴',
        icon: '🥾',
        color: '#a3e635',
        soleColor: '#1e293b',
        style: 'neon',
        desc: '夜光炫彩，步步生光'
      },
      {
        id: 'shoes_carbon',
        name: '碳板竞速钉鞋',
        icon: '👟',
        color: '#ff3d00',
        soleColor: '#ffd700',
        style: 'carbon',
        desc: '全掌碳板，极致推进'
      },
      {
        id: 'shoes_lava',
        name: '熔岩喷气战靴',
        icon: '🔥',
        color: '#b71c1c',
        soleColor: '#ff9800',
        style: 'lava',
        desc: '底部喷涌烈焰粒子'
      },
      {
        id: 'shoes_skater',
        name: '复古潮牌板鞋',
        icon: '👞',
        color: '#ec4899',
        soleColor: '#f8fafc',
        style: 'skater',
        desc: '经典百搭，滑板少年'
      },
      {
        id: 'shoes_hover',
        name: '反重力悬浮靴',
        icon: '⚡',
        color: '#8b5cf6',
        soleColor: '#00e5ff',
        style: 'hover',
        desc: '磁浮减震，凌波微步'
      }
    ]
  },

  // 5大跑酷赛道配置
  TRACKS: {
    forest: {
      id: 'forest',
      name: '森林密境',
      icon: '🌲',
      feature: '晨曦古木 · 藤蔓落叶',
      skyGradient: ['#064e3b', '#047857', '#10b981'],
      groundGradient: ['#2e7d32', '#1b5e20', '#3e2723'],
      bgElements: 'trees',
      weatherParticle: 'leaves',
      particleColor: '#86efac',
      hazards: [
        { type: 'log', name: '倒伏古木', width: 68, height: 45, yOffset: 0, requireJump: true },
        { type: 'thorns', name: '剧毒荆棘', width: 56, height: 35, yOffset: 0, requireJump: true },
        { type: 'mushroom_high', name: '悬空巨蘑菇', width: 72, height: 48, yOffset: 95, requireDuck: true }
      ]
    },
    city: {
      id: 'city',
      name: '赛博都市',
      icon: '🏙️',
      feature: '霓虹摩天 · 施工路障',
      skyGradient: ['#0f172a', '#1e1b4b', '#312e81'],
      groundGradient: ['#334155', '#1e293b', '#0f172a'],
      bgElements: 'skyscrapers',
      weatherParticle: 'neon_dust',
      particleColor: '#00e5ff',
      hazards: [
        { type: 'barrier', name: '施工路障', width: 62, height: 50, yOffset: 0, requireJump: true },
        { type: 'hydrant', name: '高压消防栓', width: 44, height: 48, yOffset: 0, requireJump: true },
        { type: 'signboard_high', name: '悬挂霓虹路牌', width: 85, height: 45, yOffset: 100, requireDuck: true }
      ]
    },
    desert: {
      id: 'desert',
      name: '狂沙荒漠',
      icon: '🏜️',
      feature: '烈阳沙丘 · 仙人掌群',
      skyGradient: ['#7c2d12', '#c2410c', '#fb923c'],
      groundGradient: ['#d97706', '#b45309', '#78350f'],
      bgElements: 'pyramids_dunes',
      weatherParticle: 'sand_storm',
      particleColor: '#fde047',
      hazards: [
        { type: 'cactus', name: '巨型仙人掌', width: 52, height: 60, yOffset: 0, requireJump: true },
        { type: 'quicksand', name: '流沙尖石', width: 65, height: 38, yOffset: 0, requireJump: true },
        { type: 'vulture_high', name: '低空盘旋秃鹰', width: 75, height: 45, yOffset: 92, requireDuck: true }
      ]
    },
    snow: {
      id: 'snow',
      name: '极地雪山',
      icon: '❄️',
      feature: '冰封雪峰 · 倒悬冰锥',
      skyGradient: ['#082f49', '#0369a1', '#38bdf8'],
      groundGradient: ['#e0f2fe', '#bae6fd', '#7dd3fc'],
      bgElements: 'ice_mountains',
      weatherParticle: 'snowflakes',
      particleColor: '#ffffff',
      hazards: [
        { type: 'snowball', name: '滚落巨型雪球', width: 58, height: 52, yOffset: 0, requireJump: true },
        { type: 'ice_spikes', name: '地面突起冰刺', width: 54, height: 42, yOffset: 0, requireJump: true },
        { type: 'icicle_high', name: '顶部倒悬冰锥', width: 70, height: 50, yOffset: 105, requireDuck: true }
      ]
    },
    grassland: {
      id: 'grassland',
      name: '青青草原',
      icon: '🌾',
      feature: '翠绿草甸 · 牧场草垛',
      skyGradient: ['#0284c7', '#38bdf8', '#bae6fd'],
      groundGradient: ['#65a30d', '#4d7c0f', '#365314'],
      bgElements: 'windmills_hills',
      weatherParticle: 'dandelions',
      particleColor: '#fef08a',
      hazards: [
        { type: 'fence', name: '农场木栅栏', width: 55, height: 48, yOffset: 0, requireJump: true },
        { type: 'haybale', name: '滚动大草垛', width: 62, height: 48, yOffset: 0, requireJump: true },
        { type: 'clothesline_high', name: '农场晾衣绳索', width: 80, height: 40, yOffset: 95, requireDuck: true }
      ]
    }
  }
};
