/* ★《旁观者效应》· B 寓言 · 100 秒 · 七章：钩 / 片名 / 知 / 形 / 我 / 术·为什么 / 术·怎么 / 答
 * 一句话：围观的人越多，每个人心里那句"该我吗"就越轻 —— 不是人心坏了，是责任被除开了。
 * 全片那把尺子：左上的「现场人数」仪表（0–40，12 以上进红区，标"沉默"），副标题实时显示"我的责任 1/N"。
 *   读数：1 → 8 → 38 → 1 → 3 → 1 → 5 → 1 → 12 → 1。
 *   结尾人数回不到 0，但指针从 12 猛地落回 1 —— 因为总会有人变成"那一个人"。尺子的收法就是结论。
 * 回场：钩子那圈围观的人在最后一章回来，这次有人蹲下了。
 *
 * 事实（2026-10-11 联网核对）：
 *   · 1964 Kitty Genovese 案：《纽约时报》报道称 38 位邻居目击而无人报警。
 *     Manning, Levine & Collins (2007) 查案卷：38 不在警方记录里（出自编辑部）；至少两人报了警；
 *     还有一人从窗口喊话把袭击者吓退。
 *   · Latané & Darley 1968 烟雾实验：被试填问卷时烟从墙上通风口灌入。独处 75% 报告（半数 2 分钟内）；
 *     三个真实被试同处只剩 38%；一名真实被试 + 两名纹丝不动的同谋，降到 10%。
 *     未报告者把烟重新定义成"蒸汽"——即多元无知，不是冷漠。
 *   · Latané & Darley 癫痫实验：隔间 + 耳机 + 麦克风。独处 85% 求助；以为还有另外 4 人在场 → 31%。
 *   · 五步决策模型（Darley & Latané 1970）：注意到 → 解释为紧急 → 承担个人责任 → 决定怎么做 → 实施帮助。
 *   · Clark & Word 1972：换成明确的紧急（亲眼看见维修工从梯子上摔下），效应消失，帮助接近 100%。
 *   · Fischer et al. 2011 meta：105 个效应量、7700+ 人，g = −0.35（真实但小）；危险情境缩小、施暴者在场时反转。
 *   · Philpot et al. 2020（American Psychologist，英/荷/南非监控 N=219）：90.9% 至少一人介入，
 *     平均 3.76 名介入者；旁观者越多，越可能有人介入。
 * 示意：街道、公寓楼、围观者站位、问卷与烟、隔间与耳机、齿轮、剪刀、梯子、卡片说法、监控构图、
 *       仪表读数 —— 全是画的，不是数据。"接近百分之百"是结论方向，柱子按此意画。
 * 这套外观的常驻元素：仪表 K.gauge、片名卡 K.titleGilt。规格见 references/worlds.md。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix } = VK;
const K = VKit, P = K.PAL.flat;

const GOLD = P.gold, GOLDHI = P.goldHi, RED = P.red, INK = P.ink, DIM = P.dim, MUTE = P.mute, PAPER = P.paper;
const GREY = '#5E6470', GREYHI = '#8A919C', COLD = '#7FA8C8';

const T = {
  hookEnd: 8.0, dim1: 8.0, title: 8.6, titleEnd: 16.2,
  ch1In: 16.4, ch1Out: 32.2, ch2In: 32.4, ch2Out: 50.2,
  ch3In: 50.4, ch3Out: 66.2, ch4In: 66.4, ch4Out: 79.2,
  ch5In: 79.4, ch5Out: 94.2, endIn: 94.4, outro: 100.0,
};
const DIP = [8.0, 16.2, 32.2, 50.2, 66.2, 79.2, 94.2];

const SUBS = [
  { a: 0.7, b: 2.9, zh: '凌晨三点，一个人倒在了街上' },
  { a: 3.1, b: 5.4, zh: '路过的每一个人，都停下来了' },
  { a: 5.6, b: 7.9, zh: '可是围观的人越多，{越没有人出手}' },
  { a: 16.8, b: 20.0, zh: '1964 年，纽约。凯蒂·吉诺维斯在自家门口遇袭' },
  { a: 20.2, b: 23.4, zh: '第二天，报纸的头版写着：{38 位目击者}，无人报警' },
  { a: 23.6, b: 26.8, zh: '2007 年，三位研究者翻了当年的案卷：{警方记录里根本没有 38}' },
  { a: 26.9, b: 29.6, zh: '至少两个人报了警，还有一个人从窗口喊，把凶手吓跑了' },
  { a: 29.8, b: 32.0, zh: '案子是假的。但它点燃的那个问题，{是真的}', tone: 'gold' },
  { a: 32.8, b: 35.8, zh: '1968 年，达利和拉塔内把这件事搬进了实验室' },
  { a: 36.0, b: 38.6, zh: '让你在房间里填问卷，然后，从通风口{灌进浓烟}' },
  { a: 38.8, b: 41.6, zh: '你一个人的时候，{75%} 的人起身报告' },
  { a: 41.8, b: 44.4, zh: '房间里坐着三个人，只剩 {38%}' },
  { a: 44.6, b: 47.4, zh: '如果那两位是安排好的、纹丝不动的人 —— {!10%}' },
  { a: 47.6, b: 50.0, zh: '他们不是冷漠。他们{把烟重新解释成了蒸汽}', tone: 'gold' },
  { a: 50.8, b: 53.6, zh: '另一间实验室：你戴着耳机，听见隔壁有人{抽搐发作}' },
  { a: 53.8, b: 56.6, zh: '以为只有你一个人听见：{85%} 去求助' },
  { a: 56.8, b: 59.8, zh: '以为还有另外{四位}也听见了：{!31%}' },
  { a: 60.0, b: 63.0, zh: '帮助要走过五步：注意到 → 认出是紧急 → {该我} → 怎么做 → 动手' },
  { a: 63.2, b: 66.0, zh: '人群没有让人变坏，它只是在第三步，{把绳子剪断}', tone: 'gold' },
  { a: 66.8, b: 70.0, zh: '三样东西在拖你：{人数}、{看不懂}、{怕出丑}' },
  { a: 70.2, b: 73.4, zh: '1972 年，克拉克和沃德换了一个设定' },
  { a: 73.6, b: 76.4, zh: '不是听见有人发作，而是{亲眼看见}维修工从梯子上摔下来' },
  { a: 76.6, b: 79.0, zh: '旁观者效应，{消失了}。帮助接近百分之百', tone: 'gold' },
  { a: 79.8, b: 84.3, zh: '第一招：别对着人群喊。{指着一个人说}：穿蓝外套的你，打 120' },
  { a: 84.6, b: 89.1, zh: '第二招：如果你是旁观者 —— 假装现场{只有你一个人}' },
  { a: 89.4, b: 94.0, zh: '第三招：把你看见的说出来。一句话就能替所有人解围' },
  { a: 94.6, b: 96.6, zh: '2020 年，有人不演了，直接看了 {219 段}真实监控' },
  { a: 96.8, b: 98.6, zh: '十次冲突里，{九次}至少有一个人站了出来' },
  { a: 98.8, b: 100.0, zh: '你缺的不是善意，是那句{该我了}', tone: 'gold', big: 2 },
];

/* ---------- 一块底 ---------- */
function backdrop(fr, c1, c2) {
  fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, H, [[0, c1 || '#3B3444'], [.55, c2 || '#433C4E'], [1, '#302A38']]) });
}
/* 概念章铺一块"舞台板"，东西才不会浮在黑里 */
function stage(fr, x0, y0, x1, y1, a, c) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x0 + 12, y0 + 16, x1 - x0, y1 - y0, { r: 18, fill: '#000', a: .36 });
    fr.rect(x0, y0, x1 - x0, y1 - y0, { r: 18, fill: c || '#4A5060' });
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

