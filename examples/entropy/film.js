/* ★《熵增》· B 寓言 · 100 秒 · 七章：钩 / 片名 / 知 / 形 / 我 / 术·为什么 / 术·怎么 / 答
 * 一句话：房间不是被谁弄乱的。是"乱的摆法"比"整齐的摆法"多太多，所以它只能往那边走。
 * 全片那把尺子：左上的「熵值」仪表（0–150，100 以上是红区，标"失控"）。每换一个对象就量一次，
 *   结尾不回到 0 —— 这就是要说的那件事。
 * 回场：开头那间屋子在第 7 章回来，还是有点乱，但灯亮着。
 *
 * 事实（2026-10-10 联网核对）：
 *   · 克劳修斯 1865《热的机械论》造出 Entropie，取自希腊语 τροπή（转变），记号 S 纪念卡诺。
 *     第二定律克劳修斯表述：热量不可能自发地从低温物体传到高温物体而不引起其他变化。
 *   · 玻尔兹曼 1877《论一般力学定理与热力学第二定理的关系》：S = k ln W，W 是宏观态对应的微观状态数。
 *     k = 1.380649e-23 J/K。他的墓碑上刻的就是这个式子。
 *   · 52! ≈ 8.07e67，一副扑克牌的排列总数。
 *   · 麦克斯韦妖 1867/1871：麦克斯韦的分拣思想实验。
 *   · 兰道尔原理 1961：擦除 1 比特至少耗散 kT ln2，室温约 2.85e-21 J（≈0.0178 eV）。
 *   · 薛定谔 1944《生命是什么》：生命以负熵为食。（片尾"要一直付代价"即此意）
 * 示意：房间、12 件东西、它们的漂移量与变乱时刻、18 格阵列、11 次扰动、"11/12"、三招的说法、
 *       仪表读数 8→138→60，全是画的，不是数据。90℃/24℃ 两条柱只画"趋于一致"这件事。
 * 这套外观的常驻元素：仪表 K.gauge、片名卡 K.titleGilt。规格见 references/worlds.md。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix } = VK;
const K = VKit, P = K.PAL.flat;

const GOLD = P.gold, GOLDHI = P.goldHi, RED = P.red, INK = P.ink, DIM = P.dim, MUTE = P.mute, PAPER = P.paper;
const HOT = '#FF8A54', COLD = '#7FA8C8';

const T = {
  hookEnd: 8.0, dim1: 8.0, title: 8.6, titleEnd: 16.2,
  ch1In: 16.4, ch1Out: 32.2, ch2In: 32.4, ch2Out: 50.2,
  ch3In: 50.4, ch3Out: 66.2, ch4In: 66.4, ch4Out: 79.2,
  ch5In: 79.4, ch5Out: 94.2, endIn: 94.4, outro: 100.0,
};
const DIP = [8.0, 16.2, 32.2, 50.2, 66.2, 79.2, 94.2];

const SUBS = [
  { a: 0.7, b: 2.9, zh: '周六下午，你把房间收拾干净了' },
  { a: 3.1, b: 5.4, zh: '没有人进来过' },
  { a: 5.6, b: 7.9, zh: '到了下周三，它{又乱了}' },
  { a: 16.8, b: 19.8, zh: '1865 年，克劳修斯给这种“回不去”起了个名字' },
  { a: 20.0, b: 23.0, zh: '热，只会自己从{热的}跑到{冷的}' },
  { a: 23.2, b: 26.2, zh: '从来不会自己跑回来' },
  { a: 26.4, b: 29.0, zh: '这不是谁下的规定' },
  { a: 29.2, b: 32.0, zh: '是它{唯一能走的方向}', tone: 'gold' },
  { a: 32.8, b: 35.6, zh: '1877 年，玻尔兹曼问：到底什么叫“乱”？' },
  { a: 35.8, b: 38.6, zh: '他说：数一数，它有多少种摆法' },
  { a: 38.8, b: 42.0, zh: '{整齐}，只有{1}种' },
  { a: 42.2, b: 45.6, zh: '{乱}，有{8×10⁶⁷}种' },
  { a: 45.8, b: 50.0, zh: '所以它不“想”变乱。它只是往{摆法多的那边}走', tone: 'gold' },
  { a: 50.8, b: 53.6, zh: '房间只是最便宜的那个例子' },
  { a: 53.8, b: 56.6, zh: '日程、关系、注意力，走的是同一条路' },
  { a: 56.8, b: 59.6, zh: '你想不费力就一直整齐？' },
  { a: 59.8, b: 62.8, zh: '可以 —— 但你得一直{盯着}，一直{选}' },
  { a: 63.0, b: 66.0, zh: '1961 年，兰道尔算清了：{信息也要付能量}', tone: 'gold' },
  { a: 66.8, b: 69.8, zh: '所以，不是你懒' },
  { a: 70.0, b: 73.2, zh: '是{乱的摆法}，比{整齐的摆法}多太多了' },
  { a: 73.4, b: 76.2, zh: '你每一次随手一放' },
  { a: 76.4, b: 79.0, zh: '都更可能落在{那边}', tone: 'gold' },
  { a: 79.8, b: 84.3, zh: '第一招：别一次收完，{每天留五分钟}' },
  { a: 84.6, b: 89.1, zh: '第二招：东西更少 = {摆法更少}' },
  { a: 89.4, b: 94.0, zh: '第三招：给每样东西，留{一个位置}' },
  { a: 94.6, b: 96.6, zh: '整齐，是{要一直付代价}的例外' },
  { a: 96.8, b: 98.6, zh: '乱，才是{默认的那个方向}' },
  { a: 98.8, b: 100.0, zh: '所以你不是没做好。你是在跟概率对峙', tone: 'gold', big: 2 },
];

/* ---------- 一块底：全幅渐变 + 暖色暗角 + 字幕带 ---------- */
function backdrop(fr, c1, c2) {
  fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, H, [[0, c1 || '#332C3C'], [.55, c2 || '#3B3444'], [1, '#282230']]) });
}
/* 一块"舞台板"：概念章（没有实景的）把东西摆在一块浅底板上，画面才不会浮在黑里 */
function stage(fr, x0, y0, x1, y1, a, c) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x0 + 12, y0 + 16, x1 - x0, y1 - y0, { r: 18, fill: '#000', a: .36 });
    fr.rect(x0, y0, x1 - x0, y1 - y0, { r: 18, fill: c || '#414757' });
    fr.rect(x0, y0, x1 - x0, 7, { r: 4, fill: '#6C7488', a: .55 });
    fr.rect(x0, y1 - 8, x1 - x0, 8, { r: 4, fill: '#22262F', a: .5 });
  });
}
function warmVig(fr, k) {
  const x = fr.x, g = x.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, W * .72);
  g.addColorStop(0, 'rgba(28,13,5,0)'); g.addColorStop(1, `rgba(28,13,5,${.52 * k})`);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
}
function bottomBand(fr) {
  const x = fr.x, g = x.createLinearGradient(0, 800, 0, H);
  g.addColorStop(0, 'rgba(12,7,5,0)'); g.addColorStop(.55, 'rgba(12,7,5,.72)'); g.addColorStop(1, 'rgba(12,7,5,.92)');
  x.fillStyle = g; x.fillRect(0, 800, W, 280);
}
function topLine(fr, str, a) {
  if (a <= 0) return;
  fr.text(str, W / 2, 66, { font: 'sansm', size: 34, track: 4, color: DIM, a, shadow: .65, shadowBlur: 14 });
}
function placeLabel(fr, year, place, a) {
  if (a <= 0) return;
  fr.text(year, 112, 96, { font: 'sansh', size: 36, color: GOLD, align: 'l', a, shadow: .6 });
  fr.text(place, 112 + fr.measure(year, { font: 'sansh', size: 36 }) + 20, 98,
    { font: 'sans', size: 28, color: MUTE, align: 'l', a, shadow: .6 });
}

