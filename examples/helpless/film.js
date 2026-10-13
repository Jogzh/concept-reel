/* ★《习得性无助》· B 寓言 · 100 秒 · 七章：钩 / 片名 / 知 / 形 / 我 / 术 / 答
 * 一句话：一只狗被教会了"做什么都没用"。后来门开了，它也不再站起来。
 * 全片那把尺子：左上的「放弃指数」仪表（0–150，100 以上是红区，标"习得"）。每来一个新对象就量一次。
 *
 * 事实（2026-10-09 联网核对）：
 *   · Seligman & Maier 1967, J. Exp. Psychol. 74:1 —— 狗先接受"可逃脱"或"不可逃脱"的电击，两者的次数、
 *     强度、时长完全相同；24 小时后放进穿梭箱（shuttle box），中间一道矮栏。可逃脱组很快跳过矮栏躲避，
 *     不可逃脱组大多趴着不动，被动承受。结论：造成"不动"的不是电击本身，是"反应与结果无关"（不可控）。
 *   · Hiroto & Seligman 1975, J. Exp. Psychol.: General 104:192 —— 把电击换成噪音、把穿梭箱换成手指穿梭盒
 *     和字谜，在人身上复制出同样的结果：被不可控结果训练过的人，后来在"可解"的任务上也更少动手。
 *   · Abramson, Seligman & Teasdale 1978, J. Abnorm. Psychol. 87:49 —— 归因风格三个维度：内在/外在、
 *     稳定/暂时、普遍/特定。把失败解释成"内在 + 稳定 + 普遍"，最容易走向无助。
 *   · 片尾"拖过矮栏"是原文里记下的细节：不肯逃的狗要被人拖过矮栏，拖过几次之后才开始自己跳。
 * 示意：狗、箱子、矮栏、信号灯、噪音、字谜卡片、三根滑块都是画的。数字只画"多 / 少"的相对关系，
 *      不编造具体统计值；"5.8 秒""30 厘米""三招"是示意量，不是论文数据。
 * 这套外观的常驻元素：仪表 K.gauge、片名卡 K.titleGilt。规格见 references/worlds.md。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix } = VK;
const K = VKit, P = K.PAL.flat;

const GOLD = P.gold, GOLDHI = P.goldHi, RED = P.red, INK = P.ink, DIM = P.dim, MUTE = P.mute, PAPER = P.paper;

const T = {
  hookEnd: 8.0, dim1: 8.0, title: 8.6, titleEnd: 16.2,
  ch1In: 16.4, ch1Out: 32.2, ch2In: 32.4, ch2Out: 50.2,
  ch3In: 50.4, ch3Out: 66.2, ch4In: 66.4, ch4Out: 79.2,
  ch5In: 79.4, ch5Out: 94.2, endIn: 94.4, outro: 100.0,
};
const DIP = [8.0, 16.2, 32.2, 50.2, 66.2, 79.2, 94.2];

const SUBS = [
  { a: 0.7, b: 2.7, zh: '1967 年，一只狗被关进一个箱子' },
  { a: 3.1, b: 5.9, zh: '它跳，它撞，它叫' },
  { a: 6.3, b: 7.9, zh: '门，是{!关着的}' },
  { a: 16.8, b: 19.4, zh: '两组狗，挨了' },
  { a: 19.6, b: 22.6, zh: '{完全一样多}的电击' },
  { a: 24.0, b: 26.6, zh: '唯一的区别是：' },
  { a: 26.8, b: 29.2, zh: '{一组能停}，{!另一组停不了}' },
  { a: 29.4, b: 32.0, zh: '别的，全都一样', tone: 'gold' },
  { a: 35.8, b: 38.6, zh: '24 小时后，换一个箱子' },
  { a: 38.8, b: 42.8, zh: '灯一亮，这一组{几秒就跳了过去}' },
  { a: 44.2, b: 47.0, zh: '这一组，{!趴下了}' },
  { a: 47.2, b: 50.0, zh: '不是电击让它不动。是它学会了：{!做什么都没用}' },
  { a: 51.0, b: 53.6, zh: '1975 年，实验{换成了人}' },
  { a: 54.0, b: 57.2, zh: '电击换成噪音，箱子换成{一道题}' },
  { a: 57.6, b: 61.6, zh: '被“做什么都没用”训练过的人，' },
  { a: 61.8, b: 65.9, zh: '遇上了{能解的题}，{!也不再动手}' },
  { a: 66.8, b: 69.4, zh: '真正把它钉死的，是你{怎么解释}那次失败' },
  { a: 69.8, b: 74.0, zh: '说成“{!我不行}”，它就从一件事，变成你这个人' },
  { a: 74.2, b: 78.9, zh: '说成“{这一步没对}”，它只关这一次', tone: 'gold' },
  { a: 79.8, b: 84.3, zh: '第一招：把“我不行”，换成“{这一步没对}”' },
  { a: 84.6, b: 89.1, zh: '第二招：把门槛拆到{不可能失败}的一步' },
  { a: 89.4, b: 93.9, zh: '第三招：每天记下{三件做成的小事}' },
  { a: 94.6, b: 96.5, zh: '研究者只好把它们{拖过}那道栏' },
  { a: 96.7, b: 98.3, zh: '拖过几次之后，{它们自己跳了}' },
  { a: 98.5, b: 100.0, zh: '不是你不行。是你在什么时候，学会了“不行”', tone: 'gold', big: 2 },
];

/* ---------- 一块底：全幅渐变 + 暖色暗角 + 字幕带 ---------- */
function backdrop(fr, c1, c2) {
  fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, H, [[0, c1 || '#262029'], [.55, c2 || '#2E2630'], [1, '#1C1720']]) });
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
/* 顶行结论 / 左上年份地点 */
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

