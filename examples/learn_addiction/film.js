/* ★ 片名 · 学习上瘾（C 夜曲，101 秒）
 * 复刻对象：抖音【Ember余烬】vibe知识大赏｜如何像刷短视频一样对学习上瘾
 *
 * 事实（2026-10-09 联网核对）：
 *   · 可变比率强化（variable-ratio）产生最高、最抗消退的反应率；固定比率下会出现
 *     "给完就停"的扇贝形停顿。Ferster, C. B. & Skinner, B. F.,
 *     Schedules of Reinforcement, 1957.
 *   · 多巴胺神经元编码"奖励预测误差"：训练后放电从奖励本身前移到预测线索；
 *     奖励越不确定，线索处的峰越高。
 *     Schultz, W., Dayan, P. & Montague, P. R., Science 275, 1997.
 *   · "小胜利"：可感知的进展是日常工作内在动机最强的驱动。
 *     Amabile, T. & Kramer, S., The Progress Principle, HBS Press, 2011.
 *   · 未完成任务的回忆率约为已完成任务的 1.9 倍（蔡格尼克效应）。Zeigarnik, B., 1927.
 *   · 行为 = 动机 × 能力 × 提示；"能力"端即降低摩擦。Fogg, B. J., Tiny Habits, 2019.
 *
 * 外观：C 夜曲。金 = 答案/术语；青 = 刻度/数据；玫红 = 欲望/多巴胺；白 = 主角的字；灰 = 结构线。
 * 时长：101 秒。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix } = VK;
const K = VKit;
// 上游事件使用 dB 写法；音频引擎的 gain 是线性倍率，显式转换。
const dbGain = db => 10 ** (db / 20);

const GOLD = '#F8D893', CYAN = '#64E3F6', ROSE = '#E84B75',
      WHITE = '#F8F9F8', ICE = '#BFD9F2', LGRY = '#AEB8C2',
      MGRY = '#879399', DGRY = '#5E6B77';
const cx = W / 2;

/* ---------- 时间表 ---------- */
const T = {
  hk1: .6, hk1b: 3.4, hk2: 3.4, hk2b: 7.0,
  title: 7.0, titleEnd: 15.0,
  ch1In: 15.0, ch1Out: 30.0,   // 01 知 机器
  ch2In: 30.0, ch2Out: 44.0,   // 02 形 多巴胺
  ch3In: 44.0, ch3Out: 56.0,   // 03 我 断供
  ch4In: 56.0, ch4Out: 84.0,   // 04 术 四招
  ch5In: 84.0, ch5Out: 96.0,   // 05 答 末句
  end: 96.0, outro: 101.0,
};

/* ---------- 字幕（22 句）---------- */
const SUBS = [
  { a: .6,    b: 3.4,   zh: '刷短视频，你能刷三小时。',             en: 'Three hours of short videos.' },
  { a: 3.4,   b: 7.0,   zh: '学习，15 分钟。你就困了。',             en: 'Fifteen minutes of study. You are out.' },

  { a: 15.0,  b: 18.5,  zh: '先别骂自己。看看这台机器。',             en: 'Don\u2019t blame yourself. Look at the machine.' },
  { a: 18.5,  b: 23.0,  zh: '按一下，给一次。{固定}给。',              en: 'One press, one pellet. {Every} time.' },
  { a: 23.0,  b: 28.0,  zh: '改成{随机}给 —— 它按到停不下来。',        en: 'Make it {random} — it cannot stop.' },
  { a: 28.0,  b: 30.0,  zh: '这叫{间歇性强化}。',                     en: 'Intermittent reinforcement.' },

  { a: 30.0,  b: 34.5,  zh: '多巴胺不是{快乐}。',                     en: 'Dopamine is not {pleasure}.' },
  { a: 34.5,  b: 39.0,  zh: '是{想要}。奖励真的来了，峰反而{没了}。',   en: 'It is {wanting}. The peak moves back.' },
  { a: 39.0,  b: 44.0,  zh: '{惊喜}越大，峰越高。',                    en: 'The bigger the {surprise}, the higher the peak.' },

  { a: 44.0,  b: 48.5,  zh: '现在看学习。',                           en: 'Now look at studying.' },
  { a: 48.5,  b: 53.0,  zh: '奖励在{三个月后}。中间全是{消耗}。',       en: 'The reward is {three months} away.' },
  { a: 53.0,  b: 56.0,  zh: '大脑不懒。它只是在{省电}。',              en: 'Your brain is not lazy. It is {saving power}.' },

  { a: 56.0,  b: 59.5,  zh: '第一招：把 1 小时{切成 6 段}。',          en: 'Rule one: cut one hour into {six}.' },
  { a: 59.5,  b: 63.0,  zh: '每完成一段，给大脑一次{完成信号}。',       en: 'Give it a {completion signal}.' },
  { a: 63.0,  b: 66.5,  zh: '第二招：奖励{别固定}。',                  en: 'Rule two: rewards must not be {fixed}.' },
  { a: 66.5,  b: 70.0,  zh: '给它{随机}。',                           en: 'Make them {random}.' },
  { a: 70.0,  b: 73.5,  zh: '第三招：在最想继续的地方，合上书。',       en: 'Rule three: stop where you most want to go on.' },
  { a: 73.5,  b: 77.0,  zh: '留一个{未完成}。',                        en: 'Leave it {unfinished}.' },
  { a: 77.0,  b: 80.5,  zh: '第四招：给坏习惯加{阻力}。',              en: 'Rule four: add {friction} to bad habits.' },
  { a: 80.5,  b: 84.0,  zh: '给好习惯{铺路}。',                        en: 'And {pave} the way for good ones.' },

  { a: 84.0,  b: 88.5,  zh: '不是你{不自律}。',                        en: 'It is not a lack of {discipline}.' },
  { a: 88.5,  b: 96.0,  zh: '是学习从来没被{设计}过。设计它。',         en: 'Studying was never {designed}. Design it.' },
];
const MARKS = [
  { t: .3,        no: '00', zh: '钩', en: 'HOOK' },
  { t: T.ch1In,   no: '01', zh: '知', en: 'MACHINE' },
  { t: T.ch2In,   no: '02', zh: '形', en: 'SIGNAL' },
  { t: T.ch3In,   no: '03', zh: '我', en: 'DROUGHT' },
  { t: T.ch4In,   no: '04', zh: '术', en: 'DESIGN' },
  { t: T.ch5In,   no: '05', zh: '答', en: 'ANSWER' },
];

/* ---------- 小工具 ---------- */
function hms(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const mm = String(m).padStart(2, '0'), s2 = String(s).padStart(2, '0');
  return h > 0 ? h + ':' + mm + ':' + s2 : m + ':' + s2;
}
function starPath(r) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    d += (i === 0 ? 'M ' : 'L ') + (Math.cos(ang) * rr).toFixed(2) + ' ' + (Math.sin(ang) * rr).toFixed(2) + ' ';
  }
  return d + 'Z';
}
function gaussPts(centerX, baseY, amp, sigma, x0, x1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n);
    pts.push([x, baseY - amp * Math.exp(-Math.pow((x - centerX) / sigma, 2))]);
  }
  return pts;
}
/* 一次"按下"：0 → 1 → 0 */
function pressAt(t, times, dur) {
  for (let i = 0; i < times.length; i++) {
    const d = t - times[i];
    if (d >= 0 && d < dur) { const k = d / dur; return k < .35 ? k / .35 : 1 - (k - .35) / .65; }
  }
  return 0;
}

