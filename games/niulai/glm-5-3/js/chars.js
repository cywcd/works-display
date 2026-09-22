/* ═══════════════════════════════════════════════
   chars.js · 8位角色定义 + 卡通矢量绘制（正面/背面）
   局部坐标系：脚底 (0,0)，向上为 -y，单位≈游戏世界单位
   ═══════════════════════════════════════════════ */
"use strict";

const CHARS = [
  {
    id: "niulai", name: "牛来", species: "cow",
    desc: "勇敢的小牛犊，草原跑酷新星！",
    size: 1.0,
    pal: { fur: "#E89A3C", fur2: "#FFF3DE", dark: "#B26E1C", inner: "#F2B990", hoof: "#8A5A28", horn: "#F4E7CC", accent: "#FFD24A" },
    horns: "nubs", tuft: "#FFDf8f", patch: { x: .1, y: -.78, rx: .26, ry: .2, color: "#FFF3DE" },
    face: { eye: "round", mouth: "open-smile" },
  },
  {
    id: "mama", name: "牛来妈妈", species: "cow",
    desc: "温柔又坚韧的妈妈，跑起来像风一样。",
    size: 1.07,
    pal: { fur: "#F2DFC0", fur2: "#FFFAEE", dark: "#C4A878", inner: "#F7C0C8", hoof: "#B08A58", horn: "#EADCC0", accent: "#E88FB0" },
    horns: "small", tuft: "#E8CCA0", flower: "#F28FB4",
    patch: { x: -.08, y: -.8, rx: .2, ry: .16, color: "#FFFAEE" },
    face: { eye: "lash", mouth: "smile" },
  },
  {
    id: "yunque", name: "云雀", species: "bird",
    desc: "天生的飞行向导，蹦蹦跳跳也能拿第一。",
    size: 0.94,
    pal: { fur: "#CBA36E", fur2: "#F7ECD2", dark: "#9C7743", inner: "#F2D9A8", hoof: "#E8963C", horn: null, accent: "#FFD966" },
    face: { eye: "round", mouth: "beak" },
  },
  {
    id: "she", name: "蛇", species: "snake",
    desc: "神秘的滑行高手，S形走位谁也追不上。",
    size: 0.98,
    pal: { fur: "#7FB862", fur2: "#E4F2C8", dark: "#4E8C3F", inner: "#B8Dc98", hoof: "#5A9843", horn: null, accent: "#F0C040" },
    face: { eye: "slit", mouth: "sly" },
  },
  {
    id: "baola", name: "豹拉", species: "cat",
    desc: "牛来最好的朋友，草原上的速度之星。",
    size: 1.0,
    pal: { fur: "#F2C05A", fur2: "#FFF0D2", dark: "#B07E22", inner: "#F7DFB0", hoof: "#8A6428", horn: null, accent: "#E8802A" },
    face: { eye: "round", mouth: "fang" },
  },
  {
    id: "lang", name: "狼", species: "wolf",
    desc: "想抓牛群的大反派，这次改行跑步了？",
    size: 1.06,
    pal: { fur: "#93A0AC", fur2: "#DCE2E8", dark: "#5B6672", inner: "#C5CCD4", hoof: "#4A545E", horn: null, accent: "#C23B2E" },
    face: { eye: "sharp", mouth: "smirk" },
  },
  {
    id: "niuer", name: "牛二", species: "cow",
    desc: "爱较劲的同龄小伙伴，嘴里总叼着草。",
    size: 0.98,
    pal: { fur: "#8A5A3A", fur2: "#FFF6E8", dark: "#5E3B22", inner: "#E8B090", hoof: "#5E3B22", horn: "#E8DCC4", accent: "#64B5E0" },
    horns: "nubs", tuft: "#3E2A18", grass: true,
    patch: { x: .12, y: -.75, rx: .24, ry: .18, color: "#FFF6E8" },
    face: { eye: "round", mouth: "tongue" },
  },
  {
    id: "baba", name: "牛爸爸", species: "cow",
    desc: "族群首领，稳重如山，冲刺如雷。",
    size: 1.2,
    pal: { fur: "#6B5540", fur2: "#C8B696", dark: "#463726", inner: "#D8C4A4", hoof: "#3E3224", horn: "#EFE2C4", accent: "#B03A2E" },
    horns: "big", tuft: null,
    patch: { x: 0, y: -.78, rx: .3, ry: .22, color: "#57432F" },
    face: { eye: "brow", mouth: "grin" },
  },
];

const charById = (id) => CHARS.find(c => c.id === id) || CHARS[0];

/* 统一形体参数 */
const GEO = {
  hipY: -.58, legX: .21, legW: .155,
  torsoCY: -.86, torsoRX: .42, torsoRY: .34,
  shoulderY: -1.04, armX: .44, armW: .115, armLen: .42,
  headY: -1.58, headR: .5,
};
const OUT = .035; // 描边宽度

function _sh(ctx, fill) { ctx.fillStyle = fill; ctx.fill(); }
function _shS(ctx, fill, stroke) { ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = OUT; ctx.stroke(); }

/* ── 腿脚（含跑动动画） anim: {phase, jumpT(0..1|null), slide} ── */
function _legs(ctx, ch, o, back, anim) {
  const P = ch.pal;
  const swing = anim ? Math.sin(anim.phase) : 0;
  const lift = anim ? Math.cos(anim.phase) : 0;
  const jump = anim && anim.jumpT != null;
  const feet = [];
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    let fx = GEO.legX * s, fy = 0, ext = 1;
    if (jump) { fx = GEO.legX * s * .8; fy = -.16 - (i === 0 ? .04 : 0); ext = .7; }
    else if (anim && anim.slide) { fy = 0; ext = .8; }
    else if (anim) { fy = -Math.max(0, swing * s) * .3; fx += lift * s * .05; }
    // 大腿
    ctx.strokeStyle = P.fur; ctx.lineCap = "round";
    ctx.lineWidth = GEO.legW;
    ctx.beginPath();
    ctx.moveTo(GEO.legX * s * .85, GEO.hipY + .1);
    ctx.lineTo(fx, fy - .07 * ext);
    ctx.stroke();
    feet.push({ x: fx, y: fy - .02, s });
  }
  return feet;
}