/* ---------- 一只狗：色块拼的，侧面朝右。y = 地面。o: {down 趴下 0..1, jump 跳 0..1, leg 走相位, shake, alert, eye} ---------- */
const DC = '#C8935A', DC2 = '#A87644', DD = '#79522F', DL = '#EADCC2';
function dog(fr, x, y, s, o = {}) {
  const dn = clamp(o.down || 0), jp = clamp(o.jump || 0), a = o.a == null ? 1 : o.a;
  if (a <= 0) return;
  const ph = o.leg || 0, G = y, X = x + (o.shake || 0);
  const hipY = G - lerp(72, 44, dn) * s - jp * 52 * s;
  const shY = G - lerp(78, 50, dn) * s - jp * 52 * s;
  const tuck = clamp(jp * .55 + dn * .62);
  const sw = Math.sin(ph) * 18 * s * (1 - dn);
  fr.ellipse(x, G + 3 * s, 88 * s, 12 * s, { fill: '#160C06', a: .26 * a * (1 - jp * .5) });
  fr.g({ a }, () => {
    for (const [lx, ly, sg] of [[-48, hipY, -1], [-30, hipY, 1], [34, shY, -1], [52, shY, 1]]) {
      const off = sg > 0 ? sw : -sw;
      const kx = X + (lx + off * .45) * s, ky = ly + lerp(36, 15, tuck) * s, fx = X + (lx + off) * s;
      fr.line(X + lx * s, ly, kx, ky, { w: 16 * s, color: DD, cap: 'round' });
      fr.line(kx, ky, fx, G - 5 * s, { w: 12 * s, color: DD, cap: 'round' });
      fr.ellipse(fx, G - 4 * s, 13 * s, 6 * s, { fill: DD });
    }
    /* 尾巴 */
    fr.g({ at: [X - 62 * s, hipY - 10 * s], rot: -.45 + Math.sin(ph * 1.5 + (o.wag || 0)) * .35 }, () => {
      fr.path(`M 0,0 Q ${-26 * s},${-16 * s} ${-42 * s},${-42 * s}`, { color: DC2, w: 13 * s, cap: 'round' });
    });
    /* 身体 */
    fr.ellipse(X, (hipY + shY) / 2 - 8 * s, 80 * s, 40 * s, { fill: DC });
    fr.ellipse(X + 18 * s, (hipY + shY) / 2 - 17 * s, 62 * s, 29 * s, { fill: DC2, a: .5 });
    /* 脖子 + 头 */
    const hdX = X + 70 * s, hdY = shY - lerp(32, 6, dn) * s;
    fr.line(X + 46 * s, shY - 18 * s, hdX - 14 * s, hdY + 8 * s, { w: 30 * s, color: DC, cap: 'round' });
    fr.ellipse(hdX, hdY, 30 * s, 26 * s, { fill: DC });
    fr.path(`M ${hdX + 15 * s},${hdY - 7 * s} L ${hdX + 52 * s},${hdY + 1 * s} L ${hdX + 52 * s},${hdY + 14 * s} L ${hdX + 13 * s},${hdY + 16 * s} Z`, { fill: DL });
    fr.circle(hdX + 50 * s, hdY + 7 * s, 5.5 * s, { fill: '#2A1B12' });
    /* 耳朵：警觉时竖起，趴下时完全垂 */
    fr.g({ at: [hdX - 10 * s, hdY - 14 * s], rot: lerp(.4, -.55, clamp(o.alert || 0)) }, () => {
      fr.path(`M 0,0 L ${-17 * s},${27 * s} L ${17 * s},${19 * s} Z`, { fill: DD });
    });
    if (o.eye === false) fr.line(hdX + 2 * s, hdY - 4 * s, hdX + 23 * s, hdY - 4 * s, { w: 4.5 * s, color: '#2A1B12', cap: 'round' });
    else fr.circle(hdX + 12 * s, hdY - 4 * s, 5 * s, { fill: '#2A1B12' });
  });
}