/* 手机屏几何（钩子与末句共用） */
const PADW = 440, PADH = 660;
function padRect(py) { return [cx - PADW / 2, py]; }
const PADP = padRect(150), PADX = PADP[0], PADY = PADP[1];

/* 信息流里的卡片（确定性随机） */
const FEED = (() => {
  const r = rng(3), arr = [], cols = [GOLD, CYAN, ROSE, WHITE];
  for (let i = 0; i < 26; i++) {
    const lines = [], n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) lines.push(.45 + r() * .55);
    arr.push({ c: cols[Math.floor(r() * 4)], lines });
  }
  return arr;
})();
function drawCard(fr, card, bx, y, w, h, a) {
  if (a <= .01) return;
  fr.rect(bx, y, w, h, { r: 12, fill: card.c, fa: a * .11, color: card.c, w: 1.2, a: a * .5 });
  for (let k = 0; k < card.lines.length; k++) {
    const ly = y + 38 + k * 28;
    if (ly > y + h - 16) break;
    fr.line(bx + 24, ly, bx + 24 + (w - 48) * card.lines[k], ly, { w: 3, color: card.c, a: a * .26 });
  }
}

/* ---------- 钩子：同一块屏，两种内容（0.6–7.0s）---------- */
function hook(fr, t) {
  const inA = fade(t, .3, T.hk2b, .5, .5);
  if (inA <= .005) return;

  fr.rect(PADX, PADY, PADW, PADH, { r: 46, color: '#3A4550', w: 2, a: inA * .85 });
  fr.rect(PADX + 8, PADY + 8, PADW - 16, PADH - 16, { r: 40, fill: '#0B0F14', fa: inA * .55 });

  /* 段一：短视频，卡片向上飞（0.6–3.4） */
  const kFeed = fade(t, .6, 3.4, .3, .45);
  if (kFeed > .01) {
    const scroll = (t - .6) * 760;
    const GAP = 190, CH = 148, bw = 340, bx = cx - bw / 2;
    fr.g({ clip: [PADX + 2, PADY + 2, PADW - 4, PADH - 4] }, () => {
      for (let i = 0; i < FEED.length; i++) {
        const y = PADY + PADH + 60 + i * GAP - scroll;
        if (y + CH < PADY - 60 || y > PADY + PADH + 60) continue;
        const mid = y + CH / 2, dist = Math.abs(mid - (PADY + PADH / 2)) / (PADH / 2);
        drawCard(fr, FEED[i], bx, y, bw, CH, kFeed * inA * clamp(1.05 - dist * .55, .25, 1));
      }
    });
    fr.text(hms(((t - .6) / 2.8) * 3 * 3600), cx, PADY - 52,
      { font: 'latinm', size: 46, color: CYAN, track: 8, align: 'c', a: kFeed * inA, glow: 12, glowColor: CYAN, glowA: .45 });
    fr.text('刷着', cx + 200, PADY - 50, { font: 'sans', size: 20, color: MGRY, track: 6, align: 'l', a: kFeed * inA * .8 });
  }

  /* 段二：学习，只剩一张灰卡，屏变暗（3.4–7.0） */
  const kBook = fade(t, 3.6, T.hk2b, .45, .5);
  if (kBook > .01) {
    const bw = 320, bx = cx - bw / 2, by = PADY + 150, bh = 300;
    fr.rect(bx, by, bw, bh, { r: 10, fill: '#1D242C', fa: kBook * inA * .8, color: MGRY, w: 1.2, a: kBook * inA * .45 });
    for (let k = 0; k < 9; k++) {
      const ly = by + 34 + k * 30;
      fr.line(bx + 22, ly, bx + 22 + (bw - 44) * (.5 + ((k * 37) % 11) / 22), ly, { w: 3, color: MGRY, a: kBook * inA * .3 });
    }
    fr.rect(PADX, PADY, PADW, PADH, { r: 46, fill: '#000000', fa: ss(t, 4.6, 6.8) * .58 * inA });
    fr.text('15:00', cx, PADY - 52, { font: 'latinm', size: 46, color: MGRY, track: 8, align: 'c', a: kBook * inA, glow: 8, glowColor: MGRY, glowA: .2 });
    fr.text('学着', cx + 200, PADY - 50, { font: 'sans', size: 20, color: MGRY, track: 6, align: 'l', a: kBook * inA * .8 });
  }

  fr.sfx(.6, 'chord', { root: 0, gain: dbGain(-10) });
  fr.sfx(.8, 'shimmer', { gain: dbGain(-18) });
  for (let i = 0; i < 11; i++) fr.sfx(.9 + i * .22, 'tick', { pitch: 62 + i * 1.2, gain: dbGain(-22) });
  fr.sfx(3.4, 'thud', { gain: dbGain(-8) });
  fr.sfx(3.6, 'hush', { dur: .8, gain: dbGain(-12) });
}

/* ---------- 片名卡（7.0–15.0s）---------- */
function title(fr, t) {
  if (t < T.title || t > T.titleEnd) return;
  const lt = t - T.title - .6;
  if (lt > -.5 && lt < .6) K.flash(fr, t, T.title + .6);
  K.titleNight(fr, lt, {
    zh: '学习上瘾', sub: '像刷短视频一样', en: 'HOOKED  ON  LEARNING',
    cy: 440, lineY: 590, size: 190, track: 54,
  });
  fr.sfx(T.title + .6, 'flash', { gain: dbGain(-6) });
  fr.sfx(T.title + .95, 'bloom', { root: 0, gain: dbGain(-6) });
}