/* ================= 人：站着 / 躺着 / 蹲下 ================= */
function stander(fr, x, y, s, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const c = o.c || '#6E5F44', hc = o.hc || '#947F5C';
  fr.g({ a, at: [x, y], s: s == null ? 1 : s, rot: o.rot || 0 }, () => {
    fr.ellipse(0, 12, 78, 15, { fill: '#0B0705', a: .34 });
    if (o.kneel) {
      fr.path(`M -70,10 L -48,-84 L 48,-84 L 70,10 Z`, { fill: c });
      fr.circle(0, -118, 37, { fill: hc });
      fr.rect(-8, -44, 96, 17, { r: 8, fill: hc });      // 伸出去的一只手
    } else {
      fr.path(`M -66,8 L -50,-92 L 50,-92 L 66,8 Z`, { fill: c });
      fr.circle(0, -124, 37, { fill: hc });
      if (o.point) fr.rect(38, -96, 78, 15, { r: 7, fill: hc });   // 抬手指人
      if (o.turn) fr.circle(o.turn > 0 ? 13 : -13, -126, 8, { fill: '#2A2019', a: .8 });
    }
    if (o.hi > 0) fr.glow(0, -60, 150, GOLD, .3 * o.hi);
  });
}
function lying(fr, x, y, s, a, o = {}) {
  if (a <= 0) return;
  const c = o.c || '#6E5F44', hc = o.hc || '#947F5C';
  fr.g({ a, at: [x, y], s }, () => {
    fr.ellipse(0, 24, 116, 17, { fill: '#0B0705', a: .36 });
    fr.rect(-96, -30, 192, 56, { r: 27, fill: c });
    fr.rect(-96, -30, 192, 12, { r: 6, fill: '#000', a: .16 });
    fr.circle(-120, -2, 34, { fill: hc });
    fr.rect(74, -4, 96, 19, { r: 9, fill: c });
    if (o.hi > 0) fr.glow(0, -8, 170, GOLD, .28 * o.hi);
  });
}

/* ================= 街景 ================= */
const SKYLINE = (() => {
  const r = rng(20261011);
  return Array.from({ length: 9 }, (_, i) => ({
    x: 40 + i * 212 + (r() - .5) * 40, w: 150 + r() * 90, h: 240 + r() * 300,
    lit: r() < .45, seed: r(),
  }));
})();
function buildings(fr, base, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    for (const b of SKYLINE) {
      const r = rng(1000 + Math.floor(b.seed * 8999));
      fr.rect(b.x, base - b.h, b.w, b.h, { fill: '#3A4050' });
      fr.rect(b.x, base - b.h, b.w, 6, { r: 3, fill: '#3D4453' });
      for (let ry = base - b.h + 34; ry < base - 48; ry += 52) {
        for (let cx = b.x + 20; cx < b.x + b.w - 24; cx += 46) {
          const on = r() < (b.lit ? .5 : .22);
          fr.rect(cx, ry, 24, 28, { r: 2, fill: on ? '#FFD89A' : '#2E3340' });
          if (on) fr.glow(cx + 12, ry + 14, 34, '#FFC978', .2);
        }
      }
    }
  });
}
function street(fr, gy, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(0, gy, W, H - gy, { fill: fr.grad(0, gy, 0, H, [[0, '#6A707C'], [1, '#4A4E58']]) });
    for (let i = 0; i <= 16; i++) fr.line(i * (W / 16), gy + 120, i * (W / 16) + (i - 8) * 30, H, { w: 2, color: '#2E323A', a: .5 });
    fr.rect(0, gy - 12, W, 14, { fill: '#868C98' });
    fr.rect(0, gy, W, 5, { fill: '#2A2E36', a: .55 });
  });
}
function streetLamp(fr, x, gy, on, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 8, gy - 460, 16, 460, { fill: '#414751' });
    fr.path(`M ${x - 8},${gy - 460} L ${x + 96},${gy - 500} L ${x + 100},${gy - 484} L ${x + 8},${gy - 444} Z`, { fill: '#414751' });
    fr.ellipse(x + 98, gy - 478, 30, 11, { fill: on > .02 ? '#FFE2A8' : '#6E7681' });
    if (on > .02) { fr.glow(x + 98, gy - 400, 460, '#FFD89A', .3 * on); fr.glow(x + 98, gy - 474, 130, '#FFF2D2', .5 * on); }
  });
}

/* ================= 计数牌 ================= */
function countBoard(fr, x, y, n, help, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 150, y - 56, 300, 112, { r: 12, fill: '#141019', a: .82 });
    fr.rect(x - 150, y - 56, 300, 112, { r: 12, color: '#5A5470', w: 2, a: .6 });
    fr.text('围观', x - 96, y - 16, { font: 'sans', size: 26, track: 4, color: MUTE });
    fr.text(String(n), x + 6, y - 18, { font: 'latinm', size: 46, color: '#F3EBDA' });
    fr.text('出手', x - 96, y + 30, { font: 'sans', size: 26, track: 4, color: MUTE });
    fr.text(String(help), x + 6, y + 28, { font: 'latinm', size: 46, color: help > 0 ? GOLD : RED });
  });
}

/* ================= 钩 0 – 8：一圈人，没有一个人上前 ================= */
const CROWD = (() => {
  const r = rng(4242);
  return Array.from({ length: 8 }, (_, i) => {
    const ang = -Math.PI * .92 + i * (Math.PI * .84 / 7);
    const rad = 250 + r() * 190;
    return { i, x: 980 + Math.cos(ang) * rad, y: 812 + Math.sin(ang) * rad * .17, s: .74 + r() * .3, ph: r(), t0: 1.15 + i * 0.72 };
  });
})();
const nCrowd = t => CROWD.reduce((n, o) => n + (t >= o.t0 ? 1 : 0), 0);