/* ================= 房间：墙、地板、窗、吊灯、家具 ================= */
const ROOM = { x0: 200, x1: 1760, fy: 880, top: 214, cx: 980 };

function roomShell(fr, o) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const x0 = o.x0, x1 = o.x1, fy = o.fy, top = o.top, w = x1 - x0;
  fr.g({ a }, () => {
    fr.rect(x0, top, w, fy - top, { fill: fr.grad(0, top, 0, fy, [[0, '#5C6470'], [.45, '#838D9B'], [1, '#A6B0BC']]) });
    for (let i = 1; i < 7; i++) fr.line(x0, top + (fy - top) * i / 7, x1, top + (fy - top) * i / 7, { w: 1.2, color: '#4E5760', a: .3 });
    fr.rect(x0 - 26, top - 34, w + 52, 34, { fill: '#3C444E' });
    fr.rect(x0 - 26, top - 34, 26, fy - top + 40, { fill: '#343C46' });
    fr.rect(x1, top - 34, 26, fy - top + 40, { fill: '#343C46' });
    fr.rect(x0 - 26, fy + 6, w + 52, 24, { fill: '#2A211E' });
    fr.rect(x0, fy - 48, w, 48, { fill: '#7A5730' });
    fr.rect(x0, fy - 48, w, 8, { fill: '#4A3115' });
    const n = Math.max(8, Math.round(w / 46));
    for (let i = 0; i <= n; i++) fr.line(x0 + i * (w / n), fy - 40, x0 + i * (w / n), fy - 4, { w: 4, color: '#966E42', a: .85 });
    fr.rect(x0, fy - 4, w, 4, { fill: '#3A2612', a: .6 });
  });
}
function windowAt(fr, x, y, w, h, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 10, y - 10, w + 20, h + 20, { r: 6, fill: '#4C5560' });
    fr.rect(x, y, w, h, { fill: fr.grad(0, y, 0, y + h, [[0, '#FFE7B0'], [.5, '#F3CE86'], [1, '#D9A75E']]) });
    fr.line(x + w / 2, y, x + w / 2, y + h, { w: 7, color: '#4C5560' });
    fr.line(x, y + h / 2, x + w, y + h / 2, { w: 7, color: '#4C5560' });
    fr.glow(x + w / 2, y + h / 2, w * .9, '#FFD89A', .16);
  });
}
function ceilingLamp(fr, x, top, on, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.line(x, top - 6, x, top + 54, { w: 4, color: '#2E343C' });
    fr.path(`M ${x - 62},${top + 96} L ${x + 62},${top + 96} L ${x + 40},${top + 54} L ${x - 40},${top + 54} Z`, { fill: '#58626E' });
    fr.ellipse(x, top + 96, 62, 12, { fill: on > .02 ? '#FFE2A8' : '#7E8792' });
    if (on > .02) { fr.glow(x, top + 110, 300, '#FFD89A', .34 * on); fr.glow(x, top + 96, 110, '#FFF2D2', .5 * on); }
  });
}
function shelfUnit(fr, x, y, w, a) {
  if (a <= 0) return;
  const rows = [y + 100, y + 200, y + 300], h = 412;
  fr.g({ a }, () => {
    fr.rect(x, y, w, h, { fill: '#4E3A22' });
    fr.rect(x + 8, y + 8, w - 16, h - 16, { fill: '#6B5233' });
    for (const ry of rows) { fr.rect(x + 8, ry, w - 16, 14, { fill: '#8A6B41' }); fr.rect(x + 8, ry, w - 16, 4, { fill: '#B08B57', a: .7 }); }
    fr.rect(x + 8, y + h - 22, w - 16, 14, { fill: '#8A6B41' });
  });
}
function deskAt(fr, x0, x1, ty, fy, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x0, ty, x1 - x0, 18, { fill: '#8A6B41' });
    fr.rect(x0, ty, x1 - x0, 5, { fill: '#B08B57', a: .8 });
    fr.rect(x0 + 30, ty + 18, 20, fy - ty - 18, { fill: '#5E4728' });
    fr.rect(x1 - 50, ty + 18, 20, fy - ty - 18, { fill: '#5E4728' });
    fr.rect(x0 + 30, ty + 90, x1 - x0 - 80, 10, { fill: '#5E4728', a: .8 });
  });
}
function railAt(fr, x0, x1, y, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.line(x0, y, x1, y, { w: 8, color: '#98A2AE', cap: 'round' });
    fr.line(x0, y - 60, x0, y, { w: 5, color: '#7C8692' });
    fr.line(x1, y - 60, x1, y, { w: 5, color: '#7C8692' });
  });
}

