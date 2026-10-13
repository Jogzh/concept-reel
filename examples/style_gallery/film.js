/* Concept Reel · 15 种风格的原创几何练习。
 * 风格名称参考 mg-styles-15；工程不复制其品牌、剧情、源码或素材。
 * 共享 runtime 与色板来自 /engine/，任意 seek(t) 重建当前画面。 */
(function () {
'use strict';
const { W, H, clamp, mix } = VK;
const IDS = ['cel-boil', 'isometric', 'flat-vector', 'line-art', '3d-render', 'morph', 'sticker', 'hud', 'collage', 'aurora-glass', 'bauhaus', 'synthwave', 'pixel', 'liquid', 'variety'];
const NOTES = {
  'cel-boil': '让{轮廓}按固定节拍重绘，保留手绘的呼吸。',
  isometric: '用{固定投影}与深度排序，讲清物体如何堆积。',
  'flat-vector': '实色与清楚剪影，让{主体关系}直接可见。',
  'line-art': '让线条沿{路径}生长，展示连接与结构。',
  '3d-render': '这里以 Canvas 示意{体积}；真实渲染可另接 Blender。',
  morph: '保持轮廓点的对应，完成{连续几何变形}。',
  sticker: '给对象加白边与标签，让{知识拆解}更亲近。',
  hud: '网格与刻度突出{状态}，这里的读数仅为示意。',
  collage: '纸边、层叠与错位，让信息像材料一样{重组}。',
  'aurora-glass': '把柔色场放在底层，半透明面板保持{清楚边缘}。',
  bauhaus: '用基础形、尺度与秩序，构成{鲜明关系}。',
  synthwave: '霓虹、条带落日与网格，建立{复古数字空间}。',
  pixel: '用{整数网格}与离散姿态，保持像素边缘清楚。',
  liquid: '让柔软边界持续流动，表现{融合过程}。',
  variety: '让反应词短促弹入；解释字幕获得{稳定阅读}。',
};

window.READY = false; window.READY_ERROR = null;
VStyles.load().then(catalog => {
  const styles = IDS.map(id => {
    const profile = catalog.find(item => item.id === id);
    if (!profile) throw new Error(`Gallery needs style ${id}`);
    return profile;
  });
  VK.film({
    dur: 60, fps: 30, theme: 'flat', bloom: 0, grain: 0,
    meta: { title: 'Concept Reel · 15 种风格', kind: 'style-gallery', reference: 'https://github.com/Vincentwei1021/mg-styles-15' },
    draw(fr, t) {
      const index = Math.min(styles.length - 1, Math.floor(t / 4)), profile = styles[index], lt = t - index * 4, p = profile.palette, labelColor = mix(p.ink, p.bg, .3);
      VStyles.apply(fr, profile, t);
      fr.text(`${String(index + 1).padStart(2, '0')} / 15`, 130, 105, { font: 'mono', size: 24, color: p.muted, align: 'l' });
      fr.text(profile.name, 320, 103, { font: 'sansh', size: 49, color: p.ink, align: 'l' });
      fr.text(`${profile.en_name}  /  ${profile.id}`, 130, 168, { font: 'sansr', size: 24, color: labelColor, align: 'l' });
      fr.text('CONCEPT REEL · CANVAS STUDIES', W - 130, 108, { font: 'mono', size: 17, color: labelColor, align: 'r' });
      fr.line(130, 205, W - 130, 205, { color: p.muted, w: 1, a: .4 });
      VStyles.demo(fr, profile, lt);
      VStyles.caption(fr, lt, [{ a: 0, b: 4, zh: NOTES[profile.id] }], profile);
      for (let i = 0; i < styles.length; i++) fr.rect(130 + i * 112, H - 38, 96, 4, { fill: i === index ? p.accent : p.muted, a: i === index ? 1 : .22 });
      fr.rect(130 + index * 112, H - 38, 96 * clamp(lt / 4), 4, { fill: p.ink });
    },
  });
}).catch(error => {
  window.READY_ERROR = String(error.message || error);
  console.error(window.READY_ERROR);
});
})();