/* ---------- 01 知：斯金纳箱（15.0–30.0s）---------- */
/* 按压时刻：固定段每 0.6s 一次共 6 次；可变段每 0.28s 一次共 18 次（约 38% 给奖励） */
const PRESS = (() => {
  const p = [];
  for (let i = 0; i < 6; i++) p.push({ t: 18.5 + i * .6, rw: 1 });
  const r = rng(11);
  for (let i = 0; i < 18; i++) p.push({ t: 23.0 + i * .28, rw: r() < .38 ? 1 : 0 });
  return p;
})();
/* 累积记录曲线：横 = 时间，纵 = 累计按压次数 */
const CUM = (() => {
  const pts = [];
  for (let tt = 18.5; tt <= 28.02; tt += .05) {
    let c = 0;
    for (let i = 0; i < PRESS.length; i++) if (PRESS[i].t <= tt) c++;
    pts.push([tt, c]);
  }
  return pts;
})();
function machine(fr, t) {
  const a = fade(t, T.ch1In, T.ch1Out, .6, .6);
  if (a <= .005) return;

  const GX = 830, GY = 800, GW = 880, GH = 400;
  const X = (tt) => GX + ((tt - 18.5) / 9.5) * GW;
  const Y = (n) => GY - (n / 25) * GH;

  /* 左：拉杆箱 */
  const apx = 470, baseY = 790;
  fr.line(apx - 150, baseY, apx + 150, baseY, { w: 2, color: DGRY, a: a * .8 });
  const press = pressAt(t, PRESS.map(p => p.t), .2);
  const knobY = 560 + press * 78;
  fr.line(apx, baseY, apx, knobY, { w: 5, color: MGRY, a: a * .9 });
  fr.glow(apx, knobY, 46, ROSE, a * (.22 + press * .5));
  fr.circle(apx, knobY, 22, { fill: press > .05 ? ROSE : '#2A323B', fa: a, color: MGRY, w: 2, a: a });
  // 食丸槽 + 已掉的食丸
  const slotX = apx + 118;
  fr.arc(slotX, baseY - 4, 34, Math.PI, Math.PI * 2, { color: MGRY, w: 2, a: a * .7 });
  let pel = 0;
  for (let i = 0; i < PRESS.length; i++) if (PRESS[i].rw && PRESS[i].t <= t - .12) pel++;
  for (let i = 0; i < Math.min(pel, 7); i++) {
    fr.circle(slotX - 20 + (i % 4) * 13, baseY - 12 - Math.floor(i / 4) * 13, 5, { fill: GOLD, fa: a * .9 });
  }
  // 正在掉落的那颗
  for (let i = 0; i < PRESS.length; i++) {
    const d = t - PRESS[i].t;
    if (d >= .1 && d < .42 && PRESS[i].rw) {
      const k = (d - .1) / .32;
      fr.spark(slotX, lerp(knobY + 40, baseY - 14, E.out3(k)), 6, GOLD, a * (1 - k * .3));
    }
  }
  // 老鼠（按压时前倾）
  fr.g({ a: a, at: [apx - 132 + press * 10, baseY - 34] }, () => {
    fr.ellipse(0, 0, 34, 25, { fill: '#39424C', fa: .95, color: MGRY, w: 1.5, a: .8 });
    fr.circle(24, -6, 6, { fill: '#1A1F25', fa: 1 });
    fr.circle(26, -8, 2, { fill: ROSE, fa: a * .9 });
    fr.path('M -30 4 C -52 -6, -58 14, -40 20', { color: MGRY, w: 2.5, a: .8 });
  });
  const kBoxLabel = fade(t, 15.0, 18.5, .4, .4);
  if (kBoxLabel > .01) {
    fr.text('SKINNER  BOX', apx, 470, { font: 'mono', size: 18, color: MGRY, track: 5, align: 'c', a: a * kBoxLabel });
    fr.text('斯金纳箱', apx, 500, { font: 'sans', size: 20, color: LGRY, track: 8, align: 'c', a: a * kBoxLabel * .85 });
  }

  /* 右：累积记录图 */
  const showAxis = ss(t, 15.0, 30.0);
  if (showAxis > .01) {
    fr.line(GX, GY, GX + GW, GY, { w: 1.5, color: DGRY, a: a * showAxis * .8 });
    fr.line(GX, GY, GX, GY - GH, { w: 1.5, color: DGRY, a: a * showAxis * .8 });
    fr.text('时间', GX + GW + 8, GY + 22, { font: 'sans', size: 18, color: MGRY, track: 4, align: 'l', a: a * showAxis * .8 });
    fr.text('累计按压', GX - 96, GY - GH + 12, { font: 'sans', size: 18, color: MGRY, track: 4, align: 'r', a: a * showAxis * .8 });
    for (let i = 1; i <= 4; i++) fr.line(GX, GY - (GH * i) / 5, GX + GW, GY - (GH * i) / 5, { w: 1, color: DGRY, a: a * showAxis * .22 });
  }
  const total = CUM.length - 1;
  const idxNow = clamp(Math.floor(((t - 18.5) / 9.5) * total), 0, total);
  if (t > 18.5 && idxNow >= 1) {
    const fixedEnd = Math.floor(((23.0 - 18.5) / 9.5) * total);
    const seg1 = CUM.slice(0, Math.min(idxNow, fixedEnd) + 1).map(([tt, n]) => [X(tt), Y(n)]);
    if (seg1.length >= 2) fr.poly(seg1, { w: 3, color: CYAN, a: a * .95, glow: 9, glowColor: CYAN, glowA: .45, add: true });
    if (idxNow > fixedEnd) {
      const seg2 = CUM.slice(fixedEnd, idxNow + 1).map(([tt, n]) => [X(tt), Y(n)]);
      if (seg2.length >= 2) fr.poly(seg2, { w: 3, color: ROSE, a: a * .95, glow: 11, glowColor: ROSE, glowA: .55, add: true });
      const head = seg2[seg2.length - 1];
      fr.spark(head[0], head[1], 7, ROSE, a * .9);
    }
  }
  const kRule = fade(t, 22.9, 28.0, .3, .4);
  if (kRule > .01) {
    fr.line(X(23.0), GY - GH - 20, X(23.0), GY + 10, { w: 1.5, color: GOLD, a: a * kRule * .55, dash: [7, 6] });
    fr.text('规则改变', X(23.0), GY - GH - 46, { font: 'sans', size: 20, color: GOLD, track: 8, align: 'c', a: a * kRule * .9 });
  }
  const kFixed = fade(t, 18.5, 23.0, .3, .4);
  if (kFixed > .01) fr.text('固定给', X(20.6), GY - GH - 46, { font: 'sans', size: 20, color: CYAN, track: 8, align: 'c', a: a * kFixed * .85 });
  const kVar = fade(t, 23.0, 28.0, .4, .4);
  if (kVar > .01) fr.text('随机给', X(25.6), GY - GH - 46, { font: 'sans', size: 20, color: ROSE, track: 8, align: 'c', a: a * kVar * .9 });

  /* 28.0–30.0：命名 */
  const kName = fade(t, 28.0, T.ch1Out, .35, .5);
  if (kName > .01) {
    fr.g({ s: lerp(.82, 1, E.out3(clamp((t - 28.0) / .7))), a: kName, at: [cx, 300] }, () => {
      fr.text('间歇性强化', 0, 0, { font: 'serifh', size: 92, color: GOLD, track: 34, align: 'c', glow: 20, glowColor: GOLD, glowA: .55 });
    });
    fr.text('intermittent  reinforcement', cx, 370, { font: 'lora', size: 24, color: LGRY, track: 4, align: 'c', a: kName * .85 });
    fr.text('Ferster & Skinner 1957  ·  Schedules of Reinforcement', cx, 412, { font: 'mono', size: 14, color: DGRY, track: 2, align: 'c', a: kName * .8 });
  }

  fr.sfx(15.0, 'chord', { root: 0, gain: dbGain(-11) });
  fr.sfx(15.0, 'soft', { gain: dbGain(-16) });
  for (let i = 0; i < 6; i++) { fr.sfx(18.5 + i * .6, 'tick', { pitch: 60, gain: dbGain(-15) }); fr.sfx(18.6 + i * .6, 'tock', { gain: dbGain(-22) }); }
  fr.sfx(23.0, 'chord', { root: 4, gain: dbGain(-8) });
  fr.sfx(23.0, 'rise', { dur: 4.6, gain: dbGain(-14) });
  for (let i = 0; i < 18; i++) fr.sfx(23.0 + i * .28, 'tick', { pitch: 64 + i * 1.1, gain: dbGain(-20) });
  fr.sfx(28.0, 'stamp', { gain: dbGain(-8) });
  fr.sfx(28.1, 'bloom', { root: 4, gain: dbGain(-9) });
}