/* ================= 一件东西：书 / 杯 / 纸 / 衣 ================= */
const ITEMS = (() => {
  const r = rng(20261011);
  const raw = [
    { k: 'book', x: 412, y: 504, w: 32, h: 112, c: '#B8533C', ty: 862 },
    { k: 'book', x: 448, y: 504, w: 32, h: 112, c: '#3F6B8A', ty: 862 },
    { k: 'book', x: 484, y: 504, w: 32, h: 112, c: '#C8954A', ty: 862 },
    { k: 'book', x: 556, y: 604, w: 32, h: 112, c: '#4E7A55', ty: 862 },
    { k: 'book', x: 592, y: 604, w: 32, h: 112, c: '#8A5A7E', ty: 862 },
    { k: 'book', x: 628, y: 604, w: 32, h: 112, c: '#C46A3A', ty: 862 },
    { k: 'cloth', x: 810, y: 545, w: 72, h: 132, c: '#6E7FA0', ty: 854 },
    { k: 'cloth', x: 882, y: 545, w: 72, h: 132, c: '#A08A6E', ty: 854 },
    { k: 'mug', x: 1130, y: 652, w: 56, h: 68, c: '#EDE6D8', ty: 846 },
    { k: 'paper', x: 1270, y: 684, w: 72, h: 13, c: '#EFE9DA', ty: 872 },
    { k: 'paper', x: 1352, y: 684, w: 72, h: 13, c: '#EFE9DA', ty: 872 },
    { k: 'paper', x: 1434, y: 684, w: 72, h: 13, c: '#EFE9DA', ty: 872 },
  ];
  return raw.map((o, i) => {
    const tx = 430 + r() * 1120, dr = (r() - .5) * (o.k === 'mug' ? .8 : 2.6);
    return Object.assign({}, o, { i, t0: 1.70 + i * 0.32, dx: tx - o.x, dy: o.ty - o.y, dr });
  });
})();
const drift = (o, t, gate) => ss(t, o.t0, o.t0 + 1.05) * (gate == null ? 1 : gate);

function drawItem(fr, o, k1, a) {
  if (a <= 0) return;
  const x = o.x + o.dx * k1, y = o.y + o.dy * k1;
  fr.g({ a, at: [x, y], rot: o.dr * k1 }, () => {
    const hw = o.w / 2, hh = o.h / 2;
    fr.ellipse(0, hh - 2, o.w * .6, 6, { fill: '#160C06', a: .22 });
    if (o.k === 'book') {
      fr.rect(-hw, -hh, o.w, o.h, { r: 3, fill: o.c });
      fr.rect(-hw, -hh, o.w * .26, o.h, { r: 3, fill: '#000', a: .2 });
      fr.rect(-hw + 5, -hh + 12, o.w - 10, 3, { fill: '#FFF', a: .28 });
      fr.rect(-hw + 5, hh - 20, o.w - 10, 3, { fill: '#FFF', a: .22 });
    } else if (o.k === 'mug') {
      fr.arc(hw + 4, 0, o.h * .38, -1.25, 1.25, { color: o.c, w: 12 });
      fr.rect(-hw, -hh, o.w, o.h, { r: 10, fill: o.c });
      fr.rect(-hw, -hh, o.w, 14, { r: 8, fill: '#FFFDF6' });
      fr.rect(-hw + 5, -hh + 22, o.w - 10, 10, { fill: '#B9AE98', a: .5 });
    } else if (o.k === 'paper') {
      fr.rect(-hw, -hh, o.w, o.h, { r: 2, fill: o.c });
      for (let i = 1; i < 3; i++) fr.line(-hw + 8, -hh + i * 4, hw - 8, -hh + i * 4, { w: 1, color: '#BFB4A0', a: .8 });
    } else {
      fr.rect(-hw, -hh, o.w, o.h, { r: 8, fill: o.c });
      fr.rect(-hw, -hh, o.w, 16, { r: 8, fill: '#000', a: .16 });
      fr.path(`M ${-hw * .5},${-hh + 12} L ${hw * .5},${-hh + 12} L ${hw * .3},${hh * .2} L ${-hw * .3},${hh * .2} Z`, { fill: '#000', a: .12 });
    }
  });
}

function person(fr, x, y, s, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  fr.g({ a }, () => {
    fr.ellipse(x, y + 8 * s, 96 * s, 17 * s, { fill: '#0B0705', a: .34 });
    fr.path(`M ${x - 98 * s},${y + 6 * s} L ${x - 72 * s},${y - 80 * s} L ${x + 72 * s},${y - 80 * s} L ${x + 98 * s},${y + 6 * s} Z`, { fill: '#6E5F44' });
    fr.circle(x, y - 112 * s, 40 * s, { fill: '#947F5C' });
  });
}
function mugAt(fr, x, y, s, hot, a) {
  if (a <= 0) return;
  fr.g({ a, at: [x, y], s }, () => {
    fr.ellipse(0, 40, 52, 9, { fill: '#0B0705', a: .3 });
    fr.arc(30, 2, 22, -1.25, 1.25, { color: '#EDE6D8', w: 12 });
    fr.rect(-27, -34, 54, 72, { r: 10, fill: '#EDE6D8' });
    fr.rect(-27, -34, 54, 12, { r: 6, fill: '#FFFDF6' });
    fr.rect(-23, -14, 46, 12, { fill: hot > .02 ? mix('#C99A72', HOT, hot) : '#B9AE98', a: .7 });
    fr.rect(-27, -34, 54, 72, { r: 10, color: '#C9C0AE', w: 1.6, a: .7 });
    if (hot > .02) fr.glow(0, -24, 90, HOT, .22 * hot);
  });
}
const HEAT = (() => { const r = rng(88); return Array.from({ length: 44 }, () => ({ x0: (r() - .5) * 46, ph: r(), sp: .42 + r() * .6, sz: 2 + r() * 4.5 })); })();
function steam(fr, t, x, y, k, a) {
  if (!(k > 0) || !(a > 0)) return;
  for (const p of HEAT) {
    const u = ((t * p.sp + p.ph) % 1 + 1) % 1;
    const py = y - u * 330, px = x + p.x0 + Math.sin(u * 7 + p.ph * 9) * 26 * (.25 + u);
    fr.glow(px, py, p.sz * (1 + u * 1.6), u < .5 ? '#FFE0BE' : '#CFD8E4', (1 - u) * .55 * k * a);
  }
}
function arrow(fr, x1, y1, x2, y2, o) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const an = Math.atan2(y2 - y1, x2 - x1), hl = o.head || 26;
  fr.line(x1, y1, x2, y2, { w: o.w || 4, color: o.color || GOLD, a, dash: o.dash, cap: 'butt' });
  fr.g({ a, at: [x2, y2], rot: an }, () => {
    fr.path(`M 0,0 L ${-hl},${-hl * .58} L ${-hl * .72},0 L ${-hl},${hl * .58} Z`, { fill: o.color || GOLD });
  });
}
function cross(fr, x, y, r, k, col) {
  if (k <= 0) return;
  fr.line(x - r, y - r, x + r, y + r, { w: 8, color: col || RED, cap: 'round', a: k });
  fr.line(x + r, y - r, x - r, y + r, { w: 8, color: col || RED, cap: 'round', a: k });
}
function card(fr, cx, cy, w, h, k, o = {}) {
  if (k <= 0) return;
  fr.g({ at: [cx, cy + (1 - k) * 40], s: lerp(.94, 1, k), rot: (o.rot == null ? -.018 : o.rot) }, () => {
    fr.g({ a: k }, () => {
      fr.rect(-w / 2 + 8, -h / 2 + 14, w, h, { r: 10, fill: '#000', a: .34 });
      fr.rect(-w / 2, -h / 2, w, h, { r: 10, fill: o.fill || PAPER });
      for (let i = 1; i < 4; i++) fr.line(-w / 2 + 34, -h / 2 + i * (h / 4), w / 2 - 34, -h / 2 + i * (h / 4), { w: 1.2, color: '#B9AE98', a: .45 });
      fr.rect(-w / 2, -h / 2, w, 62, { r: 10, fill: '#C5BA9F', a: .55 });
      if (o.title) fr.text(o.title, 0, -h / 2 + 31, { font: 'sansh', size: 38, track: 10, color: '#6B4A22' });
      if (o.body) o.body();
    });
  });
}
function star(fr, x, y, r, a, col) {
  let d = '';
  for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .44 : r; d += (i ? 'L' : 'M') + (x + Math.cos(an) * rr).toFixed(1) + ',' + (y + Math.sin(an) * rr).toFixed(1) + ' '; }
  fr.path(d + 'Z', { fill: col || GOLD, a, glow: 16, glowColor: '#8A6428', glowA: .45 });
}

