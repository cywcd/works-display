/* ═══════════════════════════════════════════════
   outfits.js · 跑酷装扮：帽子 / 衣服 / 鞋子 各6种风格
   ═══════════════════════════════════════════════ */
"use strict";

const OUTFITS = {
  hats: [
    { id: "none", name: "不戴" },
    { id: "cap", name: "运动帽" },
    { id: "cowboy", name: "牛仔帽" },
    { id: "straw", name: "草帽" },
    { id: "crown", name: "小皇冠" },
    { id: "flower", name: "花环" },
    { id: "pompom", name: "绒球帽" },
  ],
  cloths: [
    { id: "none", name: "自然装" },
    { id: "vest", name: "运动背心" },
    { id: "scarf", name: "红围巾" },
    { id: "cape", name: "英雄披风" },
    { id: "jacket", name: "探险夹克" },
    { id: "hoodie", name: "彩虹卫衣" },
    { id: "tux", name: "绅士礼服" },
  ],
  shoes: [
    { id: "none", name: "光脚丫" },
    { id: "sneaker", name: "蓝跑鞋" },
    { id: "racer", name: "疾风红鞋" },
    { id: "rain", name: "黄雨靴" },
    { id: "hike", name: "登山靴" },
    { id: "skate", name: "轮滑鞋" },
    { id: "glow", name: "星光鞋" },
  ],
};

