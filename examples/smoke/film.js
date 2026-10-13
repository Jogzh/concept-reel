/* Concept Reel 管线示例：位置随时间变化，不包含科学论断。 */
(function () {
'use strict';
const { W, lerp, ss } = VK;
VK.film({
  dur: 2, fps: 12, theme: 'night', bloom: .2, grain: 0,
  meta: { title: 'Concept Reel', drone: .15 },
  draw(fr, t) {
    const k = ss(t, .2, 1.3), x = lerp(600, 1320, k);
    fr.text('Concept Reel', W / 2, 280, { font: 'latin', size: 100, color: '#F3F0E9' });
    fr.line(600, 530, 1320, 530, { color: '#637080', w: 3 });
    fr.circle(x, 530, 54, { fill: '#69D5D0' });
    fr.text('移动，然后停住', W / 2, 880, { font: 'sans', size: 44, color: '#D8E4EA' });
    fr.sfx(.200123, 'tick', { gain: .5 });
    fr.sfx(1.3, 'soft', { gain: .3 });
  },
});
})();