/* ================= 钩 0 – 8：一间刚收拾好的屋子 ================= */
function hook(fr, t) {
  backdrop(fr, '#2A2430', '#332A34');
  const R = ROOM;
  roomShell(fr, R);
  windowAt(fr, 1560, 300, 190, 230, fade(t, .2, 7.9, .5, .5));
  ceilingLamp(fr, R.cx, R.top, fade(t, .3, 7.9, .4, .4));
  shelfUnit(fr, 380, 460, 320, fade(t, .2, 7.9, .5, .5));
  railAt(fr, 760, 940, 470, fade(t, .2, 7.9, .5, .5));
  deskAt(fr, 1060, 1560, 690, R.fy, fade(t, .2, 7.9, .5, .5));

  for (const o of ITEMS) drawItem(fr, o, drift(o, t), 1);

  const d1 = fade(t, .5, 2.9, .6, .6), d2 = fade(t, 5.6, 7.9, .5, .5);
  if (d1 > 0) fr.text('周六 · 15:40', 300, 300, { font: 'sansm', size: 30, track: 6, color: MUTE, align: 'l', a: d1, shadow: .7 });
  if (d2 > 0) fr.text('下周三 · 19:20', 300, 300, { font: 'sansm', size: 30, track: 6, color: MUTE, align: 'l', a: d2, shadow: .7 });
  placeLabel(fr, '0', '一间刚收拾好的屋子', fade(t, .3, 7.9, .6, .6));
  ITEMS.forEach(o => fr.sfx(o.t0, 'tick', {}));
  fr.sfx(0.7, 'soft', {}); fr.sfx(3.1, 'soft', {}); fr.sfx(6.4, 'hush', {});
}

/* ================= 片名 8.6 – 16.2 ================= */
function title(fr, t) {
  const lt = t - T.title;
  backdrop(fr, '#0C0705', '#0C0705');
  K.flash(fr, t, T.title, { color: '#F0DCA8', rise: .1, fall: .5, peak: .5 });
  K.titleGilt(fr, lt, {
    la: 'ENTROPY', zh: '熵增', tag: '1865 · 克劳修斯造的词',
    size: 210, track: 30, cy: 440,
    motif: (fr2, lt2, a) => {
      const k = ss(lt2, 1.0, 1.9) * a; if (k <= 0) return;
      fr2.g({ a: k }, () => {
        mugAt(fr2, 790, 706, 1.0, 1, .9);
        steam(fr2, lt2, 790, 660, .8, .9);
        arrow(fr2, 868, 668, 1120, 640, { color: '#E7C477', w: 5, a: .95, head: 30 });
        arrow(fr2, 1120, 726, 868, 754, { color: '#8C7A5C', w: 3, a: .5, dash: [14, 12], head: 20 });
        cross(fr2, 994, 740, 20, .85);
        fr2.text('自发', 994, 606, { font: 'sansm', size: 24, track: 8, color: '#C0A67A' });
        fr2.text('回不来', 994, 800, { font: 'sansm', size: 24, track: 8, color: '#9A7E56', a: .7 });
      });
    },
  });
  fr.sfx(T.title, 'bloom', {}); fr.sfx(T.title + .9, 'chord', {});
}