/* ---------- 02 形：多巴胺（30.0–44.0s）---------- */
const SPIKES = (() => { const r = rng(9), s = []; for (let i = 0; i < 90; i++) s.push(r()); return s; })();
function signal(fr, t) {
  const a = fade(t, T.ch2In, T.ch2Out, .6, .6);
  if (a <= .005) return;

  const AX0 = 420, AX1 = 1700, BASE = 730;
  const LX = 720, JX = 1290;                       // 灯亮 / 果汁

  /* 左：一个在放电的神经元 */
  const kNeu = fade(t, 30.0, 34.5, .4, .8);
  if (kNeu > .01) {
    const nx = 260, ny = 330;
    fr.glow(nx, ny, 70, ROSE, a * kNeu * .32);
    fr.circle(nx, ny, 30, { fill: '#2A323B', fa: a * kNeu, color: ROSE, w: 2, a: a * kNeu });
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i - 2) * .5;
      fr.line(nx, ny, nx + Math.cos(ang) * 46, ny + Math.sin(ang) * 46, { w: 2, color: MGRY, a: a * kNeu * .7 });
    }
    fr.line(nx, ny + 30, nx, ny + 150, { w: 3, color: ROSE, a: a * kNeu * .8 });
    for (let i = 0; i < 6; i++) {
      const ph = (t * .6 + i * .33) % 1;
      fr.spark(nx + Math.sin(ph * 5 + i) * 14, ny + 170 + ph * 210, 5, ROSE, a * kNeu * (1 - ph) * .9);
    }
    fr.text('多巴胺', nx, ny - 96, { font: 'serifm', size: 30, color: ROSE, track: 12, align: 'c', a: a * kNeu, glow: 10, glowColor: ROSE, glowA: .4 });
    fr.text('dopamine', nx, ny - 58, { font: 'lora', size: 17, color: MGRY, track: 3, align: 'c', a: a * kNeu * .8 });
  }

  /* 轴 + 两个事件标记 */
  const showAx = ss(t, 33.6, T.ch2Out);
  if (showAx > .01) {
    fr.line(AX0, BASE, AX1, BASE, { w: 1.5, color: DGRY, a: a * showAx * .85 });
    [[LX, '灯亮', 'cue'], [JX, '果汁', 'reward']].forEach(([xx, zh, en]) => {
      fr.line(xx, BASE - 340, xx, BASE + 8, { w: 1.5, color: DGRY, a: a * showAx * .5, dash: [6, 7] });
      fr.text(zh, xx, BASE + 46, { font: 'serifm', size: 26, color: LGRY, track: 10, align: 'c', a: a * showAx });
      fr.text(en, xx, BASE + 78, { font: 'lora', size: 16, color: MGRY, track: 3, align: 'c', a: a * showAx * .75 });
    });
    fr.text('放电强度', AX0 - 110, BASE - 300, { font: 'sans', size: 18, color: MGRY, track: 4, align: 'r', a: a * showAx * .8 });
  }

  /* 两根峰：训练前（果汁处大）→ 训练后（前移到灯亮）→ 不确定性拉高（更高） */
  if (t > 33.9) {
    const kMove = clamp((t - 34.5) / 3.2);
    const kSurp = clamp((t - 39.0) / 3.6);
    const ampJ = lerp(250, 42, E.out3(kMove));
    const ampL = lerp(0, 250, E.out3(kMove)) * (1 + kSurp * .45);

    if (ampL > 2) {
      fr.poly(gaussPts(LX, BASE, ampL, 120, AX0, AX1, 90),
        { w: 3, color: GOLD, a: a * .95, glow: 12, glowColor: GOLD, glowA: .5, add: true });
      for (let i = 0; i < 90; i++) {
        const x = lerp(AX0, AX1, i / 89);
        const hgt = ampL * Math.exp(-Math.pow((x - LX) / 120, 2));
        if (SPIKES[i] < hgt / 330) fr.line(x, BASE - 10, x, BASE - 26, { w: 2, color: GOLD, a: a * .5 });
      }
      if (kSurp > .05) {
        fr.text('↑ 预测误差', LX, BASE - ampL - 46, { font: 'sans', size: 20, color: GOLD, track: 6, align: 'c', a: a * kSurp });
      }
    }
    if (ampJ > 2) {
      fr.poly(gaussPts(JX, BASE, ampJ, 120, AX0, AX1, 90),
        { w: 2.5, color: ROSE, a: a * .8, glow: 9, glowColor: ROSE, glowA: .4, add: true });
    }
    // 移动的箭头
    if (kMove > .1 && kMove < .95) {
      const mx = lerp(JX, LX, E.out3(kMove)), my = BASE - lerp(ampJ, ampL, E.out3(kMove)) - 62;
      fr.g({ a: a * Math.sin(kMove * Math.PI), at: [mx, my] }, () => {
        fr.path('M -26 0 L 0 0 M 0 0 L -12 -9 M 0 0 L -12 9', { color: WHITE, w: 2.5, a: .9 });
      });
    }
    // 不确定性滑块
    if (t > 39.0) {
      const sx = 1560, sy = 250;
      fr.text('不确定性', sx, sy - 44, { font: 'sans', size: 18, color: MGRY, track: 6, align: 'c', a: a * kSurp * .9 });
      fr.line(sx - 90, sy, sx + 90, sy, { w: 2, color: DGRY, a: a * .7 });
      fr.line(sx - 90, sy, sx - 90 + 180 * kSurp, sy, { w: 3, color: GOLD, a: a, glow: 8, glowColor: GOLD, glowA: .5 });
      fr.circle(sx - 90 + 180 * kSurp, sy, 9, { fill: GOLD, fa: a });
      fr.text(Math.round(kSurp * 100) + '%', sx, sy + 42, { font: 'mono', size: 20, color: GOLD, track: 2, align: 'c', a: a * kSurp });
    }
  }

  /* 顶部两句话 */
  const kNo = fade(t, 30.0, 34.5, .35, .45);
  if (kNo > .01) {
    fr.text('多巴胺不是', cx - 130, 200, { font: 'serifm', size: 52, color: WHITE, track: 26, align: 'c', a: kNo * a, glow: 10, glowColor: ICE, glowA: .25 });
    const w = fr.measure('快乐', { font: 'serifm', size: 52, track: 26 });
    fr.text('快乐', cx + 130, 200, { font: 'serifm', size: 52, color: MGRY, track: 26, align: 'c', a: kNo * a });
    fr.line(cx + 130 - w / 2 - 10, 200, cx + 130 + w / 2 + 10, 200, { w: 3, color: ROSE, a: kNo * a * .85 });
  }
  const kWant = fade(t, 34.5, 39.0, .35, .45);
  if (kWant > .01) {
    fr.text('是', cx - 150, 200, { font: 'serifm', size: 52, color: WHITE, track: 26, align: 'c', a: kWant * a, glow: 10, glowColor: ICE, glowA: .25 });
    fr.text('想要', cx + 40, 200, { font: 'serifh', size: 62, color: GOLD, track: 26, align: 'c', a: kWant * a, glow: 20, glowColor: GOLD, glowA: .6 });
  }
  const kCite = fade(t, 41.4, T.ch2Out, .3, .6);
  if (kCite > .01) {
    fr.text('奖励预测误差', cx, 818, { font: 'sans', size: 20, color: GOLD, track: 8, align: 'c', a: kCite * a });
    fr.text('Schultz, Dayan & Montague 1997  ·  Science 275', cx, 852, { font: 'mono', size: 14, color: DGRY, track: 2, align: 'c', a: kCite * a * .9 });
  }

  fr.sfx(30.0, 'chord', { root: 0, gain: dbGain(-11) });
  fr.sfx(30.4, 'soft', { gain: dbGain(-17) });
  for (let i = 0; i < 6; i++) fr.sfx(30.6 + i * .5, 'tick', { pitch: 66, gain: dbGain(-22) });
  fr.sfx(34.5, 'rise', { dur: 3.4, gain: dbGain(-12) });
  fr.sfx(34.6, 'bloom', { root: 2, gain: dbGain(-11) });
  fr.sfx(39.0, 'chord', { root: 4, gain: dbGain(-9) });
  for (let i = 0; i < 8; i++) fr.sfx(39.2 + i * .35, 'tick', { pitch: 70 + i * 2, gain: dbGain(-20) });
  fr.sfx(41.6, 'shimmer', { gain: dbGain(-14) });
}