function hook(fr, t) {
  backdrop(fr, '#31364A', '#3A4056');
  const GY = 812;
  buildings(fr, GY - 10, fade(t, .1, 7.9, .5, .5));
  street(fr, GY, fade(t, .1, 7.9, .5, .5));
  streetLamp(fr, 320, GY, fade(t, .2, 7.9, .4, .4), fade(t, .1, 7.9, .5, .5));
  streetLamp(fr, 1650, GY, fade(t, .2, 7.9, .4, .4), fade(t, .1, 7.9, .5, .5));

  const kv = fade(t, .55, 7.9, .45, .45);
  lying(fr, 980, GY + 6, 1.0, kv);

  for (const o of CROWD) {
    const k = ss(t, o.t0, o.t0 + .55);
    if (k > 0) stander(fr, o.x, o.y, o.s, { a: k, c: GREY, hc: GREYHI, turn: o.i % 2 ? 1 : -1 });
  }
  const n = nCrowd(t);
  const kb = fade(t, 2.6, 7.9, .5, .04);
  if (kb > 0) countBoard(fr, 1520, 148, n, 0, kb);

  const d1 = fade(t, .5, 3.0, .6, .6), d2 = fade(t, 3.1, 5.5, .5, .5), d3 = fade(t, 5.6, 7.9, .5, .5);
  if (d1 > 0) fr.text('03:14', 300, 300, { font: 'latinm', size: 32, track: 4, color: MUTE, align: 'l', a: d1, shadow: .7 });
  if (d2 > 0) fr.text('围观 3', 300, 300, { font: 'sansm', size: 30, track: 5, color: MUTE, align: 'l', a: d2, shadow: .7 });
  if (d3 > 0) fr.text('围观 8 · 出手 0', 300, 300, { font: 'sansm', size: 30, track: 5, color: '#FF9A80', align: 'l', a: d3, shadow: .7 });
  placeLabel(fr, '0', '一条凌晨三点的街', fade(t, .3, 7.9, .6, .6));

  for (const o of CROWD) fr.sfx(o.t0, 'tick', {});
  fr.sfx(0.7, 'soft', {}); fr.sfx(6.4, 'hush', {});
}

/* ================= 片名 8 – 16：责任被切开了 ================= */
function title(fr, t) {
  backdrop(fr, '#241F2C', '#2C2534');
  const lt = t - T.title + .4;
  K.titleGilt(fr, lt, {
    zh: '旁观者效应', la: 'BYSTANDER EFFECT', tag: '人越多，越没有人出手', tagDy: 300, cy: 452,
    motif(fr2, l2, a2) {
      /* 母题：一块「责任 100%」的方块被切成 8 片，分给围成一圈的小人 */
      const bx = W / 2, by = 800;
      const kBox = ss(l2, 1.6, 2.0) * (1 - ss(l2, 3.1, 3.6));
      if (kBox > 0) fr2.g({ a: a2 * kBox }, () => {
        fr2.rect(bx - 96, by - 52, 192, 104, { r: 8, fill: '#3B3348', a: .9 });
        fr2.rect(bx - 96, by - 52, 192, 104, { r: 8, color: GOLD, w: 2, a: .5 });
        fr2.text('责任', bx, by - 16, { font: 'sansh', size: 34, track: 6, color: GOLD });
        fr2.text('100%', bx, by + 24, { font: 'latinm', size: 32, color: '#F3EBDA' });
      });
      const kCut = ss(l2, 2.0, 2.7) * (1 - ss(l2, 3.1, 3.6));
      if (kCut > 0) fr2.g({ a: a2 * kCut }, () => {
        for (let i = 1; i < 8; i++) {
          const gx = bx - 96 + i * 24;
          fr2.line(gx, by - 58, gx, by + 58, { w: 2.5, color: RED, a: .8, dash: [9, 7] });
        }
      });
      const kFly = E.io3(ss(l2, 2.7, 3.5));
      if (kFly > 0) {
        for (let i = 0; i < 8; i++) {
          const ang = -Math.PI * .88 + i * (Math.PI * .76 / 7);
          const tx = bx + Math.cos(ang) * 320, ty = by + 8 + Math.sin(ang) * 76;
          const px = lerp(bx - 84 + i * 24, tx, kFly), py = lerp(by, ty, kFly);
          fr2.rect(px - 9, py - 26, 18, 52, { r: 4, fill: GOLD, a: a2 * (.35 + .55 * kFly) });
        }
        for (let i = 0; i < 8; i++) {
          const ang = -Math.PI * .88 + i * (Math.PI * .76 / 7);
          const tx = bx + Math.cos(ang) * 320, ty = by + 8 + Math.sin(ang) * 76;
          stander(fr2, tx, ty + 52, .42, { a: a2 * kFly, c: GREY, hc: GREYHI });
        }
      }
    },
  });
  fr.sfx(T.title + .5, 'chord', {}); fr.sfx(T.title + 1.0, 'flash', {}); fr.sfx(T.title + 3.2, 'shimmer', {});
}

/* ================= 知 16.4 – 32.2：那个案子，和它被推翻 ================= */
const WINS = [[470, 320], [650, 320], [470, 470], [650, 470], [470, 620], [650, 620], [300, 470]];
function apartment(fr, x, y, w, h, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x, y, w, h, { fill: fr.grad(0, y, 0, y + h, [[0, '#5A6270'], [1, '#7E8694']]) });
    fr.rect(x - 16, y - 22, w + 32, 22, { fill: '#333A44' });
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = x + 48 + col * (w - 96) / 2.2, wy = y + 52 + row * (h - 104) / 3.2;
        fr.rect(wx - 46, wy - 40, 92, 80, { r: 4, fill: '#39414C' });
      }
    }
    fr.rect(x + w / 2 - 56, y + h - 92, 112, 92, { fill: '#2A303A' });
  });
}
function litWindow(fr, x, y, k, a) {
  if (a <= 0 || k <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 44, y - 38, 88, 76, { r: 4, fill: mix('#39414C', '#FFD89A', k) });
    if (k > .1) fr.glow(x, y, 120, '#FFC978', .3 * k);
  });
}
function phoneIcon(fr, x, y, s, a) {
  if (a <= 0) return;
  fr.g({ a, at: [x, y], s }, () => {
    fr.rect(-15, -26, 30, 52, { r: 6, fill: '#F3EBDA' });
    fr.rect(-11, -20, 22, 32, { r: 3, fill: '#7FA8C8' });
    fr.circle(0, 18, 4, { fill: '#B9AE98' });
    fr.glow(0, 0, 90, GOLD, .3);
  });
}
function shoutWaves(fr, t, x, y, k, a) {
  if (!(k > 0) || !(a > 0)) return;
  for (let i = 0; i < 3; i++) {
    const u = ((t * .7 + i * .33) % 1 + 1) % 1;
    fr.arc(x, y, 22 + u * 96, -1.0, 1.0, { color: '#FFD89A', w: 5, a: (1 - u) * .7 * k * a });
  }
}
function newspaper(fr, cx, cy, w, h, k, o = {}) {
  if (k <= 0) return;
  fr.g({ at: [cx, cy + (1 - k) * 44], s: lerp(.95, 1, k), rot: -.016 }, () => {
    fr.g({ a: k }, () => {
      fr.rect(-w / 2 + 9, -h / 2 + 15, w, h, { r: 6, fill: '#000', a: .34 });
      fr.rect(-w / 2, -h / 2, w, h, { r: 6, fill: o.fill || '#E8E2D2' });
      for (let i = 1; i < 7; i++) fr.line(-w / 2 + 30, -h / 2 + i * (h / 7), w / 2 - 30, -h / 2 + i * (h / 7), { w: 1.2, color: '#B9B09A', a: .5 });
      fr.rect(-w / 2 + 30, -h / 2 + 22, w - 60, 4, { fill: '#4A4238', a: .8 });
      if (o.kicker) fr.text(o.kicker, 0, -h / 2 + 54, { font: 'sansm', size: 24, track: 6, color: '#6B6355' });
      if (o.head) fr.text(o.head, 0, -h / 2 + 116, { font: 'serifh', size: 62, track: 3, color: '#241F19' });
      if (o.sub) fr.text(o.sub, 0, -h / 2 + 168, { font: 'sans', size: 27, track: 2, color: '#4A4238' });
    });
  });
}
function dossier(fr, cx, cy, w, h, k) {
  if (k <= 0) return;
  fr.g({ at: [cx, cy + (1 - k) * 44], s: lerp(.95, 1, k), rot: .014 }, () => {
    fr.g({ a: k }, () => {
      fr.rect(-w / 2 + 9, -h / 2 + 15, w, h, { r: 8, fill: '#000', a: .34 });
      fr.rect(-w / 2, -h / 2, w, h, { r: 8, fill: '#20303E' });
      fr.rect(-w / 2, -h / 2, w, 58, { r: 8, fill: '#2C4054' });
      fr.text('案卷 · 2007', 0, -h / 2 + 29, { font: 'sansh', size: 27, track: 6, color: COLD });
      fr.text('警方记录里', 0, -h / 2 + 104, { font: 'sansm', size: 34, track: 3, color: '#DCE6F0' });
      fr.text('没有“38”', 0, -h / 2 + 156, { font: 'sansh', size: 44, track: 4, color: '#FF9A80' });
      for (let i = 1; i < 4; i++) fr.line(-w / 2 + 30, -h / 2 + 196 + i * 22, w / 2 - 30, -h / 2 + 196 + i * 22, { w: 1.4, color: '#5A6E82', a: .55 });
      fr.text('Manning, Levine & Collins', 0, -h / 2 + 300, { font: 'latin', size: 22, track: 1, color: '#8FA4B8' });
    });
  });
}
function cross(fr, x, y, r, k, col) {
  if (k <= 0) return;
  fr.line(x - r, y - r, x + r, y + r, { w: 9, color: col || RED, cap: 'round', a: k });
  fr.line(x + r, y - r, x - r, y + r, { w: 9, color: col || RED, cap: 'round', a: k });
}