function _feet(ctx, ch, o, feet, back, anim) {
  for (const f of feet) {
    if (o.shoes) { Outfits.drawShoe(ctx, o.shoes, f.x, f.y, back, f.s); }
    else { // 原生蹄/爪
      const P = ch.pal;
      Draw.ell(ctx, f.x, f.y - .05, .12, .09);
      if (ch.species === "bird") _sh(ctx, P.hoof);
      else if (ch.species === "cat" || ch.species === "wolf") { _shS(ctx, P.fur, P.dark); Draw.ell(ctx, f.x, f.y - .02, .07, .04); _sh(ctx, P.dark); }
      else { _shS(ctx, P.hoof, P.dark); Draw.ell(ctx, f.x, f.y - .075, .06, .035); _sh(ctx, P.dark); }
    }
  }
}

/* ── 躯干 ── */
function _torso(ctx, ch, back) {
  const P = ch.pal;
  const wide = ch.id === "baba" ? 1.18 : 1;
  Draw.ell(ctx, 0, GEO.torsoCY, GEO.torsoRX * wide, GEO.torsoRY);
  _shS(ctx, P.fur, P.dark);
  if (ch.species === "wolf") { // 胸毛
    ctx.fillStyle = P.fur2;
    for (let i = -1; i <= 1; i++) {
      Draw.cir(ctx, i * .16, GEO.torsoCY + GEO.torsoRY * (back ? -1 : 1) * .55, .09);
      ctx.fill();
    }
  }
  if (back && ch.patch) { // 背部花纹
    Draw.ell(ctx, ch.patch.x, ch.patch.y, ch.patch.rx, ch.patch.ry);
    _sh(ctx, ch.patch.color);
  }
  if (back && ch.species === "cat") { // 豹纹
    ctx.fillStyle = P.dark;
    [[-.22, -.8], [.18, -.95], [.05, -.68], [-.1, -1.0], [.26, -.75]].forEach(([x, y]) => {
      Draw.cir(ctx, x, y, .045); ctx.fill();
      Draw.cir(ctx, x + .04, y + .03, .028); ctx.fill();
    });
  }
  if (back && ch.species === "wolf") { // 背纹
    ctx.fillStyle = P.dark;
    ctx.beginPath();
    ctx.moveTo(0, -1.14); ctx.quadraticCurveTo(.1, -.9, 0, -.62);
    ctx.quadraticCurveTo(-.1, -.9, 0, -1.14); ctx.fill();
  }
  if (!back && ch.species === "cat") { // 前胸豹点
    ctx.fillStyle = P.dark;
    [[-.14, -.72], [.12, -.78], [0, -.66]].forEach(([x, y]) => { Draw.cir(ctx, x, y, .03); ctx.fill(); });
  }
  if (!back && ch.species === "bird") { // 胸前斑点
    ctx.fillStyle = P.dark;
    [[-.12, -.7], [.1, -.76], [-.02, -.62], [.18, -.66]].forEach(([x, y]) => { Draw.cir(ctx, x, y, .024); ctx.fill(); });
  }
}

/* ── 手臂/翅膀 ── */
function _arms(ctx, ch, back, anim) {
  const P = ch.pal;
  const jump = anim && anim.jumpT != null;
  const swing = anim && anim.run ? Math.sin(anim.phase || 0) : 0;
  const idleA = anim && !anim.run ? Math.sin(anim.idleT || 0) * .12 : 0;
  for (let i = 0; i < 2; i++) {
    const s = i === 0 ? -1 : 1;
    const swingA = jump ? -.9 : (s * swing * .5 + idleA);
    ctx.save();
    ctx.translate(GEO.armX * s * .86, GEO.shoulderY);
    ctx.rotate(swingA * (back ? -1 : 1));
    if (ch.species === "bird") { // 翅膀
      Draw.ell(ctx, .05 * s, .2, .13, .3, s * .3);
      _shS(ctx, P.fur, P.dark);
      ctx.fillStyle = P.fur2;
      for (let k = 0; k < 2; k++) { Draw.ell(ctx, .07 * s, .12 + k * .12, .07, .1, s * .3); ctx.fill(); }
    } else {
      ctx.strokeStyle = P.fur; ctx.lineCap = "round"; ctx.lineWidth = GEO.armW;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, GEO.armLen * .85); ctx.stroke();
      Draw.cir(ctx, 0, GEO.armLen * .88, GEO.armW * .62); // 手
      _sh(ctx, P.fur2);
    }
    ctx.restore();
  }
}

/* ── 尾巴 ── */
function _tail(ctx, ch, back, anim) {
  const P = ch.pal;
  const wag = anim && !anim.phase ? Math.sin((anim.idleT || 0) * 2) * .3 : Math.sin(anim?.phase || 0) * .25;
  const bx = back ? 0 : .3, by = -.62;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(.5 + wag * .4);
  if (ch.species === "cat") {
    ctx.strokeStyle = P.fur; ctx.lineWidth = .1; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(.05, -.45, back ? -.18 : .18, -.6); ctx.stroke();
    Draw.cir(ctx, back ? -.18 : .18, -.6, .09); _sh(ctx, P.dark);
  } else if (ch.species === "wolf") {
    ctx.strokeStyle = P.fur; ctx.lineWidth = .16; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(.12, -.4, -.02, -.72); ctx.stroke();
    Draw.cir(ctx, -.02, -.76, .11); _sh(ctx, P.fur2);
  } else if (ch.species === "bird") {
    ctx.fillStyle = P.dark;
    for (let k = -1; k <= 1; k++) {
      Draw.ell(ctx, k * .09, -.08, .05, .17, k * .25); ctx.fill();
    }
  } else if (ch.species !== "snake") { // 牛尾
    ctx.strokeStyle = P.fur; ctx.lineWidth = .06; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(.18, -.1, .3 + wag * .1, -.34); ctx.stroke();
    Draw.ell(ctx, .32 + wag * .1, -.38, .07, .085); _sh(ctx, P.dark);
  }
  ctx.restore();
}

