/* ═══════════════════════════════════════════════
   tracks.js · 5大赛道主题：背景 / 路景 / 障碍物
   ═══════════════════════════════════════════════ */
"use strict";

const TRACKS = [
  /* ─────────── 森林 ─────────── */
  {
    id: "forest", name: "森林",
    skyTop: "#8ED8F2", skyBot: "#DFF6DC",
    sun: "#FFE9A8", sunY: .18, cloud: "#FFFFFF",
    ground: "#6FBF58", groundDark: "#57A847",
    road: "#C09A6A", roadEdge: "#8F6C42", stripe: "rgba(255,250,230,.55)",
    fog: "216,246,220",
    props: { pines: 6, oaks: 3, bushes: 5, mushrooms: 3, rocks: 2 },
    drawFar(ctx, W, H, hy, off) {
      ctx.fillStyle = "#9CCBB4";
      scroll(off * .04, 260, (x) => {
        tri(ctx, x, hy, 340, 120); tri(ctx, x + 130, hy, 240, 88);
      });
      ctx.fillStyle = "#B4DAC2";
      scroll(off * .07, 300, (x) => tri(ctx, x, hy, 300, 78));
    },
    drawMid(ctx, W, H, hy, off) {
      ctx.fillStyle = "#5D9E68";
      scroll(off * .18, 90, (x) => {
        Draw.ell(ctx, x, hy + 4, 60, 40); ctx.fill();
        Draw.ell(ctx, x + 44, hy + 8, 44, 30); ctx.fill();
      });
    },
    drawProp(ctx, kind, seed) {
      const R = mulberry(seed);
      if (kind === "pine") {
        const h = 2.8 + R() * 1.6;
        ctx.fillStyle = "#7A5230";
        ctx.fillRect(-.12, -h * .25, .24, h * .25);
        const green = ["#3E8746", "#4A9A50", "#357A3E"][Math.floor(R() * 3)];
        for (let i = 0; i < 3; i++) {
          const w = .95 - i * .22, yy = -h * (.25 + i * .27);
          ctx.fillStyle = i === 2 ? shade(green, 14) : green;
          ctx.beginPath();
          ctx.moveTo(0, yy - h * .42);
          ctx.lineTo(w, yy); ctx.lineTo(-w, yy);
          ctx.closePath(); ctx.fill();
        }
      } else if (kind === "oak") {
        const h = 2.4 + R() * 1.2;
        ctx.fillStyle = "#8A5A2B"; ctx.fillRect(-.14, -h * .4, .28, h * .4);
        Draw.cir(ctx, 0, -h * .72, .75); ctx.fillStyle = "#5DAA58"; ctx.fill();
        Draw.cir(ctx, -.5, -h * .55, .5); ctx.fill();
        Draw.cir(ctx, .5, -h * .58, .48); ctx.fill();
        ctx.fillStyle = "#6FBE66"; Draw.cir(ctx, -.2, -h * .85, .4); ctx.fill();
      } else if (kind === "bush") {
        Draw.cir(ctx, 0, -.32, .4); ctx.fillStyle = "#4E9A50"; ctx.fill();
        Draw.cir(ctx, -.32, -.22, .3); ctx.fill();
        Draw.cir(ctx, .34, -.24, .32); ctx.fill();
        if (R() > .5) { Draw.cir(ctx, .1, -.42, .06); ctx.fillStyle = "#E5533D"; ctx.fill(); }
      } else if (kind === "mushroom") {
        ctx.fillStyle = "#F2E4CC"; Draw.rr(ctx, -.09, -.3, .18, .3, .05); ctx.fill();
        Draw.ell(ctx, 0, -.32, .3, .18); _shS(ctx, "#E5533D", "#B03A2A");
        Draw.cir(ctx, -.1, -.36, .05); ctx.fillStyle = "#FFF2E0"; ctx.fill();
        Draw.cir(ctx, .09, -.3, .04); ctx.fill();
      } else { // rock
        Draw.blob(ctx, [{ x: -.45, y: 0 }, { x: -.3, y: -.4 }, { x: .1, y: -.5 }, { x: .42, y: -.28 }, { x: .4, y: 0 }]);
        _shS(ctx, "#9AA8A0", "#6E7A72");
      }
    },
    obstacles: [
      { id: "log", type: "jump", name: "倒木" },
      { id: "stump", type: "jump", name: "树桩" },
      { id: "branch", type: "slide", name: "低垂树枝" },
    ],
    drawObstacle(ctx, id, t) {
      if (id === "log") {
        ctx.save(); ctx.rotate(-.04);
        Draw.rr(ctx, -.9, -.62, 1.8, .58, .27);
        _shS(ctx, "#8A5A2B", "#5E3B18");
        for (const s of [-1, 1]) {
          Draw.cir(ctx, s * .88, -.33, .29); _shS(ctx, "#C8A26A", "#5E3B18");
          Draw.cir(ctx, s * .88, -.33, .16); _sh(ctx, "#A87E48");
        }
        ctx.strokeStyle = "#5E8C3F"; ctx.lineWidth = .05; ctx.lineCap = "round";
        for (const [x1, x2, yy] of [[-.6, -.3, -.68], [.1, .45, -.7], [-.15, .05, -.66]]) {
          ctx.beginPath(); ctx.moveTo(x1, yy); ctx.lineTo(x2, yy - .22); ctx.stroke();
        }
        ctx.restore();
      } else if (id === "stump") {
        Draw.rr(ctx, -.62, -.92, 1.24, .92, .1);
        _shS(ctx, "#9A6A38", "#6E4820");
        Draw.ell(ctx, 0, -.95, .64, .2); _shS(ctx, "#C8A26A", "#6E4820");
        Draw.ell(ctx, 0, -.95, .38, .11); _sh(ctx, "#A87E48");
        ctx.strokeStyle = "#A87E48"; ctx.lineWidth = .04;
        ctx.beginPath(); ctx.ellipse(0, -.95, .18, .05, 0, 0, Math.PI * 2); ctx.stroke();
        // 小蘑菇装饰
        ctx.fillStyle = "#F2E4CC"; Draw.rr(ctx, .38, -1.1, .12, .2, .04); ctx.fill();
        Draw.ell(ctx, .44, -1.1, .16, .09); _shS(ctx, "#E5533D", "#B03A2A");
      } else { // branch 悬挂
        ctx.strokeStyle = "#6E4820"; ctx.lineWidth = .16; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-1, 2.9); ctx.quadraticCurveTo(0, 2.55, 1, 2.9); ctx.stroke();
        ctx.strokeStyle = "#3E8746"; ctx.lineWidth = .07;
        for (const [x, r] of [[-.6, .3], [0, .38], [.55, .3]]) {
          Draw.cir(ctx, x, 2.62 - r * .3, r); ctx.fillStyle = "#4A9A50"; ctx.fill();
        }
        // 蜂巢
        Draw.ell(ctx, -.15, 1.55, .26, .34); _shS(ctx, "#E8A83C", "#B87818");
        ctx.strokeStyle = "#B87818"; ctx.lineWidth = .04;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath(); ctx.moveTo(-.24, 1.42 + k * .14); ctx.lineTo(.24, 1.42 + k * .14); ctx.stroke();
        }
        Draw.cir(ctx, 0, 1.34, .05); _sh(ctx, "#6E4820");
      }
    },
  },

  /* ─────────── 城市 ─────────── */
  {
    id: "city", name: "城市",
    skyTop: "#6FB8E8", skyBot: "#FFE6C8",
    sun: "#FFD98A", sunY: .24, cloud: "#FFF4E4",
    ground: "#8E9AA0", groundDark: "#78848A",
    road: "#4E565E", roadEdge: "#383E44", stripe: "rgba(255,255,255,.75)",
    fog: "255,230,200",
    props: { lampposts: 4, hydrants: 3, buildings: 4, cones: 3 },
    drawFar(ctx, W, H, hy, off) {
      scroll(off * .05, 150, (x, k) => {
        const h = 90 + Math.abs(Math.sin(k * 12.9)) * 160;
        ctx.fillStyle = "#7E93A8";
        ctx.fillRect(x - 52, hy - h, 104, h);
        ctx.fillStyle = "rgba(255,235,180,.5)";
        for (let wy = 0; wy < 5; wy++)
          for (let wx = 0; wx < 3; wx++)
            if ((k * 7 + wy * 3 + wx) % 3 < 1)
              ctx.fillRect(x - 34 + wx * 26, hy - h + 14 + wy * 26, 12, 16);
      });
    },
    drawMid(ctx, W, H, hy, off) {
      scroll(off * .16, 220, (x, k) => {
        const h = 130 + Math.abs(Math.sin(k * 7.3)) * 180;
        ctx.fillStyle = "#5E7186";
        ctx.fillRect(x - 68, hy - h, 136, h);
        ctx.fillStyle = "#526478";
        ctx.fillRect(x - 68, hy - h, 20, h);
        ctx.fillStyle = "rgba(255,240,200,.65)";
        for (let wy = 0; wy < 6; wy++)
          if ((k * 5 + wy) % 2 < 1)
            ctx.fillRect(x - 18, hy - h + 16 + wy * 30, 40, 18);
      });
    },
    drawProp(ctx, kind, seed) {
      const R = mulberry(seed);
      if (kind === "lamppost") {
        ctx.strokeStyle = "#3A4A58"; ctx.lineWidth = .13; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(.45, -3.1); ctx.stroke();
        Draw.rr(ctx, .3, -3.1, .32, .16, .06); _shS(ctx, "#FFE9A8", "#B8A060");
        ctx.save(); ctx.globalAlpha = .25; Draw.cir(ctx, .46, -3, .5); _sh(ctx, "#FFE9A8"); ctx.restore();
        Draw.cir(ctx, 0, 0, .15); _sh(ctx, "#3A4A58");
      } else if (kind === "hydrant") {
        Draw.rr(ctx, -.16, -.62, .32, .5, .1); _shS(ctx, "#E5533D", "#A83228");
        Draw.cir(ctx, 0, -.68, .16); _shS(ctx, "#E5533D", "#A83228");
        Draw.rr(ctx, -.28, -.5, .56, .12, .05); _shS(ctx, "#C43A30", "#A83228");
        Draw.rr(ctx, -.2, -.14, .4, .14, .05); _sh(ctx, "#C43A30");
      } else if (kind === "building") {
        const h = 3 + R() * 3, w = 1.6 + R() * .8;
        Draw.rr(ctx, -w / 2, -h, w, h, .06); _shS(ctx, "#8E9EA8", "#5E6E78");
        ctx.fillStyle = "rgba(255,240,200,.7)";
        for (let yy = 0; yy < Math.floor(h / .55); yy++)
          for (let xx = 0; xx < 3; xx++)
            if ((seed + yy * 3 + xx) % 3 < 2)
              ctx.fillRect(-w / 2 + .16 + xx * (w - .32) / 3, -h + .2 + yy * .55, .18, .3);
      } else { // cone
        ctx.fillStyle = "#F58A2E";
        ctx.beginPath(); ctx.moveTo(0, -.55); ctx.lineTo(.22, 0); ctx.lineTo(-.22, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillRect(-.13, -.3, .26, .09);
        Draw.rr(ctx, -.3, -.06, .6, .08, .03); _sh(ctx, "#E07718");
      }
    },
    obstacles: [
      { id: "barrier", type: "jump", name: "施工路障" },
      { id: "trash", type: "jump", name: "垃圾桶" },
      { id: "sign", type: "slide", name: "限高横杆" },
    ],
    drawObstacle(ctx, id, t) {
      if (id === "barrier") {
        Draw.rr(ctx, -.85, -.72, 1.7, .34, .06); _shS(ctx, "#F58A2E", "#C46A18");
        ctx.save();
        ctx.beginPath(); ctx.rect(-.85, -.72, 1.7, .34); ctx.clip();
        ctx.fillStyle = "#fff";
        for (let k = 0; k < 4; k++) {
          ctx.save(); ctx.translate(-.85 + k * .44, -.72); ctx.rotate(.5);
          ctx.fillRect(0, -.2, .16, .7); ctx.restore();
        }
        ctx.restore();
        Draw.rr(ctx, -.85, -.4, 1.7, .16, .05); _shS(ctx, "#F58A2E", "#C46A18");
        ctx.fillStyle = "#5E6E78";
        ctx.fillRect(-.78, -.28, .12, .28); ctx.fillRect(.66, -.28, .12, .28);
        // 闪灯
        const blink = Math.sin(t * 6) > 0;
        Draw.cir(ctx, 0, -.8, .07); _sh(ctx, blink ? "#FFE24A" : "#B8A030");
        ctx.save(); if (blink) { ctx.globalAlpha = .3; Draw.cir(ctx, 0, -.8, .16); ctx.fill(); } ctx.restore();
      } else if (id === "trash") {
        Draw.rr(ctx, -.5, -.95, 1, .95, .1); _shS(ctx, "#5E8C5A", "#3E6A3C");
        for (let k = 0; k < 3; k++) {
          Draw.rr(ctx, -.42, -.88 + k * .3, .84, .1, .04); _sh(ctx, "#4A7A48");
        }
        Draw.rr(ctx, -.56, -1.08, 1.12, .16, .07); _shS(ctx, "#6E9C68", "#3E6A3C");
        Draw.ell(ctx, 0, -.9, .3, .12); _sh(ctx, "#3E6A3C");
        // 掉出的垃圾
        Draw.cir(ctx, .62, -.06, .09); _shS(ctx, "#F5C542", "#B89018");
      } else { // sign 限高杆
        ctx.fillStyle = "#F2D020";
        ctx.beginPath(); ctx.moveTo(-1.05, 2.4); ctx.lineTo(1.05, 2.4); ctx.lineTo(.9, 1.15); ctx.lineTo(-.9, 1.15); ctx.closePath();
        _shS(ctx, "#F2D020", "#B89818");
        ctx.fillStyle = "#3A3A3A";
        ctx.font = "bold .42px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("限高", 0, 1.78);
        ctx.strokeStyle = "#5E6E78"; ctx.lineWidth = .12; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-.95, 2.9); ctx.lineTo(-.95, 1.2); ctx.moveTo(.95, 2.9); ctx.lineTo(.95, 1.2); ctx.stroke();
        ctx.strokeStyle = "#B89818"; ctx.lineWidth = .06;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath(); ctx.moveTo(k * .36, 1.15); ctx.lineTo(k * .36 + .12, 1.15); ctx.stroke();
        }
      }
    },
  },

  /* ─────────── 沙漠 ─────────── */
  {
    id: "desert", name: "沙漠",
    skyTop: "#F2B868", skyBot: "#FFE8B8",
    sun: "#FF9E3D", sunY: .2, cloud: "#FFE4C4",
    ground: "#E8C078", groundDark: "#D8AC5E",
    road: "#D8A85C", roadEdge: "#B8884A", stripe: "rgba(120,70,20,.35)",
    fog: "255,232,184",
    props: { cacti: 6, rocks: 4, skulls: 2, tumble: 3 },
    drawFar(ctx, W, H, hy, off) {
      ctx.fillStyle = "#D8905C";
      scroll(off * .04, 340, (x, k) => {
        mesa(ctx, x, hy, 220, 60 + Math.abs(Math.sin(k * 5.1)) * 70);
      });
    },
    drawMid(ctx, W, H, hy, off) {
      ctx.fillStyle = "#E0A468";
      scroll(off * .14, 260, (x, k) => {
        ctx.beginPath();
        ctx.moveTo(x - 130, hy);
        ctx.quadraticCurveTo(x, hy - 40 - Math.abs(Math.sin(k * 3.3)) * 40, x + 130, hy);
        ctx.fill();
      });
    },
    drawProp(ctx, kind, seed) {
      const R = mulberry(seed);
      if (kind === "cactus") {
        const h = 1.6 + R() * 1;
        Draw.rr(ctx, -.2, -h, .4, h, .2); _shS(ctx, "#5E9A4A", "#3E7030");
        Draw.rr(ctx, -.55, -h * .68, .3, .16, .08); _shS(ctx, "#5E9A4A", "#3E7030");
        Draw.rr(ctx, -.55, -h * .68 - .5, .16, .55, .08); _shS(ctx, "#5E9A4A", "#3E7030");
        Draw.rr(ctx, .28, -h * .5, .3, .16, .08); _shS(ctx, "#528842", "#3E7030");
        Draw.rr(ctx, .42, -h * .5 - .4, .16, .45, .08); _shS(ctx, "#528842", "#3E7030");
        ctx.strokeStyle = "#3E7030"; ctx.lineWidth = .025;
        for (let k = 0; k < 4; k++) {
          ctx.beginPath(); ctx.moveTo(-.1, -.2 - k * h / 4); ctx.lineTo(-.1, -.32 - k * h / 4); ctx.stroke();
        }
      } else if (kind === "rock") {
        Draw.blob(ctx, [{ x: -.5, y: 0 }, { x: -.35, y: -.45 }, { x: .05, y: -.6 }, { x: .48, y: -.3 }, { x: .45, y: 0 }]);
        _shS(ctx, "#D8A870", "#A87848");
        ctx.fillStyle = "#C09060";
        ctx.beginPath(); ctx.moveTo(.05, -.6); ctx.lineTo(.48, -.3); ctx.lineTo(.1, -.35); ctx.closePath(); ctx.fill();
      } else if (kind === "skull") {
        Draw.ell(ctx, 0, -.2, .3, .24); _shS(ctx, "#F2E8D4", "#C4B490");
        Draw.cir(ctx, -.11, -.24, .07); _sh(ctx, "#8A7A58");
        Draw.cir(ctx, .11, -.24, .07); _sh(ctx, "#8A7A58");
        ctx.strokeStyle = "#C4B490"; ctx.lineWidth = .04;
        ctx.beginPath(); ctx.moveTo(-.06, -.08); ctx.lineTo(-.02, 0); ctx.moveTo(.06, -.08); ctx.lineTo(.02, 0); ctx.stroke();
      } else { // tumbleweed
        const r = .32 + R() * .2;
        ctx.strokeStyle = "#A8865A"; ctx.lineWidth = .025;
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          ctx.ellipse(0, -r, r, r * .9, k * .6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    obstacles: [
      { id: "cactusBig", type: "jump", name: "巨型仙人掌" },
      { id: "duneRock", type: "jump", name: "红岩堆" },
      { id: "deadwood", type: "slide", name: "枯树杈" },
    ],
    drawObstacle(ctx, id, t) {
      if (id === "cactusBig") {
        Draw.rr(ctx, -.3, -1.25, .6, 1.25, .3); _shS(ctx, "#4E8A3E", "#2E5A22");
        Draw.rr(ctx, -.85, -.9, .48, .2, .1); _shS(ctx, "#4E8A3E", "#2E5A22");
        Draw.rr(ctx, -.85, -1.3, .2, .5, .1); _shS(ctx, "#4E8A3E", "#2E5A22");
        Draw.rr(ctx, .38, -.75, .48, .2, .1); _shS(ctx, "#457E36", "#2E5A22");
        Draw.rr(ctx, .66, -1.1, .2, .42, .1); _shS(ctx, "#457E36", "#2E5A22");
        // 小红花
        Draw.cir(ctx, 0, -1.28, .07); _sh(ctx, "#E5538A");
        ctx.strokeStyle = "#2E5A22"; ctx.lineWidth = .03;
        for (let k = 0; k < 5; k++) {
          ctx.beginPath(); ctx.moveTo(0, -.15 - k * .22); ctx.lineTo(0, -.3 - k * .22); ctx.stroke();
        }
      } else if (id === "duneRock") {
        Draw.blob(ctx, [{ x: -.8, y: 0 }, { x: -.6, y: -.6 }, { x: -.1, y: -.85 }, { x: .5, y: -.55 }, { x: .75, y: 0 }]);
        _shS(ctx, "#C87848", "#98542C");
        Draw.blob(ctx, [{ x: -.2, y: -.8 }, { x: .1, y: -1.15 }, { x: .5, y: -.7 }, { x: .2, y: -.6 }]);
        _shS(ctx, "#D88858", "#98542C");
        ctx.fillStyle = "rgba(255,240,200,.35)";
        ctx.beginPath(); ctx.moveTo(-.6, -.6); ctx.lineTo(-.1, -.85); ctx.lineTo(-.2, -.5); ctx.closePath(); ctx.fill();
      } else { // deadwood 枯树杈（悬挂）
        ctx.strokeStyle = "#8A6844"; ctx.lineWidth = .2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-1, 2.9); ctx.quadraticCurveTo(0, 2.7, 1, 2.9); ctx.stroke();
        ctx.lineWidth = .11;
        ctx.beginPath(); ctx.moveTo(-.45, 2.78); ctx.lineTo(-.65, 2.0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(.5, 2.8); ctx.lineTo(.68, 2.1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-.62, 2.25); ctx.lineTo(-.35, 1.75); ctx.stroke();
        // 挂着的秃鹫剪影(装饰)
        ctx.fillStyle = "#5E4A38";
        Draw.ell(ctx, .68, 1.95, .13, .18); ctx.fill();
        Draw.ell(ctx, .68, 2.08, .22, .07); ctx.fill();
        Draw.cir(ctx, .68, 1.8, .08); ctx.fill();
      }
    },
  },

  /* ─────────── 雪山 ─────────── */
  {
    id: "snow", name: "雪山",
    skyTop: "#A8CFE8", skyBot: "#EAF4FA",
    sun: "#FFF6D8", sunY: .16, cloud: "#FFFFFF",
    ground: "#EAF2F8", groundDark: "#D4E4F0",
    road: "#C8DCEA", roadEdge: "#A8C4D8", stripe: "rgba(90,130,170,.4)",
    fog: "234,244,250",
    props: { snowpines: 7, icerocks: 4, snowmen: 2 },
    drawFar(ctx, W, H, hy, off) {
      scroll(off * .03, 300, (x, k) => {
        const h = 150 + Math.abs(Math.sin(k * 4.7)) * 130;
        ctx.fillStyle = "#B8D2E4";
        tri(ctx, x, hy, 260, h);
        ctx.fillStyle = "#F4FAFE";
        tri(ctx, x, hy, 260, h * .38);
      });
    },
    drawMid(ctx, W, H, hy, off) {
      ctx.fillStyle = "#D8E8F2";
      scroll(off * .12, 240, (x) => {
        Draw.ell(ctx, x, hy + 6, 110, 42); ctx.fill();
        Draw.ell(ctx, x + 80, hy + 10, 70, 30); ctx.fill();
      });
    },
    drawProp(ctx, kind, seed) {
      const R = mulberry(seed);
      if (kind === "snowpine") {
        const h = 2.6 + R() * 1.4;
        ctx.fillStyle = "#6E4A28"; ctx.fillRect(-.11, -h * .22, .22, h * .22);
        for (let i = 0; i < 3; i++) {
          const w = .9 - i * .2, yy = -h * (.22 + i * .26);
          ctx.fillStyle = "#2E6A46";
          ctx.beginPath(); ctx.moveTo(0, yy - h * .4); ctx.lineTo(w, yy); ctx.lineTo(-w, yy); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#F4FAFE";
          ctx.beginPath(); ctx.moveTo(0, yy - h * .4); ctx.lineTo(w * .55, yy - h * .14); ctx.lineTo(-w * .55, yy - h * .14); ctx.closePath(); ctx.fill();
        }
      } else if (kind === "icerock") {
        Draw.blob(ctx, [{ x: -.42, y: 0 }, { x: -.3, y: -.5 }, { x: .08, y: -.62 }, { x: .4, y: -.3 }, { x: .38, y: 0 }]);
        _shS(ctx, "#D8ECF8", "#A0C4DC");
        ctx.fillStyle = "rgba(255,255,255,.6)";
        ctx.beginPath(); ctx.moveTo(-.3, -.5); ctx.lineTo(.08, -.62); ctx.lineTo(-.05, -.4); ctx.closePath(); ctx.fill();
      } else { // snowman
        Draw.cir(ctx, 0, -.2, .24); _shS(ctx, "#F8FBFE", "#C0D4E4");
        Draw.cir(ctx, 0, -.58, .17); _shS(ctx, "#F8FBFE", "#C0D4E4");
        Draw.cir(ctx, -.05, -.6, .02); _sh(ctx, "#3A2A18");
        Draw.cir(ctx, .05, -.6, .02); _sh(ctx, "#3A2A18");
        Draw.cir(ctx, 0, -.55, .015); _sh(ctx, "#E8722A");
        Draw.rr(ctx, -.1, -.78, .2, .1, .04); _shS(ctx, "#E8722A", "#B8551E");
      }
    },
    obstacles: [
      { id: "snowmanBig", type: "jump", name: "大雪人" },
      { id: "iceBlock", type: "jump", name: "冰晶堆" },
      { id: "icicle", type: "slide", name: "冰凌横梁" },
    ],
    drawObstacle(ctx, id, t) {
      if (id === "snowmanBig") {
        Draw.cir(ctx, 0, -.42, .58); _shS(ctx, "#F8FBFE", "#B8D0E2");
        Draw.cir(ctx, 0, -1.05, .4); _shS(ctx, "#F8FBFE", "#B8D0E2");
        Draw.cir(ctx, -.13, -1.1, .05); _sh(ctx, "#3A2A18");
        Draw.cir(ctx, .13, -1.1, .05); _sh(ctx, "#3A2A18");
        Draw.cir(ctx, 0, -1.0, .03); _sh(ctx, "#E8722A");
        Draw.rr(ctx, -.26, -1.42, .52, .18, .08); _shS(ctx, "#5E8C4A", "#3E6A30"); // 帽
        Draw.rr(ctx, -.12, -1.6, .24, .22, .06); _shS(ctx, "#5E8C4A", "#3E6A30");
        ctx.strokeStyle = "#8A5A2B"; ctx.lineWidth = .05; ctx.lineCap = "round";
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(s * .5, -.5); ctx.lineTo(s * .78, -.85); ctx.stroke();
        }
        Draw.cir(ctx, -.78, -.85, .04); _sh(ctx, "#3A3A3A");
        Draw.cir(ctx, .78, -.85, .04); _sh(ctx, "#3A3A3A");
        ctx.strokeStyle = "#3A2A18"; ctx.lineWidth = .03;
        ctx.beginPath(); ctx.arc(0, -.98, .14, .3, Math.PI - .3); ctx.stroke();
      } else if (id === "iceBlock") {
        Draw.blob(ctx, [{ x: -.75, y: 0 }, { x: -.6, y: -.7 }, { x: -.1, y: -.95 }, { x: .5, y: -.65 }, { x: .7, y: 0 }]);
        _shS(ctx, "#BCE4F8", "#78B0D4");
        ctx.fillStyle = "rgba(255,255,255,.65)";
        ctx.beginPath(); ctx.moveTo(-.6, -.7); ctx.lineTo(-.1, -.95); ctx.lineTo(-.15, -.55); ctx.closePath(); ctx.fill();
        Draw.blob(ctx, [{ x: -.25, y: -.75 }, { x: .05, y: -1.2 }, { x: .45, y: -.8 }, { x: .1, y: -.6 }]);
        _shS(ctx, "#D0ECFB", "#78B0D4");
        const glint = (t * 2) % 2;
        if (glint < 1) {
          ctx.save(); ctx.globalAlpha = 1 - glint;
          ctx.strokeStyle = "#fff"; ctx.lineWidth = .05; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(.05, -1.2); ctx.lineTo(.2, -1.02); ctx.stroke();
          ctx.restore();
        }
      } else { // icicle 冰凌横梁
        Draw.rr(ctx, -1, 2.45, 2, .4, .12); _shS(ctx, "#A8D4EC", "#6AA4CC");
        ctx.fillStyle = "#D8EFFB";
        for (const x of [-.8, -.35, .1, .55]) {
          ctx.beginPath();
          ctx.moveTo(x, 2.45); ctx.lineTo(x + .22, 2.45);
          ctx.lineTo(x + .11, 2.45 + .3 + Math.abs(Math.sin(x * 20)) * .25);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = "rgba(255,255,255,.7)";
        Draw.rr(ctx, -1, 2.45, 2, .08, .04); ctx.fill();
        // 顶端支柱（视觉）
        ctx.strokeStyle = "#B8D8EC"; ctx.lineWidth = .1; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-.95, 2.85); ctx.lineTo(-.95, 2.6); ctx.moveTo(.95, 2.85); ctx.lineTo(.95, 2.6); ctx.stroke();
      }
    },
  },

  /* ─────────── 草原 ─────────── */
  {
    id: "grass", name: "草原",
    skyTop: "#6EC2F0", skyBot: "#D8F0D8",
    sun: "#FFE9A8", sunY: .2, cloud: "#FFFFFF",
    ground: "#8ECC6A", groundDark: "#72B452",
    road: "#D8B878", roadEdge: "#B89858", stripe: "rgba(120,80,30,.4)",
    fog: "216,240,216",
    props: { tufts: 8, flowers: 5, acacias: 3, fences: 3 },
    drawFar(ctx, W, H, hy, off) {
      ctx.fillStyle = "#A8D89A";
      scroll(off * .04, 280, (x) => {
        Draw.ell(ctx, x, hy + 4, 170, 52); ctx.fill();
        Draw.ell(ctx, x + 120, hy + 8, 100, 38); ctx.fill();
      });
    },
    drawMid(ctx, W, H, hy, off) {
      ctx.fillStyle = "#7CC060";
      scroll(off * .12, 320, (x, k) => {
        Draw.ell(ctx, x, hy + 8, 130, 40); ctx.fill();
        if (k % 3 === 0) { // 远处金合欢
          ctx.fillStyle = "#5E8A48";
          ctx.fillRect(x - 3, hy - 22, 6, 30);
          Draw.ell(ctx, x, hy - 30, 42, 14); ctx.fill();
          ctx.fillStyle = "#7CC060";
        }
      });
    },
    drawProp(ctx, kind, seed) {
      const R = mulberry(seed);
      if (kind === "tuft") {
        ctx.strokeStyle = "#5AA040"; ctx.lineWidth = .06; ctx.lineCap = "round";
        for (const [dx, h, bend] of [[-.2, .5, -.15], [0, .7, 0], [.2, .55, .15], [-.08, .45, -.08], [.1, .5, .1]]) {
          ctx.beginPath(); ctx.moveTo(dx, 0); ctx.quadraticCurveTo(dx + bend, -h * .6, dx + bend * 2.4, -h); ctx.stroke();
        }
        if (R() > .6) { Draw.cir(ctx, .15, -.6, .05); _sh(ctx, "#FFE28A"); }
      } else if (kind === "flowers") {
        const cols = ["#F28FB4", "#FFE28A", "#A8D8F0", "#FFF"];
        for (let k = 0; k < 3; k++) {
          const x = -.25 + k * .22 + R() * .08, h = .28 + R() * .16;
          ctx.strokeStyle = "#5AA040"; ctx.lineWidth = .035;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -h); ctx.stroke();
          for (let p = 0; p < 5; p++) {
            const a = p / 5 * Math.PI * 2;
            Draw.cir(ctx, x + Math.cos(a) * .05, -h + Math.sin(a) * .05, .035);
            _sh(ctx, cols[(seed + k) % 4]);
          }
          Draw.cir(ctx, x, -h, .025); _sh(ctx, "#F5C542");
        }
      } else if (kind === "acacia") {
        const h = 2.2 + R() * 1;
        ctx.fillStyle = "#8A5A2B";
        ctx.beginPath();
        ctx.moveTo(-.1, 0); ctx.lineTo(.1, 0); ctx.lineTo(.04, -h); ctx.lineTo(-.04, -h);
        ctx.closePath(); ctx.fill();
        Draw.ell(ctx, 0, -h - .15, .85, .3); _shS(ctx, "#6FAE52", "#4E8838");
        Draw.ell(ctx, -.4, -h + .05, .45, .18); _sh(ctx, "#6FAE52");
        Draw.ell(ctx, .42, -h, .4, .16); _sh(ctx, "#7EBC5E");
      } else { // fence
        ctx.fillStyle = "#B89058";
        ctx.fillRect(-.6, -.5, .12, .5); ctx.fillRect(.5, -.5, .12, .5);
        Draw.rr(ctx, -.68, -.42, 1.4, .1, .04); ctx.fill();
        Draw.rr(ctx, -.68, -.22, 1.4, .1, .04); ctx.fill();
      }
    },
    obstacles: [
      { id: "fence", type: "jump", name: "木栅栏" },
      { id: "hay", type: "jump", name: "干草堆" },
      { id: "geese", type: "slide", name: "低飞雁阵" },
    ],
    drawObstacle(ctx, id, t) {
      if (id === "fence") {
        ctx.fillStyle = "#C89858";
        ctx.fillRect(-.95, -.75, .14, .75); ctx.fillRect(.83, -.75, .14, .75);
        ctx.beginPath(); ctx.moveTo(-.95, -.5); ctx.lineTo(.9, -.5); ctx.lineTo(.9, -.34); ctx.lineTo(-.95, -.34); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-.95, -.22); ctx.lineTo(.9, -.22); ctx.lineTo(.9, -.06); ctx.lineTo(-.95, -.06); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#A87838";
        ctx.fillRect(-.95, -.8, .3, .1); ctx.fillRect(.7, -.8, .3, .1);
      } else if (id === "hay") {
        Draw.ell(ctx, 0, -.5, .8, .55); _shS(ctx, "#E8C05A", "#B89030");
        ctx.strokeStyle = "#C8A03C"; ctx.lineWidth = .04;
        for (const ry of [.12, .38, .64]) {
          ctx.beginPath(); ctx.ellipse(0, -.5, .8 * ry + .12, .1, 0, 0, Math.PI * 2); ctx.stroke();
        }
        Draw.ell(ctx, 0, -.98, .3, .2); _shS(ctx, "#F2D06A", "#B89030");
        // 叉子
        ctx.strokeStyle = "#8A5A2B"; ctx.lineWidth = .06; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(.55, -.3); ctx.lineTo(.75, -.95); ctx.stroke();
        ctx.lineWidth = .045;
        for (const dx of [-.06, 0, .06]) {
          ctx.beginPath(); ctx.moveTo(.75 + dx, -.95); ctx.lineTo(.75 + dx, -1.15); ctx.stroke();
        }
      } else { // geese 低飞雁阵
        const flap = Math.sin(t * 10) * .18;
        ctx.fillStyle = "#5E6E7E";
        for (const [x, y, sc] of [[-.55, 2.15, .8], [0, 1.9, 1], [.55, 2.2, .8]]) {
          ctx.save();
          ctx.translate(x, y); ctx.scale(sc, sc);
          Draw.ell(ctx, 0, 0, .3, .18); ctx.fill(); // 身体
          Draw.cir(ctx, .28, -.1, .12); ctx.fill(); // 头
          Draw.rr(ctx, .36, -.1, .12, .05, .02); ctx.fillStyle = "#E8A03C"; ctx.fill(); // 嘴
          ctx.fillStyle = "#3A4A5A"; Draw.cir(ctx, .3, -.12, .025); ctx.fill();
          ctx.fillStyle = "#DCE4EC"; // 翅膀
          ctx.beginPath();
          ctx.moveTo(-.1, -.05);
          ctx.quadraticCurveTo(-.35, -.45 + flap * 2, -.02, -.12 + flap);
          ctx.quadraticCurveTo(.12, -.05 + flap * .5, -.1, -.05);
          ctx.fill();
          ctx.fillStyle = "#5E6E7E";
          ctx.restore();
        }
      }
    },
  },
];