/* ---------- 箱子：剖面。cx = 中心，fy = 地板线，w/h = 宽/高 ---------- */
function room(fr, cx, fy, w, h, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0 || w <= 0) return;
  const x0 = cx - w / 2, y0 = fy - h, live = clamp(o.live || 0);
  fr.g({ a }, () => {
    fr.rect(x0, y0, w, h, { fill: fr.grad(0, y0, 0, fy, [[0, '#556270'], [.45, '#7B8794'], [1, '#A6B0B8']]) });
    for (let i = 1; i < 5; i++) fr.line(x0, y0 + h * i / 5, x0 + w, y0 + h * i / 5, { w: 1.4, color: '#4E5760', a: .5 });
    /* 后墙上的通风口 + 一道管线，让墙不是空的 */
    fr.rect(x0 + 26, y0 + 34, 118, 46, { r: 4, fill: '#3A444E', a: .9 });
    for (let i = 0; i < 4; i++) fr.line(x0 + 34, y0 + 44 + i * 10, x0 + 136, y0 + 44 + i * 10, { w: 3, color: '#5C6670', a: .95 });
    fr.line(x0, y0 + 96, x0 + w, y0 + 96, { w: 6, color: '#5C6670', a: .8 });
    fr.glow(cx, y0 + 20, w * .46, '#FFE9C0', .16);
    fr.rect(x0, fy - 44, w, 44, { fill: '#4A423C' }); fr.rect(x0, fy - 44, w, 7, { fill: '#2E2723' });
    const n = Math.max(4, Math.round(w / 32));
    for (let i = 0; i <= n; i++) fr.line(x0 + i * (w / n), fy - 37, x0 + i * (w / n), fy - 6, { w: 5, color: '#7A6E64' });
    if (live > 0) {
      const fl = live * (.8 + .2 * Math.sin(fr.t * 34));
      for (let i = 0; i <= n; i++) fr.line(x0 + i * (w / n), fy - 37, x0 + i * (w / n), fy - 6, { w: 7, color: RED, a: fl });
      fr.rect(x0, fy - 44, w, 44, { fill: RED, a: .3 * live });
      fr.glow(cx, fy - 22, w * .5, RED, .4 * live);
      for (let i = 0; i < 7; i++) { const sx = x0 + ((i * 917 + Math.floor(fr.t * 9) * 313) % w), sy = fy - 6 - (hash(i * 3 + Math.floor(fr.t * 11)) * 26); fr.glow(sx, sy, 8 + hash(i + fr.t) * 12, '#FFC9A0', .5 * live); }
    }
    fr.rect(x0 - 24, y0 - 30, w + 48, 30, { fill: '#3C444E' });
    fr.rect(x0 - 24, y0 - 30, 24, h + 74, { fill: '#343C46' });
    fr.rect(x0 + w, y0 - 30, 24, h + 74, { fill: '#343C46' });
    fr.rect(x0 - 24, fy, w + 48, 24, { fill: '#2A211E' });
  });
}
/* 墙上的信号灯 */
function lamp(fr, x, y, on, a = 1) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 15, y - 34, 30, 22, { fill: '#1E2228' });
    fr.circle(x, y, 18, { fill: '#191C21' });
    fr.circle(x, y, 12, { fill: on > .02 ? mix('#7A2A20', RED, on) : '#3A4048' });
    if (on > .02) { fr.glow(x, y, 78, RED, .5 * on); fr.circle(x, y, 11, { fill: '#FF9A80', a: .5 * on }); }
  });
}
/* 右墙那扇关着的门 */
function shutDoor(fr, x, fy, top, a = 1) {
  if (a <= 0) return;
  const h = fy - top - 46;
  fr.g({ a }, () => {
    fr.rect(x - 104, fy - h - 32, 208, h + 32, { r: 6, fill: '#39424C' });
    fr.rect(x - 96, fy - h - 26, 192, h + 26, { r: 6, fill: '#6E7984' });
    fr.rect(x - 96, fy - h - 26, 192, 12, { fill: '#525C66' });
    fr.rect(x - 74, fy - h + 6, 148, h - 46, { r: 4, fill: '#5D6872', a: .9 });
    fr.circle(x + 62, fy - h * .52, 9, { fill: '#C6CED6' });
    fr.circle(x + 62, fy - h * .52, 9, { color: '#8C96A0', w: 2 });
    fr.text('关', x, fy - h - 68, { font: 'sansh', size: 36, track: 4, color: GOLD, a: .95, shadow: .7 });
  });
}
/* 中间那道矮栏 */
function barrier(fr, x, fy, hh, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 54, fy - 18, 108, 18, { r: 6, fill: '#8A949E' });
    fr.rect(x - 12, fy - hh - 46, 24, hh + 46, { r: 6, fill: '#B8C2CC' });
    fr.rect(x - 12, fy - hh - 46, 24, 12, { r: 5, fill: '#DCE4EC' });
    fr.circle(x, fy - hh - 52, 6, { fill: '#F0F6FA' });
    if (o.label) fr.text(o.label, x, fy - hh - 88, { font: 'sansm', size: 28, track: 4, color: o.labelColor || GOLD, a: .95, shadow: .7 });
  });
}
/* A 组墙上那块能顶的板 */
function pushPanel(fr, x, y, press, a = 1) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 82, y - 98, 164, 196, { r: 8, fill: '#333C46' });
    fr.rect(x - 66 + press * 13, y - 80 + press * 11, 132, 160, { r: 6, fill: press > .02 ? mix('#7E8A96', GOLD, press * .8) : '#7E8A96' });
    fr.rect(x - 66 + press * 13, y - 80 + press * 11, 132, 18, { r: 6, fill: press > .02 ? '#B4BEC8' : '#9AA4AE', a: .75 });
    if (press > .02) fr.glow(x, y, 150, GOLD, .32 * press);
  });
}
/* 一个人形（坐着，戴耳机） */
function person(fr, x, y, s, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  fr.g({ a }, () => {
    fr.ellipse(x, y + 8 * s, 96 * s, 17 * s, { fill: '#0B0705', a: .34 });
    fr.path(`M ${x - 98 * s},${y + 6 * s} L ${x - 72 * s},${y - 80 * s} L ${x + 72 * s},${y - 80 * s} L ${x + 98 * s},${y + 6 * s} Z`, { fill: '#6E5F44' });
    fr.circle(x, y - 112 * s, 40 * s, { fill: '#947F5C' });
    if (o.headset) {
      fr.arc(x, y - 110 * s, 45 * s, -2.5, -.64, { color: '#B0A492', w: 9 * s, cap: 'round' });
      fr.rect(x - 54 * s, y - 118 * s, 22 * s, 36 * s, { r: 9 * s, fill: '#8A7C68' });
      fr.rect(x + 32 * s, y - 118 * s, 22 * s, 36 * s, { r: 9 * s, fill: '#8A7C68' });
    }
  });
}
/* 噪音波纹 */
function noiseWaves(fr, t, x, y, k, a = 1) {
  if (!(k > 0) || !(a > 0)) return;
  for (let i = 0; i < 3; i++) {
    const ph = ((t * 1.35 + i / 3) % 1 + 1) % 1;
    fr.arc(x, y, 54 + ph * 116, -1.2, 1.2, { color: RED, w: 3.4, a: (1 - ph) * .5 * k * a, cap: 'round' });
  }
  fr.glow(x, y, 96, RED, .18 * k * a);
}
/* 一张卡片（米色纸，略微倾斜） */
function card(fr, cx, cy, w, h, k, o = {}) {
  if (k <= 0) return;
  fr.g({ at: [cx, cy + (1 - k) * 40], s: lerp(.94, 1, k), rot: (o.rot == null ? -.018 : o.rot) }, () => {
    fr.g({ a: k }, () => {
      fr.rect(-w / 2 + 8, -h / 2 + 14, w, h, { r: 10, fill: '#000', a: .34 });
      fr.rect(-w / 2, -h / 2, w, h, { r: 10, fill: o.fill || PAPER });
      for (let i = 1; i < 4; i++) fr.line(-w / 2 + 34, -h / 2 + i * (h / 4), w / 2 - 34, -h / 2 + i * (h / 4), { w: 1.2, color: '#B9AE98', a: .5 });
      fr.rect(-w / 2, -h / 2, w, 62, { r: 10, fill: '#C5BA9F', a: .55 });
      if (o.title) fr.text(o.title, 0, -h / 2 + 31, { font: 'sansh', size: 38, track: 10, color: '#6B4A22' });
      if (o.body) o.body();
    });
  });
}
/* 删除线 */
function strike(fr, x, y, w, k, col) {
  if (k <= 0) return;
  fr.line(x - w / 2, y, x - w / 2 + w * k, y, { w: 7, color: col || RED, cap: 'butt' });
}
/* 一只手（从上方伸下来抓） */
function hand(fr, x, y, s, rot, a = 1) {
  if (a <= 0) return;
  fr.g({ a, at: [x, y], rot, s }, () => {
    fr.rect(-32, -300, 64, 300, { r: 22, fill: '#3D4A5A' });
    fr.rect(-40, -22, 80, 46, { r: 18, fill: '#D9A97E' });
    for (let i = 0; i < 4; i++) fr.rect(-34 + i * 19, 12, 15, 40 - Math.abs(i - 1.5) * 7, { r: 7, fill: '#C9986C' });
    fr.rect(-52, 2, 20, 34, { r: 9, fill: '#C9986C', rot: .35 });
  });
}