const Outfits = {
  /* ── 帽子：headY 头心y、r 头半径 ── */
  drawHat(ctx, id, ch, headY, r, back, anim) {
    const topY = headY - r * .88;
    switch (id) {
      case "cap": { // 运动帽（红）
        Draw.ell(ctx, 0, topY + .06, r * .78, r * .5);
        _shS(ctx, "#E5484D", "#A82E33");
        if (back) { // 后脑扣带
          Draw.rr(ctx, -.1, topY + .02, .2, .14, .05);
          _sh(ctx, "#C43A40");
          Draw.cir(ctx, 0, topY + .13, .03); _sh(ctx, "#F5C542");
        } else { // 前檐
          Draw.ell(ctx, 0, topY + .28, r * .8, .1);
          _shS(ctx, "#C43A40", "#A82E33");
          Draw.ell(ctx, 0, topY - .12, r * .3, .12); _sh(ctx, "#fff");
        }
        break;
      }
      case "cowboy": { // 牛仔帽
        Draw.ell(ctx, 0, topY + .1, r * 1.35, .16); // 大帽檐
        _shS(ctx, "#A5713C", "#7A4E22");
        Draw.ell(ctx, 0, topY - .02, r * .72, .24); // 帽筒
        _shS(ctx, "#B87F45", "#7A4E22");
        Draw.ell(ctx, 0, topY + .08, r * .74, .07); // 帽带
        _sh(ctx, "#5E3B1E");
        break;
      }
      case "straw": { // 草帽
        Draw.ell(ctx, 0, topY + .1, r * 1.42, .19);
        _shS(ctx, "#F2D98A", "#BFA050");
        Draw.ell(ctx, 0, topY + .07, r * 1.42, .1); _sh(ctx, "#E8C86E");
        Draw.ell(ctx, 0, topY - .05, r * .6, .26);
        _shS(ctx, "#F5E1A0", "#BFA050");
        Draw.ell(ctx, 0, topY + .05, r * .62, .08); _sh(ctx, "#E88FB0"); // 粉带
        break;
      }
      case "crown": { // 皇冠
        ctx.beginPath();
        const w = r * .8, h = r * .62, y0 = topY + .1;
        ctx.moveTo(-w, y0);
        ctx.lineTo(-w, y0 - h * .35);
        ctx.lineTo(-w * .5, y0 - h * .1);
        ctx.lineTo(0, y0 - h);
        ctx.lineTo(w * .5, y0 - h * .1);
        ctx.lineTo(w, y0 - h * .35);
        ctx.lineTo(w, y0);
        ctx.closePath();
        _shS(ctx, "#F5C542", "#B8860B");
        for (const [x, y] of [[-w * .55, y0 + .02], [0, y0 - h * .2], [w * .55, y0 + .02]]) {
          Draw.cir(ctx, x, y, .04); _sh(ctx, "#E5533D");
        }
        break;
      }
      case "flower": { // 花环
        const cols = ["#F28FB4", "#FFE28A", "#A8D8F0", "#F28FB4", "#C5E8A0", "#FFE28A", "#A8D8F0"];
        for (let k = 0; k < 7; k++) {
          const a = Math.PI * (1.08 + k / 6 * .84);
          const fx = Math.cos(a) * r * .92, fy = topY + .3 + Math.sin(a) * r * .8;
          for (let p = 0; p < 4; p++) {
            const pa = p / 4 * Math.PI * 2 + k;
            Draw.cir(ctx, fx + Math.cos(pa) * .045, fy + Math.sin(pa) * .045, .038);
            _sh(ctx, cols[k]);
          }
          Draw.cir(ctx, fx, fy, .025); _sh(ctx, "#FFF6D8");
        }
        break;
      }
      case "pompom": { // 绒球帽
        Draw.rr(ctx, -r * .8, topY - .02, r * 1.6, r * .66, r * .3);
        _shS(ctx, "#E8836F", "#B55A48");
        Draw.rr(ctx, -r * .82, topY + .3, r * 1.64, .14, .07);
        _shS(ctx, "#FFF2E0", "#B55A48");
        Draw.cir(ctx, 0, topY - .12, .12); _shS(ctx, "#FFF2E0", "#D8C0A8");
        break;
      }
    }
  },

  /* ── 衣服：画在躯干上 ── */
  drawCloth(ctx, id, ch, back, anim) {
    const cy = GEO.torsoCY, rx = GEO.torsoRX * (ch.id === "baba" ? 1.18 : 1), ry = GEO.torsoRY;
    switch (id) {
      case "vest": { // 运动背心
        Draw.ell(ctx, 0, cy, rx * 1.04, ry * 1.04);
        _shS(ctx, "#3D7BD9", "#2A5AA8");
        Draw.rr(ctx, -rx * .5, cy - ry * .4, rx, ry * .8, .06);
        _sh(ctx, "#fff");
        if (back) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold .28px Baloo 2, sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("7", 0, cy + .01);
        } else {
          ctx.strokeStyle = "#fff"; ctx.lineWidth = .05;
          ctx.beginPath(); ctx.moveTo(-rx * .6, cy); ctx.lineTo(rx * .6, cy); ctx.stroke();
        }
        Draw.ell(ctx, 0, cy + ry * 1.02, rx * .5, .07); _sh(ctx, "#2A5AA8");
        break;
      }
      case "scarf": { // 红围巾
        Draw.ell(ctx, 0, cy - ry * .82, rx * .68, .1);
        _shS(ctx, "#E5533D", "#B03A2A");
        const wav = Math.sin(anim?.phase || 0) * .1;
        ctx.save();
        ctx.translate(rx * .5, cy - ry * .7);
        ctx.rotate(.25 + wav * .3);
        Draw.rr(ctx, -.07, 0, .15, .42, .06);
        _shS(ctx, "#E5533D", "#B03A2A");
        Draw.rr(ctx, -.05, .3, .12, .1, .04); _sh(ctx, "#F2907A");
        ctx.restore();
        if (!back) {
          ctx.save();
          ctx.translate(-rx * .45, cy - ry * .7);
          ctx.rotate(-.3 - wav * .2);
          Draw.rr(ctx, -.06, 0, .13, .34, .06);
          _shS(ctx, "#E5533D", "#B03A2A");
          ctx.restore();
        }
        break;
      }
      case "cape": { // 英雄披风（正面：领结+两侧披风边）
        ctx.fillStyle = "#B03A2A";
        ctx.beginPath();
        ctx.moveTo(-rx * .5, cy - ry * .6);
        ctx.quadraticCurveTo(-rx * 1.25, cy - ry * .2, -rx * 1.05, cy + ry * 1.1);
        ctx.lineTo(-rx * .55, cy + ry * .9);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(rx * .5, cy - ry * .6);
        ctx.quadraticCurveTo(rx * 1.25, cy - ry * .2, rx * 1.05, cy + ry * 1.1);
        ctx.lineTo(rx * .55, cy + ry * .9);
        ctx.closePath(); ctx.fill();
        Draw.ell(ctx, 0, cy - ry * .72, rx * .62, .09);
        _shS(ctx, "#E5533D", "#B03A2A");
        Draw.cir(ctx, 0, cy - ry * .72, .06); _sh(ctx, "#F5C542");
        break;
      }
      case "jacket": { // 探险夹克
        Draw.ell(ctx, 0, cy, rx * 1.08, ry * 1.06);
        _shS(ctx, "#5E8C4A", "#436834");
        Draw.ell(ctx, 0, cy - ry * .55, rx * 1.05, .08); _sh(ctx, "#D8C8A0"); // 领口
        if (back) {
          Draw.rr(ctx, -.16, cy - .1, .32, .34, .06); _shS(ctx, "#436834", "#2E4A24");
          Draw.rr(ctx, -.12, cy - .06, .24, .12, .04); _sh(ctx, "#D8C8A0"); // 背包
        } else {
          ctx.strokeStyle = "#D8C8A0"; ctx.lineWidth = .045;
          ctx.beginPath(); ctx.moveTo(0, cy - ry * .5); ctx.lineTo(0, cy + ry * .8); ctx.stroke();
          Draw.cir(ctx, 0, cy, .05); _sh(ctx, "#F5C542");
        }
        Draw.rr(ctx, -rx * 1.05, cy + ry * .2, .12, .3, .05); _shS(ctx, "#436834", "#2E4A24");
        Draw.rr(ctx, rx * 1.05 - .12, cy + ry * .2, .12, .3, .05); _shS(ctx, "#436834", "#2E4A24");
        break;
      }
      case "hoodie": { // 彩虹卫衣
        const cols = ["#E5533D", "#F5A623", "#F5D93C", "#5BB862", "#3D7BD9"];
        for (let i = 0; i < 5; i++) {
          Draw.ell(ctx, 0, cy - ry * .7 + i * ry * .36, rx * 1.02, ry * .22);
          _sh(ctx, cols[i]);
        }
        Draw.ell(ctx, 0, cy, rx * 1.04, ry * 1.04);
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        for (let i = 0; i < 5; i++) {
          Draw.ell(ctx, 0, cy - ry * .8 + i * ry * .4, rx * 1.1, ry * .24);
          ctx.fillStyle = cols[i]; ctx.fill();
        }
        ctx.restore();
        Draw.ell(ctx, 0, cy, rx * 1.04, ry * 1.04);
        ctx.strokeStyle = "#3A2A18"; ctx.lineWidth = OUT; ctx.stroke();
        Draw.ell(ctx, 0, cy - ry * .85, rx * .3, .1); _shS(ctx, "#C5E8F5", "#3A2A18"); // 帽绳
        Draw.rr(ctx, -.05, cy + ry * .2, .1, .3, .04); _sh(ctx, "#fff");
        break;
      }
      case "tux": { // 绅士礼服
        Draw.ell(ctx, 0, cy, rx * 1.06, ry * 1.06);
        _shS(ctx, "#3A3A48", "#23232E");
        Draw.ell(ctx, 0, cy + ry * .1, rx * .4, ry * .9);
        _sh(ctx, "#F2EDE2"); // 衬衫
        if (!back) {
          ctx.fillStyle = "#E5533D"; // 领结
          ctx.beginPath();
          ctx.moveTo(0, cy - ry * .45);
          ctx.lineTo(-.14, cy - ry * .6); ctx.lineTo(-.14, cy - ry * .3);
          ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(0, cy - ry * .45);
          ctx.lineTo(.14, cy - ry * .6); ctx.lineTo(.14, cy - ry * .3);
          ctx.closePath(); ctx.fill();
          Draw.cir(ctx, 0, cy - ry * .45, .035); _sh(ctx, "#B03A2A");
        } else {
          Draw.rr(ctx, -.3, cy - .15, .6, .06, .03); _sh(ctx, "#23232E"); // 腰带
        }
        Draw.cir(ctx, 0, cy + ry * .3, .035); _sh(ctx, "#F5C542");
        break;
      }
    }
  },

  /* 披风（背面视角最底层） */
  drawCapeBack(ctx, ch, anim) {
    const cy = GEO.torsoCY, rx = GEO.torsoRX;
    const wav = Math.sin(anim?.phase || 0) * .12;
    ctx.save();
    ctx.translate(0, cy - ry2(.3));
    ctx.beginPath();
    ctx.moveTo(-rx * .75, 0);
    ctx.quadraticCurveTo(-rx * 1.3 - wav, .5, -rx * .9 + wav * .3, .95 + wav * .3);
    ctx.quadraticCurveTo(0, 1.1 + wav * .4, rx * .9 - wav * .3, .95 + wav * .3);
    ctx.quadraticCurveTo(rx * 1.3 + wav, .5, rx * .75, 0);
    ctx.closePath();
    _shS(ctx, "#E5533D", "#B03A2A");
    Draw.ell(ctx, -rx * .55, -.02, .14, .07); _sh(ctx, "#B03A2A");
    Draw.ell(ctx, rx * .55, -.02, .14, .07); _sh(ctx, "#B03A2A");
    ctx.restore();
    function ry2(v) { return GEO.torsoRY * v; }
  },

  /* ── 鞋子：画在脚位置 ── */
  drawShoe(ctx, id, x, y, back, side) {
    const dir = back ? 1 : -1; // 鞋头方向
    switch (id) {
      case "sneaker": {
        Draw.ell(ctx, x, y - .07, .15, .1);
        _shS(ctx, "#4A90D9", "#2E6AB0");
        Draw.rr(ctx, x - .15, y - .035, .3, .05, .02);
        _shS(ctx, "#fff", "#C8D8E8");
        if (!back) { Draw.ell(ctx, x + side * .05, y - .12, .05, .03); _sh(ctx, "#fff"); }
        break;
      }
      case "racer": {
        Draw.ell(ctx, x, y - .08, .16, .11);
        _shS(ctx, "#E5484D", "#A82E33");
        ctx.strokeStyle = "#FFD24A"; ctx.lineWidth = .03;
        ctx.beginPath(); ctx.moveTo(x - .1, y - .12); ctx.lineTo(x + .08, y - .04); ctx.stroke();
        Draw.rr(ctx, x - .16, y - .03, .32, .05, .02); _shS(ctx, "#3A3A48", "#23232E");
        break;
      }
      case "rain": {
        Draw.rr(ctx, x - .11, y - .3, .22, .3, .06);
        _shS(ctx, "#F5C542", "#C89818");
        Draw.ell(ctx, x, y - .02, .13, .05); _shS(ctx, "#E8B820", "#C89818");
        break;
      }
      case "hike": {
        Draw.rr(ctx, x - .12, y - .2, .24, .2, .06);
        _shS(ctx, "#8A5A2B", "#5E3B18");
        Draw.rr(ctx, x - .13, y - .06, .26, .07, .03); _shS(ctx, "#3E2A14", "#2A1C0C");
        if (!back) { ctx.strokeStyle = "#D8C8A0"; ctx.lineWidth = .02; ctx.beginPath(); ctx.moveTo(x - .08, y - .16); ctx.lineTo(x + .08, y - .16); ctx.stroke(); }
        break;
      }
      case "skate": {
        Draw.ell(ctx, x, y - .1, .14, .09);
        _shS(ctx, "#3DC5C0", "#238C88");
        Draw.rr(ctx, x - .1, y - .06, .2, .05, .02); _shS(ctx, "#fff", "#B8D8D8");
        for (const wx of [-.07, .05]) {
          Draw.cir(ctx, x + wx, y + .015, .045); _shS(ctx, "#E8836F", "#B55A48");
          Draw.cir(ctx, x + wx, y + .015, .018); _sh(ctx, "#FFF2E0");
        }
        break;
      }
      case "glow": {
        ctx.save();
        ctx.shadowColor = "#B07CFF"; ctx.shadowBlur = 8;
        Draw.ell(ctx, x, y - .08, .15, .1);
        _shS(ctx, "#8E5AD9", "#5E36A0");
        ctx.restore();
        Draw.cir(ctx, x, y - .1, .04); _sh(ctx, "#E8D5FF");
        Draw.rr(ctx, x - .14, y - .04, .28, .05, .02); _shS(ctx, "#C5A8F0", "#5E36A0");
        break;
      }
    }
  },

  /* ════════ 侧面视图（面朝右奔跑时使用） ════════ */

  drawHatSide(ctx, id, ch, hx, hy, r, anim) {
    const topY = hy - r * .88;
    switch (id) {
      case "cap": { // 运动帽：帽檐朝右
        Draw.ell(ctx, hx - r * .08, topY + .08, r * .72, r * .42);
        _shS(ctx, "#E5484D", "#A82E33");
        Draw.rr(ctx, hx + r * .3, topY + .12, r * .85, .13, .06); // 檐
        _shS(ctx, "#C43A40", "#A82E33");
        Draw.cir(ctx, hx - r * .08, topY - .18, .045); _sh(ctx, "#F5C542");
        break;
      }
      case "cowboy": {
        Draw.ell(ctx, hx - r * .05, topY + .12, r * 1.15, .17);
        _shS(ctx, "#A5713C", "#7A4E22");
        Draw.ell(ctx, hx - r * .08, topY - .02, r * .62, .24);
        _shS(ctx, "#B87F45", "#7A4E22");
        Draw.ell(ctx, hx - r * .08, topY + .09, r * .64, .06); _sh(ctx, "#5E3B1E");
        Draw.ell(ctx, hx + r * .5, topY + .04, .18, .1, -.3); _shS(ctx, "#A5713C", "#7A4E22"); // 前檐翘
        break;
      }
      case "straw": {
        Draw.ell(ctx, hx - r * .05, topY + .1, r * 1.25, .19);
        _shS(ctx, "#F2D98A", "#BFA050");
        Draw.ell(ctx, hx - r * .05, topY + .06, r * 1.25, .1); _sh(ctx, "#E8C86E");
        Draw.ell(ctx, hx - r * .08, topY - .06, r * .55, .24);
        _shS(ctx, "#F5E1A0", "#BFA050");
        Draw.ell(ctx, hx - r * .08, topY + .05, r * .57, .07); _sh(ctx, "#E88FB0");
        break;
      }
      case "crown": { // 侧视皇冠（两尖）
        const w = r * .62, y0 = topY + .12;
        ctx.beginPath();
        ctx.moveTo(-w + hx, y0);
        ctx.lineTo(-w + hx, y0 - .18);
        ctx.lineTo(-w * .3 + hx, y0 - .05);
        ctx.lineTo(hx, y0 - .4);
        ctx.lineTo(w * .4 + hx, y0 - .05);
        ctx.lineTo(w + hx, y0 - .2);
        ctx.lineTo(w + hx, y0);
        ctx.closePath();
        _shS(ctx, "#F5C542", "#B8860B");
        Draw.cir(ctx, hx, y0 - .18, .04); _sh(ctx, "#E5533D");
        Draw.cir(ctx, -w * .6 + hx, y0 + .02, .035); _sh(ctx, "#5E9AD9");
        break;
      }
      case "flower": { // 花环（沿头顶到脑后）
        const cols = ["#F28FB4", "#FFE28A", "#A8D8F0", "#F28FB4", "#C5E8A0"];
        for (let k = 0; k < 5; k++) {
          const a = Math.PI * (.55 + k / 4 * .75);
          const fx = hx + Math.cos(a) * r * .95, fy = topY + .32 + Math.sin(a) * r * .85;
          for (let p = 0; p < 4; p++) {
            const pa = p / 4 * Math.PI * 2 + k;
            Draw.cir(ctx, fx + Math.cos(pa) * .04, fy + Math.sin(pa) * .04, .034);
            _sh(ctx, cols[k]);
          }
          Draw.cir(ctx, fx, fy, .022); _sh(ctx, "#FFF6D8");
        }
        break;
      }
      case "pompom": {
        Draw.rr(ctx, hx - r * .75, topY, r * 1.5, r * .62, r * .28);
        _shS(ctx, "#E8836F", "#B55A48");
        Draw.rr(ctx, hx - r * .78, topY + .3, r * 1.56, .13, .06);
        _shS(ctx, "#FFF2E0", "#B55A48");
        Draw.cir(ctx, hx - r * .1, topY - .12, .11); _shS(ctx, "#FFF2E0", "#D8C0A8");
        break;
      }
    }
  },

  drawClothSide(ctx, id, ch, anim) {
    const cy = GEO.torsoCY;
    const wave = anim?.phase ? Math.sin(anim.phase) * .12 : Math.sin((anim?.idleT || 0) * 2) * .05;
    const body = (fill, stroke) => {
      ctx.save();
      ctx.translate(.05, cy); ctx.rotate(-.09);
      Draw.ell(ctx, 0, 0, .47, .32);
      _shS(ctx, fill, stroke);
      ctx.restore();
    };
    switch (id) {
      case "vest": {
        body("#3D7BD9", "#2A5AA8");
        ctx.save();
        ctx.translate(.05, cy); ctx.rotate(-.09);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = .06;
        ctx.beginPath(); ctx.moveTo(-.2, .12); ctx.lineTo(.3, .02); ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "bold .26px Baloo 2, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("7", .12, -.06);
        ctx.restore();
        break;
      }
      case "scarf": { // 红围巾：飘带向后（左）
        body("#E5533D", "#B03A2A");
        ctx.save();
        ctx.translate(-.05, cy - .3);
        ctx.beginPath();
        ctx.moveTo(.05, 0);
        ctx.quadraticCurveTo(-.3, -.12 + wave * .5, -.6 - wave * .2, .1 + wave * .4);
        ctx.lineTo(-.5 - wave * .2, .22 + wave * .4);
        ctx.quadraticCurveTo(-.25, .02, .02, .14);
        ctx.closePath();
        _shS(ctx, "#E5533D", "#B03A2A");
        Draw.rr(ctx, -.04 - wave * .2, .18, .12, .12, .04); _sh(ctx, "#F2907A");
        ctx.restore();
        break;
      }
      case "cape": { // 英雄披风：向后飘扬
        ctx.save();
        ctx.translate(.18, cy - .32);
        ctx.beginPath();
        ctx.moveTo(.05, -.05);
        ctx.quadraticCurveTo(-.35, -.15 + wave * .6, -.78 - wave * .25, .12 + wave * .5);
        ctx.quadraticCurveTo(-.5, .18 + wave * .3, -.72 - wave * .2, .42 + wave * .4);
        ctx.quadraticCurveTo(-.3, .32, .02, .28);
        ctx.closePath();
        _shS(ctx, "#E5533D", "#B03A2A");
        Draw.ell(ctx, .02, -.04, .1, .07); _sh(ctx, "#B03A2A"); //系扣
        ctx.restore();
        break;
      }
      case "jacket": {
        body("#5E8C4A", "#436834");
        ctx.save();
        ctx.translate(.05, cy); ctx.rotate(-.09);
        Draw.ell(ctx, 0, -.24, .45, .07); _sh(ctx, "#D8C8A0"); // 领口
        Draw.rr(ctx, -.12, -.06, .26, .24, .05); _shS(ctx, "#436834", "#2E4A24"); // 口袋
        Draw.cir(ctx, .12, .06, .045); _sh(ctx, "#F5C542");
        ctx.restore();
        break;
      }
      case "hoodie": {
        const cols = ["#E5533D", "#F5A623", "#F5D93C", "#5BB862", "#3D7BD9"];
        ctx.save();
        ctx.translate(.05, cy); ctx.rotate(-.09);
        Draw.ell(ctx, 0, 0, .47, .32);
        ctx.save();
        ctx.beginPath(); ctx.ellipse(0, 0, .47, .32, 0, 0, Math.PI * 2); ctx.clip();
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = cols[i];
          ctx.fillRect(-.5, -.34 + i * .14, 1, .14);
        }
        ctx.restore();
        ctx.strokeStyle = "#3A2A18"; ctx.lineWidth = OUT; ctx.stroke();
        ctx.restore();
        Draw.ell(ctx, -.22, cy - .38, .17, .12, -.4); _shS(ctx, "#C5E8F5", "#3A2A18"); // 兜帽
        break;
      }
      case "tux": {
        body("#3A3A48", "#23232E");
        ctx.save();
        ctx.translate(.05, cy); ctx.rotate(-.09);
        Draw.ell(ctx, .38, .05, .1, .26); _shS(ctx, "#F2EDE2", "#23232E"); // 白衬边
        Draw.cir(ctx, .1, -.02, .035); _sh(ctx, "#F5C542");
        Draw.ell(ctx, .3, -.26, .08, .06); _shS(ctx, "#E5533D", "#B03A2A"); // 领结侧影
        ctx.restore();
        break;
      }
    }
  },

  drawShoeSide(ctx, id, x, y, far) {
    const dim = far ? -16 : 0;
    const shoeBody = (c1, c2) => {
      Draw.ell(ctx, x + .04, y - .1, .17, .1);
      _shS(ctx, shade(c1, dim), shade(c2, dim));
    };
    const sole = (c) => {
      Draw.rr(ctx, x - .12, y - .05, .34, .055, .025);
      _shS(ctx, shade(c, dim), shade(c, dim - 30));
    };
    switch (id) {
      case "sneaker": {
        shoeBody("#4A90D9", "#2E6AB0");
        sole("#F2F6FA");
        Draw.rr(ctx, x - .13, y - .16, .07, .12, .03); _sh(ctx, "#2E6AB0"); // 鞋跟
        Draw.ell(ctx, x + .05, y - .13, .05, .028); _sh(ctx, "#fff");
        break;
      }
      case "racer": {
        shoeBody("#E5484D", "#A82E33");
        sole("#3A3A48");
        ctx.strokeStyle = "#FFD24A"; ctx.lineWidth = .03; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x - .06, y - .13); ctx.lineTo(x + .14, y - .06); ctx.stroke();
        break;
      }
      case "rain": {
        Draw.rr(ctx, x - .1, y - .32, .22, .3, .06);
        _shS(ctx, shade("#F5C542", dim), shade("#C89818", dim));
        Draw.rr(ctx, x - .12, y - .06, .28, .07, .03);
        _shS(ctx, shade("#E8B820", dim), shade("#C89818", dim));
        break;
      }
      case "hike": {
        Draw.rr(ctx, x - .1, y - .24, .24, .22, .06);
        _shS(ctx, shade("#8A5A2B", dim), shade("#5E3B18", dim));
        sole("#3E2A14");
        ctx.strokeStyle = shade("#D8C8A0", dim); ctx.lineWidth = .022;
        ctx.beginPath(); ctx.moveTo(x - .02, y - .19); ctx.lineTo(x + .08, y - .12); ctx.stroke();
        break;
      }
      case "skate": {
        Draw.rr(ctx, x - .1, y - .22, .24, .2, .07);
        _shS(ctx, shade("#3DC5C0", dim), shade("#238C88", dim));
        for (const wx2 of [-.05, .09]) {
          Draw.cir(ctx, x + wx2, y - .015, .05); _shS(ctx, shade("#E8836F", dim), shade("#B55A48", dim));
          Draw.cir(ctx, x + wx2, y - .015, .02); _sh(ctx, "#FFF2E0");
        }
        Draw.rr(ctx, x - .1, y - .07, .25, .04, .02); _sh(ctx, shade("#fff", dim));
        break;
      }
      case "glow": {
        ctx.save();
        if (!far) { ctx.shadowColor = "#B07CFF"; ctx.shadowBlur = 7; }
        Draw.ell(ctx, x + .04, y - .1, .17, .1);
        _shS(ctx, shade("#8E5AD9", dim), shade("#5E36A0", dim));
        ctx.restore();
        Draw.cir(ctx, x + .06, y - .11, .035); _sh(ctx, "#E8D5FF");
        sole("#C5A8F0");
        break;
      }
    }
  },

  /* 装扮图标（菜单里的小图） */
  drawIcon(cv, kind, id) {
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    const s = w / 64;
    ctx.scale(s, s);
    if (kind === "hat") {
      const fake = { pal: { fur: "#E89A3C" } };
      if (id === "none") { // 帽子斜杠
        ctx.strokeStyle = "#B8A888"; ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-16, 12); ctx.lineTo(16, -12); ctx.stroke();
        Draw.ell(ctx, 0, 6, 20, 10); _shS(ctx, "#EDE2CC", "#C4B494");
      } else {
        ctx.translate(0, 12);
        ctx.scale(38, 38);
        this.drawHat(ctx, id, fake, -.5, .5, false, null);
      }
    } else if (kind === "cloth") {
      const fake = { id: "niulai" };
      if (id === "none") {
        ctx.strokeStyle = "#B8A888"; ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-16, 12); ctx.lineTo(16, -12); ctx.stroke();
      } else {
        ctx.scale(52, 52);
        ctx.translate(0, -GEO.torsoCY); // 躯干中心对准画布中心
        this.drawCloth(ctx, id, fake, false, null);
      }
    } else {
      if (id === "none") {
        ctx.strokeStyle = "#B8A888"; ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-16, 12); ctx.lineTo(16, -12); ctx.stroke();
        Draw.ell(ctx, 0, 2, 14, 9); _shS(ctx, "#EDE2CC", "#C4B494");
      } else {
        ctx.scale(105, 105);
        this.drawShoe(ctx, id, 0, 0, false, 1);
      }
    }
    ctx.restore();
  },
};