const trackById = (id) => TRACKS.find(t => t.id === id) || TRACKS[0];

/* ── 主题相关的环境粒子 ── */
function ambientFor(trackId) {
  switch (trackId) {
    case "snow": return { n: 40, type: "snow" };
    case "forest": return { n: 8, type: "leaf" };
    case "grass": return { n: 6, type: "petal" };
    case "desert": return { n: 5, type: "sand" };
    default: return { n: 0, type: "none" };
  }
}

/* ── 菜单里的赛道缩略图 ── */
function drawTrackPreview(cv, track) {
  const ctx = cv.getContext("2d");
  const w = cv.width, h = cv.height;
  const hy = h * .42;
  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, track.skyTop); sky.addColorStop(1, track.skyBot);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hy);
  Draw.cir(ctx, w * .78, hy * .5, h * .13); ctx.fillStyle = track.sun; ctx.fill();
  ctx.globalAlpha = .8;
  Draw.ell(ctx, w * .25, hy * .3, h * .12, h * .05); ctx.fillStyle = track.cloud; ctx.fill();
  Draw.ell(ctx, w * .62, hy * .18, h * .09, h * .04); ctx.fill();
  ctx.globalAlpha = 1;
  track.drawFar(ctx, w, h, hy, 40);
  track.drawMid(ctx, w, h, hy, 60);
  const g2 = ctx.createLinearGradient(0, hy, 0, h);
  g2.addColorStop(0, track.groundDark); g2.addColorStop(.35, track.ground);
  ctx.fillStyle = g2; ctx.fillRect(0, hy, w, h - hy);
  // 小路
  ctx.beginPath();
  ctx.moveTo(w * .5 - w * .05, hy);
  ctx.lineTo(w * .5 + w * .05, hy);
  ctx.lineTo(w + w * .12, h);
  ctx.lineTo(-w * .12, h);
  ctx.closePath();
  ctx.fillStyle = track.road; ctx.fill();
  // 一个标志性景物
  ctx.save();
  ctx.translate(w * .2, h * .92);
  const kinds = Object.keys(track.props);
  ctx.scale(h / 3.2, h / 3.2);
  track.drawProp(ctx, kinds[0], 7);
  ctx.restore();
}

/* ── 小工具 ── */
function tri(ctx, x, y, w, h) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x - w / 2, y - h); ctx.closePath(); ctx.fill();
}
function mesa(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * .3, y - h); ctx.lineTo(x + w * .3, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.closePath(); ctx.fill();
}
function mulberry(seed) {
  let a = seed * 1103515245 + 12345 >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = U.clamp((n >> 16) + amt, 0, 255), g = U.clamp((n >> 8 & 255) + amt, 0, 255), b = U.clamp((n & 255) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}
/* 无限滚动辅助：spacing 间隔像素，fn(x, k) 绘制每一项 */
function scroll(off, spacing, fn) {
  const W = SCROLL_W || 1000;
  const start = Math.floor(off / spacing) - 1;
  const count = Math.ceil(W / spacing) + 3;
  for (let k = start; k < start + count; k++) fn(k * spacing - off, k);
}
let SCROLL_W = 1000;