function ch1(fr, t) {
  backdrop(fr, '#33303E', '#3B3744');
  const kA = fade(t, T.ch1In + .2, 29.6, .5, .5);
  apartment(fr, 170, 250, 640, 470, kA);
  WINS.forEach((p, i) => litWindow(fr, p[0], p[1], ss(t, 17.6 + i * .12, 18.6 + i * .12) * .8, kA));
  lying(fr, 490, 786, .8, fade(t, 17.4, 29.6, .45, .5));
  const kShout = fade(t, 27.6, 29.6, .4, .04);
  if (kShout > 0) {
    shoutWaves(fr, t, 650, 320, kShout, 1);
    fr.text('“喂！”', 650, 214, { font: 'sansh', size: 34, color: '#FFD89A', a: kShout, shadow: .7 });
  }
  const kPh = fade(t, 26.9, 29.6, .4, .04);
  if (kPh > 0) { phoneIcon(fr, 300, 470, 1, kPh); phoneIcon(fr, 470, 620, 1, kPh); }

  const kN = fade(t, 20.2, 26.6, .45, .5);
  newspaper(fr, 1240, 470, 560, 460, kN, { kicker: '1964-03-14 · 纽约', head: '38 位目击者', sub: '无人报警' });
  cross(fr, 1240, 470, 190, fade(t, 23.6, 26.6, .4, .04));

  const kD = fade(t, 24.4, 29.6, .5, .5);
  dossier(fr, 1240, 470, 560, 400, kD);

  const kQ = fade(t, 29.8, T.ch1Out, .4, .04);
  if (kQ > 0) fr.text('案子是假的。问题是真的', W / 2, 900, { font: 'serifm', size: 52, track: 8, color: GOLD, a: kQ, shadow: .8 });

  placeLabel(fr, '1964', '纽约皇后区', fade(t, T.ch1In + .3, T.ch1Out - .2, .6, .6));
  fr.sfx(16.8, 'soft', {}); fr.sfx(20.2, 'tick', {}); fr.sfx(23.6, 'thud', {});
  fr.sfx(26.9, 'rise', {}); fr.sfx(29.8, 'bloom', {});
}

/* ================= 形 32.4 – 50.2：烟灌进来 ================= */
const SMOKE = (() => {
  const r = rng(1207);
  return Array.from({ length: 78 }, () => ({ ox: r() * 620, oy: (r() - .5) * 300, ph: r(), sp: .18 + r() * .3, sz: 10 + r() * 26, sw: (r() - .5) * 90 }));
})();
function smokeFill(fr, t, x, y, k, a) {
  if (!(k > 0) || !(a > 0)) return;
  for (const p of SMOKE) {
    const u = ((t * p.sp + p.ph) % 1 + 1) % 1;
    const px = x + p.ox * (0.25 + u * 1.1) + Math.sin(u * 4 + p.ph * 8) * p.sw * (.3 + u);
    const py = y + p.oy * (0.3 + u * .9) - u * 240;
    fr.glow(px, py, p.sz * (1 + u * 2.0), '#CFCABC', (1 - u) * .38 * k * a);
  }
}
function labRoom(fr, o) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const x0 = o.x0, x1 = o.x1, fy = o.fy, top = o.top;
  fr.g({ a }, () => {
    fr.rect(x0, top, x1 - x0, fy - top, { fill: fr.grad(0, top, 0, fy, [[0, '#59636F'], [.5, '#828C99'], [1, '#A3ADB9']]) });
    for (let i = 1; i < 6; i++) fr.line(x0, top + (fy - top) * i / 6, x1, top + (fy - top) * i / 6, { w: 1.2, color: '#4C5560', a: .28 });
    fr.rect(x0 - 24, top - 30, x1 - x0 + 48, 30, { fill: '#3B434D' });
    fr.rect(x0 - 24, top - 30, 24, fy - top + 36, { fill: '#333B44' });
    fr.rect(x1, top - 30, 24, fy - top + 36, { fill: '#333B44' });
    fr.rect(x0, fy - 44, x1 - x0, 44, { fill: '#6E5A3E' });
    fr.rect(x0, fy - 44, x1 - x0, 7, { fill: '#463414' });
    const n = Math.max(8, Math.round((x1 - x0) / 52));
    for (let i = 0; i <= n; i++) fr.line(x0 + i * ((x1 - x0) / n), fy - 37, x0 + i * ((x1 - x0) / n), fy - 3, { w: 4, color: '#8C6740', a: .8 });
  });
}
function vent(fr, x, y, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 8, y - 8, 152, 84, { r: 4, fill: '#3A424C' });
    for (let i = 0; i < 5; i++) fr.rect(x, y + i * 15, 136, 9, { r: 4, fill: '#20262E' });
  });
}
function deskQ(fr, x, y, w, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x, y, w, 16, { r: 4, fill: '#8A6B41' });
    fr.rect(x, y, w, 5, { r: 3, fill: '#B08B57', a: .8 });
    fr.rect(x + 24, y + 16, 16, 96, { fill: '#5E4728' });
    fr.rect(x + w - 40, y + 16, 16, 96, { fill: '#5E4728' });
    fr.rect(x + 40, y - 26, 92, 26, { r: 3, fill: '#EFE9DA' });
    for (let i = 1; i < 4; i++) fr.line(x + 50, y - 20 + i * 6, x + 122, y - 20 + i * 6, { w: 1, color: '#BFB4A0', a: .8 });
  });
}
function bar(fr, x, y, w, h, k, o = {}) {
  if (!(k > 0)) return;
  const col = o.col || GOLD;
  fr.rect(x, y, w, h, { r: 6, fill: '#171320', a: .8 });
  fr.rect(x, y + h * (1 - k), w, h * k, { r: 6, fill: col, a: .92 });
  if (o.label) fr.text(o.label, x + w / 2, y + h + 36, { font: 'sansh', size: 30, track: 3, color: o.lcol || MUTE, shadow: .6 });
  if (o.pct) fr.text(o.pct, x + w / 2, y - 26, { font: 'latinm', size: 48, track: 1, color: col, shadow: .6 });
}