/* ================= 知 16.4 – 32.2：热只往一个方向走 ================= */
const TEMPS = [[90, 24], [24, 25.6]];
function ch1(fr, t) {
  backdrop(fr, '#3A3140', '#423A48');
  const TY = 620, CUPX = 520, BASE = 800;
  stage(fr, 170, 214, 1750, 900, fade(t, T.ch1In + .1, T.ch1Out - .2, .5, .5), '#464B5A');
  deskAt(fr, 240, 1680, TY, 830, fade(t, T.ch1In + .2, T.ch1Out - .2, .6, .5));
  mugAt(fr, CUPX, TY - 42, 1.25, fade(t, T.ch1In + .3, T.ch1Out - .4, .5, .5));
  const heatK = fade(t, 17.6, T.ch1Out - .4, .6, .6);
  steam(fr, t, CUPX, TY - 84, heatK, 1);

  const airK = fade(t, T.ch1In + .3, T.ch1Out - .2, .6, .5);
  if (airK > 0) fr.g({ a: airK }, () => {
    fr.rect(1150, 300, 470, 330, { r: 10, fill: '#3A4250', a: .5 });
    const r = rng(3001);
    for (let i = 0; i < 60; i++) {
      const bx = 1166 + r() * 438, by = 316 + r() * 298, ph = r(), sz = 3 + r() * 2;
      fr.glow(bx + Math.sin(t * .5 + ph * 9) * 9, by + Math.cos(t * .42 + ph * 7) * 8, sz, '#9FB0C8', .3);
    }
    fr.text('房间', 1385, 258, { font: 'sansh', size: 30, track: 8, color: MUTE, shadow: .6 });
  });

  const ar1 = fade(t, 20.0, T.ch1Out - .3, .7, .6);
  if (ar1 > 0) {
    arrow(fr, 610, TY - 76, 1120, 420, { color: GOLD, w: 5, a: ar1, head: 30 });
    fr.text('热量', 880, 470, { font: 'sansm', size: 26, track: 6, color: GOLD, a: ar1, shadow: .7 });
  }
  const ar2 = fade(t, 23.2, T.ch1Out - .3, .7, .6);
  if (ar2 > 0) {
    arrow(fr, 1120, TY - 20, 610, 350, { color: '#8E8A84', w: 3, a: ar2 * .8, dash: [16, 13], head: 22 });
    cross(fr, 866, 400, 24, ar2);
  }

  const kT = E.io3(seg(t, 21.0, 30.5));
  const vHot = lerp(TEMPS[0][0], TEMPS[0][1], kT), vRoom = lerp(TEMPS[1][0], TEMPS[1][1], kT);
  const bars = fade(t, 20.6, T.ch1Out - .2, .6, .5);
  if (bars > 0) fr.g({ a: bars }, () => {
    const H1 = vHot * 2.9, H2 = vRoom * 2.9;
    fr.rect(286, BASE - H1, 74, H1, { r: 8, fill: HOT });
    fr.rect(286, BASE - H1, 74, 9, { r: 6, fill: '#FFD9BE', a: .85 });
    fr.glow(323, BASE - H1, 120, HOT, .2);
    fr.rect(1582, BASE - H2, 74, H2, { r: 8, fill: COLD });
    fr.rect(1582, BASE - H2, 74, 9, { r: 6, fill: '#CFE6F6', a: .85 });
    fr.line(240, BASE, 1710, BASE, { w: 2, color: '#8E8A84', a: .5, cap: 'butt' });
    fr.text(Math.round(vHot) + '℃', 323, BASE + 34, { font: 'sansh', size: 34, track: 3, color: '#FFC3A2', shadow: .6 });
    fr.text('杯子', 323, BASE + 72, { font: 'sansm', size: 24, track: 5, color: MUTE });
    fr.text(Math.round(vRoom) + '℃', 1619, BASE + 34, { font: 'sansh', size: 34, track: 3, color: '#C3DCEE', shadow: .6 });
    fr.text('房间', 1619, BASE + 72, { font: 'sansm', size: 24, track: 5, color: MUTE });
    if (kT > .92) fr.text('一样了', 970, BASE + 40, { font: 'sansh', size: 30, track: 8, color: GOLD, a: clamp((kT - .92) / .08), shadow: .7 });
  });
  topLine(fr, '1865 · 德国 · 克劳修斯', fade(t, T.ch1In + .3, 31.4, .6, .6));
  placeLabel(fr, '1865', '热，只会往一个方向走', fade(t, T.ch1In + .2, T.ch1Out - .3, .6, .5));
  fr.sfx(16.6, 'soft', {}); fr.sfx(20.0, 'rise', {}); fr.sfx(23.2, 'tock', {}); fr.sfx(29.2, 'chord', {}); fr.sfx(31.4, 'stamp', {});
}

/* ================= 形 32.4 – 50.2：玻尔兹曼，数一数有多少种摆法 ================= */
const FACES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CARDS = (() => {
  const r = rng(2468), perm = FACES.map((_, i) => i);
  for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  return FACES.map((f, i) => ({ f, i, to: perm[i], rot: (r() - .5) * .95, dy: (r() - .5) * 30, red: f === 'A' || f === 'K' }));
})();
function ch2(fr, t) {
  backdrop(fr, '#322C40', '#3A3448');
  stage(fr, 300, 236, 1620, 846, fade(t, T.ch2In + .1, T.ch2Out - .2, .5, .5), '#414757');
  const CY = 520, X0 = 428, GAP = 92, CW = 76, CH = 108;
  const wash = E.io3(seg(t, 34.6, 36.6));
  const kAll = fade(t, 32.6, T.ch2Out - .2, .6, .5);

  if (kAll > 0) fr.g({ a: kAll }, () => {
    for (const c of CARDS) {
      const xi = X0 + c.i * GAP, xt = X0 + c.to * GAP;
      const px = lerp(xi, xt, wash), py = CY - Math.sin(wash * Math.PI) * 96 + c.dy * wash;
      fr.g({ at: [px, py], rot: c.rot * wash, s: lerp(.96, 1, wash) }, () => {
        fr.rect(-CW / 2 + 4, -CH / 2 + 7, CW, CH, { r: 7, fill: '#000', a: .34 });
        fr.rect(-CW / 2, -CH / 2, CW, CH, { r: 7, fill: '#F6F1E4' });
        fr.rect(-CW / 2, -CH / 2, CW, CH, { r: 7, color: '#C9C0AE', w: 1.4, a: .8 });
        fr.text(c.f, -CW / 2 + 15, -CH / 2 + 22, { font: 'latinm', size: 22, color: c.red ? '#B5301F' : '#2A211B' });
        fr.circle(0, 0, 17, { fill: c.red ? '#B5301F' : '#2A211B', a: .82 });
      });
    }
  });
  const kL = fade(t, 38.8, 45.4, .7, .6);
  if (kL > 0) fr.g({ a: kL }, () => {
    fr.rect(384, 268, 420, 96, { r: 10, fill: '#1C1710', a: .72 });
    fr.rect(384, 268, 420, 96, { r: 10, color: GOLD, w: 2, a: .7 });
    fr.text('整齐 · 只有 1 种', 594, 316, { font: 'sansh', size: 38, track: 4, color: GOLD, shadow: .6 });
  });
  const kR = fade(t, 42.2, T.ch2Out - .3, .7, .6);
  if (kR > 0) fr.g({ a: kR }, () => {
    fr.rect(1144, 268, 500, 96, { r: 10, fill: '#1C1710', a: .72 });
    fr.rect(1144, 268, 500, 96, { r: 10, color: RED, w: 2, a: .7 });
    fr.text('乱 · 8×10⁶⁷ 种', 1394, 316, { font: 'sansh', size: 38, track: 4, color: '#FF9A80', shadow: .6 });
  });
  const kF = ss(t, 45.6, 46.6);
  if (kF > 0) fr.g({ a: kF }, () => {
    const gold = [[0, '#F7E8C2'], [.55, '#E2C07A'], [1, '#C39A52']];
    fr.text('S = k ln W', W / 2, 726, { font: 'latinm', size: 74, track: 6, grad: gold, glow: 20, glowColor: '#B8873C', glowA: .38 });
    fr.text('熵 = 摆法数的对数', W / 2, 786, { font: 'sansm', size: 27, track: 8, color: MUTE, a: ss(t, 46.4, 47.4) });
  });
  if (wash > 0 && wash < 1) K.ripple(fr, t, 34.6, W / 2, CY, { r0: 60, r1: 760, dur: 1.4, color: '#E7C477' });
  topLine(fr, '1877 · 维也纳 · 玻尔兹曼', fade(t, T.ch2In + .3, 49.6, .6, .6));
  placeLabel(fr, '1877', '数一数，有多少种摆法', fade(t, T.ch2In + .2, T.ch2Out - .3, .6, .5));
  fr.sfx(32.6, 'soft', {}); fr.sfx(34.6, 'shimmer', {}); fr.sfx(38.8, 'tick', {}); fr.sfx(42.2, 'tick', {}); fr.sfx(45.8, 'chord', {}); fr.sfx(49.4, 'stamp', {});
}