/* ================= 钩 0 – 8：一个关着的箱子 ================= */
function hook(fr, t) {
  backdrop(fr, '#2A2430', '#332A34');
  const CX = 980, FY = 880, TOP = 214, HGT = FY - TOP;
  const strg = fade(t, 2.9, 6.1, .18, .18);
  const live = fade(t, 2.86, 6.2, .06, .22);
  const onL = fade(t, 2.8, 6.2, .08, .1);

  room(fr, CX, FY, 1560, HGT, { live });
  lamp(fr, CX, TOP + 56, onL);
  shutDoor(fr, CX + 610, FY, TOP);

  /* 跳：2.9 起每 0.52 秒扑一次 */
  let jp = 0;
  for (let i = 0; i < 7; i++) jp = Math.max(jp, Math.sin(clamp((t - (2.9 + i * 0.52)) / 0.5) * Math.PI));
  jp *= strg;
  const dn = ss(t, 6.2, 7.8) * (1 - jp);
  const dx = lerp(CX - 210, CX + 430, E.io3(seg(t, 2.9, 6.1)));       // 它一次次往门那边扑
  dog(fr, dx, FY - 6, 1.62, {
    down: dn, jump: jp, leg: t * 9, shake: Math.sin(t * 26) * 7 * strg,
    alert: 1 - dn, eye: dn > .6 ? false : true, wag: t * 2,
  });
  placeLabel(fr, '1967', '宾夕法尼亚 · 塞利格曼的实验室', fade(t, .5, 7.9, .7, .6));
  fr.sfx(2.86, 'flash', {}); fr.sfx(3.0, 'thud', {}); fr.sfx(6.2, 'hush', {});
}

/* ================= 片名 8.6 – 16.2 ================= */
function title(fr, t) {
  const lt = t - T.title;
  backdrop(fr, '#0C0705', '#0C0705');
  K.flash(fr, t, T.title, { color: '#F0DCA8', rise: .1, fall: .5, peak: .5 });
  /* 母题：一道矮栏，左边一只小狗剪影 */
  K.titleGilt(fr, lt, {
    la: 'LEARNED HELPLESSNESS', zh: '习得性无助', tag: '塞利格曼的箱子 · 1967',
    size: 178, track: 26, cy: 452,
    motif: (fr2, lt2, a) => {
      const k = ss(lt2, 1.0, 1.9) * a; if (k <= 0) return;
      fr2.g({ a: k }, () => {
        fr2.rect(830, 690, 8, 92, { r: 4, fill: '#E7C477', a: .85 });
        fr2.rect(1092, 690, 8, 92, { r: 4, fill: '#E7C477', a: .85 });
        fr2.rect(830, 686, 270, 6, { r: 3, fill: '#E7C477', a: .9 });
        fr2.ellipse(716, 726, 34, 22, { fill: '#B99A64', a: .8 });
        fr2.ellipse(688, 700, 17, 14, { fill: '#B99A64', a: .8 });
        fr2.rect(722, 744, 8, 26, { fill: '#B99A64', a: .8 }); fr2.rect(700, 744, 8, 26, { fill: '#B99A64', a: .8 });
        fr2.rect(744, 744, 8, 26, { fill: '#B99A64', a: .8 }); fr2.rect(666, 744, 8, 26, { fill: '#B99A64', a: .8 });
        fr2.text('30 厘米', 962, 812, { font: 'sansm', size: 24, track: 8, color: '#C0A67A', a: .85 });
      });
    },
  });
  fr.sfx(T.title, 'bloom', {}); fr.sfx(T.title + .9, 'chord', {});
}

/* ================= 知 16.4 – 32.2：两组狗，一模一样的电击 ================= */
const TRIALS = [[18.0, 19.1, 23.0], [24.0, 24.9, 28.4], [29.4, 30.2, 32.4]];   // [灯亮, A 逃脱, B 结束]
const onOff = (t, list) => list.reduce((m, tr) => Math.max(m, fade(t, tr[0], tr[2], .07, .07)), 0);
function ch1(fr, t) {
  backdrop(fr, '#2A2430', '#332A34');
  const FY = 880, TOP = 340, HGT = FY - TOP, RW = 740, AX = 690, BX = 1380;

  /* A 组的灯在它顶板之后就灭；B 组的灯要亮到实验者关掉 */
  const onA = TRIALS.reduce((m, tr) => Math.max(m, fade(t, tr[0], tr[1], .07, .07)), 0);
  const onB = onOff(t, TRIALS);
  const liveA = onA, liveB = onB;
  /* A 组的按压：每一轮在 aEsc 前 0.28 秒顶下去 */
  const press = TRIALS.reduce((m, tr) => Math.max(m, fade(t, tr[1] - .34, tr[1] + .04, .12, .18)), 0);
  const escN = TRIALS.filter(tr => t >= tr[1]).length;
  const triesN = TRIALS.reduce((s, tr) => s + Math.floor(clamp((Math.min(t, tr[2]) - tr[0]) / 0.42)), 0);

  room(fr, AX, FY, RW, HGT, { live: liveA });
  room(fr, BX, FY, RW, HGT, { live: liveB });
  lamp(fr, AX, TOP + 46, onA); lamp(fr, BX, TOP + 46, onB);
  pushPanel(fr, AX + RW / 2 - 96, TOP + 216, press);

  /* A 组狗：从左往右跑，用鼻子去顶右墙上那块板 */
  const walk = TRIALS.reduce((m, tr) => Math.max(m, fade(t, tr[0] - .1, tr[1], .35, .1)), 0);
  const adx = lerp(AX - 190, AX + RW / 2 - 300, walk);
  dog(fr, adx, FY - 6, 1.15, { leg: t * 7, shake: press * 9, alert: .7, wag: t * 3 });
  /* B 组狗：乱撞 */
  let jp = 0;
  for (const tr of TRIALS) for (let i = 0; i < 12; i++) { const a0 = tr[0] + i * .42; jp = Math.max(jp, Math.sin(clamp((t - a0) / .38) * Math.PI) * (t < tr[2] ? 1 : 0)); }
  const bStrg = TRIALS.reduce((m, tr) => Math.max(m, fade(t, tr[0], tr[2], .1, .1)), 0);
  const bdx = BX - 110 + Math.sin(t * 3.1) * 90 * bStrg;
  dog(fr, bdx, FY - 6, 1.15, { jump: jp * .8, leg: t * 11, shake: Math.sin(t * 24) * 7 * bStrg, alert: 1, wag: t * 2 });

  /* 两个注解：A 的动作能停下电击；B 的什么都没有 */
  const capA = Math.min(1, fade(t, 18.4, 23.0, .4, .4) + fade(t, 24.4, 29.0, .4, .4) + fade(t, 29.8, 32.0, .4, .4));
  fr.text('顶一下 → 电击停', AX + RW / 2 - 96, TOP + 372, { font: 'sansm', size: 27, track: 4, color: GOLD, a: capA, shadow: .7 });
  fr.text('· 什么都没有 ·', BX, TOP + 372, { font: 'sansm', size: 27, track: 4, color: '#F0907A', a: capA * .95, shadow: .7 });

  /* 组名 + 计数 */
  const la = fade(t, T.ch1In + .3, T.ch1Out - .2, .6, .5);
  fr.g({ a: la }, () => {
    fr.text('A 组 · 可逃脱', AX, 168, { font: 'sansh', size: 32, track: 4, color: DIM, shadow: .6 });
    fr.text('B 组 · 不可逃脱', BX, 168, { font: 'sansh', size: 32, track: 4, color: DIM, shadow: .6 });
    fr.text('逃脱', AX - 118, 246, { font: 'sans', size: 34, track: 4, color: MUTE });
    fr.text(String(escN), AX + 22, 242, { font: 'sansh', size: 90, color: INK, shadow: .7 });
    fr.text('逃脱', BX - 118, 246, { font: 'sans', size: 34, track: 4, color: MUTE });
    fr.text('0', BX + 22, 242, { font: 'sansh', size: 90, color: RED, shadow: .7, glow: 16, glowColor: RED, glowA: .35 });
    if (t > 18.4) fr.text('尝试 ' + triesN, BX + 8, 300, { font: 'sansm', size: 27, track: 3, color: RED, a: .9 });
    if (escN > 0) fr.text('第 ' + escN + ' 轮', AX + 8, 300, { font: 'sansm', size: 27, track: 3, color: GOLD, a: .9 });
  });
  topLine(fr, '1967 · 宾夕法尼亚 · 塞利格曼与梅尔', fade(t, T.ch1In + .2, 31.4, .6, .6));
  placeLabel(fr, '1967', '两组 · 一模一样的电击', fade(t, T.ch1In + .1, T.ch1Out - .3, .6, .5));
  TRIALS.forEach(tr => { fr.sfx(tr[0], 'flash', {}); fr.sfx(tr[1], 'tick', {}); fr.sfx(tr[2], 'tock', {}); });
  fr.sfx(31.6, 'stamp', {});
}