function ch2(fr, t) {
  backdrop(fr, '#33343F', '#3B3C47');
  const X0 = 300, X1 = 1620, TOP = 262, FY = 640;
  labRoom(fr, { x0: X0, x1: X1, fy: FY, top: TOP, a: fade(t, T.ch2In + .2, T.ch2Out - .2, .5, .5) });
  vent(fr, 320, 330, fade(t, 33.6, 50.0, .4, .4));
  deskQ(fr, 560, 560, 300, fade(t, 33.4, 50.0, .4, .4));
  deskQ(fr, 980, 560, 300, fade(t, 33.4, 50.0, .4, .4));
  deskQ(fr, 1360, 560, 240, fade(t, 33.4, 50.0, .4, .4));

  /* 三个人：阶段 0 独处 / 1 三人 / 2 一真 + 两同谋 */
  const STAGE = t < 41.6 ? 0 : (t < 44.4 ? 1 : 2);
  const seatX = [700, 1120, 1480];
  const seatA = [0, 1, 2].map(i => {
    if (i === 0) return fade(t, 34.2, T.ch2Out - .3, .45, .04);
    if (STAGE === 0) return 0;
    return fade(t, STAGE === 1 ? 41.8 : 44.6, T.ch2Out - .3, .45, .04);
  });
  seatX.forEach((sx, i) => {
    const a = seatA[i]; if (a <= 0) return;
    const confed = STAGE === 2 && i > 0;
    stander(fr, sx, 572, .92, { a, c: confed ? '#4B5260' : '#6E5F44', hc: confed ? '#767E8C' : '#947F5C', turn: i === 0 ? 1 : -1 });
  });
  if (STAGE === 2) {
    const kc = fade(t, 44.6, T.ch2Out - .3, .4, .04);
    if (kc > 0) {
      fr.text('安排好的', 1120, 352, { font: 'sans', size: 24, track: 3, color: '#9AA2AE', a: kc, shadow: .6 });
      fr.text('安排好的', 1480, 352, { font: 'sans', size: 24, track: 3, color: '#9AA2AE', a: kc, shadow: .6 });
    }
  }

  smokeFill(fr, t, 340, 380, ss(t, 36.1, 38.2) * (1 - ss(t, 49.6, 50.1)), 1);

  /* 三根柱子 */
  const kStage2 = fade(t, 38.4, 50.0, .5, .5);
  stage(fr, 300, 690, 1620, 812, kStage2, '#464C5C');
  const BARS = [
    [38.8, 41.6, .75, '独处 · 1 人', '75%', GOLD, 420],
    [41.8, 44.4, .38, '三人同处', '38%', '#E0B366', 860],
    [44.6, 49.4, .10, '1 真人 + 2 同谋', '10%', RED, 1300],
  ];
  BARS.forEach((B, i) => {
    const grow = clamp(seg(t, B[0], B[0] + 1.1), 0, 1);
    const out = i === 2 ? 1 : (1 - ss(t, B[1] + .6, B[1] + 1.4));
    const a = fade(t, B[0] - .2, B[1] + 2.6, .5, .04) * kStage2;
    if (a <= 0) return;
    fr.g({ a }, () => bar(fr, B[6], 722, 200, 74, B[2] * grow * out, { label: B[3], pct: B[4], col: B[5] }));
  });

  const kSt = fade(t, 47.6, 50.0, .4, .04);
  if (kSt > 0) {
    fr.text('“蒸汽？”', 700, 300, { font: 'serifm', size: 46, track: 4, color: '#E8DFC8', a: kSt, shadow: .8 });
    fr.text('不是冷漠 —— 是重新解释', 700, 226, { font: 'sans', size: 26, track: 3, color: MUTE, a: kSt, shadow: .6 });
  }
  placeLabel(fr, '1968', '达利 & 拉塔内 · 烟雾实验', fade(t, T.ch2In + .3, T.ch2Out - .2, .6, .6));
  fr.sfx(32.8, 'soft', {}); fr.sfx(36.2, 'hush', {}); fr.sfx(38.8, 'tick', {});
  fr.sfx(41.8, 'thud', {}); fr.sfx(44.6, 'tock', {}); fr.sfx(47.6, 'bloom', {});
}

/* ================= 我 50.4 – 66.2：五步链断在第三步 ================= */
function booth(fr, x, y, w, h, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x, y, w, h, { r: 10, fill: o.dim ? '#2E3440' : '#363D4A' });
    fr.rect(x, y, w, h, { r: 10, color: o.live ? GOLD : '#4A5462', w: o.live ? 3 : 2, a: o.live ? .85 : .55 });
    fr.arc(x + w / 2, y + 34, 34, Math.PI * 1.06, Math.PI * 1.94, { color: '#8A94A2', w: 7 });   // 耳机
    fr.rect(x + w / 2 - 42, y + 34, 18, 9, { r: 4, fill: '#8A94A2' });
    fr.rect(x + w / 2 + 24, y + 34, 18, 9, { r: 4, fill: '#8A94A2' });
    fr.rect(x + w / 2 + 42, y + 42, 8, 60, { r: 4, fill: '#6E7886' });                            // 麦克风杆
    fr.circle(x + w / 2 + 46, y + 106, 11, { fill: '#8A94A2' });
    stander(fr, x + w / 2, y + h - 44, .56, { a: 1, c: o.dim ? GREY : '#6E5F44', hc: o.dim ? GREYHI : '#947F5C' });
    if (o.label) fr.text(o.label, x + w / 2, y + h + 28, { font: 'sans', size: 24, track: 3, color: MUTE, shadow: .6 });
  });
}
function soundWave(fr, t, x, y, k, a) {
  if (!(k > 0) || !(a > 0)) return;
  for (let i = 0; i < 5; i++) {
    const u = ((t * 1.5 + i * .2) % 1 + 1) % 1;
    const hh = (18 + u * 46) * (.4 + Math.abs(Math.sin(t * 9 + i)) * .9);
    fr.rect(x + i * 22, y - hh / 2, 10, hh, { r: 5, fill: RED, a: (1 - u) * .8 * k * a });
  }
}