/* ================= 我 50.4 – 66.2：生活里的四格 + 麦克斯韦妖 ================= */
const BOXES = [
  { x: 315, name: '房间' }, { x: 745, name: '日程' }, { x: 1175, name: '关系' }, { x: 1605, name: '注意力' },
];
const CELLS = (() => { const r = rng(909); return BOXES.map(() => Array.from({ length: 8 }, () => ({ dx: (r() - .5) * 220, dy: (r() - .5) * 120, dr: (r() - .5) * 1.4 }))); })();
const MOLEC = (() => { const r = rng(555); return Array.from({ length: 30 }, () => ({ ph: r(), sp: .32 + r() * .5, yy: r(), fast: r() < .5, ox: r(), oy: r() })); })();
const OPEN = [60.1, 60.85, 61.6, 62.35, 63.1, 63.85, 64.6, 65.0];
function ch3(fr, t) {
  backdrop(fr, '#2E3352', '#353A58');
  stage(fr, 100, 392, 1820, 712, fade(t, 50.5, 59.8, .5, .5), '#3D4359');
  const BW = 400, BH = 260, BY = 550;

  BOXES.forEach((B, bi) => {
    const a1 = fade(t, 50.6 + bi * .12, 59.8, .6, .5);
    if (a1 <= 0) return;
    fr.g({ a: a1 }, () => {
      fr.rect(B.x - BW / 2, BY - BH / 2, BW, BH, { r: 12, fill: '#232A40', a: .9 });
      fr.rect(B.x - BW / 2, BY - BH / 2, BW, BH, { r: 12, color: '#727C9C', w: 2, a: .7 });
      fr.text(B.name, B.x, BY - BH / 2 + 34, { font: 'sansh', size: 30, track: 6, color: DIM, shadow: .6 });
      const cells = CELLS[bi];
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i], k = ss(t, 52.6 + bi * .45 + i * .12, 54.4 + bi * .45 + i * .12);
        const gx = B.x - 132 + (i % 4) * 88, gy = BY + 6 + Math.floor(i / 4) * 74;
        fr.g({ at: [gx + c.dx * k, gy + c.dy * k], rot: c.dr * k }, () => {
          fr.rect(-26, -26, 52, 52, { r: 6, fill: i % 3 === 0 ? GOLD : i % 3 === 1 ? '#7E93B8' : '#B0836A', a: .92 });
        });
      }
    });
  });
  topLine(fr, '房间只是最便宜的那个例子', fade(t, 50.8, 59.4, .6, .6));

  const kD = fade(t, 59.9, 66.0, .5, .4);
  if (kD > 0) fr.g({ a: kD }, () => {
    fr.rect(0, 0, W, H, { fill: '#0C1020', a: .46 });
    const bx0 = 660, bx1 = 1300, by0 = 340, by1 = 740, mx = 980;
    fr.rect(bx0, by0, bx1 - bx0, by1 - by0, { r: 10, fill: '#2E3652', a: .95 });
    fr.rect(bx0, by0, bx1 - bx0, by1 - by0, { r: 10, color: '#78829F', w: 2, a: .6 });
    fr.text('A', bx0 + 60, by0 + 44, { font: 'latinm', size: 30, color: MUTE });
    fr.text('B', bx1 - 60, by0 + 44, { font: 'latinm', size: 30, color: MUTE });
    const openNow = OPEN.reduce((m, o) => Math.max(m, fade(t, o, o + .34, .06, .06)), 0);
    const half = (by1 - by0 - 120) / 2;
    fr.rect(mx - 5, by0 + 60, 10, half - 34 * openNow, { fill: '#8E97B0' });
    fr.rect(mx - 5, by0 + 60 + half + 34 * openNow, 10, half - 34 * openNow, { fill: '#8E97B0' });
    for (const m of MOLEC) {
      const u = ((t * m.sp + m.ph) % 1 + 1) % 1;
      const px = m.fast ? lerp(bx0 + 40, mx - 40, (m.ox + u * .12) % 1) : lerp(mx + 40, bx1 - 40, 1 - ((m.ox + u * .12) % 1));
      const py = lerp(by0 + 50, by1 - 50, (m.yy + Math.sin(t * m.sp * 3 + m.ph * 8) * .18 + 1) % 1);
      fr.circle(px, py, m.fast ? 9 : 12, { fill: m.fast ? HOT : COLD, a: .92, glow: 8, glowColor: m.fast ? HOT : COLD, glowA: .35 });
    }
    const wob = Math.sin(t * 3.2) * 5;
    fr.g({ at: [mx, 300 + wob] }, () => {
      fr.path('M 0,-34 L 26,16 L -26,16 Z', { fill: '#B9C0D4' });
      fr.circle(0, -6, 8, { fill: '#1B2030' }); fr.circle(3, -8, 3, { fill: GOLD });
      fr.glow(0, 0, 90, '#9FB0C8', .16);
    });
    fr.text('麦克斯韦妖', mx, 226, { font: 'sansh', size: 30, track: 6, color: DIM, shadow: .6 });
    const nm = OPEN.filter(o => t >= o).length;
    fr.text('记忆', mx - 250, 800, { font: 'sansm', size: 24, track: 5, color: MUTE });
    for (let i = 0; i < 8; i++) {
      const px = mx - 130 + i * 36, on = i < nm;
      fr.rect(px, 782, 28, 36, { r: 5, fill: on ? GOLD : '#2A3044' });
      fr.rect(px, 782, 28, 36, { r: 5, color: '#4A5470', w: 1.4, a: .8 });
    }
    const kEr = clamp((t - 65.2) / .5);
    if (kEr > 0) {
      for (let i = 0; i < 8; i++) fr.rect(mx - 130 + i * 36, 782, 28, 36, { r: 5, fill: '#2A3044', a: kEr });
      fr.text('擦掉记忆', mx + 210, 800, { font: 'sansh', size: 26, track: 5, color: '#FF9A80', a: kEr });
      const r2 = rng(777);
      for (let i = 0; i < 14; i++) {
        const u = ((t * .8 + r2()) % 1 + 1) % 1;
        fr.glow(mx + 105 + r2() * 30, 820 - u * 130, 5 + r2() * 7, HOT, (1 - u) * .5 * kEr);
      }
      fr.text('擦除 1 比特 ≥ kT ln2', W / 2, 886, { font: 'latinm', size: 30, track: 3, color: '#FFB894', a: kEr });
    }
    K.flash(fr, t, 65.2, { color: '#FFB070', rise: 0, fall: .4, peak: .34 });
  });
  placeLabel(fr, '1961', '兰道尔原理 · 信息也要付能量', fade(t, 62.8, 65.9, .5, .5));
  fr.sfx(50.6, 'soft', {}); fr.sfx(53.8, 'tick', {}); fr.sfx(59.9, 'bloom', {});
  OPEN.forEach(o => fr.sfx(o, 'tick', {}));
  fr.sfx(65.2, 'flash', {}); fr.sfx(65.6, 'hush', {});
}