/* ================= 形 32.4 – 50.2：门开了，它不走了 ================= */
function shuttle(fr, t, o) {
  const FY = 880, TOP = 268, HGT = FY - TOP, CX = 980, RW = 1560;
  room(fr, CX, FY, RW, HGT, { live: o.live });
  lamp(fr, CX, TOP + 48, o.lamp);
  barrier(fr, CX + 150, FY, 122, { label: o.label ? '矮栏 · 30 厘米' : null });
  return { FY, TOP, CX, RW, BX: CX + 150 };
}
function ch2(fr, t) {
  backdrop(fr, '#2A2430', '#332A34');
  const S = shuttle(fr, t, { live: 0, lamp: 0 });
  const FY = S.FY, CX = S.CX, BX = S.BX;

  /* 32.4 – 35.6 转场卡 */
  const kCard = fade(t, 32.6, 35.4, .5, .5);
  if (kCard > 0) fr.g({ a: kCard }, () => {
    fr.rect(0, 0, W, H, { fill: '#0C0705', a: .72 });
    fr.text('24 小时后', W / 2, 500, { font: 'serifh', size: 118, track: 26, color: GOLD, shadow: .7, glow: 24, glowColor: '#8A6428', glowA: .4 });
    fr.text('换一个箱子 · 中间有一道矮栏', W / 2, 596, { font: 'sans', size: 32, track: 8, color: MUTE });
  });

  /* 35.6 – 43.0：可逃脱组，几秒就跳过去了 */
  const aOn = fade(t, 36.0, 41.6, .08, .08);
  const liveA = fade(t, 36.0, 41.6, .06, .1);
  if (t < 42.6) {
    shuttle(fr, t, { live: liveA, lamp: aOn });
    const run = seg(t, 36.4, 41.2);
    const jk = seg(t, 41.1, 41.9);                                  // 起跳 → 落地
    const dx = lerp(CX - 470, BX - 130, E.in2(run));
    const arc = Math.sin(jk * Math.PI);
    const over = jk > 0 ? E.io3(seg(t, 41.1, 42.0)) : 0;
    const px = lerp(dx, BX + 260, over);
    dog(fr, px, FY - 6, 1.22, { jump: arc, leg: t * 9, down: 0, alert: 1, wag: t * 3 });
    /* 秒表 */
    const sw = fade(t, 36.2, 43.0, .3, .3);
    if (sw > 0) fr.g({ a: sw }, () => {
      const sec = Math.min(5.8, (Math.min(t, 41.9) - 36.0));
      fr.text(sec.toFixed(1), 430, 470, { font: 'latinm', size: 76, color: t >= 41.9 ? GOLD : INK, shadow: .6 });
      fr.text('秒', 430 + fr.measure(sec.toFixed(1), { font: 'latinm', size: 76 }) + 12, 480, { font: 'sans', size: 26, color: MUTE });
      if (t >= 41.9) fr.text('逃脱', 430, 536, { font: 'sansh', size: 34, track: 8, color: GOLD });
    });
    /* 没发生的那条路（先不画） */
  }

  /* 43.2 – 50.2：不可逃脱组，趴下了 */
  if (t >= 42.4) {
    const kB = ss(t, 42.6, 43.6);                        // 这一段一直留到本章结束（退场交给 K.dips）
    const bOn = fade(t, 43.6, 49.4, .08, .1);
    const liveB = fade(t, 43.6, 49.4, .06, .3);
    fr.g({ a: kB }, () => {
      shuttle(fr, t, { live: liveB, lamp: bOn, label: true });
      /* 那条它没有走的路 */
      const ghost = fade(t, 45.4, 49.8, .8, .4);
      if (ghost > 0) fr.g({ a: ghost * .5 }, () => {
        fr.ellipse(BX, FY - 210, 300, 190, { color: DIM, w: 4, a0: -2.5, a1: .5, dash: [22, 18] });
        fr.text('它没有试', BX - 300, FY - 400, { font: 'sansm', size: 28, track: 6, color: MUTE });
      });
      dog(fr, CX - 300, FY - 6, 1.22, { down: 1, eye: false, shake: Math.sin(t * 40) * 1.6 * liveB, wag: 0 });
    });
  }
  topLine(fr, '24 小时后 · 换一个箱子', fade(t, 32.8, 49.6, .6, .6));
  placeLabel(fr, '1967', '穿梭箱 · 中间一道矮栏', Math.min(1, fade(t, 32.8, 35.4, .6, .6) + fade(t, 42.8, 49.8, .5, .5)));
  fr.sfx(36.0, 'flash', {}); fr.sfx(41.6, 'rise', {}); fr.sfx(43.6, 'flash', {}); fr.sfx(44.2, 'hush', {}); fr.sfx(47.6, 'chord', {});
}