function ch3(fr, t) {
  backdrop(fr, '#2F3444', '#373B4C');
  const BW = 250, BH = 300, BY = 300;
  const BX = [180, 460, 740, 1020, 1300];
  const nLive = t < 56.6 ? 1 : 5;
  for (let i = 0; i < 5; i++) {
    const a = fade(t, T.ch3In + .3 + i * .08, 65.8, .45, .04);
    booth(fr, BX[i], BY, BW, BH, { a, dim: i >= nLive, live: i < nLive, label: i === 0 ? '你' : '' });
  }
  const kw = fade(t, 51.6, 60.0, .4, .4);
  soundWave(fr, t, BX[0] + BW + 40, BY + 150, kw, 1);
  if (kw > 0) fr.text('隔壁', BX[0] + BW + 46, BY + 96, { font: 'sans', size: 24, track: 3, color: '#FF9A80', a: kw, shadow: .6 });

  stage(fr, 1500, 300, 1780, 470, fade(t, 53.4, 65.8, .5, .5), '#464C5C');
  const b1 = clamp(seg(t, 53.8, 55.4) * (1 - ss(t, 56.4, 57.6)), 0, 1);
  bar(fr, 1546, 330, 110, 120, .85 * b1, { label: '以为独处', pct: '85%', col: GOLD });
  const b2 = ss(t, 57.0, 58.6);
  bar(fr, 1672, 330, 110, 120, .31 * b2, { label: '以为 4 人在', pct: '31%', col: RED });

  /* 五步链 */
  const STEPS = ['注意到', '认出是紧急', '该我', '怎么做', '动手'];
  const kChain = fade(t, 60.0, 65.8, .5, .5);
  stage(fr, 160, 592, 1400, 740, kChain, '#4A5060');
  if (kChain > 0) fr.g({ a: kChain }, () => {
    const y = 620, w = 200, gap = 240, x0 = 190;
    for (let i = 0; i < 5; i++) {
      const kx = ss(t, 60.0 + i * .34, 60.5 + i * .34);
      if (kx <= 0) continue;
      const cut = i >= 2;
      const cxx = x0 + i * gap;
      fr.rect(cxx, y, w, 96, { r: 10, fill: cut ? '#5A3A42' : '#5E6676', a: .98 });
      fr.rect(cxx, y, w, 96, { r: 10, color: cut ? RED : GOLD, w: 3.5, a: cut ? .8 : .95 });
      fr.text(STEPS[i], cxx + w / 2, y + 48, { font: 'sansh', size: 34, track: 3, color: cut ? '#E3CFCB' : '#FFFDF6' });
      if (i < 4) {
        fr.line(cxx + w + 6, y + 48, cxx + gap - 6, y + 48, { w: 5, color: i >= 1 ? RED : GOLD, a: i >= 1 ? .45 : .85 });
        if (i === 1) cross(fr, cxx + gap - 14, y + 48, 19, kx, RED);
      }
    }
    const kSc = fade(t, 63.2, 65.8, .4, .04);
    if (kSc > 0) {
      fr.text('断在这里', 656, 566, { font: 'sansh', size: 32, track: 4, color: '#FF9A80', a: kSc, shadow: .7 });
      fr.g({ a: kSc, at: [656, 636], rot: -.5 }, () => {
        fr.line(-46, -22, 40, 26, { w: 7, color: '#C9C0AE', cap: 'round' });
        fr.line(-46, 26, 40, -22, { w: 7, color: '#C9C0AE', cap: 'round' });
      });
    }
  });
  placeLabel(fr, '1968', '拉塔内 & 达利 · 隔间实验', fade(t, T.ch3In + .3, T.ch3Out - .2, .6, .6));
  fr.sfx(50.8, 'soft', {}); fr.sfx(53.8, 'tick', {}); fr.sfx(56.8, 'thud', {});
  fr.sfx(60.0, 'soft', {}); fr.sfx(63.2, 'shimmer', {});
}

/* ================= 术·为什么 66.4 – 79.2：拔掉"模糊"，效应消失 ================= */
function gear(fr, x, y, r, teeth, rot, o = {}) {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  fr.g({ a, at: [x, y], rot: rot || 0 }, () => {
    let d = '';
    for (let i = 0; i < teeth * 2; i++) {
      const an = i * Math.PI / teeth, rr = i % 2 ? r * .84 : r;
      d += (i ? 'L' : 'M') + (Math.cos(an) * rr).toFixed(1) + ',' + (Math.sin(an) * rr).toFixed(1) + ' ';
    }
    fr.path(d + 'Z', { fill: o.c || '#6A7486', color: o.ec || '#B4BECC', w: o.w || 3 });
    fr.circle(0, 0, r * .3, { fill: '#2A2F38' });
    if (o.bad) { fr.line(-r * .72, -r * .72, r * .72, r * .72, { w: 8, color: RED, cap: 'round', a: .85 }); }
  });
}
function ladder(fr, x, gy, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(x - 62, gy - 420, 12, 420, { fill: '#7A8492' });
    fr.rect(x + 50, gy - 420, 12, 420, { fill: '#7A8492' });
    for (let i = 0; i < 8; i++) fr.rect(x - 62, gy - 400 + i * 50, 124, 10, { fill: '#8A94A2' });
  });
}

function ch4(fr, t) {
  backdrop(fr, '#31343F', '#393C47');
  const kG = fade(t, T.ch4In + .2, 73.2, .5, .5);
  if (kG > 0) fr.g({ a: kG }, () => {
    stage(fr, 240, 300, 1180, 640, 1, '#484E5E');
    const GS = [[470, 470, '人数'], [760, 470, '看不懂'], [1050, 470, '怕出丑']];
    GS.forEach((g, i) => {
      const kg = ss(t, 66.8 + i * .5, 67.5 + i * .5);
      gear(fr, g[0], g[1], 128, 14, t * (i % 2 ? -.34 : .34) + i, { a: kg, c: '#7E8898', ec: '#B4BECC', w: 3 });
      fr.text(g[2], g[0], g[1] + 176, { font: 'sansh', size: 34, track: 4, color: '#E8E2D2', a: kg, shadow: .6 });
    });
    const kT = fade(t, 69.4, 73.2, .4, .04);
    if (kT > 0) fr.text('三只一起转，你就动不了', 760, 336, { font: 'sans', size: 27, track: 3, color: DIM, a: kT, shadow: .6 });
  });

  /* 1972：亲眼看见 */
  const kL = fade(t, 73.4, T.ch4Out - .2, .5, .5);
  if (kL > 0) fr.g({ a: kL }, () => {
    stage(fr, 1180, 300, 1780, 700, 1, '#4C5264');
    ladder(fr, 1320, 660, 1);
    const fall = E.io3(seg(t, 74.4, 75.6));
    stander(fr, lerp(1358, 1300, fall), lerp(320, 640, fall), .78,
      { a: 1, rot: fall * 1.5, c: '#7E6C4E', hc: '#9C8763' });
    lying(fr, 1560, 668, .78, ss(t, 75.4, 76.4));
    fr.text('亲眼看见', 1480, 356, { font: 'sansh', size: 32, track: 4, color: '#FFD89A', shadow: .7 });
    fr.text('Clark & Word 1972', 1480, 296, { font: 'latin', size: 22, track: 2, color: MUTE, shadow: .6 });
  });

  /* "模糊"那只崩掉 + 柱子涨满 */
  const kBreak = fade(t, 76.6, T.ch4Out - .2, .4, .04);
  if (kBreak > 0) {
    gear(fr, 760, 470, 128, 14, 0, { a: kBreak * .5, c: '#7E8898', ec: RED, w: 3, bad: true });
    stage(fr, 240, 720, 1180, 812, kBreak, '#484E5E');
    bar(fr, 320, 748, 820, 52, .99 * E.io3(seg(t, 76.6, 78.2)), { pct: '≈100%', col: GOLD });
    fr.text('旁观者效应，消失了', 730, 706, { font: 'sansh', size: 32, track: 4, color: GOLD, a: kBreak, shadow: .7 });
  }
  placeLabel(fr, '1972', '克拉克 & 沃德 · 明确化实验', fade(t, 70.4, T.ch4Out - .2, .6, .6));
  fr.sfx(66.8, 'tock', {}); fr.sfx(67.5, 'tock', {}); fr.sfx(68.2, 'tock', {});
  fr.sfx(70.2, 'soft', {}); fr.sfx(73.6, 'thud', {}); fr.sfx(76.6, 'bloom', {});
}