/* ---------- 03 我：断供（44.0–56.0s）---------- */
function drought(fr, t) {
  const a = fade(t, T.ch3In, T.ch3Out, .6, .6);
  if (a <= .005) return;

  const AX0 = 230, AX1 = 1750, AXY = 700;
  const ticks = [[.06, '第 1 周'], [.30, '第 4 周'], [.54, '第 8 周'], [.78, '第 12 周'], [1.0, '期末']];
  const px = (f) => AX0 + (AX1 - AX0) * f;

  /* 轴长出来 */
  const kAxis = seg(t, 44.2, 47.4);
  if (kAxis > 0) {
    const endX = lerp(AX0, AX1, E.out3(kAxis));
    fr.line(AX0, AXY, endX, AXY, { w: 2, color: LGRY, a: a * .85 });
    fr.line(AX0, AXY - 8, AX0, AXY + 8, { w: 2, color: LGRY, a: a * .85 });
    for (let i = 0; i < ticks.length; i++) {
      if (px(ticks[i][0]) > endX + 4) continue;
      fr.line(px(ticks[i][0]), AXY, px(ticks[i][0]), AXY + 8, { w: 1.5, color: MGRY, a: a * .7 });
      fr.text(ticks[i][1], px(ticks[i][0]), AXY + 42, { font: 'sans', size: 19, color: MGRY, track: 5, align: 'c', a: a * .8 });
    }
  }

  /* 中间：一条长长的"消耗"带 */
  const kCost = fade(t, 48.5, 56.0, .5, .5);
  if (kCost > .01) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const f = i / 60;
      pts.push([px(f * .93 + .04), AXY - 46 - (1 - Math.pow(f, 1.25) * .72) * 8]);
    }
    fr.poly(pts, { k: clamp((t - 48.8) / 2.6), w: 2.5, color: MGRY, a: a * kCost * .8 });
    for (let i = 0; i < 26; i++) {
      const kk = ss(t, 48.6 + i * .06, 48.9 + i * .06);
      if (kk <= 0) continue;
      const x = px(.06 + i * .034);
      fr.line(x, AXY - 14, x, AXY - 36, { w: 3, color: DGRY, a: a * kk * .75 });
    }
    fr.text('消耗', px(.5), AXY - 100, { font: 'sans', size: 20, color: MGRY, track: 8, align: 'c', a: a * kCost });
    fr.text('effort, no payoff', px(.5), AXY - 72, { font: 'lora', size: 15, color: DGRY, track: 2, align: 'c', a: a * kCost * .8 });
  }

  /* 末端：唯一的那一颗星 */
  const kStar = fade(t, 49.4, 56.0, .5, .5);
  if (kStar > .01) {
    const sx = px(1.0), sy = AXY - 132;
    fr.glow(sx, sy, 90, GOLD, a * kStar * .38);
    fr.path(starPath(30), { fill: GOLD, fa: a * kStar, at: [sx, sy], glow: 16 });
    fr.text('分数', sx, sy + 68, { font: 'serifm', size: 26, color: GOLD, track: 10, align: 'c', a: a * kStar });
    const kk = fade(t, 51.0, 56.0, .4, .4);
    if (kk > .01) fr.text('三个月后', sx, sy - 80, { font: 'sans', size: 20, color: GOLD, track: 6, align: 'c', a: a * kk * .9 });
  }

  /* 电池：100% → 15% */
  const kBat = fade(t, 53.0, T.ch3Out, .45, .6);
  if (kBat > .01) {
    const bw = 300, bh = 116, bx = cx - bw / 2, by = 390;
    const lvl = lerp(1, .15, E.out3(clamp((t - 53.0) / 2.2)));
    const col = lvl > .5 ? CYAN : (lvl > .25 ? GOLD : DGRY);
    fr.rect(bx, by, bw, bh, { r: 14, color: col, w: 2.5, a: a * kBat * .9 });
    fr.rect(bx + bw + 3, by + 36, 16, 44, { r: 5, fill: col, fa: a * kBat * .8 });
    fr.rect(bx + 12, by + 12, (bw - 24) * lvl, bh - 24, { r: 7, fill: col, fa: a * kBat * .75 });
    fr.text(Math.round(lvl * 100) + '%', cx, by + bh / 2, { font: 'latinm', size: 40, color: WHITE, track: 4, align: 'c', a: a * kBat });
    fr.text('power', cx, by + bh + 36, { font: 'lora', size: 17, color: MGRY, track: 3, align: 'c', a: a * kBat * .8 });
  }

  fr.sfx(44.0, 'soft', { gain: dbGain(-16) });
  fr.sfx(44.2, 'rise', { dur: 3.2, gain: dbGain(-15) });
  fr.sfx(48.5, 'thud', { gain: dbGain(-10) });
  for (let i = 0; i < 26; i += 3) fr.sfx(48.6 + i * .06, 'tick', { pitch: 52 - i * .2, gain: dbGain(-24) });
  fr.sfx(49.4, 'shimmer', { gain: dbGain(-16) });
  fr.sfx(53.0, 'hush', { dur: 1.0, gain: dbGain(-12) });
  for (let i = 0; i < 6; i++) fr.sfx(53.2 + i * .3, 'tick', { pitch: 48 - i * 2, gain: dbGain(-18) });
  fr.sfx(55.2, 'thud', { gain: dbGain(-12) });
}

/* ---------- 04 术：四招（56.0–84.0s）---------- */
function ruleLabel(fr, no, zh, a) {
  fr.text(no, cx, 244, { font: 'mono', size: 26, color: GOLD, track: 10, align: 'c', a: a * .85 });
  fr.text(zh, cx, 288, { font: 'serifm', size: 34, color: WHITE, track: 18, align: 'c', a: a * .9, glow: 8, glowColor: ICE, glowA: .2 });
}

/* 招一：切段 + 完成信号 */
function rule1(fr, t, a) {
  const BX = 330, BY = 560, BW = 1260, BH = 92;
  const kBar = ss(t, 56.2, 57.0);
  if (kBar > .01) {
    fr.rect(BX, BY, BW, BH, { r: 10, fill: '#161C23', fa: a * kBar * .9, color: DGRY, w: 1.5, a: a * kBar * .7 });
    fr.text('60 min', BX + BW + 18, BY + BH / 2, { font: 'mono', size: 22, color: MGRY, track: 3, align: 'l', a: a * kBar });
  }
  for (let i = 1; i <= 5; i++) {                          // 5 刀
    const kt = 57.5 + i * .32, kk = ss(t, kt, kt + .16);
    if (kk <= 0) continue;
    const x = BX + (BW * i) / 6;
    fr.line(x, BY - 16, x, BY + BH + 16, { w: 2.5, color: WHITE, a: a * kk * .9, glow: 8, glowColor: ICE, glowA: .5 });
  }
  for (let i = 0; i < 6; i++) {                           // 6 段依次点亮 + 金星
    const st = 59.3 + i * .55, kk = ss(t, st, st + .5);
    if (kk <= 0) continue;
    const sx = BX + (BW * i) / 6, sw = BW / 6;
    fr.rect(sx + 3, BY + 5, sw - 6, BH - 10, { r: 7, fill: GOLD, fa: a * kk * .17, color: GOLD, w: 1.5, a: a * kk * .7 });
    const sy = BY - 58 - 12 * Math.sin(t * 3 + i);
    fr.glow(sx + sw / 2, sy, 52, GOLD, a * kk * .4);
    fr.path(starPath(20), { fill: GOLD, fa: a * kk, at: [sx + sw / 2, sy], glow: 14 });
    fr.text(String(i + 1), sx + sw / 2, BY + BH / 2, { font: 'mono', size: 26, color: GOLD, track: 2, align: 'c', a: a * kk * .95 });
  }
  const kCite = fade(t, 61.4, 63.0, .4, .5);
  if (kCite > .01) {
    fr.text('完成信号', cx, BY + BH + 74, { font: 'serifm', size: 32, color: GOLD, track: 16, align: 'c', a: a * kCite, glow: 12, glowColor: GOLD, glowA: .45 });
    fr.text('Amabile & Kramer 2011  ·  小胜利', cx, BY + BH + 116, { font: 'mono', size: 14, color: DGRY, track: 2, align: 'c', a: a * kCite * .9 });
  }
  fr.sfx(56.0, 'chord', { root: 0, gain: dbGain(-11) });
  fr.sfx(56.2, 'soft', { gain: dbGain(-17) });
  for (let i = 1; i <= 5; i++) fr.sfx(57.5 + i * .32, 'tock', { gain: dbGain(-14) });
  for (let i = 0; i < 6; i++) { fr.sfx(59.3 + i * .55, 'shimmer', { gain: dbGain(-17) }); fr.sfx(59.36 + i * .55, 'tick', { pitch: 68 + i * 2, gain: dbGain(-20) }); }
  fr.sfx(61.4, 'bloom', { root: 4, gain: dbGain(-12) });
}