/* ── 头部（背面：后脑勺；正面：完整脸） ── */
function _head(ctx, ch, back, anim, headR) {
  const P = ch.pal;
  const hy = GEO.headY, r = headR;
  const bob = anim?.phase ? Math.sin(anim.phase) * .02 : 0;

  /* 耳朵/角（先画，压在头后面） */
  ctx.save();
  ctx.translate(0, hy + bob);
  if (ch.species === "cat") {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * .55, -r * .5);
      ctx.lineTo(s * r * 1.05, -r * 1.25);
      ctx.lineTo(s * r * .98, -r * .3);
      ctx.closePath(); _shS(ctx, P.fur, P.dark);
      ctx.beginPath();
      ctx.moveTo(s * r * .62, -r * .55);
      ctx.lineTo(s * r * .9, -r * 1.0);
      ctx.lineTo(s * r * .85, -r * .45);
      ctx.closePath(); _sh(ctx, P.inner);
    }
  } else if (ch.species === "wolf") {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * .5, -r * .55);
      ctx.lineTo(s * r * .85, -r * 1.6);
      ctx.lineTo(s * r * 1.0, -r * .35);
      ctx.closePath(); _shS(ctx, P.fur, P.dark);
      ctx.beginPath();
      ctx.moveTo(s * r * .62, -r * .6);
      ctx.lineTo(s * r * .82, -r * 1.25);
      ctx.lineTo(s * r * .88, -r * .5);
      ctx.closePath(); _sh(ctx, P.inner);
    }
  } else if (ch.species === "bird") { // 冠羽
    ctx.fillStyle = P.dark;
    for (const [dx, rot, len] of [[-.14, -.5, .3], [0, 0, .36], [.14, .5, .3]]) {
      Draw.ell(ctx, dx, -r * 1.02, .05, len / 2, rot); ctx.fill();
    }
  } else if (ch.species === "cow") {
    for (const s of [-1, 1]) { // 牛耳
      Draw.ell(ctx, s * r * .92, -r * .18, .17, .1, s * .35);
      _shS(ctx, P.fur, P.dark);
      Draw.ell(ctx, s * r * .95, -r * .18, .1, .055, s * .35); _sh(ctx, P.inner);
    }
    const horns = ch.horns;
    if (horns === "nubs") {
      for (const s of [-1, 1]) { Draw.ell(ctx, s * r * .34, -r * .95, .09, .07); _shS(ctx, P.horn, P.dark); }
    } else if (horns === "small") {
      for (const s of [-1, 1]) {
        Draw.ell(ctx, s * r * .42, -r * .98, .07, .13, s * .25); _shS(ctx, P.horn, P.dark);
      }
    } else if (horns === "big") {
      for (const s of [-1, 1]) {
        ctx.strokeStyle = P.horn; ctx.lineWidth = .13; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s * r * .42, -r * .7);
        ctx.quadraticCurveTo(s * r * 1.15, -r * 1.05, s * r * 1.3, -r * .45);
        ctx.stroke();
        ctx.strokeStyle = P.dark; ctx.lineWidth = .02;
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  /* 头 */
  Draw.ell(ctx, 0, hy + bob, r, r * .94);
  _shS(ctx, P.fur, P.dark);
  const hb = hy + bob;

  if (back) {
    /* 后脑勺细节 */
    if (ch.species === "cow" && ch.tuft) {
      ctx.fillStyle = ch.tuft;
      ctx.beginPath();
      ctx.moveTo(0, hb - r * .92);
      ctx.quadraticCurveTo(.16, hb - r * 1.25, .02, hb - r * 1.18);
      ctx.quadraticCurveTo(.05, hb - r * 1.35, -.1, hb - r * 1.2);
      ctx.quadraticCurveTo(-.12, hb - r * 1.05, 0, hb - r * .92);
      ctx.fill();
    }
    if (ch.species === "snake") { // 菱形纹
      ctx.fillStyle = P.dark;
      for (let k = 0; k < 3; k++) {
        const yy = hb - .1 + k * .16;
        ctx.beginPath();
        ctx.moveTo(0, yy - .07); ctx.lineTo(.09, yy); ctx.lineTo(0, yy + .07); ctx.lineTo(-.09, yy);
        ctx.closePath(); ctx.fill();
      }
    }
    return { hy: hb, r };
  }

  /* ── 正面脸 ── */
  const F = ch.face;
  if (ch.species === "cow") {
    // 口鼻
    Draw.ell(ctx, 0, hb + r * .38, r * .62, r * .42);
    _shS(ctx, P.fur2, P.dark);
    Draw.ell(ctx, -r * .22, hb + r * .38, .05, .065); _sh(ctx, P.dark);
    Draw.ell(ctx, r * .22, hb + r * .38, .05, .065); _sh(ctx, P.dark);
  } else if (ch.species === "cat") {
    Draw.ell(ctx, 0, hb + r * .42, r * .4, r * .26);
    _shS(ctx, P.fur2, P.dark);
    ctx.fillStyle = P.dark;
    ctx.beginPath(); ctx.moveTo(0, hb + r * .3); ctx.lineTo(-.06, hb + r * .38); ctx.lineTo(.06, hb + r * .38); ctx.closePath(); ctx.fill();
  } else if (ch.species === "wolf") {
    Draw.ell(ctx, 0, hb + r * .45, r * .44, r * .3);
    _shS(ctx, P.fur2, P.dark);
    Draw.ell(ctx, 0, hb + r * .32, .085, .06); _sh(ctx, P.dark);
  } else if (ch.species === "bird") {
    ctx.fillStyle = P.hoof;
    ctx.beginPath();
    ctx.moveTo(0, hb + r * .18);
    ctx.lineTo(-r * .3, hb + r * .42);
    ctx.lineTo(0, hb + r * .48);
    ctx.lineTo(r * .3, hb + r * .42);
    ctx.closePath(); _shS(ctx, P.hoof, P.dark);
  } else if (ch.species === "snake") {
    Draw.ell(ctx, 0, hb + r * .5, r * .5, r * .3);
    _shS(ctx, P.fur2, P.dark);
  }

  // 眼睛
  const ey = hb - r * .08, ex = r * .34;
  const drawEye = (x, style) => {
    if (style === "sharp" || style === "slit") {
      Draw.cir(ctx, x, ey, .095);
      _shS(ctx, style === "slit" ? "#F5D03C" : "#F2E8DC", P.dark);
      ctx.fillStyle = P.dark;
      Draw.ell(ctx, x, ey, .028, .075); ctx.fill();
      if (style === "sharp") { // 挑眉
        ctx.strokeStyle = P.dark; ctx.lineWidth = .035; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - .11 * Math.sign(x), ey - .13);
        ctx.lineTo(x + .1 * Math.sign(x), ey - .08);
        ctx.stroke();
      }
    } else {
      Draw.cir(ctx, x, ey, .1); _sh(ctx, "#3A2A18");
      Draw.cir(ctx, x + .032, ey - .035, .032); _sh(ctx, "#fff");
      if (style === "lash") {
        ctx.strokeStyle = P.dark; ctx.lineWidth = .03; ctx.lineCap = "round";
        for (const a of [-.5, .15, .8]) {
          ctx.beginPath();
          ctx.moveTo(x + Math.sign(x) * .1, ey + .02);
          ctx.lineTo(x + Math.sign(x) * (.1 + Math.cos(a) * .07), ey + .02 + Math.sin(a) * .06);
          ctx.stroke();
        }
      }
      if (style === "brow") {
        ctx.strokeStyle = P.dark; ctx.lineWidth = .05; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x - .1, ey - .15); ctx.lineTo(x + .1, ey - .12);
        ctx.stroke();
      }
    }
  };
  drawEye(-ex, F.eye); drawEye(ex, F.eye);

  // 腮红
  ctx.fillStyle = "rgba(240,120,110,.28)";
  Draw.ell(ctx, -r * .62, hb + r * .18, .075, .05); ctx.fill();
  Draw.ell(ctx, r * .62, hb + r * .18, .075, .05); ctx.fill();

  // 嘴
  ctx.strokeStyle = P.dark; ctx.lineWidth = .035; ctx.lineCap = "round";
  const my = hb + r * (ch.species === "bird" ? .62 : .55);
  const m = F.mouth;
  if (m === "smile" || m === "sly") {
    ctx.beginPath(); ctx.arc(0, my - .05, .1, .35, Math.PI - .35); ctx.stroke();
    if (m === "sly") {
      ctx.fillStyle = "#E05A3A";
      ctx.beginPath(); ctx.moveTo(0, my + .02); ctx.lineTo(-.02, my + .12); ctx.lineTo(-.06, my + .04); ctx.closePath();
      ctx.moveTo(0, my + .02); ctx.lineTo(.02, my + .12); ctx.lineTo(.06, my + .04); ctx.closePath(); ctx.fill();
    }
  } else if (m === "open-smile") {
    ctx.fillStyle = "#8A4B2A";
    Draw.ell(ctx, 0, my, .11, .085); ctx.fill();
    ctx.fillStyle = "#F2908A";
    Draw.ell(ctx, 0, my + .045, .07, .04); ctx.fill();
  } else if (m === "fang") {
    ctx.fillStyle = "#8A4B2A";
    Draw.ell(ctx, 0, my, .11, .075); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(-.06, my - .03); ctx.lineTo(-.03, my + .05); ctx.lineTo(0, my - .03); ctx.closePath(); ctx.fill();
  } else if (m === "tongue") {
    ctx.beginPath(); ctx.arc(0, my - .06, .09, .3, Math.PI - .3); ctx.stroke();
    ctx.fillStyle = "#F2908A";
    Draw.ell(ctx, .01, my + .05, .05, .07); ctx.fill();
  } else if (m === "smirk") {
    ctx.beginPath();
    ctx.moveTo(-.09, my + .01);
    ctx.quadraticCurveTo(0, my + .07, .11, my - .05);
    ctx.stroke();
  } else if (m === "grin") {
    ctx.fillStyle = "#8A4B2A";
    Draw.ell(ctx, 0, my, .13, .08); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-.1, my - .075, .2, .028);
  }

  // 牛二的草茎
  if (ch.grass) {
    ctx.strokeStyle = "#6FA050"; ctx.lineWidth = .03; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r * .3, my + .02);
    ctx.quadraticCurveTo(r * .7, my - .1, r * .95, my + .08);
    ctx.stroke();
  }
  // 妈妈头花
  if (ch.flower) {
    const fx = r * .78, fy = hb - r * .5;
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2;
      Draw.cir(ctx, fx + Math.cos(a) * .055, fy + Math.sin(a) * .055, .035);
      _sh(ctx, ch.flower);
    }
    Draw.cir(ctx, fx, fy, .03); _sh(ctx, "#FFE28A");
  }
  // 牛来额头白斑
  if (ch.id === "niulai") {
    ctx.fillStyle = P.fur2;
    ctx.beginPath();
    ctx.moveTo(0, hb - r * .92);
    ctx.quadraticCurveTo(r * .3, hb - r * .4, 0, hb - r * .05);
    ctx.quadraticCurveTo(-r * .3, hb - r * .4, 0, hb - r * .92);
    ctx.fill();
  }
  return { hy: hb, r };
}