/* ================= 术·为什么 66.4 – 79.2：乱的摆法太多了 ================= */
const PERT = [70.2, 70.95, 71.7, 72.45, 73.2, 73.95, 74.7, 75.45, 76.2, 76.95, 77.7];
const SHUF = (() => { const r = rng(1357); return PERT.map(() => Math.floor(r() * 18)); })();
function ch4(fr, t) {
  backdrop(fr, '#322C40', '#3A3448');
  stage(fr, 500, 322, 1420, 886, fade(t, 69.5, T.ch4Out - .2, .5, .5), '#414757');
  const GX = 575, GY = 360, GS = 130, CS = 120;
  const kGrid = fade(t, 69.6, T.ch4Out - .2, .6, .5);
  const cellX = i => GX + (i % 6) * GS + CS / 2, cellY = i => GY + Math.floor(i / 6) * GS + CS / 2;

  if (kGrid > 0) fr.g({ a: kGrid }, () => {
    for (let i = 0; i < 18; i++) fr.rect(cellX(i) - CS / 2, cellY(i) - CS / 2, CS, CS, { r: 8, fill: '#2C2740', a: .95, color: '#6B648C', w: 1.8 });
    for (let i = 0; i < 12; i++) {
      const kp = ss(t, PERT[i], PERT[i] + .62);
      const fx = lerp(cellX(i), cellX(SHUF[i]), kp), fy = lerp(cellY(i), cellY(SHUF[i]), kp);
      const moved = kp > .02;
      fr.g({ at: [fx, fy], rot: (hash(i + 3) - .5) * .7 * kp }, () => {
        fr.rect(-28, -28, 56, 56, { r: 7, fill: moved ? '#8A6F92' : GOLD, a: .95 });
        if (moved) fr.rect(-28, -28, 56, 56, { r: 7, color: '#5A4A62', w: 2, a: .8 });
      });
      if (kp > .05 && kp < 1) fr.glow(fx, fy, 70, '#C9A0D4', Math.sin(kp * Math.PI) * .4);
    }
    const nDone = PERT.filter(p => t >= p + .62).length;
    if (t > 74.0) fr.text(nDone + ' / 12 已经不在原位', W / 2, 838, { font: 'sansh', size: 34, track: 6, color: '#C9AED4', shadow: .6, a: fade(t, 74.0, T.ch4Out - .2, .5, .5) });
  });
  topLine(fr, '不是你懒 · 是那边的摆法多太多了', fade(t, 70.0, T.ch4Out - .3, .6, .6));
  placeLabel(fr, '18 格', '每一次随手一放', fade(t, 70.0, T.ch4Out - .3, .6, .5));
  fr.sfx(66.6, 'soft', {}); PERT.forEach(p => fr.sfx(p, 'tick', {})); fr.sfx(76.6, 'chord', {});
}

/* ================= 术·怎么 79.4 – 94.2：三招 ================= */
function ch5(fr, t) {
  backdrop(fr, '#322C40', '#3A3448');
  const k1 = fade(t, 79.6, 84.3, .5, .5);
  if (k1 > 0) card(fr, 960, 520, 900, 470, k1, {
    title: '第 一 招 · 每 天 五 分 钟',
    body: () => {
      for (let i = 0; i < 7; i++) {
        const px = -330 + i * 110, kk = clamp((t - 80.4 - i * .3) / .55);
        fr.circle(px, -40, 22, { color: '#A79B84', w: 3, a: .8 });
        if (kk > 0) { fr.circle(px, -40, 22, { fill: GOLD, a: kk }); star(fr, px, -40, 11, kk, '#6B4A22'); }
        fr.text('周' + '一二三四五六日'[i], px, 6, { font: 'sansm', size: 22, track: 2, color: '#9A8E76' });
      }
      const BW2 = 620, by = 96;
      fr.rect(-BW2 / 2, by, BW2, 40, { r: 8, fill: '#B9AE98', a: .5 });
      const fill = lerp(.62, .58, Math.sin(t * 1.4) * .5 + .5);
      fr.rect(-BW2 / 2, by, BW2 * fill * clamp((t - 81.6) / 1.2), 40, { r: 8, fill: '#8A6B41' });
      fr.text('整齐度', -BW2 / 2 - 80, by + 20, { font: 'sansm', size: 24, track: 4, color: '#9A8E76' });
      fr.text('不是一次收干净，是一直往里给', 0, 176, { font: 'sansh', size: 34, track: 4, color: '#6B4A22', a: clamp((t - 82.6) / .8) });
    },
  });
  const k2 = fade(t, 84.6, 89.1, .5, .5);
  if (k2 > 0) card(fr, 960, 520, 900, 470, k2, {
    title: '第 二 招 · 东 西 更 少',
    body: () => {
      const fadeOut = clamp((t - 85.6) / 1.0);
      for (let i = 0; i < 12; i++) {
        const px = -352 + (i % 6) * 128, py = -90 + Math.floor(i / 6) * 92;
        const gone = i >= 4 ? fadeOut : 0;
        if (gone >= 1) continue;
        fr.g({ a: 1 - gone, s: 1 - gone * .5 }, () => {
          fr.rect(px - 26, py - 26, 52, 52, { r: 7, fill: i % 3 === 0 ? '#B8862C' : i % 3 === 1 ? '#9A7E56' : '#8A6B41', a: .95 });
        });
      }
      const kB = clamp((t - 86.8) / .9);
      if (kB > 0) {
        fr.line(0, 40, 0, 88, { w: 2.5, color: '#B9AE98', a: .7, dash: [10, 10] });
        fr.text('12 件 → 4 件', 0, 128, { font: 'sansh', size: 42, track: 4, color: '#6B4A22', a: kB });
        fr.text('摆法  4.8 亿  →  24', 0, 186, { font: 'sansm', size: 32, track: 4, color: '#8A6B41', a: clamp((t - 87.6) / .9) });
      }
    },
  });
  const k3 = fade(t, 89.4, 94.2, .5, .5);
  if (k3 > 0) card(fr, 960, 520, 900, 470, k3, {
    title: '第 三 招 · 每 样 有 位 置',
    body: () => {
      for (let i = 0; i < 3; i++) {
        const y = -120 + i * 104, kk = clamp((t - 90.2 - i * .5) / .7);
        if (kk <= 0) continue;
        const hx = 250, sx = -220;
        fr.g({ a: kk }, () => {
          fr.rect(hx - 42, y - 42, 84, 84, { r: 8, color: '#8A6B41', w: 3, dash: [12, 10] });
          fr.text('家', hx, y, { font: 'sansm', size: 22, color: '#A79B84', a: .8 });
          fr.rect(sx - 26, y - 26, 52, 52, { r: 7, fill: ['#B8862C', '#9A7E56', '#8A6B41'][i] });
          const kw = clamp((t - 90.8 - i * .5) / .9);
          if (kw > 0) {
            fr.line(sx + 26, y, hx - 42, y, { w: 2.5, color: '#B9AE98', a: .75, dash: [10, 10] });
            fr.circle(lerp(sx + 26, hx - 42, E.io3(kw)), y, 9, { fill: '#6B4A22', a: .9 });
          }
          if (kw > .8) star(fr, hx + 78, y, 20, clamp((kw - .8) / .2), '#B8862C');
        });
      }
      fr.text('放回原位的代价越低，它就越不容易乱', 0, 196, { font: 'sansh', size: 32, track: 3, color: '#6B4A22', a: clamp((t - 92.6) / .8) });
    },
  });
  topLine(fr, '怎么跟它相处', fade(t, T.ch5In + .3, 94.0, .6, .6));
  fr.sfx(79.8, 'stamp', {}); fr.sfx(82.4, 'shimmer', {}); fr.sfx(84.8, 'stamp', {}); fr.sfx(86.6, 'tick', {});
  fr.sfx(89.6, 'stamp', {}); fr.sfx(91.4, 'rise', {}); fr.sfx(92.8, 'shimmer', {});
}