/* ================= 我 50.4 – 66.2：1975，换成人 ================= */
const GROUPS = [
  { x: 520, name: '可控噪音组', sub: '按得停', ctrl: 1, noise: 1, bar: 1.0, red: false },
  { x: 960, name: '不可控噪音组', sub: '怎么按都停不了', ctrl: 0, noise: 1, bar: .42, red: true },
  { x: 1400, name: '对照组', sub: '不给噪音', ctrl: 1, noise: 0, bar: .95, red: false },
];
function ch3(fr, t) {
  backdrop(fr, '#232A46', '#2B2A3E');
  /* 夜里的书桌 */
  const g = fr.grad(0, 0, 0, 760, [[0, '#333A5E'], [1, '#20203A']]);
  fr.rect(0, 0, W, 760, { fill: g });
  for (let i = 0; i < 3; i++) { const cx = [330, 960, 1620][i]; fr.glow(cx, 250, 300, '#6A7AC0', .22); fr.rect(cx - 160, 110, 320, 450, { r: 8, fill: '#48517E', a: .6 }); fr.rect(cx - 160, 110, 320, 12, { fill: '#5A6494', a: .6 }); }
  fr.rect(0, 760, W, 320, { fill: '#3A200D' }); fr.rect(0, 756, W, 12, { fill: '#543016' });

  const train = fade(t, 53.6, 57.4, .5, .5);          // 训练阶段
  const test = fade(t, 57.8, 65.6, .5, .5);           // 测试阶段
  const trainN = fade(t, 51.0, 57.6, .6, .5);

  GROUPS.forEach((G, i) => {
    const a1 = fade(t, 50.6 + i * .12, 66.0, .6, .5);
    fr.g({ a: a1 }, () => {
      /* 人 */
      person(fr, G.x, 720, 1.0, { headset: 1 });
      /* 噪音 */
      if (G.noise) {
        const on = fade(t, 53.8, 57.4, .3, .5);
        const stopped = G.ctrl ? fade(t, 54.9, 57.4, .2, .02) : 0;
        noiseWaves(fr, t, G.x, 612, on * (1 - stopped));
        if (G.ctrl && stopped > 0) fr.text('停了', G.x, 560, { font: 'sansh', size: 26, track: 6, color: GOLD, a: stopped, shadow: .6 });
        if (!G.ctrl && on > .3) {
          for (let k = 0; k < 3; k++) {                              // 手在按，没用
            const pk = ((t * 2 + k / 3) % 1 + 1) % 1;
            fr.circle(G.x + 150, 800 - pk * 12, 12, { fill: '#8A7A63', a: (1 - pk) * .7 * on });
          }
          fr.text('没用', G.x + 214, 792, { font: 'sansh', size: 26, track: 6, color: RED, a: on, shadow: .6 });
        }
      }
      /* 柱子：解出的题数（只画多少，不写数字） */
      if (test > 0) {
        const hmax = 250, h = hmax * G.bar, k = E.out3(clamp((t - 58.2 - i * .35) / 1.8));
        const base = 500, hp = h * k;
        fr.rect(G.x - 54, base - hp, 108, hp, { r: 6, fill: G.red ? RED : INK, a: .92 * test });
        if (G.red) fr.glow(G.x, base - hp, 150, RED, .2 * test);
        fr.rect(G.x - 54, base - hp, 108, 8, { r: 4, fill: G.red ? '#FF8A70' : '#FFFFFF', a: .8 * test });
      }
      /* 字谜卡片 */
      if (test > 0) {
        const r = rng(4100 + i * 7);
        for (let j = 0; j < 4; j++) {
          const kk = clamp((t - 58.4 - j * .22) / .5), px = G.x - 96 + j * 52;
          if (kk <= 0) continue;
          fr.rect(px, 786 - (1 - kk) * 26, 42, 56, { r: 5, fill: PAPER, a: kk * test });
          fr.rect(px, 786 - (1 - kk) * 26, 42, 9, { r: 4, fill: '#BFB4A0', a: kk * test });
          fr.text('ABCDEFGH'[Math.floor(r() * 8)], px + 21, 812 - (1 - kk) * 26,
            { font: 'latinm', size: 26, color: G.red ? '#9C5B4A' : '#6B4A22', a: kk * test });
        }
      }
      /* 标签 */
      fr.text(G.name, G.x, 148, { font: 'sansh', size: 30, track: 4, color: G.red ? '#F0907A' : DIM, shadow: .6 });
      fr.text(G.sub, G.x, 184, { font: 'sansm', size: 24, track: 3, color: MUTE });
      if (test > 0 && t > 60.4) fr.text('解出的题数', G.x, 536, { font: 'sansm', size: 22, track: 4, color: MUTE, a: test });
    });
  });
  topLine(fr, '1975 · 广户与塞利格曼 · 换成人', fade(t, 50.8, 65.8, .6, .6));
  placeLabel(fr, '1975', '噪音 + 字谜', fade(t, 50.8, 65.8, .6, .6));
  fr.sfx(50.6, 'soft', {}); fr.sfx(53.8, 'tick', {}); fr.sfx(54.9, 'tock', {}); fr.sfx(58.2, 'rise', {}); fr.sfx(61.4, 'stamp', {});
}