/* ═════════ 正面（奔跑/预览/头像） ═════════
   anim: { idleT } 静立摇摆 ｜ { run, phase, jumpT, slide } 奔跑动画 */
function drawCharFront(ctx, ch, o = {}, anim = { idleT: 0 }) {
  ctx.save();
  ctx.scale(ch.size, ch.size);
  if (anim.slide) {           // 滑铲压低
    ctx.translate(0, .1);
    ctx.scale(1.06, .62);
  }
  const headR = ch.species === "bird" ? .46 : ch.id === "baba" ? .55 : .5;

  _tail(ctx, ch, false, anim);
  let feet;
  if (ch.species === "snake") {
    _snakeBody(ctx, ch, false, anim.run ? anim.phase : (anim.idleT || 0) * 2);
    feet = [{ x: -.16, y: 0, s: -1 }, { x: .16, y: 0, s: 1 }];
  } else {
    feet = _legs(ctx, ch, o, false, anim.run ? anim : null);
    _torso(ctx, ch, false);
    if (o.cloth) Outfits.drawCloth(ctx, o.cloth, ch, false, anim);
  }
  if (ch.species !== "snake") _arms(ctx, ch, false, anim);
  const head = _head(ctx, ch, false, anim, headR);
  if (o.hat) Outfits.drawHat(ctx, o.hat, ch, head.hy, head.r, false, anim);
  _feet(ctx, ch, o, feet, false, anim.run ? anim : null);
  ctx.restore();
}

