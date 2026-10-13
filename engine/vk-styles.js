/* Concept Reel 风格层。所有背景、形态和动作只依赖固定 profile 与绝对时间。
 * 不加载第三方素材；3D 演示是 Canvas 投影，不模拟真实光线追踪。 */
(function (G) {
'use strict';
const { W, H, clamp, lerp, ss, E, hash, rgba, mix } = G.VK;
const TAU = Math.PI * 2;

async function load() {
  const response = await fetch('/engine/styles.json');
  if (!response.ok) throw new Error(`Style catalog failed to load: HTTP ${response.status}`);
  const data = await response.json();
  const profiles = Array.isArray(data) ? data : data.styles;
  if (!Array.isArray(profiles) || !profiles.length) throw new Error('Style catalog must contain a nonempty styles array');
  const ids = new Set();
  for (const profile of profiles) {
    if (!profile || typeof profile.id !== 'string' || !profile.id || ids.has(profile.id)) throw new Error('Style catalog contains an invalid or duplicate id');
    ids.add(profile.id);
    if (typeof profile.name !== 'string' || typeof profile.en_name !== 'string' || !G.VK.FONTS[profile.font]) throw new Error(`Style ${profile.id} needs name, en_name and a VK font key`);
    if (!profile.palette || ['bg', 'ink', 'accent', 'secondary', 'muted'].some(key => !/^#[0-9a-f]{6}$/i.test(profile.palette[key] || ''))) throw new Error(`Style ${profile.id} needs five six-digit palette colors`);
    if (!profile.look || ['bloom', 'grain'].some(key => !Number.isFinite(profile.look[key]) || profile.look[key] < 0)) throw new Error(`Style ${profile.id} needs finite nonnegative bloom and grain`);
    if (!profile.motion || !Number.isFinite(profile.motion.duration) || profile.motion.duration <= 0 || !Number.isFinite(profile.motion.fps) || profile.motion.fps <= 0 || typeof profile.motion.easing !== 'string') throw new Error(`Style ${profile.id} needs valid motion settings`);
    if (['signature', 'use_cases', 'recipe', 'avoid'].some(key => !Array.isArray(profile[key]) || profile[key].some(item => typeof item !== 'string')) || typeof profile.implementation !== 'string') throw new Error(`Style ${profile.id} needs descriptive arrays and implementation notes`);
  }
  return profiles;
}

function nativeGlow(x, cx, cy, r, color, a) {
  const gradient = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  gradient.addColorStop(0, rgba(color, a)); gradient.addColorStop(1, rgba(color, 0));
  x.fillStyle = gradient; x.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function apply(fr, profile, t) {
  const p = profile.palette;
  fr.look.bg = 'flat'; fr.look.bgo = { color: p.bg };
  fr.look.bloom = profile.look.bloom; fr.look.grain = profile.look.grain;
  const previous = fr.look.under;
  fr.look.under = (x, time) => {
    if (previous) previous(x, time);
    x.save();
    if (profile.id === 'hud') {
      x.strokeStyle = rgba(p.accent, .065); x.lineWidth = 1;
      x.beginPath();
      for (let px = 80; px < W; px += 80) { x.moveTo(px, 0); x.lineTo(px, H); }
      for (let py = 60; py < H; py += 60) { x.moveTo(0, py); x.lineTo(W, py); }
      x.stroke();
    } else if (profile.id === 'aurora-glass') {
      nativeGlow(x, 480 + Math.sin(t * .24) * 180, 340, 700, p.accent, .32);
      nativeGlow(x, 1440 + Math.cos(t * .18) * 140, 570, 640, p.secondary, .26);
    } else if (profile.id === 'synthwave') {
      nativeGlow(x, W / 2, 430, 750, p.secondary, .2);
      x.strokeStyle = rgba(p.accent, .13); x.lineWidth = 1.5; x.beginPath();
      for (let i = -12; i <= 12; i++) { x.moveTo(W / 2 + i * 40, 680); x.lineTo(W / 2 + i * 190, H); }
      for (let i = 0; i < 12; i++) { const q = ((i + t * .45) % 12) / 12; const py = 680 + q * q * 400; x.moveTo(0, py); x.lineTo(W, py); }
      x.stroke();
    } else if (['cel-boil', 'collage', 'sticker'].includes(profile.id)) {
      x.fillStyle = rgba(p.muted, .055);
      for (let i = 0; i < 170; i++) x.fillRect(Math.floor(hash(i + 9) * W), Math.floor(hash(i + 80) * H), 2, 2);
    } else if (profile.id === 'pixel') {
      x.fillStyle = rgba(p.muted, .055);
      for (let py = 0; py < H; py += 32) for (let px = 0; px < W; px += 32) if (((px + py) / 32) % 2 === 0) x.fillRect(px, py, 32, 32);
    }
    x.restore();
  };
}

/* Same subtitle item contract as VKit.subs; VKit.parseMark preserves {词}/{!词}.
 * Draw after content bloom so bright styles retain crisp, stable captions. */
function caption(fr, t, list, profile) {
  const active = list.filter(s => t >= s.a && t <= s.b);
  if (!active.length) return;
  const previous = fr.look.post;
  fr.look.post = (context, time) => {
    if (previous) previous(context, time);
    const saved = fr.x; fr.x = context;
    try {
      for (const s of active) {
        const marked = G.VKit.parseMark(s.zh), text = marked.map(c => c.ch).join('');
        const a = Math.min(ss(t, s.a, s.a + .18), 1 - ss(t, s.b - .16, s.b));
        const font = s.font || (['mono', 'type'].includes(profile.font) ? 'sans' : profile.font);
        let size = s.size || (s.big === 2 ? 64 : s.big ? 54 : 43), track = size * .035;
        let width = fr.measure(text, { font, size, track });
        if (width > 1640) { size *= 1640 / width; track = size * .035; width = fr.measure(text, { font, size, track }); }
        const y = s.y == null ? 944 : s.y;
        fr.rect(W / 2 - width / 2 - 38, y - 44, width + 76, s.en ? 118 : 88, { r: 18, fill: '#10141C', a: .91 * a });
        const base = s.tone === 'gold' ? '#FFE09A' : s.tone === 'red' ? '#FFB4AA' : '#F8F9FC';
        fr.chars(text, W / 2, y, { font, size, track, color: base, a }, i => ({ color: marked[i].tone === 'gold' ? '#FFE09A' : marked[i].tone === 'red' ? '#FFB4AA' : base }));
        if (s.en) fr.text(s.en, W / 2, s.enY == null ? y + 44 : s.enY, { font: 'sansr', size: 26, color: '#D7DDE8', a });
      }
    } finally { fr.x = saved; }
  };
}

function polygon(fr, pts, fill, color, w = 3) { fr.poly(pts, { close: true, fill, color, w }); }
function ease(profile, progress) { return (E[profile.motion.easing] || E.out3)(clamp(progress)); }
function label(fr, text, x, y, p, size = 26) { fr.text(text, x, y, { font: 'sansm', size, color: mix(p.ink, p.bg, .3) }); }
function outline(fr, pts, p, t, salt, fps) {
  const step = Math.floor(t * fps);
  const jitter = pts.map(([x, y], i) => [x + (hash(step * 47 + i * 13 + salt) - .5) * 7, y + (hash(step * 59 + i * 19 + salt) - .5) * 7]);
  polygon(fr, jitter, p.accent, p.ink, 5);
}
function isoBlock(fr, cx, cy, size, height, color, p) {
  const dx = size, dy = size * .48;
  polygon(fr, [[cx, cy - height - dy], [cx + dx, cy - height], [cx, cy - height + dy], [cx - dx, cy - height]], mix(color, '#FFFFFF', .25), p.bg, 3);
  polygon(fr, [[cx - dx, cy - height], [cx, cy - height + dy], [cx, cy + dy], [cx - dx, cy]], mix(color, '#000000', .13), p.bg, 3);
  polygon(fr, [[cx, cy - height + dy], [cx + dx, cy - height], [cx + dx, cy], [cx, cy + dy]], mix(color, '#000000', .3), p.bg, 3);
}
function radial(fr, cx, cy, radius, p, time, liquid) {
  const points = [];
  for (let i = 0; i <= 96; i++) {
    const ang = i / 96 * TAU;
    const deformation = liquid ? .105 * Math.sin(ang * 3 - time * 2) + .06 * Math.sin(ang * 5 + time * 1.6) : 0;
    points.push([cx + Math.cos(ang) * radius * (1 + deformation), cy + Math.sin(ang) * radius * (1 + deformation)]);
  }
  polygon(fr, points, p.accent, null);
}

/* Demonstrations occupy the central stage (roughly y=270..790).
 * These are original geometric exercises, not the reference repository's films. */
function demo(fr, profile, lt) {
  const p = profile.palette, k = ease(profile, lt / Math.min(1.1, profile.motion.duration)), cx = 960, cy = 520;
  switch (profile.id) {
    case 'cel-boil': {
      const bounce = Math.sin(Math.min(lt, 1.15) / 1.15 * Math.PI) * 50;
      const points = Array.from({ length: 40 }, (_, i) => { const ang = i / 40 * TAU; return [cx + Math.cos(ang) * 148, cy + Math.sin(ang) * 134 - bounce]; });
      outline(fr, points, p, lt, 50, profile.motion.fps);
      outline(fr, [[750, 700], [1155, 700], [1135, 734], [770, 734]], { ...p, accent: p.bg }, lt, 9, profile.motion.fps);
      fr.circle(910, cy - bounce - 12, 7, { fill: p.ink }); fr.circle(1010, cy - bounce - 12, 7, { fill: p.ink });
      fr.arc(cx, cy - bounce + 20, 40, .12, Math.PI - .12, { color: p.ink, w: 5 });
      label(fr, `${profile.motion.fps} fps 重绘轮廓 · 位置仍由时间计算`, cx, 815, p); break;
    }
    case 'isometric': {
      polygon(fr, [[cx, 770], [cx + 350, 605], [cx, 440], [cx - 350, 605]], mix(p.bg, p.secondary, .19), p.muted, 2);
      const blocks = [[-150, 660, 105], [0, 730, 170], [150, 660, 235], [0, 590, 310]];
      blocks.map(([dx, y, h], i) => ({ dx, y, h, i })).sort((a, b) => a.y - b.y).forEach(({ dx, y, h, i }) => isoBlock(fr, cx + dx, y, 74, h * E.out3(clamp((lt - i * .17) / .8)), i % 2 ? p.secondary : p.accent, p));
      label(fr, '固定轴线 · 深度排序 · 逐个生长', cx, 815, p); break;
    }
    case 'flat-vector': {
      fr.circle(cx - 210 + 110 * k, cy, 120, { fill: p.accent });
      fr.rect(cx - 5, cy - 120, 210, 240, { r: 25, fill: p.secondary });
      polygon(fr, [[cx + 190, cy + 130], [cx + 340, cy - 130], [cx + 460, cy + 130]], p.ink, null);
      fr.circle(cx - 100, cy, 39, { fill: p.bg });
      label(fr, '清楚剪影 · 少量实色 · 无需光效', cx, 815, p); break;
    }
    case 'line-art': {
      const points = [[680, 680], [680, 460], [775, 340], [870, 460], [870, 680], [805, 680], [805, 575], [744, 575], [744, 680], [980, 680], [980, 490], [1150, 490], [1150, 680], [1200, 680]];
      fr.poly(points, { color: p.ink, w: 6, k: clamp(lt / 1.55) });
      fr.circle(1080, 390, 50, { color: p.accent, w: 5, a: ss(lt, .9, 1.2) });
      for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU; fr.line(1080 + Math.cos(ang) * 72, 390 + Math.sin(ang) * 72, 1080 + Math.cos(ang) * 90, 390 + Math.sin(ang) * 90, { color: p.accent, w: 4, a: ss(lt, 1.1, 1.4) }); }
      label(fr, '线条生长先揭示路径，再保留完整结构', cx, 815, p); break;
    }
    case '3d-render': {
      fr.ellipse(cx, 735, 260, 38, { fill: '#000000', a: .15 });
      const angle = -.5 + Math.min(lt, 2.3) * .35, co = Math.cos(angle), si = Math.sin(angle), s = 135;
      const project = ([x, y, z]) => { const rx = x * co + z * si, rz = -x * si + z * co; return [cx + rx * s, cy + y * s + rz * s * .33, rz]; };
      const corners = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(project);
      const faces = [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [3, 2, 6, 7], [0, 3, 7, 4], [1, 5, 6, 2]];
      faces.map((indices, i) => ({ indices, i, z: indices.reduce((sum, j) => sum + corners[j][2], 0) / 4 })).sort((a, b) => b.z - a.z).forEach(({ indices, i }) => polygon(fr, indices.map(j => corners[j].slice(0, 2)), mix(p.accent, i === 2 ? '#FFFFFF' : '#000000', i === 2 ? .35 : .08 + i * .055), p.bg, 3));
      fr.text('CANVAS PROJECTION', cx, 300, { font: 'mono', size: 24, track: 3, color: p.muted });
      label(fr, '多面着色与投影；不是 Blender 成片或真实光照', cx, 815, p); break;
    }
    case 'morph': {
      const q = ss(lt, .25, 2.05), points = [];
      for (let i = 0; i < 80; i++) { const ang = i / 80 * TAU; const circle = [Math.cos(ang) * 155, Math.sin(ang) * 155]; const squareRadius = 155 / Math.max(Math.abs(Math.cos(ang)), Math.abs(Math.sin(ang))); const square = [Math.cos(ang) * squareRadius, Math.sin(ang) * squareRadius]; points.push([cx + lerp(circle[0], square[0], q), cy + lerp(circle[1], square[1], q)]); }
      polygon(fr, points, p.accent, null);
      for (let i = 0; i < 8; i++) { const point = points[i * 10]; fr.circle(point[0], point[1], 6, { fill: p.ink }); }
      label(fr, '相同点的对应关系 · 圆形连续变成方形', cx, 815, p); break;
    }
    case 'sticker': {
      fr.g({ at: [cx, cy], rot: lerp(-.08, .03, k), s: .88 + .12 * k }, () => {
        fr.rect(-190, -180, 380, 360, { r: 55, fill: '#FFFFFF', color: p.ink, w: 3 });
        fr.rect(-167, -157, 334, 314, { r: 38, fill: p.accent });
        fr.circle(0, -25, 72, { fill: p.secondary });
        fr.text('拆开看', 0, 95, { font: 'sansh', size: 44, color: p.ink });
      });
      [[-320, -115, '结构'], [330, -35, '材料'], [-285, 155, '关系']].forEach(([dx, dy, word], i) => { const a = ss(lt, .5 + i * .17, .8 + i * .17); fr.line(cx + dx, cy + dy, cx + Math.sign(dx) * 180, cy + dy * .5, { color: p.muted, w: 3, a }); fr.rect(cx + dx - 60, cy + dy - 34, 120, 68, { r: 17, fill: '#FFFFFF', color: p.ink, w: 3, a }); fr.text(word, cx + dx, cy + dy, { font: 'sans', size: 31, color: p.ink, a }); });
      label(fr, '白边贴纸 · 手工布局 · 标注靠近对象', cx, 815, p); break;
    }
    case 'hud': {
      const r = 176; fr.circle(cx, cy, r, { color: p.accent, w: 2, a: .4 });
      for (let i = 0; i < 48; i++) { const angle = i / 48 * TAU, rr = i % 4 === 0 ? r + 18 : r + 8; fr.line(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, cx + Math.cos(angle) * rr, cy + Math.sin(angle) * rr, { color: p.accent, w: 2, a: .7 }); }
      fr.arc(cx, cy, r - 30, -Math.PI / 2, -Math.PI / 2 + TAU * .73 * k, { color: p.secondary, w: 7, glow: 5 });
      fr.line(cx - 250, cy, cx + 250, cy, { color: p.muted, w: 1, a: .6 }); fr.line(cx, cy - 250, cx, cy + 250, { color: p.muted, w: 1, a: .6 });
      fr.text('73%', cx, cy - 12, { font: 'mono', size: 90, color: p.ink }); fr.text('DEMO / NOT SENSOR DATA', cx, cy + 64, { font: 'mono', size: 15, color: p.accent });
      label(fr, '网格、刻度与状态层；读数明确标记为示意', cx, 815, p); break;
    }
    case 'collage': {
      const sheets = [[-175, -45, -.1, p.secondary], [145, -15, .08, p.accent]];
      sheets.forEach(([dx, dy, rot, color], i) => fr.g({ at: [cx + dx, cy + dy + (1 - k) * 45], rot }, () => { const edge = [[-170, -165], [-95, -171], [-24, -163], [45, -169], [117, -163], [170, -168], [166, 167], [90, 164], [5, 172], [-75, 165], [-171, 170]]; polygon(fr, edge, mix(color, p.bg, .22), p.ink, 2); fr.text(i ? '重组' : '剪下', 0, -13, { font: 'serif', size: 76, color: p.ink }); }));
      fr.g({ at: [cx, 310], rot: -.05 }, () => fr.rect(-95, -17, 190, 34, { fill: p.muted, a: .34 }));
      fr.line(770, 719, 1130, 698, { color: p.ink, w: 4, dash: [8, 12] });
      label(fr, '不规则纸边 · 层叠 · 轻微错位', cx, 815, p); break;
    }
    case 'aurora-glass': {
      fr.g({ at: [cx, cy + (1 - k) * 35] }, () => {
        fr.rect(-300, -175, 600, 350, { r: 42, fill: '#FFFFFF', fa: .075, color: '#FFFFFF', a: .34, w: 2 });
        fr.rect(-275, -150, 550, 300, { r: 31, color: p.accent, a: .23, w: 1 });
        fr.circle(-185, -70, 42, { fill: p.accent, a: .8 });
        fr.text('半透明层', -105, -68, { font: 'sansm', size: 46, color: p.ink, align: 'l' });
        fr.line(-205, 36, 205, 36, { color: p.ink, w: 5, a: .7 });
        fr.line(-205, 96, 95, 96, { color: p.ink, w: 5, a: .35 });
      });
      label(fr, '柔色场在底层；文字和边缘保持清楚', cx, 815, p); break;
    }
    case 'bauhaus': {
      fr.circle(cx - 195, cy - 55, 120, { fill: p.accent });
      fr.rect(cx - 75, cy - 175, 260, 350, { fill: p.secondary });
      polygon(fr, [[cx + 80, cy + 175], [cx + 330, cy + 175], [cx + 330, cy - 175]], p.ink, null);
      fr.g({ at: [cx - 315, cy + 235], rot: -Math.PI / 2 }, () => fr.text('FORM / ORDER', 0, 0, { font: 'sansh', size: 33, color: p.ink, align: 'l' }));
      fr.rect(cx - 380, cy - 240, 760 * k, 8, { fill: p.ink });
      label(fr, '圆、方、三角 · 强秩序 · 大小对比', cx, 815, p); break;
    }
    case 'synthwave': {
      const x = fr.x; x.save(); x.beginPath(); x.arc(cx, 448, 157, 0, TAU); x.clip();
      const g = x.createLinearGradient(0, 280, 0, 605); g.addColorStop(0, p.secondary); g.addColorStop(1, p.accent); x.fillStyle = g; x.fillRect(cx - 165, 270, 330, 350);
      x.fillStyle = p.bg; for (let y = 465; y < 610; y += 20) x.fillRect(cx - 165, y, 330, 6 + (y - 465) / 30); x.restore();
      fr.poly([[575, 683], [690, 520], [820, 682], [963, 589], [1090, 683], [1220, 543], [1350, 683]], { color: p.accent, w: 3 });
      fr.text('1986', cx, 710, { font: 'latinim', size: 110, color: p.ink, glow: 6, glowColor: p.accent });
      label(fr, '霓虹、落日与透视网格；扫描纹不过文字', cx, 815, p); break;
    }
    case 'pixel': {
      const grid = 20, sprite = ['0000001111000000', '0000112222110000', '0001222222221000', '0012223223222100', '0122222222222210', '0122222442222210', '0012222222222100', '0001222222221000', '0000111111110000'];
      const colors = { '1': p.ink, '2': p.accent, '3': p.bg, '4': p.secondary };
      const originX = Math.round((cx - 160) / grid) * grid, originY = Math.round((cy - 90 - Math.round(Math.sin(Math.min(lt, 1) * Math.PI) * 3) * grid) / grid) * grid;
      sprite.forEach((row, y) => Array.from(row).forEach((cell, x) => { if (cell !== '0') fr.rect(originX + x * grid, originY + y * grid, grid, grid, { fill: colors[cell] }); }));
      for (let i = 0; i < 23; i++) fr.rect(cx - 460 + i * grid * 2, 720, grid * 2, grid, { fill: i % 2 ? p.secondary : p.accent });
      label(fr, '20 px 整数网格 · 离散姿态 · 无模糊边缘', cx, 815, p); break;
    }
    case 'liquid': {
      const q = ss(lt, .35, 1.85), left = cx - 200 * (1 - q), right = cx + 200 * (1 - q);
      if (q < .99) { radial(fr, left, cy, 100 + 30 * q, p, lt, true); radial(fr, right, cy, 100 + 30 * q, { ...p, accent: p.secondary }, lt + 1.1, true); }
      if (q > .25) fr.g({ a: ss(q, .25, .65) }, () => radial(fr, cx, cy, 120 + 58 * q, p, lt, true));
      fr.ellipse(cx - 65 * q, cy - 75, 48, 17, { fill: '#FFFFFF', a: .28 * q, rot: -.5 });
      label(fr, '边界柔软地持续变化；不是固定点的几何变形', cx, 815, p); break;
    }
    case 'variety': {
      fr.circle(cx, cy - 70, 104, { fill: p.secondary });
      fr.arc(cx, cy - 70, 57, .1, Math.PI - .1, { color: p.ink, w: 7 });
      fr.circle(cx - 32, cy - 85, 8, { fill: p.ink }); fr.circle(cx + 32, cy - 85, 8, { fill: p.ink });
      fr.chars('原来如此！', cx, cy + 105, { font: 'sansh', size: 95, color: p.ink }, i => { const q = clamp((lt - .25 - i * .045) / .22); return { a: q, s: .7 + .3 * E.outBack(q), dy: (1 - q) * 38, color: i === 2 ? p.accent : p.ink }; });
      const a = ss(lt, .6, .85); for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU; fr.line(cx + Math.cos(ang) * 180, cy - 70 + Math.sin(ang) * 160, cx + Math.cos(ang) * 218, cy - 70 + Math.sin(ang) * 195, { color: p.accent, w: 6, a }); }
      label(fr, '短促字效负责反应；连续解释字幕保持稳定', cx, 815, p); break;
    }
    default: throw new Error(`No style demonstration for ${profile.id}`);
  }
}

G.VStyles = { load, apply, caption, demo };
})(window);
