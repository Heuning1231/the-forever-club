/* The Forever Club — High-Resolution PNG Keepsake Card Generators */

function downloadCanvas(canvas, filename) {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function drawRoyalBorder(ctx, w, h, pad = 42) {
  ctx.strokeStyle = 'rgba(220, 196, 154, 0.72)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

  ctx.strokeStyle = 'rgba(203, 181, 217, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 12, pad + 12, w - (pad + 12) * 2, h - (pad + 12) * 2);

  // Corner star ornaments
  const corners = [
    [pad, pad],
    [w - pad, pad],
    [pad, h - pad],
    [w - pad, h - pad]
  ];
  ctx.fillStyle = '#DCC49A';
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFourPointStar(ctx, cx, cy, r, fill = '#DCC49A') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.14, -r * 0.14, r, 0);
  ctx.quadraticCurveTo(r * 0.14, r * 0.14, 0, r);
  ctx.quadraticCurveTo(-r * 0.14, r * 0.14, -r, 0);
  ctx.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function exportMembershipCardPNG(member) {
  const w = 1400;
  const h = 880;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Deep royal gradient + pearlescent sheen
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#171223');
  bg.addColorStop(0.5, '#2b2038');
  bg.addColorStop(1, '#171223');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.72, h * 0.3, 20, w * 0.72, h * 0.3, 520);
  glow.addColorStop(0, 'rgba(203, 181, 217, 0.24)');
  glow.addColorStop(0.5, 'rgba(220, 196, 154, 0.08)');
  glow.addColorStop(1, 'rgba(23, 18, 35, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  drawRoyalBorder(ctx, w, h, 40);

  // Subtle starfield
  for (let i = 0; i < 65; i++) {
    const sx = ((i * 197) % (w - 140)) + 70;
    const sy = ((i * 113) % (h - 140)) + 70;
    ctx.fillStyle = `rgba(245, 239, 230, ${0.15 + (i % 4) * 0.12})`;
    ctx.beginPath();
    ctx.arc(sx, sy, (i % 3 === 0 ? 2 : 1.1), 0, Math.PI * 2);
    ctx.fill();
  }

  // Right orbital crest
  const ox = w - 290;
  const oy = h / 2;
  ctx.strokeStyle = 'rgba(220, 196, 154, 0.42)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ox, oy, 150, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(ox, oy, 190, 74, -0.42, 0, Math.PI * 2);
  ctx.stroke();
  drawFourPointStar(ctx, ox, oy, 38, '#DCC49A');

  ctx.fillStyle = '#DCC49A';
  ctx.font = '600 20px "Georgia", serif';
  ctx.fillText('THE FOREVER CLUB  ·  ROYAL PRIVATE COLLECTION', 96, 128);

  ctx.fillStyle = '#CBB5D9';
  ctx.font = '400 22px sans-serif';
  ctx.fillText('EST. FOREVER  ·  2022–2026', 96, 174);

  ctx.fillStyle = '#F5EFE6';
  ctx.font = 'italic 84px "Georgia", serif';
  ctx.fillText(member.name, 96, 405);

  ctx.fillStyle = '#DCC49A';
  ctx.font = '600 32px "Georgia", serif';
  ctx.fillText(member.cardCode, 96, 478);

  ctx.fillStyle = 'rgba(245, 239, 230, 0.78)';
  ctx.font = '400 24px sans-serif';
  ctx.fillText(`CONSTELLATION: ${member.constellation.toUpperCase()}`, 96, 560);

  ctx.fillStyle = 'rgba(203, 181, 217, 0.7)';
  ctx.font = 'italic 22px "Georgia", serif';
  ctx.fillText('Four Girls. One Universe. Infinite Memories.', 96, 765);

  downloadCanvas(canvas, `The-Forever-Club-${member.cardCode.replace(/\s+/g, '')}.png`);
}

export function exportBlessingCardPNG(blessing, memberName = 'Royal Member') {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createRadialGradient(w / 2, h * 0.35, 40, w / 2, h / 2, 840);
  bg.addColorStop(0, '#34283F');
  bg.addColorStop(1, '#171223');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawRoyalBorder(ctx, w, h, 48);

  // Astrolabe rings
  ctx.strokeStyle = 'rgba(220, 196, 154, 0.35)';
  ctx.lineWidth = 1.6;
  [160, 210, 250].forEach((r, idx) => {
    ctx.beginPath();
    if (idx === 1) ctx.setLineDash([6, 8]);
    else ctx.setLineDash([]);
    ctx.arc(w / 2, 410, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  drawFourPointStar(ctx, w / 2, 410, 44, '#DCC49A');

  ctx.textAlign = 'center';
  ctx.fillStyle = '#DCC49A';
  ctx.font = '600 22px sans-serif';
  ctx.fillText('THE ROYAL BALLROOM  ·  DESTINY PROTOCOL', w / 2, 130);

  ctx.fillStyle = '#CBB5D9';
  ctx.font = 'italic 28px "Georgia", serif';
  ctx.fillText(`Conferred upon ${memberName}`, w / 2, 730);

  ctx.fillStyle = '#F5EFE6';
  ctx.font = '500 54px "Georgia", serif';
  const words = blessing.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > 760) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, w / 2, 845 + idx * 72);
  });

  ctx.fillStyle = 'rgba(220, 196, 154, 0.78)';
  ctx.font = '400 22px "Georgia", serif';
  ctx.fillText('The Forever Club  ·  2022–2026  ·  Est. Forever', w / 2, 1210);

  downloadCanvas(canvas, 'The-Forever-Club-Royal-Blessing.png');
}