/* 蛇的蜿蜒身体（覆盖躯干画法） */
function _snakeBody(ctx, ch, back, t) {
  const P = ch.pal;
  const sw = Math.sin(t * 3) * .1;
  ctx.strokeStyle = P.fur; ctx.lineCap = "round"; ctx.lineWidth = .34;
  ctx.beginPath();
  ctx.moveTo(0, -.06);
  ctx.quadraticCurveTo(.22 + sw, -.38, -.1 - sw, -.66);
  ctx.quadraticCurveTo(-.3, -.9, .06 + sw, -1.12);
  ctx.stroke();
  ctx.strokeStyle = P.dark; ctx.lineWidth = .015; ctx.stroke();
  if (back) { // 背菱纹
    ctx.fillStyle = P.dark;
    for (const [x, y] of [[.1, -.22], [-.12, -.5], [-.14, -.82], [.02, -1.05]]) {
      ctx.beginPath();
      ctx.moveTo(x, y - .07); ctx.lineTo(x + .07, y); ctx.lineTo(x, y + .07); ctx.lineTo(x - .07, y);
      ctx.closePath(); ctx.fill();
    }
  } else { // 腹纹
    ctx.strokeStyle = P.fur2; ctx.lineWidth = .05;
    for (let k = 0; k < 4; k++) {
      const tt = .15 + k * .22;
      const x = (1 - tt) * (1 - tt) * 0 + 2 * (1 - tt) * tt * (.22 + sw) + tt * tt * (-.1 - sw) + (k % 2 ? .06 : -.02);
      const y = -.1 - tt * .95;
      ctx.beginPath(); ctx.moveTo(x - .07, y); ctx.lineTo(x + .07, y); ctx.stroke();
    }
  }
}

/* ═════════ 背面（游戏中奔跑） ═════════
   anim: { phase, jumpT: null|0..1, slide: bool } */
function drawCharBack(ctx, ch, o = {}, anim = { phase: 0 }) {
  ctx.save();
  ctx.scale(ch.size, ch.size);
  const headR = ch.species === "bird" ? .46 : ch.id === "baba" ? .55 : .5;

  if (anim.slide) {
    // 滑铲：压低+前倾
    ctx.translate(0, .12);
    ctx.rotate(0);
    ctx.scale(1.06, .62);
  }

  if (o.cloth === "cape") Outfits.drawCapeBack(ctx, ch, anim); // 披风在最底层
  _tail(ctx, ch, true, anim);

  let feet;
  if (ch.species === "snake") {
    _snakeBody(ctx, ch, true, anim.phase);
    feet = [{ x: -.16, y: 0, s: -1 }, { x: .16, y: 0, s: 1 }];
  } else {
    feet = _legs(ctx, ch, o, true, anim);
    _torso(ctx, ch, true);
    if (o.cloth && o.cloth !== "cape") Outfits.drawCloth(ctx, o.cloth, ch, true, anim);
  }
  if (ch.species !== "snake") _arms(ctx, ch, true, anim);
  const head = _head(ctx, ch, true, anim, headR);
  if (o.hat) Outfits.drawHat(ctx, o.hat, ch, head.hy, head.r, true, anim);
  _feet(ctx, ch, o, feet, true, anim);
  ctx.restore();
}

/* 把角色画进指定画布（适配缩放，用于菜单） */
function renderCharToCanvas(cv, ch, o = {}, t = 0) {
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  const scale = Math.min(cv.width / (2.3 * ch.size), cv.height / (2.45 * ch.size));
  ctx.save();
  ctx.translate(cv.width / 2, cv.height * .97);
  ctx.scale(scale, scale);
  drawCharFront(ctx, ch, o, { idleT: t });
  ctx.restore();
}

/* ═══════════════════════════════════════════════
   侧面视图（面朝 +x 方向奔跑）
   anim: { run, phase, jumpT, slide } ｜ { idleT }
   ═══════════════════════════════════════════════ */
const SIDE = { hx: .14, headY: GEO.headY };

function drawCharSide(ctx, ch, o = {}, anim = { idleT: 0 }) {
  ctx.save();
  ctx.scale(ch.size, ch.size);
  const run = !!anim.run;
  const phase = anim.phase || 0;
  if (anim.slide) { ctx.translate(.04, .08); ctx.scale(1.12, .6); }
  const headR = ch.species === "bird" ? .46 : ch.id === "baba" ? .55 : .5;

  if (ch.species === "snake") { _snakeSide(ctx, ch, o, anim, headR); ctx.restore(); return; }

  const hop = ch.species === "bird";           // 鸟双脚同相 = 蹦跳步态
  const jump = anim.jumpT != null;
  const farCol = shade(ch.pal.fur, -26);

  _tailSide(ctx, ch, anim);                                     // 尾巴（左后）
  _armSide(ctx, ch, o, shade(ch.pal.fur, -26), run, phase + Math.PI, jump, true, farCol);  // 远侧手臂
  _legSide(ctx, ch, o, run, jump, anim, hop ? phase : phase + Math.PI, true);             // 远侧腿

  /* 躯干（略前倾） */
  ctx.save();
  ctx.translate(.05, GEO.torsoCY);
  ctx.rotate(-.09);
  Draw.ell(ctx, 0, 0, .47, .32);
  _shS(ctx, ch.pal.fur, ch.pal.dark);
  _patternSide(ctx, ch);
  ctx.restore();

  if (o.cloth) Outfits.drawClothSide(ctx, o.cloth, ch, anim);   // 衣服

  _legSide(ctx, ch, o, run, jump, anim, hop ? phase : phase, false);                      // 近侧腿
  _armSide(ctx, ch, o, ch.pal.fur, run, phase, jump, false, ch.pal.fur2);                 // 近侧手臂

  const hd = _headSide(ctx, ch, anim, headR);                   // 头（朝右）
  if (o.hat) Outfits.drawHatSide(ctx, o.hat, ch, SIDE.hx, hd.hy, headR, anim);
  ctx.restore();
}