/* ================= 术·怎么 79.4 – 94.2：三招 ================= */
function tip(fr, n, label, a) {
  if (a <= 0) return;
  fr.g({ a }, () => {
    fr.rect(W / 2 - 210, 236, 420, 62, { r: 10, fill: '#141019', a: .78 });
    fr.rect(W / 2 - 210, 236, 420, 62, { r: 10, color: GOLD, w: 2, a: .5 });
    fr.text('第' + n + '招 · ' + label, W / 2, 267, { font: 'sansh', size: 34, track: 5, color: GOLD, shadow: .6 });
  });
}
function bubble(fr, x, y, str, k, o = {}) {
  if (k <= 0) return;
  fr.g({ a: k, at: [x, y], s: lerp(.9, 1, k) }, () => {
    const w = o.w || 420;
    fr.rect(-w / 2, -46, w, 92, { r: 46, fill: o.fill || '#F3EBDA' });
    fr.path(`M ${-40},${42} L ${-8},${42} L ${-34},${80} Z`, { fill: o.fill || '#F3EBDA' });
    fr.text(str, 0, 0, { font: o.font || 'sansh', size: o.size || 36, track: 3, color: '#3B2A18' });
  });
}
const CROWD2 = (() => {
  const r = rng(3141);
  return Array.from({ length: 9 }, (_, i) => ({ i, x: 420 + i * 150 + (r() - .5) * 40, y: 700 + (r() - .5) * 46, s: .74 + r() * .26, ph: r() }));
})();

function ch5(fr, t) {
  backdrop(fr, '#332C3E', '#3B3444');
  /* 招一：指名道姓 */
  const k1 = fade(t, 79.6, 84.3, .5, .5);
  if (k1 > 0) fr.g({ a: k1 }, () => {
    stage(fr, 260, 330, 1660, 770, 1, '#4A5062');
    const picked = CROWD2[4];
    const kP = E.io3(seg(t, 80.8, 81.8));
    CROWD2.forEach(o => {
      const isP = o.i === picked.i;
      stander(fr, o.x, o.y, o.s, {
        a: 1, c: isP ? mix(GREY, '#7A6335', kP) : GREY,
        hc: isP ? mix(GREYHI, '#D9B46A', kP) : GREYHI, hi: isP ? kP : 0,
      });
    });
    if (kP > 0) {
      bubble(fr, picked.x, picked.y - 250, '打 120', kP, { w: 260, size: 40 });
      fr.g({ a: kP, at: [picked.x - 30, picked.y - 152], rot: -.5 }, () => {
        fr.path('M 0,0 L 140,0 L 140,-16 L 216,8 L 140,32 L 140,16 L 0,16 Z', { fill: GOLD, a: .95 });
      });
      fr.text('穿蓝外套的你', picked.x, picked.y - 306, { font: 'sansh', size: 30, track: 3, color: GOLD, a: kP, shadow: .7 });
    }
    const kNo = fade(t, 80.0, 84.3, .4, .04);
    if (kNo > 0) {
      fr.text('别对着人群喊', 300, 300, { font: 'sansm', size: 32, track: 4, color: '#FF9A80', align: 'l', a: kNo, shadow: .7 });
      cross(fr, 300, 370, 22, kNo, '#FF9A80');
    }
    tip(fr, '一', '求助者', k1);
  });

  /* 招二：假装只有你一个 */
  const k2 = fade(t, 84.6, 89.1, .5, .5);
  if (k2 > 0) fr.g({ a: k2 }, () => {
    stage(fr, 260, 330, 1660, 770, 1, '#4A5062');
    CROWD2.forEach(o => {
      const out = o.i === 4 ? 1 : 1 - ss(t, 85.6 + o.i * .16, 86.4 + o.i * .16);
      stander(fr, o.x, o.y, o.s, { a: out, c: GREY, hc: GREYHI, hi: o.i === 4 ? ss(t, 85.6, 87.0) : 0 });
    });
    const kS = fade(t, 86.6, 89.1, .4, .04);
    if (kS > 0) fr.text('现场只有你一个人', 1620, 300, { font: 'sansh', size: 36, track: 4, color: GOLD, align: 'r', a: kS, shadow: .7 });
    tip(fr, '二', '旁观者', k2);
  });

  /* 招三：把话说出来 */
  const k3 = fade(t, 89.4, 94.2, .5, .5);
  if (k3 > 0) fr.g({ a: k3 }, () => {
    stage(fr, 260, 330, 1660, 770, 1, '#4A5062');
    CROWD2.forEach(o => stander(fr, o.x, o.y, o.s, { a: 1, c: GREY, hc: GREYHI, turn: o.i % 2 ? 1 : -1 }));
    const kB = E.io3(seg(t, 90.4, 91.4));
    bubble(fr, 980, 470, '他是不是需要帮忙？', kB, { w: 560, size: 38 });
    const kT = fade(t, 91.6, 94.2, .4, .04);
    if (kT > 0) fr.text('一句话，替所有人解围', 1620, 300, { font: 'sansh', size: 34, track: 4, color: GOLD, align: 'r', a: kT, shadow: .7 });
    tip(fr, '三', '打破沉默', k3);
  });

  fr.sfx(79.8, 'stamp', {}); fr.sfx(84.6, 'rise', {}); fr.sfx(89.4, 'chord', {});
}