/* 招二：盲盒 */
const BOXES = [
  { kind: 'candy', c: ROSE }, { kind: 'note', c: CYAN }, { kind: 'walk', c: CYAN },
  { kind: 'none', c: DGRY }, { kind: 'none', c: DGRY }, { kind: 'star', c: GOLD },
];
function boxIcon(fr, kind, col, x, y, al) {
  if (kind === 'candy') {
    fr.circle(x, y, 19, { fill: col, fa: al * .9 });
    fr.path('M ' + (x - 19) + ' ' + y + ' L ' + (x - 36) + ' ' + (y - 13) + ' L ' + (x - 36) + ' ' + (y + 13) + ' Z', { fill: col, fa: al * .7 });
    fr.path('M ' + (x + 19) + ' ' + y + ' L ' + (x + 36) + ' ' + (y - 13) + ' L ' + (x + 36) + ' ' + (y + 13) + ' Z', { fill: col, fa: al * .7 });
  } else if (kind === 'note') {
    fr.ellipse(x - 12, y + 20, 15, 11, { fill: col, fa: al * .9, rot: -.35 });
    fr.line(x + 1, y + 18, x + 1, y - 30, { w: 3.5, color: col, a: al * .9 });
    fr.path('M ' + (x + 1) + ' ' + (y - 30) + ' C ' + (x + 26) + ' ' + (y - 22) + ', ' + (x + 22) + ' ' + (y - 2) + ', ' + (x + 4) + ' ' + (y - 7), { color: col, w: 3.5, a: al * .85 });
  } else if (kind === 'walk') {
    for (let i = 0; i < 3; i++) fr.ellipse(x + (i % 2 ? 13 : -13), y - 16 + i * 17, 9, 13, { fill: col, fa: al * .85 });
  } else if (kind === 'none') {
    fr.text('?', x, y, { font: 'serifh', size: 56, color: MGRY, track: 0, align: 'c', a: al });
  } else {
    fr.glow(x, y, 46, GOLD, al * .38);
    fr.path(starPath(26), { fill: GOLD, fa: al, at: [x, y], glow: 14 });
  }
}
const EXPH = [.85, .7, .6, .2, .25, 1];
function rule2(fr, t, a) {
  const N = 6, S = 130, GAP = 22;
  const totalW = N * S + (N - 1) * GAP;
  const x0 = cx - totalW / 2, y0 = 520;
  // 预期折线
  for (let i = 0; i < N; i++) {
    const xx = x0 + i * (S + GAP) + S / 2;
    const kk = ss(t, 66.5 + i * .5, 66.9 + i * .5);
    if (kk <= 0) continue;
    const hy = y0 - 76 - EXPH[i] * 130;
    fr.glow(xx, hy, 30, GOLD, a * kk * .28);
    fr.circle(xx, hy, 8, { fill: GOLD, fa: a * kk });
    if (i > 0) {
      const px2 = x0 + (i - 1) * (S + GAP) + S / 2;
      const py2 = y0 - 76 - EXPH[i - 1] * 130;
      fr.line(px2, py2, xx, hy, { w: 2.5, color: GOLD, a: a * kk * .8, glow: 7, glowColor: GOLD, glowA: .4 });
    }
  }
  const kLine = fade(t, 66.3, 70.0, .4, .5);
  if (kLine > .01) fr.text('预期', x0 - 56, y0 - 206, { font: 'sans', size: 19, color: GOLD, track: 6, align: 'r', a: a * kLine });
  // 格子
  for (let i = 0; i < N; i++) {
    const bx = x0 + i * (S + GAP);
    const kEnter = ss(t, 63.1 + i * .12, 63.5 + i * .12);
    if (kEnter <= 0) continue;
    const kf = clamp((t - (66.5 + i * .5)) / .5);
    const sxs = Math.max(.02, Math.abs(1 - 2 * kf));
    const face = kf >= .5;
    fr.g({ s: [sxs, 1], a: a * kEnter, at: [bx + S / 2, y0 + S / 2] }, () => {
      fr.rect(-S / 2, -S / 2, S, S, { r: 14, fill: '#141A21', fa: .95, color: face ? BOXES[i].c : DGRY, w: 2, a: .9 });
      if (face) boxIcon(fr, BOXES[i].kind, BOXES[i].c, 0, 0, .95);
      else fr.text('?', 0, 0, { font: 'serifh', size: 52, color: DGRY, track: 0, align: 'c', a: .9 });
    });
  }
  const kCite = fade(t, 68.6, 70.0, .4, .5);
  if (kCite > .01) {
    fr.text('有的格子是空的 —— 那才上瘾', cx, y0 + S + 62,
      { font: 'serifm', size: 30, color: GOLD, track: 14, align: 'c', a: a * kCite, glow: 12, glowColor: GOLD, glowA: .4 });
  }
  fr.sfx(63.0, 'chord', { root: 0, gain: dbGain(-11) });
  for (let i = 0; i < 6; i++) fr.sfx(63.1 + i * .12, 'tick', { pitch: 62 + i * 2, gain: dbGain(-20) });
  for (let i = 0; i < 6; i++) fr.sfx(66.5 + i * .5, 'tock', { gain: dbGain(-15) });
  fr.sfx(66.6, 'shimmer', { gain: dbGain(-17) });
  fr.sfx(68.9, 'bloom', { root: 0, gain: dbGain(-13) });
}