/* 侧面躯干花纹 */
function _patternSide(ctx, ch) {
  const P = ch.pal;
  if (ch.patch) { Draw.ell(ctx, .08, .04, .2, .15); _sh(ctx, ch.patch.color); }
  if (ch.species === "cat") {
    ctx.fillStyle = P.dark;
    [[-.18, -.04], [.04, -.12], [.22, .02], [-.02, .13]].forEach(([x, y]) => {
      Draw.cir(ctx, x, y, .042); ctx.fill();
      Draw.cir(ctx, x + .035, y + .03, .026); ctx.fill();
    });
  }
  if (ch.species === "wolf") {
    ctx.fillStyle = P.dark;
    ctx.beginPath();
    ctx.moveTo(-.4, -.22); ctx.quadraticCurveTo(0, -.36, .42, -.2);
    ctx.quadraticCurveTo(0, -.24, -.4, -.22); ctx.fill();
  }
  if (ch.species === "bird") {
    ctx.fillStyle = P.dark;
    [[.16, .12], [.28, .04], [.1, .2]].forEach(([x, y]) => { Draw.cir(ctx, x, y, .026); ctx.fill(); });
  }
}

/* 侧面尾巴 */
function _tailSide(ctx, ch, anim) {
  const P = ch.pal;
  const run = !!anim.run;
  const wag = run ? Math.sin((anim.phase || 0) * 2) * .3 : Math.sin((anim.idleT || 0) * 2) * .15;
  ctx.save();
  ctx.translate(-.42, -.62);
  ctx.rotate(-.35 + wag * .25);
  if (ch.species === "cat") {
    ctx.strokeStyle = P.fur; ctx.lineWidth = .1; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-.18, -.34, .02, -.55); ctx.stroke();
    Draw.cir(ctx, .02, -.55, .085); _sh(ctx, P.dark);
  } else if (ch.species === "wolf") {
    ctx.strokeStyle = P.fur; ctx.lineWidth = .17; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-.2, -.3, -.12, -.62); ctx.stroke();
    Draw.ell(ctx, -.12, -.68, .1, .13); _sh(ctx, P.fur2);
  } else if (ch.species === "bird") {
    ctx.fillStyle = P.dark;
    for (let k = 0; k < 3; k++) {
      Draw.ell(ctx, -.06 - k * .1, .02, .06, .15, .5 + k * .12 + wag * .1); ctx.fill();
    }
  } else { // 牛尾
    ctx.strokeStyle = P.fur; ctx.lineWidth = .06; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-.2, -.05, -.3, -.28 - wag * .08); ctx.stroke();
    Draw.ell(ctx, -.3, -.32 - wag * .08, .07, .085); _sh(ctx, P.dark);
  }
  ctx.restore();
}

/* 侧面腿+鞋：p 为该腿相位 */
function _legSide(ctx, ch, o, run, jump, anim, p, far) {
  const P = ch.pal;
  const color = far ? shade(P.fur, -26) : P.fur;
  const baseX = far ? -.15 : .15;
  let fx, fy;
  if (jump) { fx = baseX + (far ? -.1 : .2); fy = -.16 - (far ? .04 : 0); }
  else if (anim.slide) { fx = baseX + .36; fy = -.03; }
  else if (run) { fx = baseX + Math.cos(p) * .3; fy = -Math.max(0, Math.sin(p)) * .34; }
  else { fx = baseX + (far ? -.03 : .03); fy = 0; }
  ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.lineWidth = GEO.legW;
  ctx.beginPath();
  ctx.moveTo(baseX * .55, GEO.hipY + .14);
  ctx.lineTo(fx, fy - .06);
  ctx.stroke();
  if (o.shoes) Outfits.drawShoeSide(ctx, o.shoes, fx, fy, far);
  else _footSide(ctx, ch, fx, fy, far);
}

/* 原生脚（侧视） */
function _footSide(ctx, ch, x, y, far) {
  const P = ch.pal;
  const col = far ? shade((ch.species === "bird" ? P.hoof : P.hoof), -18) : P.hoof;
  if (ch.species === "cat" || ch.species === "wolf") {
    Draw.ell(ctx, x + .05, y - .05, .14, .085);
    _shS(ctx, far ? shade(P.fur, -26) : P.fur, P.dark);
    ctx.strokeStyle = P.dark; ctx.lineWidth = .025;
    ctx.beginPath(); ctx.moveTo(x + .12, y - .09); ctx.lineTo(x + .12, y - .03); ctx.stroke();
  } else if (ch.species === "bird") {
    ctx.strokeStyle = col; ctx.lineWidth = .045; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y - .06); ctx.lineTo(x + .12, y); ctx.stroke();
  } else { // 蹄
    Draw.rr(ctx, x - .1, y - .12, .26, .12, .05);
    _shS(ctx, col, P.dark);
  }
}

/* 侧面手臂/翅膀 */
function _armSide(ctx, ch, o, color, run, p, jump, far, handCol) {
  const sx = .3 + (far ? -.13 : 0), sy = GEO.shoulderY - .02;
  let ex, ey;
  if (ch.species === "bird") { // 翅膀
    const flap = jump ? -1 : (run ? Math.sin(p) * .6 : Math.sin((arguments[4] || 0)) * .1);
    ctx.save();
    ctx.translate(sx - .06, sy + .04);
    ctx.rotate(-.4 + flap * .8);
    Draw.ell(ctx, -.06, .18, .13, .3, .15);
    _shS(ctx, color, ch.pal.dark);
    ctx.fillStyle = ch.pal.fur2;
    Draw.ell(ctx, -.04, .12, .06, .1, .15); ctx.fill();
    Draw.ell(ctx, -.02, .26, .06, .1, .15); ctx.fill();
    ctx.restore();
    return;
  }
  if (jump) { ex = sx + .32; ey = sy + .04; }
  else if (run) { ex = sx + Math.cos(p) * .3; ey = sy + .3 + Math.abs(Math.sin(p)) * .05; }
  else { ex = sx + .05; ey = sy + GEO.armLen * .85; }
  ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.lineWidth = GEO.armW;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  Draw.cir(ctx, ex, ey, GEO.armW * .58); _sh(ctx, handCol || ch.pal.fur2);
}

