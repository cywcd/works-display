const Sprites = (() => {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h) {
      this.beginPath();
      this.rect(x, y, w, h);
    };
  }

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  function fillStroke(ctx, fill, stroke, width) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width || 2.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  function roundPoly(ctx, pts, r) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  function shade(hex, amt) {
    const n = hex.replace("#", "");
    const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (num & 255) + amt));
    return `rgb(${r},${g},${b})`;
  }

  function spots(ctx, color, list) {
    ctx.fillStyle = color;
    list.forEach(([x, y, r]) => {
      ellipse(ctx, x, y, r, r * 0.78);
      ctx.fill();
    });
  }

  function drawEyes(ctx, char, blink, ox, oy, size, look) {
    const p = char.palette;
    const open = blink > 0.08 ? 1 : 0.12;
    const s = size || 1;
    const lookX = look == null ? 1.6 : look;
    [[-10 * s, 0], [11 * s, 0]].forEach(([x, y]) => {
      ellipse(ctx, ox + x, oy + y, 8.4 * s, 8.8 * s * open);
      fillStroke(ctx, "#fffdf6", p.lash, 1.6);
      if (open > 0.4) {
        ellipse(ctx, ox + x + lookX, oy + y + 1.2, 3.4 * s, 3.8 * s * open);
        fillStroke(ctx, p.eye);
        ctx.fillStyle = "#fff";
        ellipse(ctx, ox + x + lookX + 1.2, oy + y - 1.4, 1.3 * s, 1.5 * s);
        ctx.fill();
      }
      if (char.body.lashes > 0.4) {
        ctx.strokeStyle = p.lash;
        ctx.lineWidth = 1.5;
        const n = char.id === "niulai" || char.body.lashes > 1 ? 4 : 3;
        for (let k = 0; k < n; k += 1) {
          const a = -Math.PI * 0.85 + k * 0.28;
          ctx.beginPath();
          ctx.moveTo(ox + x + Math.cos(a) * 8.2 * s, oy + y + Math.sin(a) * 8.4 * s * open);
          ctx.lineTo(ox + x + Math.cos(a) * (11 + char.body.lashes * 2) * s, oy + y + Math.sin(a) * (11.5 + char.body.lashes) * s * open);
          ctx.stroke();
        }
      }
    });
    ctx.strokeStyle = p.lash;
    ctx.lineWidth = 1.8;
    const brow = char.body.brow;
    ctx.beginPath();
    ctx.moveTo(ox - 16, oy - 12 - brow);
    ctx.quadraticCurveTo(ox - 10, oy - 15 - brow, ox - 5, oy - 12 - brow * 0.4);
    ctx.moveTo(ox + 5, oy - 12 - brow * 0.4);
    ctx.quadraticCurveTo(ox + 10, oy - 15 - brow, ox + 16, oy - 12 - brow);
    ctx.stroke();
  }

  function drawHat(ctx, hat, y) {
    const h = HATS[hat];
    const [a, b] = h.colors;
    ctx.save();
    ctx.translate(0, y);
    if (h.id === "cap") {
      ellipse(ctx, 0, 0, 22, 10);
      fillStroke(ctx, a, "#2a1c10", 2);
      ctx.beginPath();
      ctx.ellipse(18, 4, 16, 5, -0.2, 0, Math.PI * 2);
      fillStroke(ctx, b, "#2a1c10", 2);
    } else if (h.id === "helmet") {
      ellipse(ctx, 0, -2, 24, 16);
      fillStroke(ctx, a, "#2a1c10", 2);
      ctx.fillStyle = b;
      ctx.fillRect(-22, -2, 44, 5);
      ellipse(ctx, 10, -6, 5, 4);
      fillStroke(ctx, "#8fd4f0", "#2a1c10", 1.5);
    } else if (h.id === "band") {
      ctx.beginPath();
      ctx.roundRect(-22, -4, 44, 10, 4);
      fillStroke(ctx, a, "#2a1c10", 2);
      ctx.fillStyle = b;
      ctx.fillRect(-4, -4, 8, 10);
    } else if (h.id === "explorer") {
      ellipse(ctx, 0, 6, 30, 8);
      fillStroke(ctx, a, "#2a1c10", 2);
      ellipse(ctx, 0, -2, 16, 10);
      fillStroke(ctx, shade(a, 20), "#2a1c10", 2);
      ctx.fillStyle = h.colors[1];
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(4, -22);
      ctx.lineTo(-1, -14);
      ctx.fill();
    } else if (h.id === "crown") {
      ["#e07090", "#f0d24a", "#7ab05a", "#e07090", "#f0d24a"].forEach((c, i) => {
        ellipse(ctx, -16 + i * 8, -6 + (i % 2) * 3, 5, 6);
        fillStroke(ctx, c, "#2a1c10", 1.4);
      });
    } else {
      ellipse(ctx, 0, -4, 22, 16);
      fillStroke(ctx, a, "#2a1c10", 2);
      ctx.beginPath();
      ctx.roundRect(-8, -22, 16, 10, 4);
      fillStroke(ctx, b, "#2a1c10", 2);
    }
    ctx.restore();
  }

  function drawSuit(ctx, suit, bulk) {
    const s = SUITS[suit];
    const [a, b] = s.colors;
    ctx.save();
    if (s.id === "jersey") {
      ctx.beginPath();
      ctx.roundRect(-22 * bulk, -8, 44 * bulk, 28, 8);
      fillStroke(ctx, a, "#2a1c10", 2.2);
      ctx.fillStyle = b;
      ctx.fillRect(-6, -2, 12, 18);
    } else if (s.id === "hoodie") {
      ctx.beginPath();
      ctx.roundRect(-24 * bulk, -10, 48 * bulk, 32, 12);
      fillStroke(ctx, a, "#2a1c10", 2.2);
      ellipse(ctx, 18 * bulk, 6, 7, 10);
      fillStroke(ctx, shade(a, -20), "#2a1c10", 1.8);
    } else if (s.id === "racing") {
      ctx.beginPath();
      ctx.roundRect(-22 * bulk, -8, 44 * bulk, 30, 6);
      fillStroke(ctx, a, "#2a1c10", 2.2);
      ctx.fillStyle = b;
      ctx.fillRect(-22 * bulk, 4, 44 * bulk, 6);
      ctx.fillStyle = "#f0d24a";
      ctx.fillRect(10 * bulk, -6, 8, 22);
    } else if (s.id === "rain") {
      ctx.beginPath();
      ctx.moveTo(-28 * bulk, -8);
      ctx.lineTo(28 * bulk, -8);
      ctx.lineTo(24 * bulk, 26);
      ctx.lineTo(-24 * bulk, 26);
      ctx.closePath();
      fillStroke(ctx, a, "#2a1c10", 2.2);
      ctx.fillStyle = b;
      ctx.fillRect(-4, -8, 8, 18);
    } else if (s.id === "down") {
      ctx.beginPath();
      ctx.roundRect(-26 * bulk, -8, 52 * bulk, 32, 14);
      fillStroke(ctx, a, "#2a1c10", 2.2);
      ctx.strokeStyle = s.colors[1];
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-20 * bulk, -2 + i * 8);
        ctx.lineTo(20 * bulk, -2 + i * 8);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.roundRect(-22 * bulk, -8, 44 * bulk, 30, 8);
      fillStroke(ctx, a, "#2a1c10", 2.2);
      ctx.fillStyle = b;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, 8);
      ctx.lineTo(-6, 8);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShoe(ctx, shoe, x, y, flip) {
    const s = SHOES[shoe];
    const [a, b] = s.colors;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.roundRect(-8, -8, 22, 12, 5);
    fillStroke(ctx, a, "#2a1c10", 2);
    if (s.id === "boot") {
      ctx.beginPath();
      ctx.roundRect(-6, -18, 12, 12, 3);
      fillStroke(ctx, shade(a, 20), "#2a1c10", 2);
    } else if (s.id === "sandal") {
      ctx.strokeStyle = b;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.lineTo(8, 0);
      ctx.stroke();
    } else if (s.id === "skate") {
      ctx.fillStyle = "#9aa8b4";
      ctx.fillRect(-4, 3, 16, 3);
      ctx.fillRect(-2, 4, 2, 6);
      ctx.fillRect(8, 4, 2, 6);
    } else if (s.id === "roller") {
      ellipse(ctx, -2, 6, 3.2, 3.2);
      fillStroke(ctx, "#222", "#2a1c10", 1.2);
      ellipse(ctx, 10, 6, 3.2, 3.2);
      fillStroke(ctx, "#222", "#2a1c10", 1.2);
    } else if (s.id === "cloud") {
      ellipse(ctx, 4, 2, 12, 6);
      fillStroke(ctx, b, "#2a1c10", 1.6);
    } else {
      ctx.fillStyle = b;
      ctx.fillRect(8, -6, 6, 8);
    }
    ctx.restore();
  }

  function drawBovine(ctx, char, t, pose, gear) {
    const p = char.palette;
    const b = char.body;
    const run = pose.sliding ? 0 : Math.sin(t * 14);
    const bob = pose.air ? 0 : Math.abs(Math.sin(t * 14)) * 3;
    const ink = "#2a1c10";
    ctx.save();
    ctx.translate(0, bob);

    ctx.save();
    ctx.translate(-28 * b.bulk, 10);
    ctx.rotate(-0.6 + run * 0.15);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8, 8, -4, 18);
    fillStroke(ctx, p.furDark, ink, 2);
    ctx.restore();

    const legs = [
      [-12, 18, run],
      [6, 18, -run],
      [-4, 20, -run * 0.8],
      [14, 20, run * 0.8],
    ];
    legs.forEach(([x, y, ph], i) => {
      const lift = pose.sliding ? 6 : ph * 7;
      ctx.beginPath();
      ctx.roundRect(x - 5, y + lift, 9, pose.sliding ? 10 : 18, 4);
      fillStroke(ctx, i < 2 ? p.furDark : p.fur, ink, 2);
      if (!pose.sliding) drawShoe(ctx, gear.shoe, x + 4, y + lift + 18, false);
      else drawShoe(ctx, gear.shoe, x + 6, y + 12, false);
    });

    ellipse(ctx, 0, 6, 26 * b.bulk, 18 * b.bulk);
    fillStroke(ctx, p.fur, ink, 2.6);
    ellipse(ctx, 4, 10, 16 * b.bulk, 10 * b.bulk);
    fillStroke(ctx, p.belly);
    drawSuit(ctx, gear.suit, b.bulk);

    ctx.save();
    ctx.translate(18 * b.scale, -20 * b.scale - (pose.air ? 2 : 0));
    ctx.rotate(pose.sliding ? 0.25 : 0);

    if (b.horns > 0.2) {
      const hs = 7 + b.horns * 10;
      [[-16, -22], [12, -24]].forEach(([x, y], i) => {
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.quadraticCurveTo(x + (i ? 8 : -8), y - hs * 0.2, x + (i ? 4 : -4), y - hs);
        ctx.quadraticCurveTo(x + (i ? 2 : -2), y - 4, x + (i ? -2 : 2), y + 8);
        fillStroke(ctx, p.horn, ink, 2);
      });
    }

    ctx.beginPath();
    ctx.ellipse(-24, -6, 8, 12, -0.5, 0, Math.PI * 2);
    fillStroke(ctx, p.earRim, ink, 2);
    ctx.beginPath();
    ctx.ellipse(-24, -6, 4.5, 7, -0.5, 0, Math.PI * 2);
    fillStroke(ctx, p.innerEar);
    ctx.beginPath();
    ctx.ellipse(22, -10, 8, 12, 0.45, 0, Math.PI * 2);
    fillStroke(ctx, p.earRim, ink, 2);
    ctx.beginPath();
    ctx.ellipse(22, -10, 4.5, 7, 0.45, 0, Math.PI * 2);
    fillStroke(ctx, p.innerEar);

    ellipse(ctx, 0, 0, 30, 28);
    fillStroke(ctx, p.furLight, ink, 2.8);
    ellipse(ctx, 3, 12, 18, 13);
    fillStroke(ctx, p.muzzle, ink, 2);
    ellipse(ctx, 6, 10, 6.6, 5);
    fillStroke(ctx, p.nose);
    ctx.fillStyle = "#fff8f0";
    ellipse(ctx, 8, 8.5, 1.5, 1.1);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(8, 15);
    ctx.quadraticCurveTo(13, 19, 7, 19);
    ctx.stroke();

    drawEyes(ctx, char, pose.blink, -1, -5, char.id === "niulai" ? 1.14 : 1, char.id === "niulai" ? 2.3 : 1.6);
    drawHat(ctx, gear.hat, -24);
    ctx.restore();
    ctx.restore();
  }

  function drawLark(ctx, char, t, pose, gear) {
    const p = char.palette;
    const flap = pose.air ? Math.sin(t * 18) * 0.5 : Math.sin(t * 10) * 0.18;
    const ink = "#2a1c10";
    ctx.save();
    ctx.translate(0, pose.sliding ? 8 : Math.sin(t * 8) * 2);
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.quadraticCurveTo(-28, 4 + flap * 20, -18, -10 - flap * 16);
    ctx.quadraticCurveTo(-6, 0, 2, 8);
    fillStroke(ctx, p.furDark, ink, 2.2);
    ellipse(ctx, 0, 6, 22, 14);
    fillStroke(ctx, p.fur, ink, 2.4);
    ellipse(ctx, 6, 10, 14, 8);
    fillStroke(ctx, p.belly);
    drawSuit(ctx, gear.suit, 0.85);
    ctx.save();
    ctx.translate(16, -10);
    ctx.beginPath();
    ctx.moveTo(-4, -12);
    ctx.lineTo(2, -22);
    ctx.lineTo(6, -10);
    fillStroke(ctx, p.furDark, ink, 2);
    ellipse(ctx, 0, 0, 16, 14);
    fillStroke(ctx, p.furLight, ink, 2.4);
    ctx.beginPath();
    ctx.moveTo(14, 2);
    ctx.lineTo(26, 4);
    ctx.lineTo(14, 8);
    fillStroke(ctx, p.nose, ink, 2);
    drawEyes(ctx, char, pose.blink, -2, -2, 0.82);
    drawHat(ctx, gear.hat, -16);
    ctx.restore();
    drawShoe(ctx, gear.shoe, 6, 22, false);
    drawShoe(ctx, gear.shoe, 16, 22, false);
    ctx.restore();
  }

  function drawSnake(ctx, char, t, pose, gear) {
    const p = char.palette;
    const ink = "#2a1c10";
    ctx.save();
    ctx.translate(0, pose.sliding ? 10 : 4);
    for (let i = 6; i >= 0; i -= 1) {
      const x = -30 + i * 10;
      const y = Math.sin(t * 10 + i * 0.7) * (pose.air ? 4 : 8);
      ellipse(ctx, x, 10 + y, 10 - i * 0.4, 8);
      fillStroke(ctx, i % 2 ? p.furLight : p.fur, ink, 2);
      if (i === 3 || i === 5) {
        ctx.fillStyle = p.accent;
        ellipse(ctx, x, 8 + y, 3, 2);
        ctx.fill();
      }
    }
    drawSuit(ctx, gear.suit, 0.7);
    ctx.save();
    ctx.translate(28, -6 + Math.sin(t * 10) * 2);
    ellipse(ctx, 0, 0, 16, 14);
    fillStroke(ctx, p.furLight, ink, 2.4);
    ctx.beginPath();
    ctx.moveTo(14, 2);
    ctx.lineTo(24, 0);
    ctx.lineTo(14, 6);
    fillStroke(ctx, p.furDark, ink, 2);
    ctx.strokeStyle = "#e24a3b";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(30, -4);
    ctx.moveTo(24, 0);
    ctx.lineTo(30, 4);
    ctx.stroke();
    drawEyes(ctx, char, pose.blink, -2, -2, 0.72);
    drawHat(ctx, gear.hat, -16);
    ctx.restore();
    drawShoe(ctx, gear.shoe, -20, 22, false);
    drawShoe(ctx, gear.shoe, 4, 24, false);
    ctx.restore();
  }

  function drawLeopard(ctx, char, t, pose, gear) {
    const p = char.palette;
    const run = Math.sin(t * 15);
    const ink = "#2a1c10";
    ctx.save();
    ctx.translate(0, pose.sliding ? 6 : Math.abs(run) * 2);
    ctx.save();
    ctx.translate(-24, 6);
    ctx.rotate(-0.5);
    ellipse(ctx, 0, 0, 7, 14);
    fillStroke(ctx, p.fur, ink, 2);
    ctx.restore();
    [[-10, 16, run], [8, 16, -run], [0, 18, -run], [16, 18, run]].forEach(([x, y, ph]) => {
      ctx.beginPath();
      ctx.roundRect(x, y + ph * 6, 8, 16, 4);
      fillStroke(ctx, p.fur, ink, 2);
      drawShoe(ctx, gear.shoe, x + 6, y + ph * 6 + 16, false);
    });
    ellipse(ctx, 2, 4, 24, 16);
    fillStroke(ctx, p.fur, ink, 2.4);
    spots(ctx, p.spot, [[-8, 0, 3], [6, -4, 2.4], [12, 6, 2.8], [-2, 8, 2], [18, 2, 2.2]]);
    ellipse(ctx, 4, 10, 14, 8);
    fillStroke(ctx, p.belly);
    drawSuit(ctx, gear.suit, 0.9);
    ctx.save();
    ctx.translate(20, -16);
    [[-16, -10, -0.4], [12, -12, 0.35]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 10, r, 0, Math.PI * 2);
      fillStroke(ctx, p.fur, ink, 2);
      ctx.beginPath();
      ctx.ellipse(x, y, 3.5, 6, r, 0, Math.PI * 2);
      fillStroke(ctx, p.innerEar);
    });
    ellipse(ctx, 0, 0, 20, 18);
    fillStroke(ctx, p.furLight, ink, 2.4);
    ellipse(ctx, 6, 8, 12, 9);
    fillStroke(ctx, p.muzzle, ink, 2);
    ellipse(ctx, 10, 6, 4.2, 3.4);
    fillStroke(ctx, p.nose);
    spots(ctx, p.spot, [[-10, 4, 2], [8, -6, 1.8], [-4, -8, 1.6]]);
    drawEyes(ctx, char, pose.blink, -4, -2, 0.9);
    drawHat(ctx, gear.hat, -20);
    ctx.restore();
    ctx.restore();
  }

  function drawWolf(ctx, char, t, pose, gear) {
    const p = char.palette;
    const run = Math.sin(t * 14);
    const ink = "#2a1c10";
    ctx.save();
    ctx.translate(0, pose.sliding ? 6 : Math.abs(run) * 2);
    ctx.save();
    ctx.translate(-26, 4);
    ctx.rotate(-0.7);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, 16);
    ctx.lineTo(6, 8);
    fillStroke(ctx, p.furDark, ink, 2);
    ctx.restore();
    [[-8, 16, run], [10, 16, -run], [0, 18, -run], [18, 18, run]].forEach(([x, y, ph]) => {
      ctx.beginPath();
      ctx.roundRect(x, y + ph * 6, 8, 16, 3);
      fillStroke(ctx, p.fur, ink, 2);
      drawShoe(ctx, gear.shoe, x + 6, y + ph * 6 + 16, false);
    });
    ellipse(ctx, 2, 4, 24, 15);
    fillStroke(ctx, p.fur, ink, 2.4);
    ellipse(ctx, 4, 10, 13, 7);
    fillStroke(ctx, p.belly);
    drawSuit(ctx, gear.suit, 0.95);
    ctx.save();
    ctx.translate(18, -16);
    [[-14, -12], [10, -14]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 8);
      ctx.lineTo(x, y - 10);
      ctx.lineTo(x + 6, y + 8);
      fillStroke(ctx, p.furDark, ink, 2);
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 6);
      ctx.lineTo(x, y - 4);
      ctx.lineTo(x + 3, y + 6);
      fillStroke(ctx, p.innerEar);
    });
    ellipse(ctx, 0, 0, 18, 16);
    fillStroke(ctx, p.furLight, ink, 2.4);
    ctx.beginPath();
    ctx.moveTo(8, 4);
    ctx.lineTo(22, 8);
    ctx.lineTo(8, 12);
    fillStroke(ctx, p.muzzle, ink, 2);
    ellipse(ctx, 18, 8, 3.4, 2.6);
    fillStroke(ctx, p.nose);
    drawEyes(ctx, char, pose.blink, -4, -2, 0.78);
    drawHat(ctx, gear.hat, -20);
    ctx.restore();
    ctx.restore();
  }

  function drawCharacter(ctx, char, x, y, scale, t, flags, gear) {
    const pose = {
      air: !!(flags && flags.air),
      sliding: !!(flags && flags.sliding),
      blink: (t * 0.85) % 4 > 0.16 ? 1 : 0.12,
    };
    ctx.save();
    ctx.translate(x, y);
    if (pose.sliding) {
      ctx.translate(18, 6);
      ctx.rotate(0.42);
      ctx.scale(scale * 1.28, scale * 0.46);
    } else {
      ctx.scale(scale, scale);
    }
    if (flags && flags.dead) {
      ctx.rotate(0.5 + Math.sin(t * 20) * 0.1);
      ctx.globalAlpha = 0.9;
    }
    if (char.species === "lark") drawLark(ctx, char, t, pose, gear);
    else if (char.species === "snake") drawSnake(ctx, char, t, pose, gear);
    else if (char.species === "leopard") drawLeopard(ctx, char, t, pose, gear);
    else if (char.species === "wolf") drawWolf(ctx, char, t, pose, gear);
    else drawBovine(ctx, char, t, pose, gear);
    ctx.restore();
  }

  function drawCoin(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 6) * 0.2);
    const squash = 0.55 + Math.abs(Math.cos(t * 5)) * 0.45;
    ellipse(ctx, 0, 0, 12 * squash, 12);
    fillStroke(ctx, "#f0d24a", "#8a6410", 2.2);
    ellipse(ctx, 0, 0, 6 * squash, 6);
    fillStroke(ctx, "#fff3b0");
    ctx.restore();
  }

  function drawApple(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 4) * 3);
    ellipse(ctx, 0, 4, 13, 12);
    fillStroke(ctx, "#e24a3b", "#2a1c10", 2.2);
    ellipse(ctx, -4, 0, 4, 3);
    fillStroke(ctx, "#f07068");
    ctx.strokeStyle = "#3f7a3a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(6, -16, 8, -10);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(8, -10, 6, 3.5, 0.4, 0, Math.PI * 2);
    fillStroke(ctx, "#6b9a40", "#2a1c10", 1.6);
    ctx.restore();
  }

  function obstaclePath(ctx, kind, w, h) {
    const ink = "#2a1c10";
    if (kind === "log" || kind === "stump") {
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h, w, h, 8);
      fillStroke(ctx, kind === "log" ? "#8a5a2a" : "#6b4220", ink, 2.4);
      ctx.strokeStyle = "#c49a62";
      ctx.beginPath();
      ctx.arc(0, -h / 2, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === "rock" || kind === "stone" || kind === "dune") {
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.quadraticCurveTo(-w / 4, -h, 0, -h);
      ctx.quadraticCurveTo(w / 3, -h * 0.8, w / 2, 0);
      fillStroke(ctx, kind === "dune" ? "#e0b86a" : "#8a8074", ink, 2.4);
    } else if (kind === "vine" || kind === "icicle" || kind === "sign") {
      ctx.beginPath();
      ctx.roundRect(-w / 2, 0, w, h, kind === "icicle" ? 2 : 6);
      fillStroke(ctx, kind === "icicle" ? "#d8eef8" : kind === "sign" ? "#c4302b" : "#3f7a3a", ink, 2.2);
    } else if (kind === "mushroom") {
      ellipse(ctx, 0, -h * 0.35, w / 2, h * 0.35);
      fillStroke(ctx, "#e24a3b", ink, 2.2);
      ctx.beginPath();
      ctx.roundRect(-w * 0.16, -h * 0.3, w * 0.32, h * 0.3, 4);
      fillStroke(ctx, "#f0e0c0", ink, 2);
    } else if (kind === "bin" || kind === "crate" || kind === "barrier") {
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h, w, h, 4);
      fillStroke(ctx, kind === "bin" ? "#4a6a48" : kind === "crate" ? "#c49a5a" : "#f0d24a", ink, 2.2);
    } else if (kind === "hydrant") {
      ctx.beginPath();
      ctx.roundRect(-w * 0.2, -h, w * 0.4, h, 4);
      fillStroke(ctx, "#e24a3b", ink, 2.2);
      ellipse(ctx, 0, -h, w / 2, 8);
      fillStroke(ctx, "#c4302b", ink, 2);
    } else if (kind === "cactus") {
      ctx.beginPath();
      ctx.roundRect(-w * 0.18, -h, w * 0.36, h, 8);
      fillStroke(ctx, "#3f8f62", ink, 2.2);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h * 0.55, w * 0.34, 10, 5);
      fillStroke(ctx, "#3f8f62", ink, 2);
    } else if (kind === "bone" || kind === "skull") {
      ellipse(ctx, 0, -h * 0.55, w * 0.38, h * 0.38);
      fillStroke(ctx, "#f0e8d4", ink, 2.2);
    } else if (kind === "tumble") {
      ellipse(ctx, 0, -h / 2, w / 2, h / 2);
      fillStroke(ctx, "#c4a06a", ink, 2.2);
    } else if (kind === "ice" || kind === "pine" || kind === "snowman") {
      if (kind === "pine") {
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(w / 2, 0);
        ctx.lineTo(-w / 2, 0);
        fillStroke(ctx, "#2f5a38", ink, 2.2);
      } else if (kind === "snowman") {
        ellipse(ctx, 0, -h * 0.28, w * 0.4, w * 0.32);
        fillStroke(ctx, "#f4f8fc", ink, 2);
        ellipse(ctx, 0, -h * 0.68, w * 0.28, w * 0.26);
        fillStroke(ctx, "#f4f8fc", ink, 2);
      } else {
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h, w, h, 6);
        fillStroke(ctx, "#d4eef8", ink, 2.2);
      }
    } else if (kind === "fence" || kind === "hay" || kind === "bush" || kind === "mound") {
      ctx.beginPath();
      if (kind === "fence") {
        ctx.roundRect(-w / 2, -h, 8, h, 2);
        ctx.roundRect(w / 2 - 8, -h, 8, h, 2);
        ctx.roundRect(-w / 2, -h * 0.55, w, 8, 2);
        fillStroke(ctx, "#8a5a28", ink, 2);
      } else if (kind === "hay") {
        ctx.roundRect(-w / 2, -h, w, h, 10);
        fillStroke(ctx, "#e0b84a", ink, 2.2);
      } else if (kind === "bush") {
        ellipse(ctx, 0, -h * 0.45, w / 2, h * 0.5);
        fillStroke(ctx, "#3f7a3a", ink, 2.2);
      } else {
        ellipse(ctx, 0, -h * 0.4, w / 2, h * 0.45);
        fillStroke(ctx, "#8a5a28", ink, 2.2);
      }
    } else {
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h, w, h, 6);
      fillStroke(ctx, "#8a8074", ink, 2.2);
    }
  }

  function drawObstacle(ctx, ob) {
    if (ob.kind === "pit") {
      ctx.fillStyle = "rgba(20,12,8,0.85)";
      ctx.beginPath();
      ctx.ellipse(ob.x + ob.w / 2, ob.y, ob.w / 2, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ob.track === "snow" ? "#8aa8c4" : ob.track === "city" ? "#222" : "#3a2414";
      ctx.fillRect(ob.x, ob.y, ob.w, 18);
      return;
    }
    ctx.save();
    ctx.translate(ob.x + ob.w / 2, ob.y);
    if (ob.mode === "air") {
      ctx.fillStyle = "#2a1c10";
      ctx.fillRect(-2, 0, 4, 14);
      if (ob.kind === "icicle") {
        ctx.beginPath();
        ctx.moveTo(-ob.w / 2, 8);
        ctx.lineTo(0, ob.h);
        ctx.lineTo(ob.w / 2, 8);
        fillStroke(ctx, "#d8eef8", "#2a1c10", 2.2);
      } else if (ob.kind === "sign") {
        ctx.beginPath();
        ctx.roundRect(-ob.w / 2, 10, ob.w, ob.h - 18, 6);
        fillStroke(ctx, "#c4302b", "#2a1c10", 2.2);
        ctx.fillStyle = "#f7efe0";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("停", -10, 48);
      } else if (ob.kind === "cactus") {
        ctx.beginPath();
        ctx.roundRect(-10, 8, 20, ob.h - 12, 8);
        fillStroke(ctx, "#3f8f62", "#2a1c10", 2.2);
      } else {
        ctx.beginPath();
        ctx.roundRect(-ob.w / 2, 8, ob.w, ob.h - 14, 10);
        fillStroke(ctx, "#3f7a3a", "#2a1c10", 2.2);
      }
    } else {
      obstaclePath(ctx, ob.kind, ob.w, ob.h);
    }
    ctx.restore();
  }

  function drawBackground(ctx, w, h, track, dist, t) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, track.sky[0]);
    g.addColorStop(1, track.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const groundY = h * 0.72;
    ctx.fillStyle = track.far;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= w; x += 40) {
      const y = groundY - 90 - Math.sin((x + dist * 0.15) / 90) * 28;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    ctx.fillStyle = track.mid;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 10);
    for (let x = 0; x <= w; x += 30) {
      const y = groundY - 40 - Math.sin((x + dist * 0.35) / 60) * 16;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    if (track.id === "city") {
      ctx.fillStyle = track.near;
      for (let i = 0; i < 12; i += 1) {
        const x = ((i * 140 - dist * 0.5) % (w + 140)) - 40;
        const bh = 80 + (i % 4) * 30;
        ctx.fillRect(x, groundY - bh, 70, bh);
        ctx.fillStyle = "#f0d24a";
        for (let wy = 0; wy < 4; wy += 1) ctx.fillRect(x + 10, groundY - bh + 12 + wy * 16, 8, 8);
        ctx.fillStyle = track.near;
      }
    } else if (track.id === "forest") {
      ctx.fillStyle = "#244830";
      for (let i = 0; i < 10; i += 1) {
        const x = ((i * 160 - dist * 0.45) % (w + 160)) - 30;
        ctx.fillRect(x + 18, groundY - 120, 14, 120);
        ellipse(ctx, x + 25, groundY - 130, 36, 40);
        ctx.fill();
      }
    } else if (track.id === "snow") {
      ctx.fillStyle = "#eef6fb";
      for (let i = 0; i < 6; i += 1) {
        const x = ((i * 220 - dist * 0.25) % (w + 220)) - 40;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 80, groundY - 160);
        ctx.lineTo(x + 160, groundY);
        ctx.fill();
      }
    } else if (track.id === "desert") {
      ctx.fillStyle = "#c49048";
      for (let i = 0; i < 4; i += 1) {
        const x = ((i * 280 - dist * 0.2) % (w + 200)) - 20;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 70, groundY - 70);
        ctx.lineTo(x + 140, groundY);
        ctx.fill();
      }
      ctx.fillStyle = "#2f6a48";
      for (let i = 0; i < 5; i += 1) {
        const x = ((i * 190 - dist * 0.4) % (w + 120)) + 10;
        ctx.fillRect(x, groundY - 36, 8, 36);
        ctx.fillRect(x - 10, groundY - 24, 12, 6);
      }
    } else if (track.id === "grass") {
      ctx.fillStyle = "#3a6a28";
      for (let i = 0; i < 14; i += 1) {
        const x = ((i * 70 - dist * 0.55) % (w + 80)) - 10;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.quadraticCurveTo(x + 6, groundY - 18, x + 4, groundY - 26);
        ctx.quadraticCurveTo(x + 10, groundY - 8, x + 12, groundY);
        ctx.fill();
      }
    }

    ctx.fillStyle = track.ground[0];
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = track.ground[1];
    ctx.fillRect(0, groundY, w, 18);
    ctx.fillStyle = track.dirt;
    const stripe = 48;
    for (let x = -((dist * 1.2) % stripe); x < w; x += stripe) {
      ctx.fillRect(x, groundY + 22, 26, 6);
    }

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 260 + t * 20 - dist * 0.08) % (w + 120)) - 60;
      ellipse(ctx, x, 50 + (i % 3) * 18, 36, 14);
      ctx.fill();
      ellipse(ctx, x + 24, 54 + (i % 3) * 18, 24, 12);
      ctx.fill();
    }
  }

  function drawGearThumb(ctx, kind, index, w, h) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#f7efe0");
    bg.addColorStop(1, "#e7d3b0");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (kind === "hat") {
      ctx.scale(w / 70, w / 70);
      ellipse(ctx, 0, 10, 18, 16);
      fillStroke(ctx, "#e2c48a", "#2a1c10", 1.8);
      ellipse(ctx, 0, 16, 10, 7);
      fillStroke(ctx, "#f6e8c8");
      drawHat(ctx, index, -12);
    } else if (kind === "suit") {
      ctx.scale(w / 78, w / 78);
      ellipse(ctx, 0, 18, 16, 8);
      fillStroke(ctx, "#e2c48a", "#2a1c10", 1.6);
      drawSuit(ctx, index, 1);
    } else {
      ctx.scale(w / 56, w / 56);
      drawShoe(ctx, index, -2, 4, false);
    }
    ctx.restore();
  }

  function drawTrackThumb(ctx, track, w, h) {
    drawBackground(ctx, w, h, track, 90, 0.4);
    const gy = h * 0.72;
    const props = {
      forest: [
        { kind: "log", x: w * 0.08, y: gy, w: w * 0.28, h: h * 0.12, mode: "ground" },
        { kind: "mushroom", x: w * 0.58, y: gy, w: w * 0.16, h: h * 0.22, mode: "ground" },
      ],
      city: [
        { kind: "hydrant", x: w * 0.12, y: gy, w: w * 0.14, h: h * 0.28, mode: "ground" },
        { kind: "crate", x: w * 0.5, y: gy, w: w * 0.22, h: h * 0.2, mode: "ground" },
      ],
      desert: [
        { kind: "cactus", x: w * 0.16, y: gy, w: w * 0.2, h: h * 0.38, mode: "ground" },
        { kind: "skull", x: w * 0.58, y: gy, w: w * 0.18, h: h * 0.2, mode: "ground" },
      ],
      snow: [
        { kind: "snowman", x: w * 0.12, y: gy, w: w * 0.22, h: h * 0.34, mode: "ground" },
        { kind: "pine", x: w * 0.52, y: gy, w: w * 0.26, h: h * 0.4, mode: "ground" },
      ],
      grass: [
        { kind: "fence", x: w * 0.08, y: gy, w: w * 0.3, h: h * 0.22, mode: "ground" },
        { kind: "hay", x: w * 0.52, y: gy, w: w * 0.24, h: h * 0.2, mode: "ground" },
      ],
    };
    (props[track.id] || []).forEach((ob) => {
      ob.track = track.id;
      drawObstacle(ctx, ob);
    });
  }

  return { drawCharacter, drawCoin, drawApple, drawObstacle, drawBackground, drawGearThumb, drawTrackThumb };
})();