/* ================= 术·为什么 66.4 – 79.2：那句话是怎么说的 ================= */
const DIMS = [
  { y: 452, name: '是谁的问题', l: '我', r: '这件事' },
  { y: 592, name: '会不会过去', l: '永远', r: '这一次' },
  { y: 732, name: '影响有多大', l: '全都', r: '只有这一件' },
];
function ch4(fr, t) {
  backdrop(fr, '#241F2E', '#2B2634');
  const A = fade(t, T.ch4In + .2, 78.8, .6, .6);
  /* 图例 */
  fr.g({ a: fade(t, 67.0, 78.8, .6, .6) }, () => {
    fr.circle(690, 250, 11, { fill: RED, glow: 14, glowColor: RED, glowA: .5 });
    fr.text('“我不行”', 730, 250, { font: 'sansh', size: 34, track: 4, color: '#F0907A', align: 'l', shadow: .6 });
    fr.circle(1150, 250, 11, { fill: INK });
    fr.text('“这一步的方法没对”', 1190, 250, { font: 'sansh', size: 34, track: 4, color: INK, align: 'l', shadow: .6 });
  });
  DIMS.forEach((D, i) => {
    const a = fade(t, 68.4 + i * .18, 78.8, .5, .5) * A;
    if (a <= 0) return;
    const x0 = 560, x1 = 1360, y = D.y;
    fr.g({ a }, () => {
      fr.line(x0, y, x1, y, { w: 3, color: '#3A3546', cap: 'butt' });
      fr.line(x0, y - 16, x0, y + 16, { w: 3, color: '#5A5470', cap: 'butt' });
      fr.line(x1, y - 16, x1, y + 16, { w: 3, color: '#5A5470', cap: 'butt' });
      fr.text(D.l, x0 - 26, y - 2, { font: 'sansh', size: 32, track: 4, color: RED, align: 'r', shadow: .6 });
      fr.text(D.r, x1 + 26, y - 2, { font: 'sansh', size: 32, track: 4, color: INK, align: 'l', shadow: .6 });
      fr.text(D.name, (x0 + x1) / 2, y - 54, { font: 'sansm', size: 26, track: 6, color: MUTE });
      /* 红滑块：往左端推 */
      const kr = E.out3(seg(t, 70.4 + i * .8, 71.4 + i * .8));
      const kx = lerp((x0 + x1) / 2, x0, kr);
      fr.circle(kx, y, 17, { fill: RED, glow: 18, glowColor: RED, glowA: .5 });
      fr.circle(kx, y, 7, { fill: '#FFD9CE' });
      /* 白滑块：往右端推 */
      const kw = E.out3(seg(t, 74.6 + i * .8, 75.6 + i * .8));
      const wx = lerp((x0 + x1) / 2, x1, kw);
      if (kw > 0) { fr.circle(wx, y, 17, { fill: INK }); fr.circle(wx, y, 7, { fill: '#9A9488' }); }
    });
  });
  topLine(fr, '1978 · 归因风格 · 三个维度', fade(t, T.ch4In + .3, 78.6, .6, .6));
  DIMS.forEach((D, i) => { fr.sfx(70.4 + i * .8, 'tick', {}); fr.sfx(74.6 + i * .8, 'tick', {}); });
  fr.sfx(76.8, 'chord', {});
}

/* ================= 术·怎么解开 79.4 – 94.2：三招 ================= */
function star(fr, x, y, r, a, col) {
  let d = '';
  for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .44 : r; d += (i ? 'L' : 'M') + (x + Math.cos(an) * rr).toFixed(1) + ',' + (y + Math.sin(an) * rr).toFixed(1) + ' '; }
  fr.path(d + 'Z', { fill: col || GOLD, a, glow: 16, glowColor: '#8A6428', glowA: .45 });
}
function ch5(fr, t) {
  backdrop(fr, '#241F2E', '#2B2634');
  /* 招一：换词 */
  const k1 = fade(t, 79.6, 84.3, .5, .5);
  if (k1 > 0) card(fr, 960, 520, 900, 470, k1, {
    title: '第 一 招 · 换 词',
    body: () => {
      fr.text('我不行', 0, -70, { font: 'serifh', size: 96, track: 12, color: '#8A5A4A' });
      strike(fr, 0, -70, 340, clamp((t - 80.6) / .7), RED);
      const k2 = clamp((t - 81.4) / .8);
      if (k2 > 0) {
        fr.line(0, 6, 0, 46, { w: 2.5, color: '#B9AE98', a: .8, dash: [10, 10] });
        fr.text('这一步没对', 0, 122, { font: 'serifh', size: 96, track: 12, color: '#6B4A22', a: k2 });
        fr.text('人', -300, 26, { font: 'sansm', size: 24, track: 4, color: '#9A8E76' });
        fr.text('事', -300, 170, { font: 'sansm', size: 24, track: 4, color: '#9A8E76' });
      }
    },
  });
  /* 招二：拆小 */
  const k2c = fade(t, 84.6, 89.1, .5, .5);
  if (k2c > 0) card(fr, 960, 520, 900, 470, k2c, {
    title: '第 二 招 · 拆 小',
    body: () => {
      const FY = 152, BX = 200;
      fr.rect(-360, FY - 14, 720, 14, { r: 6, fill: '#B9AE98' });
      const kA = clamp((t - 85.4) / .9), kB = clamp((t - 86.8) / .9);
      /* 8 米的高墙 → 0.3 米的一步 */
      if (kA > 0) fr.g({ a: 1 - kB * .88 }, () => {
        fr.rect(BX - 9, FY - 252, 18, 252, { r: 5, fill: '#9A8E76' });
        fr.text('8 米', BX, FY - 282, { font: 'sansh', size: 30, track: 4, color: '#8A7E66' });
        for (let i = 0; i < 3; i++) fr.rect(BX - 40 - i * 150, FY - 252 + i * 74, 26, 126, { r: 5, fill: '#A79B84', a: .7 });
      });
      if (kB > 0) fr.g({ a: kB }, () => {
        fr.rect(BX - 9, FY - 22, 18, 22, { r: 5, fill: '#6B4A22' });
        fr.text('0.3 米', BX + 100, FY - 40, { font: 'sansh', size: 30, track: 4, color: '#6B4A22' });
        const st = clamp((t - 87.6) / 1.0);
        const fx = lerp(-210, 214, E.io3(st));
        fr.path(`M ${fx - 30},${FY - 8} L ${fx + 26},${FY - 8} L ${fx + 34},${FY - 34} L ${fx - 6},${FY - 40} Z`, { fill: '#6B4A22' });
        if (st > .7) star(fr, 320, FY - 82, 26, clamp((st - .7) / .3), '#B8862C');
        fr.text('一步', -262, FY + 48, { font: 'sansm', size: 26, track: 6, color: '#9A8E76' });
        fr.text('拆到不可能失败', 60, FY + 48, { font: 'sansm', size: 26, track: 6, color: '#9A8E76' });
      });
    },
  });
  /* 招三：记账 */
  const k3c = fade(t, 89.4, 94.2, .5, .5);
  if (k3c > 0) card(fr, 960, 520, 900, 470, k3c, {
    title: '第 三 招 · 记 账',
    body: () => {
      for (let i = 0; i < 3; i++) {
        const y = -110 + i * 92, kk = clamp((t - 90.2 - i * .55) / .6);
        if (kk <= 0) continue;
        fr.g({ a: kk }, () => {
          fr.line(-330, y, 250, y, { w: 3, color: '#A79B84', a: .8 });
          fr.circle(-360, y, 16, { color: '#A79B84', w: 3 });
          strike(fr, -40, y, 620, clamp((t - 90.6 - i * .55) / .5), '#6B4A22');
          if (t > 91.0 + i * .55) star(fr, 330, y, 24, clamp((t - 91.0 - i * .55) / .4), '#B8862C');
        });
      }
      fr.text('今天做成了三件', 0, 178, { font: 'serifh', size: 46, track: 10, color: '#6B4A22', a: clamp((t - 92.6) / .8) });
    },
  });
  topLine(fr, '怎么解开它', fade(t, T.ch5In + .3, 94.0, .6, .6));
  fr.sfx(80.6, 'tick', {}); fr.sfx(85.4, 'rise', {}); fr.sfx(87.6, 'tick', {}); fr.sfx(89.6, 'stamp', {}); fr.sfx(91.6, 'shimmer', {}); fr.sfx(92.8, 'shimmer', {});
}