/* ================= 答 94.4 – 100：那间屋子回来了 ================= */
function outro(fr, t) {
  backdrop(fr, '#2A2430', '#332A34');
  const R = ROOM;
  roomShell(fr, R);
  windowAt(fr, 1560, 300, 190, 230, fade(t, 94.5, 98.4, .5, .5));
  ceilingLamp(fr, R.cx, R.top, fade(t, 94.5, 99.2, .3, .5));
  shelfUnit(fr, 380, 460, 320, fade(t, 94.5, 98.4, .5, .5));
  railAt(fr, 760, 940, 470, fade(t, 94.5, 98.4, .5, .5));
  deskAt(fr, 1060, 1560, 690, R.fy, fade(t, 94.5, 98.4, .5, .5));
  const gate = lerp(.62, .5, E.out3(seg(t, 94.5, 97.6)));
  for (const o of ITEMS) drawItem(fr, o, drift(o, t, gate), 1);
  person(fr, 1300, R.fy - 4, 1.0, { a: fade(t, 95.0, 98.4, .5, .5) });

  const kEnd = ss(t, 98.4, 99.1);
  if (kEnd > 0) {
    fr.rect(0, 0, W, H, { fill: '#0C0705', a: .78 * kEnd });
    fr.g({ a: kEnd }, () => {
      fr.rect(1500, 380, 200, 250, { r: 6, fill: '#3A424E' });
      fr.rect(1512, 392, 176, 226, { fill: '#F3CE86' });
      fr.line(1600, 392, 1600, 618, { w: 7, color: '#3A424E' });
      fr.line(1512, 505, 1688, 505, { w: 7, color: '#3A424E' });
      fr.glow(1600, 505, 320, '#FFD89A', .34);
    });
  }
  topLine(fr, '那间屋子 · 灯还亮着', fade(t, 94.6, 98.2, .5, .6));
  placeLabel(fr, '100', '它不是被谁弄乱的', fade(t, 94.6, 98.2, .5, .6));
  fr.sfx(94.6, 'soft', {}); fr.sfx(96.8, 'chord', {}); fr.sfx(98.8, 'bloom', {}); fr.sfx(99.4, 'hush', {});
}

/* ---------- 全片那把尺子：熵值 ---------- */
function gaugeVal(t) {
  if (t < 1.6) return 8;
  if (t < T.hookEnd) return lerp(8, 34, seg(t, 1.8, 7.6));
  if (t < T.ch1Out) return lerp(34, 52, seg(t, 20.0, 32.0));
  if (t < T.ch2Out) return lerp(52, 96, E.in2(seg(t, 36.0, 47.0)));
  if (t < T.ch3Out) return lerp(96, 138, E.in2(seg(t, 52.0, 64.0)));
  if (t < T.ch4Out) return lerp(138, 142, seg(t, 70.0, 79.0));
  if (t < 88.0) return lerp(142, 104, seg(t, 82.0, 88.0));
  if (t < T.ch5Out) return lerp(104, 82, seg(t, 88.0, 94.0));
  return lerp(82, 60, E.out3(seg(t, 95.0, 98.6)));
}
function gaugeCap(t) {
  if (t < T.ch2In) return '对象：{一杯热水}';
  if (t < T.ch3In) return '对象：{一副牌}';
  if (t < T.ch5In) return '对象：{你的生活}';
  return '对象：{!你}';
}

VK.film({
  dur: T.outro, theme: 'flat', meta: { title: '熵增', root: 0 },
  draw(fr, t) {
    fr.look.bgo = { color: '#0C0705' };
    const dim = lerp(.16, 1, K.dips(t, DIP, .42)) * (1 - ss(t, 99.4, 99.95));
    fr.g({ a: dim }, () => {
      if (t < 8.0) hook(fr, t);
      else if (t < T.ch1In) title(fr, t);
      else if (t < T.ch2In) ch1(fr, t);
      else if (t < T.ch3In) ch2(fr, t);
      else if (t < T.ch4In) ch3(fr, t);
      else if (t < T.ch5In) ch4(fr, t);
      else if (t < T.endIn) ch5(fr, t);
      else outro(fr, t);
      const ga = fade(t, T.ch1In + .1, 99.2, .8, .8);
      if (ga > 0) K.gauge(fr, 64, 150, { value: gaugeVal(t), max: 150, redFrom: 100, zone: '失控', label: '熵值', caption: gaugeCap(t), a: ga });
      warmVig(fr, .42);
      bottomBand(fr);
    });
    K.subs(fr, t, SUBS, 'flat');                          // 字幕永远最后画
  },
});
})();