/* ================= 答 94.4 – 100：真实世界里，总有人先动手 ================= */
function monitor(fr, x0, y0, x1, y1, t, k) {
  if (k <= 0) return;
  fr.g({ a: k }, () => {
    fr.rect(x0, y0, x1 - x0, y1 - y0, { r: 8, fill: '#141821' });
    fr.g({ clip: [x0 + 4, y0 + 4, x1 - x0 - 8, y1 - y0 - 8] }, () => {
      fr.rect(x0, y0, x1 - x0, y1 - y0, { fill: fr.grad(0, y0, 0, y1, [[0, '#444C5A'], [1, '#303642']]) });
      const sc = ((t * .22) % 1 + 1) % 1;
      for (let i = 0; i < 90; i++) fr.line(x0, y0 + i * 7 + sc * 7, x1, y0 + i * 7 + sc * 7, { w: 1, color: '#FFFFFF', a: .028 });
      /* 监控里的现场 */
      const GY = 700;
      fr.rect(x0, GY, x1 - x0, 60, { fill: '#4E5666', a: .55 });
      stander(fr, 420, GY, .8, { a: 1, c: '#5A6070', hc: '#828C9A', point: true });
      stander(fr, 780, GY, .8, { a: 1, c: '#7A5A44', hc: '#9C7A5E' });
      const kI = E.io3(seg(t, 96.4, 97.6));
      for (let i = 0; i < 4; i++) {
        const bx = 300 + i * 250;
        stander(fr, bx, GY + 10, .7, { a: kI, c: '#7A6335', hc: '#D9B46A', hi: kI, kneel: i % 2 === 0, point: i % 2 === 1 });
      }
      if (kI > 0) fr.text('有人先动了', x0 + 60, y0 + 78, { font: 'sansh', size: 30, track: 4, color: GOLD, align: 'l', a: kI, shadow: .7 });
    });
    fr.rect(x0, y0, x1 - x0, y1 - y0, { r: 8, color: '#4E5666', w: 3 });
    fr.circle(x0 + 34, y0 + 32, 9, { fill: RED });
    fr.text('REC', x0 + 56, y0 + 32, { font: 'latinm', size: 24, track: 3, color: '#E8E2D2', align: 'l' });
    fr.text('CAM 03', x1 - 26, y0 + 32, { font: 'latinm', size: 22, track: 2, color: '#9AA2AE', align: 'r' });
    fr.text('LANCASTER / AMSTERDAM / CAPE TOWN', x0 + 26, y1 - 26, { font: 'latin', size: 18, track: 2, color: '#6E7686', align: 'l' });
  });
}

function outro(fr, t) {
  backdrop(fr, '#2F3444', '#373B4C');
  monitor(fr, 180, 300, 1180, 760, t, fade(t, T.endIn + .2, 99.2, .5, .5));

  stage(fr, 1240, 300, 1780, 620, fade(t, 95.0, 99.2, .5, .5), '#464C5C');
  const kD = fade(t, 95.2, 99.2, .5, .5);
  if (kD > 0) fr.g({ a: kD }, () => {
    fr.text('219 段', 1510, 352, { font: 'sansh', size: 34, track: 4, color: MUTE });
    fr.text('真实监控', 1510, 400, { font: 'sans', size: 26, track: 3, color: DIM });
    fr.text('90.9%', 1510, 486, { font: 'latinm', size: 62, color: GOLD, shadow: .7 });
    fr.text('至少一人出手', 1510, 534, { font: 'sans', size: 26, track: 3, color: MUTE });
    const kR = E.io3(seg(t, 96.6, 97.8));
    if (kR > 0) {
      fr.line(1330, 572, 1690, 572, { w: 2, color: '#5A6472', a: .6, a2: 0 });
      fr.text('平均 3.76 人', 1510, 604, { font: 'sansh', size: 30, track: 3, color: '#FFD89A', a: kR, shadow: .6 });
    }
  });

  /* 反向曲线：人越多，越可能有人出手 */
  const kC = fade(t, 97.8, 99.4, .5, .5);
  if (kC > 0) fr.g({ a: kC }, () => {
    stage(fr, 1240, 646, 1780, 812, 1, '#464C5C');
    const x0 = 1300, x1 = 1720, y0 = 786, y1 = 674;
    let d = '';
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, px = lerp(x0, x1, u), py = lerp(y0, y1, E.out2(u));
      d += (i ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1) + ' ';
    }
    fr.path(d, { color: GOLD, w: 5 });
    fr.text('在场人数 →', 1510, 690, { font: 'sans', size: 22, track: 3, color: DIM });
    fr.text('有人出手 ↑', 1510, 800, { font: 'sansh', size: 26, track: 3, color: GOLD, shadow: .6 });
  });

  const kBack = fade(t, 98.6, 99.6, .5, .04);
  if (kBack > 0) fr.text('你缺的不是善意，是那句“该我了”', W / 2, 906,
    { font: 'serifm', size: 46, track: 6, color: GOLD, a: kBack, shadow: .8 });

  placeLabel(fr, '2020', '真实监控里的公共冲突', fade(t, T.endIn + .3, 99.2, .6, .6));
  fr.sfx(94.6, 'soft', {}); fr.sfx(96.8, 'bloom', {}); fr.sfx(98.8, 'flash', {}); fr.sfx(99.4, 'hush', {});
}

/* ---------- 全片那把尺子：现场人数 ---------- */
function gaugeVal(t) {
  if (t < 1.6) return 1;
  if (t < T.hookEnd) return lerp(1, 8, seg(t, 1.8, 7.4));
  if (t < T.ch1In) return 8;
  if (t < 26.4) return lerp(8, 38, E.in2(seg(t, 19.4, 26.0)));
  if (t < T.ch2In) return 38;
  if (t < 36.0) return lerp(38, 1, E.out3(seg(t, 32.6, 35.6)));
  if (t < 40.2) return 1;
  if (t < 43.0) return lerp(1, 3, seg(t, 40.4, 42.8));
  if (t < T.ch3In) return 3;
  if (t < 52.4) return lerp(3, 1, seg(t, 50.8, 52.2));
  if (t < 57.2) return 1;
  if (t < 61.0) return lerp(1, 5, seg(t, 57.6, 60.8));
  if (t < 73.6) return 5;
  if (t < 77.0) return lerp(5, 1, E.out3(seg(t, 73.8, 76.8)));
  if (t < 84.4) return 1;
  if (t < 88.6) return lerp(1, 12, seg(t, 84.8, 88.4));
  if (t < 97.4) return 12;
  return lerp(12, 1, E.out3(seg(t, 97.6, 99.4)));
}
function gaugeCap(t) {
  const n = Math.max(1, Math.round(gaugeVal(t)));
  if (t < 96.0) return '我的责任 {1/' + n + '}';
  return '我的责任 {!1/1}';
}

VK.film({
  dur: T.outro, theme: 'flat', meta: { title: '旁观者效应', root: 0 },
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
      if (ga > 0) K.gauge(fr, 64, 150, { value: gaugeVal(t), max: 40, redFrom: 12, zone: '沉默', label: '现场人数', caption: gaugeCap(t), a: ga });
      warmVig(fr, .42);
      bottomBand(fr);
    });
    K.subs(fr, t, SUBS, 'flat');                          // 字幕永远最后画
  },
});
})();