/* ================= 答 94.4 – 100 ================= */
const DRAGS = [[94.7, 95.35], [95.45, 96.10], [96.20, 96.85]];
function outro(fr, t) {
  backdrop(fr, '#2A2430', '#332A34');
  const S = shuttle(fr, t, { live: 0, lamp: 0, label: true });
  const FY = S.FY, CX = S.CX, BX = S.BX;

  const dragK = DRAGS.reduce((m, d) => Math.max(m, seg(t, d[0], d[1])), 0);
  const dragging = DRAGS.some(d => t >= d[0] && t <= d[1] + .1);
  const onLate = fade(t, 97.0, 98.4, .08, .12);
  const liveLate = fade(t, 97.0, 98.2, .06, .3);

  /* 拖：一次、两次、三次 */
  if (t < 97.0) {
    let dx = CX - 430, carried = 0;
    for (const d of DRAGS) {
      if (t >= d[0] && t <= d[1] + .12) { const k = seg(t, d[0], d[1]); dx = lerp(CX - 430, BX + 240, E.io3(k)); carried = Math.sin(k * Math.PI); }
    }
    dog(fr, dx, FY - 6 - carried * 26, 1.18, { down: .45 + carried * .3, eye: false, wag: 0 });
    if (dragging) hand(fr, dx + 62, FY - 250 - carried * 26, 1.0, .12, 1);
    fr.text('拖过去 · 不算它赢', W / 2, 250, { font: 'sansm', size: 28, track: 8, color: MUTE, a: fade(t, 94.7, 96.6, .5, .5) });
  } else {
    shuttle(fr, t, { live: liveLate, lamp: onLate, label: true });
    /* 它自己跳 */
    const run = seg(t, 97.2, 97.9), jk = seg(t, 97.9, 98.5);
    const px = lerp(CX - 430, BX + 130, run);
    const px2 = lerp(px, BX + 310, E.io3(jk));
    dog(fr, px2, FY - 6, 1.18, { jump: Math.sin(jk * Math.PI), leg: t * 10, down: 0, alert: 1, wag: t * 4 });
    if (t > 98.3) {
      const kk = clamp((t - 98.3) / .6);
      fr.g({ a: kk }, () => { star(fr, BX + 400, FY - 300, 26, 1, GOLD); fr.text('它自己跳了', BX + 400, FY - 240, { font: 'sansh', size: 30, track: 6, color: GOLD, shadow: .6 }); });
    }
  }
  /* 末句：压暗，只留那道矮栏 */
  const kEnd = ss(t, 98.4, 99.0);
  if (kEnd > 0) {
    fr.rect(0, 0, W, H, { fill: '#0C0705', a: .74 * kEnd });
    fr.g({ a: kEnd }, () => {
      fr.rect(1500, 800, 6, 92, { r: 3, fill: GOLD, a: .8 });
      fr.rect(1690, 800, 6, 92, { r: 3, fill: GOLD, a: .8 });
      fr.rect(1500, 796, 196, 5, { r: 3, fill: GOLD, a: .9 });
    });
  }
  topLine(fr, '1967 · 那道矮栏', fade(t, 94.6, 98.2, .5, .6));
  DRAGS.forEach(d => fr.sfx(d[0], 'thud', {}));
  fr.sfx(97.0, 'flash', {}); fr.sfx(97.9, 'rise', {}); fr.sfx(98.5, 'chord', {}); fr.sfx(99.4, 'hush', {});
}

/* ---------- 全片那把尺子：放弃指数 ---------- */
function gaugeVal(t) {
  if (t < 18.0) return 26;
  if (t < 32.2) return lerp(26, 44, seg(t, 24.0, 32.2));
  if (t < 44.0) return lerp(44, 58, seg(t, 35.6, 43.0));
  if (t < 48.0) return lerp(58, 132, E.in2(seg(t, 44.0, 48.0)));
  if (t < 89.2) return 132;
  if (t < 93.9) return lerp(132, 96, seg(t, 89.2, 93.9));
  if (t < 96.6) return lerp(96, 78, seg(t, 93.9, 96.6));
  return lerp(78, 28, E.out3(seg(t, 96.6, 98.4)));
}
function gaugeCap(t) {
  if (t < T.ch2In) return '对象：{笼中的狗}';
  if (t < T.ch3In) return '对象：{穿梭箱里的狗}';
  if (t < 62.0) return '对象：{被噪音训练过的人}';
  return '对象：{!你}';
}

VK.film({
  dur: T.outro, theme: 'flat', meta: { title: '习得性无助', root: 0 },
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
      /* 贯穿全片的仪表（钩和片名不出现） */
      const ga = fade(t, T.ch1In + .1, 99.2, .8, .8);
      if (ga > 0) K.gauge(fr, 64, 150, { value: gaugeVal(t), max: 150, redFrom: 100, zone: '习得', label: '放弃指数', caption: gaugeCap(t), a: ga });
      warmVig(fr, .42);
      bottomBand(fr);
    });
    K.subs(fr, t, SUBS, 'flat');                          // 字幕永远最后画
  },
});
})();
