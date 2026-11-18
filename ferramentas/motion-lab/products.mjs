// Original deterministic motion curves, evaluated from the shared timeline.
export const clamp = v => Math.min(1, Math.max(0, v));
export function spring(seconds, damping = 8, frequency = 13) {
  if (seconds <= 0) return 0;
  return 1 - Math.exp(-damping * seconds) * (Math.cos(frequency * seconds) + damping / frequency * Math.sin(frequency * seconds));
}
export function heroAt(seconds) {
  const t = Math.max(0, Math.min(6, seconds));
  const enter = spring(t - .08, 6, 12);
  const sweep = clamp((t - 1.1) / .9);
  return { enter, y: (1 - enter) * 140 + Math.sin(t * 2.2) * 1.2,
    tilt: -6 + (1 - enter) * 16 + Math.sin(t * 1.5) * 1.2,
    rays: t * 5, word: clamp((t - .5) / .65),
    sheen: Math.sin(sweep * Math.PI) * .85, sweep: -25 + sweep * 150,
    left: spring(t - 2.15, 8, 13), right: spring(t - 2.55, 8, 13),
    sparkle: clamp((t - 1.8) / .45), underline: clamp((t - 3) / .5) };
}
export function carouselAt(seconds) {
  const t = Math.max(0, Math.min(8, seconds));
  // Remotion's supplied configuration: mass=1, stiffness=100, damping=15.
  const step = seconds => spring(seconds, 7.5, Math.sqrt(43.75));
  let p = -1.6 * (1 - step(t));
  p += step(t - 8 / 3) + step(t - 16 / 3);
  const focus = Math.max(0, Math.min(2, Math.round(p)));
  const colors = [[72,31,160],[242,113,23],[40,137,108]];
  const from = p < 1 ? 0 : 1;
  const mix = clamp(p - from);
  const color = colors[from].map((v, i) => Math.round(v + (colors[from+1][i] - v) * mix));
  const products = Array.from({length:3}, (_, index) => {
    const distance = index - p, far = Math.min(1.5, Math.abs(distance));
    return { index, variant: index, x: distance * 34.375,
      scale: 1 - Math.min(1,far) * .38, opacity: far <= 1 ? 1 - far * .45 : Math.max(0,.55 - (far-1)*1.1), blur: far * 3,
      rotate: distance * 6, float: Math.sin((t*30+index*20)/16)*6, focus: Math.abs(distance) < .5 };
  });
  const textIn = spring(t - focus*8/3 - 10/30,7,Math.sqrt(51));
  return { p, focus, variant: focus, color: `rgb(${color.join(',')})`, products,
    label: clamp(textIn), labelY: (1-textIn)*40 };
}