/* 招三：合上书 / 留个未完成 */
function rule3(fr, t, a) {
  const BKY = 470, PW = 300, PH = 190;
  const kBook = fade(t, 70.0, 73.6, .4, .5);
  if (kBook > .01) {
    const sx = clamp(1 - (t - 72.6) / .8);          // 1 = 摊开，0 = 合上
    const w = Math.max(4, PW * sx);
    fr.line(cx, BKY - PH / 2, cx, BKY + PH / 2, { w: 3, color: MGRY, a: a * kBook * .9 });
    fr.rect(cx - w, BKY - PH / 2, w, PH, { r: 4, fill: '#141A21', fa: a * kBook * .95, color: LGRY, w: 1.5, a: a * kBook * .8 });
    fr.rect(cx, BKY - PH / 2, w, PH, { r: 4, fill: '#141A21', fa: a * kBook * .95, color: LGRY, w: 1.5, a: a * kBook * .8 });
    if (sx > .12) {
      for (let s = -1; s <= 1; s += 2) {
        for (let k = 0; k < 4; k++) {
          fr.line(cx + s * 26, BKY - 60 + k * 40, cx + s * (w - 26), BKY - 60 + k * 40, { w: 2.5, color: DGRY, a: a * kBook * .5 * sx });
        }
      }
    }
    if (sx < .3) fr.text('合上', cx, BKY + PH / 2 + 54, { font: 'serifm', size: 28, color: LGRY, track: 12, align: 'c', a: a * kBook * (1 - sx) * 1.6 });
  }
  const kBar = fade(t, 73.5, 77.0, .45, .5);
  if (kBar > .01) {
    const BX = 400, BY = 740, BW = 1120, BH = 28;
    fr.rect(BX, BY, BW, BH, { r: 14, fill: '#161C23', fa: a * kBar * .9, color: DGRY, w: 1.5, a: a * kBar * .6 });
    const fill = clamp((t - 73.6) / 1.6) * .7;
    if (fill > .01) fr.rect(BX + 3, BY + 3, (BW - 6) * fill, BH - 6, { r: 11, fill: GOLD, fa: a * kBar * .85 });
    const kx = ss(t, 75.6, 76.2);
    if (kx > .01) {
      fr.rect(BX + 3 + (BW - 6) * .7, BY + 3, (BW - 6) * .3, BH - 6, { r: 11, color: GOLD, w: 2, a: a * kx * .55, dash: [9, 8] });
      const qx = BX + BW + 78;
      fr.glow(qx, BY + BH / 2, 44, GOLD, a * kx * (.3 + .2 * Math.sin(t * 4)));
      fr.text('?', qx, BY + BH / 2, { font: 'serifh', size: 62, color: GOLD, track: 0, align: 'c', a: a * kx, glow: 16, glowColor: GOLD, glowA: .5 });
      fr.text('未完成', qx, BY + BH / 2 + 68, { font: 'sans', size: 19, color: GOLD, track: 6, align: 'c', a: a * kx * .9 });
    }
    fr.text('70%', BX + (BW - 6) * .7 - 8, BY - 30, { font: 'mono', size: 22, color: GOLD, track: 2, align: 'c', a: a * kBar });
    const kCite = fade(t, 75.8, 77.0, .3, .5);
    if (kCite > .01) fr.text('Zeigarnik 1927  ·  未完成的事，大脑一直惦记', cx, BY + 92, { font: 'mono', size: 14, color: DGRY, track: 2, align: 'c', a: a * kCite * .95 });
  }
  fr.sfx(70.0, 'chord', { root: 0, gain: dbGain(-11) });
  fr.sfx(70.2, 'soft', { gain: dbGain(-17) });
  fr.sfx(72.6, 'stamp', { gain: dbGain(-10) });
  fr.sfx(73.5, 'tick', { pitch: 60, gain: dbGain(-16) });
  fr.sfx(75.6, 'hush', { dur: .7, gain: dbGain(-13) });
  fr.sfx(76.0, 'shimmer', { gain: dbGain(-15) });
}

/* 招四：两条路 */
function rule4(fr, t, a) {
  const SX = 260;
  const kUp = fade(t, 77.0, 84.0, .45, .5);
  if (kUp > .01) {
    const y = 470, ex = 1560;
    const pts = [];
    for (let i = 0; i <= 40; i++) { const f = i / 40; pts.push([lerp(SX, ex, f), y + Math.sin(f * 6) * 10]); }
    fr.poly(pts, { k: clamp((t - 77.2) / 2.0), w: 2.5, color: MGRY, a: a * kUp * .75, dash: [8, 7] });
    for (let i = 1; i <= 3; i++) {                   // 3 道门
      const dx = SX + ((ex - SX) * i) / 4;
      const kd = ss(t, 77.6 + i * .35, 78.1 + i * .35);
      if (kd <= 0) continue;
      fr.line(dx, y - 46, dx, y + 46, { w: 3, color: ROSE, a: a * kd * .8 });
      fr.text('门', dx, y - 68, { font: 'sans', size: 17, color: ROSE, track: 4, align: 'c', a: a * kd * .85 });
    }
    const ke = ss(t, 79.4, 80.0);                    // 终点：手机
    if (ke > .01) {
      fr.rect(ex, y - 46, 44, 92, { r: 8, fill: '#161C23', fa: a * ke, color: ROSE, w: 2, a: a * ke * .9 });
      fr.glow(ex + 22, y, 60, ROSE, a * ke * .3);
      fr.text('手机', ex + 22, y + 76, { font: 'serifm', size: 24, color: ROSE, track: 8, align: 'c', a: a * ke });
    }
    if (kUp > .3) fr.text('8 米 · 3 道门', (SX + ex) / 2, y - 92, { font: 'sans', size: 20, color: MGRY, track: 6, align: 'c', a: a * kUp });
  }
  const kDn = fade(t, 80.5, 84.0, .45, .5);
  if (kDn > .01) {
    const y = 700, ex = 620;
    fr.line(SX, y, lerp(SX, ex, clamp((t - 80.7) / 1.0)), y, { w: 4, color: GOLD, a: a * kDn * .95, glow: 9, glowColor: GOLD, glowA: .45 });
    const ke = ss(t, 81.6, 82.1);                    // 终点：书
    if (ke > .01) {
      fr.rect(ex, y - 34, 74, 68, { r: 5, fill: '#161C23', fa: a * ke, color: GOLD, w: 2, a: a * ke * .95 });
      fr.line(ex + 12, y - 34, ex + 12, y + 34, { w: 1.5, color: GOLD, a: a * ke * .6 });
      fr.glow(ex + 37, y, 70, GOLD, a * ke * .32);
      fr.text('书', ex + 37, y + 64, { font: 'serifm', size: 24, color: GOLD, track: 8, align: 'c', a: a * ke });
    }
    if (kDn > .4) fr.text('0.3 米 · 一步', (SX + ex) / 2, y + 92, { font: 'sans', size: 20, color: GOLD, track: 6, align: 'c', a: a * kDn });
  }
  const kYou = fade(t, 77.0, 84.0, .4, .5);
  if (kYou > .01) {
    fr.glow(SX, 470, 34, WHITE, a * kYou * .28);
    fr.circle(SX, 470, 16, { fill: WHITE, fa: a * kYou * .9 });
    fr.glow(SX, 700, 34, WHITE, a * kYou * .28);
    fr.circle(SX, 700, 16, { fill: WHITE, fa: a * kYou * .9 });
    fr.text('你', SX - 46, 585, { font: 'serifm', size: 26, color: WHITE, track: 8, align: 'c', a: a * kYou });
  }
  const kCite = fade(t, 82.4, 84.0, .3, .5);
  if (kCite > .01) fr.text('Fogg 2019  ·  B = MAP  ·  先改"能力"这一端', cx, 812, { font: 'mono', size: 14, color: DGRY, track: 2, align: 'c', a: a * kCite * .95 });

  fr.sfx(77.0, 'chord', { root: 0, gain: dbGain(-11) });
  fr.sfx(77.2, 'soft', { gain: dbGain(-18) });
  for (let i = 1; i <= 3; i++) fr.sfx(77.6 + i * .35, 'thud', { gain: dbGain(-17) });
  fr.sfx(79.4, 'tick', { pitch: 52, gain: dbGain(-16) });
  fr.sfx(80.5, 'rise', { dur: 1.2, gain: dbGain(-13) });
  fr.sfx(81.6, 'shimmer', { gain: dbGain(-14) });
  fr.sfx(82.4, 'bloom', { root: 4, gain: dbGain(-12) });
}