/* 侧面头（面朝右），返回头心y */
function _headSide(ctx, ch, anim, r) {
  const P = ch.pal;
  const hx = SIDE.hx;
  const bob = anim?.phase ? Math.sin(anim.phase) * .02 : 0;
  const hy = SIDE.headY + bob;

  /* 远侧耳/角（先画，深色） */
  ctx.save();
  ctx.translate(hx, hy);
  if (ch.species === "cat" || ch.species === "wolf") {
    ctx.fillStyle = shade(P.fur, -26);
    ctx.beginPath();
    ctx.moveTo(-r * .5, -r * .55); ctx.lineTo(-r * .72, -r * 1.25); ctx.lineTo(-r * .15, -r * .85);
    ctx.closePath(); ctx.fill();
  } else if (ch.species === "cow") {
    _hornSide(ctx, ch, -r * .34, -r * .8, shade(P.horn, -22), r, .8);
    Draw.ell(ctx, -r * .8, -r * .3, .16, .09, -.5);
    ctx.fillStyle = shade(P.fur, -26); ctx.fill();
  }
  ctx.restore();

  /* 头 */
  Draw.ell(ctx, hx, hy, r, r * .94);
  _shS(ctx, P.fur, P.dark);

  /* 近侧耳/角/冠羽 */
  ctx.save();
  ctx.translate(hx, hy);
  if (ch.species === "cat") {
    ctx.beginPath();
    ctx.moveTo(r * .12, -r * .7); ctx.lineTo(-r * .1, -r * 1.35); ctx.lineTo(r * .55, -r * .62);
    ctx.closePath(); _shS(ctx, P.fur, P.dark);
    ctx.beginPath();
    ctx.moveTo(r * .2, -r * .78); ctx.lineTo(r * .02, -r * 1.15); ctx.lineTo(r * .42, -r * .7);
    ctx.closePath(); _sh(ctx, P.inner);
  } else if (ch.species === "wolf") {
    ctx.beginPath();
    ctx.moveTo(r * .05, -r * .6); ctx.lineTo(-r * .05, -r * 1.55); ctx.lineTo(r * .6, -r * .5);
    ctx.closePath(); _shS(ctx, P.fur, P.dark);
    ctx.beginPath();
    ctx.moveTo(r * .14, -r * .68); ctx.lineTo(r * .08, -r * 1.3); ctx.lineTo(r * .46, -r * .6);
    ctx.closePath(); _sh(ctx, P.inner);
  } else if (ch.species === "bird") {
    ctx.fillStyle = P.dark;
    for (const [dx, rot, len] of [[-.08, -.9, .26], [.04, -.4, .3]]) {
      Draw.ell(ctx, dx, -r * 1.0, .045, len / 2, rot); ctx.fill();
    }
  } else if (ch.species === "cow") {
    Draw.ell(ctx, -r * .55, -r * .12, .17, .1, -.35);   // 近耳
    _shS(ctx, P.fur, P.dark);
    Draw.ell(ctx, -r * .58, -r * .12, .1, .05, -.35); _sh(ctx, P.inner);
    const hornScale = ch.horns === "big" ? 1.35 : ch.horns === "small" ? 1 : .62;
    _hornSide(ctx, ch, r * .18, -r * .78, P.horn, r, hornScale);
    if (ch.tuft) { // 额发
      ctx.fillStyle = ch.tuft;
      ctx.beginPath();
      ctx.moveTo(r * .3, -r * .9);
      ctx.quadraticCurveTo(r * .5, -r * 1.28, r * .12, -r * 1.05);
      ctx.quadraticCurveTo(r * .1, -r * .92, r * .3, -r * .9);
      ctx.fill();
    }
  }
  ctx.restore();

  /* ── 面部（右侧） ── */
  const F = ch.face;
  const eyeX = hx + r * .38, eyeY = hy - r * .1;
  // 眼
  if (F.eye === "sharp" || F.eye === "slit") {
    Draw.cir(ctx, eyeX, eyeY, .095);
    _shS(ctx, F.eye === "slit" ? "#F5D03C" : "#F2E8DC", P.dark);
    ctx.fillStyle = P.dark;
    Draw.ell(ctx, eyeX + .01, eyeY, .028, .075); ctx.fill();
    if (F.eye === "sharp") {
      ctx.strokeStyle = P.dark; ctx.lineWidth = .035; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(eyeX - .12, eyeY - .13); ctx.lineTo(eyeX + .1, eyeY - .07); ctx.stroke();
    }
  } else {
    Draw.cir(ctx, eyeX, eyeY, .1); _sh(ctx, "#3A2A18");
    Draw.cir(ctx, eyeX + .035, eyeY - .035, .033); _sh(ctx, "#fff");
    if (F.eye === "lash") {
      ctx.strokeStyle = P.dark; ctx.lineWidth = .03; ctx.lineCap = "round";
      for (const a of [-.3, .35, .9]) {
        ctx.beginPath();
        ctx.moveTo(eyeX + .1, eyeY + .02);
        ctx.lineTo(eyeX + .1 + Math.cos(a) * .07, eyeY + .02 + Math.sin(a) * .06);
        ctx.stroke();
      }
    }
    if (F.eye === "brow") {
      ctx.strokeStyle = P.dark; ctx.lineWidth = .05; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(eyeX - .1, eyeY - .15); ctx.lineTo(eyeX + .1, eyeY - .11); ctx.stroke();
    }
  }
  // 吻部/嘴
  const mx = hx + r * .82, my = hy + r * .3;
  if (ch.species === "cow") {
    Draw.ell(ctx, mx, my, .3, .23);
    _shS(ctx, P.fur2, P.dark);
    Draw.ell(ctx, mx + .14, my - .05, .045, .058); _sh(ctx, P.dark); // 鼻孔
    ctx.strokeStyle = P.dark; ctx.lineWidth = .03; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(mx - .02, my + .07, .08, .2, Math.PI - .9); ctx.stroke();
  } else if (ch.species === "cat") {
    Draw.ell(ctx, mx - .05, my - .05, .16, .12);
    _shS(ctx, P.fur2, P.dark);
    ctx.fillStyle = P.dark;
    ctx.beginPath(); ctx.moveTo(mx + .08, my - .12); ctx.lineTo(mx + .15, my - .04); ctx.lineTo(mx + .04, my - .06); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = P.dark; ctx.lineWidth = .022;
    for (const dy of [-.02, .03]) {
      ctx.beginPath(); ctx.moveTo(mx + .08, my + dy); ctx.lineTo(mx + .26, my + dy - .02); ctx.stroke();
    }
  } else if (ch.species === "wolf") {
    Draw.ell(ctx, mx - .04, my - .04, .2, .13);
    _shS(ctx, P.fur2, P.dark);
    Draw.cir(ctx, mx + .13, my - .1, .05); _sh(ctx, P.dark);
    ctx.strokeStyle = P.dark; ctx.lineWidth = .03; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(mx - .02, my + .05); ctx.quadraticCurveTo(mx + .06, my + .1, mx + .14, my + .02); ctx.stroke();
  } else if (ch.species === "bird") {
    const open = anim.run ? (Math.sin((anim.phase || 0) * 2) > .2 ? .05 : 0) : .02;
    ctx.fillStyle = P.hoof;
    ctx.beginPath(); // 上喙
    ctx.moveTo(hx + r * .6, hy + r * .05);
    ctx.lineTo(hx + r * 1.15, hy + r * .22);
    ctx.lineTo(hx + r * .62, hy + r * .3);
    ctx.closePath(); _shS(ctx, P.hoof, P.dark);
    ctx.fillStyle = shade(P.hoof, -25);
    ctx.beginPath(); // 下喙
    ctx.moveTo(hx + r * .62, hy + r * .3 + open);
    ctx.lineTo(hx + r * 1.02, hy + r * .34 + open);
    ctx.lineTo(hx + r * .62, hy + r * .42 + open);
    ctx.closePath(); ctx.fill();
  }
  // 腮红
  ctx.fillStyle = "rgba(240,120,110,.25)";
  Draw.ell(ctx, hx + r * .1, hy + r * .3, .07, .045); ctx.fill();
  // 妈妈头花
  if (ch.flower) {
    const fx2 = hx - r * .5, fy2 = hy - r * .45;
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2;
      Draw.cir(ctx, fx2 + Math.cos(a) * .05, fy2 + Math.sin(a) * .05, .032);
      _sh(ctx, ch.flower);
    }
    Draw.cir(ctx, fx2, fy2, .026); _sh(ctx, "#FFE28A");
  }
  // 牛来额斑
  if (ch.id === "niulai") {
    ctx.fillStyle = P.fur2;
    ctx.beginPath();
    ctx.moveTo(hx + r * .5, hy - r * .72);
    ctx.quadraticCurveTo(hx + r * .95, hy - r * .1, hx + r * .55, hy + r * .1);
    ctx.quadraticCurveTo(hx + r * .4, hy - r * .35, hx + r * .5, hy - r * .72);
    ctx.fill();
  }
  // 牛二草茎
  if (ch.grass) {
    ctx.strokeStyle = "#6FA050"; ctx.lineWidth = .028; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(mx - .05, my + .08);
    ctx.quadraticCurveTo(mx + .3, my + .12, mx + .45, my - .04);
    ctx.stroke();
  }
  return { hy };
}