export function exportConstellationCardPNG(members, poemLines) {
  const w = 1200;
  const h = 1500;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createRadialGradient(w / 2, 480, 40, w / 2, h / 2, 920);
  bg.addColorStop(0, '#2c213a');
  bg.addColorStop(0.6, '#1b1428');
  bg.addColorStop(1, '#120d1c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawRoyalBorder(ctx, w, h, 46);

  // Dust stars
  for (let i = 0; i < 120; i++) {
    const sx = ((i * 223) % (w - 140)) + 70;
    const sy = ((i * 151) % (h - 160)) + 80;
    ctx.fillStyle = `rgba(245, 239, 230, ${0.15 + (i % 5) * 0.12})`;
    ctx.beginPath();
    ctx.arc(sx, sy, i % 7 === 0 ? 2.2 : 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#DCC49A';
  ctx.font = '600 22px sans-serif';
  ctx.fillText('OUR FOREVER CONSTELLATION', w / 2, 130);

  // Constellation geometry
  const pts = members.map((m) => ({
    name: m.name,
    x: 180 + (m.starCoords.x / 100) * 840,
    y: 230 + (m.starCoords.y / 100) * 560
  }));

  ctx.strokeStyle = 'rgba(220, 196, 154, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  pts.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.stroke();

  pts.forEach((p) => {
    const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 44);
    g.addColorStop(0, 'rgba(220, 196, 154, 0.85)');
    g.addColorStop(1, 'rgba(220, 196, 154, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 44, 0, Math.PI * 2);
    ctx.fill();
    drawFourPointStar(ctx, p.x, p.y, 20, '#F5EFE6');

    ctx.fillStyle = '#F5EFE6';
    ctx.font = 'italic 28px "Georgia", serif';
    ctx.fillText(p.name, p.x, p.y + 48);
  });

  // Poem
  ctx.fillStyle = '#F5EFE6';
  ctx.font = 'italic 32px "Georgia", serif';
  poemLines.forEach((line, idx) => {
    if (idx === poemLines.length - 1) {
      ctx.fillStyle = '#DCC49A';
      ctx.font = '600 26px "Georgia", serif';
      ctx.fillText(line, w / 2, 1020 + idx * 54 + 26);
    } else {
      ctx.fillText(line, w / 2, 1000 + idx * 52);
    }
  });

  downloadCanvas(canvas, 'The-Forever-Club-Constellation.png');
}

export function exportRoyalPactPNG(members, promises, member) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  const fill = ctx.createLinearGradient(0, 0, 1200, 1000);
  fill.addColorStop(0, '#F8F3EB');
  fill.addColorStop(1, '#E9DFF3');
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRoyalBorder(ctx, canvas.width, canvas.height);
  ctx.fillStyle = '#51405D';
  ctx.textAlign = 'center';
  ctx.font = '64px Georgia, serif';
  ctx.fillText('Our Forever Pact', 600, 165);
  ctx.font = '31px Georgia, serif';
  ctx.fillText(members.map(person => person.name).join('   ·   '), 600, 236);
  ctx.font = '34px sans-serif';
  promises.forEach((promise, index) => ctx.fillText(promise, 600, 345 + index * 65, 960));
  ctx.fillStyle = '#874863';
  ctx.beginPath();
  ctx.arc(600, 755, 51, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F8F3EB';
  ctx.font = '50px Georgia, serif';
  ctx.fillText(member.sealMonogram, 600, 771);
  ctx.fillStyle = '#51405D';
  ctx.font = '27px Georgia, serif';
  ctx.fillText(`Personal seal · ${member.name}`, 600, 864);
  downloadCanvas(canvas, 'the-forever-club-royal-pact.png');
}