function design(fr, t) {
  const r1 = fade(t, 56.0, 63.0, .5, .5);
  const r2 = fade(t, 63.0, 70.0, .5, .5);
  const r3 = fade(t, 70.0, 77.0, .5, .5);
  const r4 = fade(t, 77.0, 84.0, .5, .5);
  if (r1 > .005) { ruleLabel(fr, '01', '切段', r1); rule1(fr, t, r1); }
  if (r2 > .005) { ruleLabel(fr, '02', '随机', r2); rule2(fr, t, r2); }
  if (r3 > .005) { ruleLabel(fr, '03', '留白', r3); rule3(fr, t, r3); }
  if (r4 > .005) { ruleLabel(fr, '04', '摩擦力', r4); rule4(fr, t, r4); }
}

/* ---------- 05 答：末句 + 回扣（84.0–96.0s）---------- */
function answer(fr, t) {
  const a = fade(t, T.ch5In, T.ch5Out, .6, .6);
  if (a <= .005) return;

  /* 不是你不自律 —— "不自律"被划掉 */
  const kNo = fade(t, 84.0, 88.6, .4, .5);
  if (kNo > .01) {
    fr.g({ s: lerp(.86, 1, E.out3(clamp((t - 84.0) / .8))), a: kNo * a, at: [cx - 250, 430] }, () => {
      fr.text('不是你', 0, 0, { font: 'serifh', size: 86, color: WHITE, track: 30, align: 'c', glow: 14, glowColor: ICE, glowA: .28 });
    });
    const w = fr.measure('不自律', { font: 'serifh', size: 86, track: 30 });
    fr.text('不自律', cx + 250, 430, { font: 'serifh', size: 86, color: MGRY, track: 30, align: 'c', a: kNo * a });
    const ks = ss(t, 86.0, 86.5);
    if (ks > .01) fr.line(cx + 250 - w / 2 - 14, 430, cx + 250 + w / 2 + 14, 430, { w: 4, color: ROSE, a: ks * a * .9 });
  }

  /* 那块屏回来了 —— 里面是学习流 */
  const kPad = fade(t, 88.5, T.ch5Out, .55, .6);
  if (kPad > .01) {
    const P2 = padRect(196), PX = P2[0], PY = P2[1];
    fr.rect(PX, PY, PADW, PADH, { r: 46, color: '#3A4550', w: 2, a: kPad * a * .85 });
    fr.rect(PX + 8, PY + 8, PADW - 16, PADH - 16, { r: 40, fill: '#0B0F14', fa: kPad * a * .55 });
    const bw = 330, bx = cx - bw / 2, CH = 130, GAP = 168;
    const scroll = (t - 88.5) * 132;
    fr.g({ clip: [PX + 2, PY + 2, PADW - 4, PADH - 4] }, () => {
      for (let i = 0; i < 6; i++) {
        const y = PY + PADH + 20 + i * GAP - scroll;
        if (y + CH < PY - 40 || y > PY + PADH + 40) continue;
        fr.rect(bx, y, bw, CH, { r: 12, fill: GOLD, fa: kPad * a * .12, color: GOLD, w: 1.2, a: kPad * a * .55 });
        for (let k = 0; k < 3; k++) {
          fr.line(bx + 24, y + 38 + k * 28, bx + 24 + (bw - 48) * (.5 + ((i * 5 + k * 3) % 9) / 18), y + 38 + k * 28, { w: 3, color: GOLD, a: kPad * a * .26 });
        }
        const kx = ss(t, 88.9 + i * .55, 89.4 + i * .55);
        if (kx > .01) {
          const sx = bx + bw - 34, sy = y + 32;
          fr.glow(sx, sy, 40, GOLD, kPad * a * kx * .38);
          fr.path(starPath(15), { fill: GOLD, fa: kPad * a * kx, at: [sx, sy], glow: 12 });
        }
      }
    });
    fr.text('01:00:00', cx, PY - 52, { font: 'latinm', size: 46, color: GOLD, track: 8, align: 'c', a: kPad * a, glow: 12, glowColor: GOLD, glowA: .45 });
    fr.text('学着', cx + 200, PY - 50, { font: 'sans', size: 20, color: GOLD, track: 6, align: 'l', a: kPad * a * .8 });
    if (kNo > .01) fr.text('不是你不自律', cx, 132, { font: 'serifm', size: 28, color: MGRY, track: 14, align: 'c', a: kNo * a * .8 });
    const kDes = fade(t, 92.6, T.ch5Out, .4, .6);
    if (kDes > .01) {
      fr.g({ s: lerp(.85, 1, E.out3(clamp((t - 92.6) / .8))), a: kDes * a, at: [cx, PY + PADH + 76] }, () => {
        fr.text('设计它。', 0, 0, { font: 'serifh', size: 76, color: GOLD, track: 28, align: 'c', glow: 20, glowColor: GOLD, glowA: .55 });
      });
    }
  }

  fr.sfx(84.0, 'chord', { root: 0, gain: dbGain(-8) });
  fr.sfx(84.4, 'hush', { dur: .9, gain: dbGain(-12) });
  fr.sfx(86.0, 'tick', { pitch: 48, gain: dbGain(-14) });
  fr.sfx(88.5, 'bloom', { root: 4, gain: dbGain(-7) });
  for (let i = 0; i < 6; i++) fr.sfx(88.9 + i * .55, 'shimmer', { gain: dbGain(-17) });
  fr.sfx(92.6, 'rise', { dur: 1.6, gain: dbGain(-10) });
  fr.sfx(93.4, 'stamp', { gain: dbGain(-9) });
}

/* ---------- 片尾（96.0–101.0s）---------- */
function outro(fr, t) {
  if (t < T.end || t > T.outro) return;
  const lt = t - T.end;
  fr.text('学习上瘾', cx, 400, { font: 'serifm', size: 108, color: WHITE, track: 44, align: 'c', a: ss(lt, .3, 1.3) * .92, glow: 18, glowColor: ICE, glowA: .35 });
  fr.text('HOOKED  ON  LEARNING', cx, 496, { font: 'latin', size: 26, color: GOLD, track: 8, align: 'c', a: ss(lt, 1.2, 2.0) * .85 });
  fr.text('Ferster & Skinner 1957  ·  Schultz, Dayan & Montague 1997  ·  Amabile & Kramer 2011  ·  Zeigarnik 1927  ·  Fogg 2019',
    cx, 552, { font: 'mono', size: 13, color: DGRY, track: 2, align: 'c', a: ss(lt, 1.5, 2.2) * .9 });
  fr.text('放电峰、"消耗带"、电池均为教学示意', cx, 584, { font: 'sans', size: 14, color: DGRY, track: 4, align: 'c', a: ss(lt, 1.9, 2.6) * .8 });
  fr.sfx(96.0, 'hush', { dur: .5, gain: dbGain(-8) });
  fr.sfx(96.5, 'chord', { root: 0, gain: dbGain(-6) });
}

/* ---------- 主调度 ---------- */
VK.film({
  dur: T.outro, theme: 'night', meta: { title: '学习上瘾', subtitle: '像刷短视频一样' },
  draw(fr, t) {
    fr.look.bgo = { stars: K.dips(t, [T.title, T.ch1In, T.ch2In, T.ch3In, T.ch4In, T.ch5In, T.end]) };
    K.chapterMark(fr, t, MARKS, T.outro);
    if (t < T.title) hook(fr, t);
    else if (t < T.titleEnd) title(fr, t);
    else if (t < T.ch2In) machine(fr, t);
    else if (t < T.ch3In) signal(fr, t);
    else if (t < T.ch4In) drought(fr, t);
    else if (t < T.ch5In) design(fr, t);
    else if (t < T.end) answer(fr, t);
    else outro(fr, t);
    K.subs(fr, t, SUBS, 'night');
  },
});
})();