/* 侧面牛角 */
function _hornSide(ctx, ch, x, y, color, r, scale) {
  if (ch.horns === "nubs") {
    Draw.ell(ctx, x, y - .02, .09 * scale + .02, .06 * scale + .02);
    _shS(ctx, color, ch.pal.dark);
    return;
  }
  ctx.strokeStyle = color; ctx.lineWidth = .1 * scale + .03; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y + .1);
  ctx.quadraticCurveTo(x + .12 * scale, y - .28 * scale, -.1 * scale + x, y - .38 * scale);
  ctx.stroke();
  ctx.strokeStyle = ch.pal.dark; ctx.lineWidth = .018;
  ctx.stroke();
}

/* 蛇（侧视：水平波动滑行，头抬起朝右） */
function _snakeSide(ctx, ch, o, anim, headR) {
  const P = ch.pal;
  const run = !!anim.run;
  const ph = anim.phase || (anim.idleT || 0) * 2;
  // 身体路径：尾(-.85,0) -> 颈(.3,-1.0)
  const pts = [];
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    const x = -.85 + t * 1.18;
    const baseY = -Math.sin(t * Math.PI * .9) * .5 - t * .58;
    const wave = run ? Math.sin(ph * 2.2 + t * 7) * .1 * (1 - t * .7) : Math.sin(ph + t * 4) * .035;
    pts.push({ x, y: baseY + wave });
  }
  // 尾尖（细）
  ctx.strokeStyle = P.fur; ctx.lineCap = "round";
  ctx.lineWidth = .09;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke();
  // 主体（粗）
  ctx.lineWidth = .32;
  ctx.beginPath(); ctx.moveTo(pts[1].x, pts[1].y);
  for (let i = 2; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
  ctx.strokeStyle = P.dark; ctx.lineWidth = .016; ctx.stroke();
  // 腹部浅纹
  ctx.strokeStyle = P.fur2; ctx.lineWidth = .05; ctx.lineCap = "round";
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    ctx.beginPath(); ctx.moveTo(p.x - .09, p.y + .08); ctx.lineTo(p.x + .09, p.y + .05); ctx.stroke();
  }
  // 背菱纹
  ctx.fillStyle = P.dark;
  for (const p of [pts[3], pts[5]]) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - .16); ctx.lineTo(p.x + .07, p.y - .1); ctx.lineTo(p.x, p.y - .04); ctx.lineTo(p.x - .07, p.y - .1);
    ctx.closePath(); ctx.fill();
  }
  // 头（朝右抬起）
  const hx = .36, hy = -1.12;
  Draw.ell(ctx, hx, hy, .3, .26);
  _shS(ctx, P.fur, P.dark);
  Draw.ell(ctx, hx + .12, hy + .12, .18, .13); // 下颌
  _sh(ctx, P.fur2);
  // 眼（竖瞳）
  Draw.cir(ctx, hx + .08, hy - .06, .08);
  _shS(ctx, "#F5D03C", P.dark);
  ctx.fillStyle = P.dark;
  Draw.ell(ctx, hx + .09, hy - .06, .022, .06); ctx.fill();
  // 吐信
  if (Math.sin(ph * 3) > .3) {
    ctx.strokeStyle = "#E05A3A"; ctx.lineWidth = .025; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hx + .28, hy + .1);
    ctx.lineTo(hx + .44, hy + .06);
    ctx.moveTo(hx + .44, hy + .06); ctx.lineTo(hx + .52, hy + .12);
    ctx.moveTo(hx + .44, hy + .06); ctx.lineTo(hx + .5, hy + .0);
    ctx.stroke();
  }
  // 尾尖穿鞋（可爱细节）
  if (o.shoes) Outfits.drawShoeSide(ctx, o.shoes, pts[0].x - .02, pts[0].y + .04, false);
  if (o.hat) Outfits.drawHatSide(ctx, o.hat, ch, hx, hy, .3, anim);
}

