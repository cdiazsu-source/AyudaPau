/* ==========================================================
   UV-Vis · Seminario de análisis instrumental farmacéutico
   Gráficas generadas en SVG con JavaScript vainilla
   ========================================================== */

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

/* ---------- utilidades ---------- */
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, s, attrs = {}) {
  const t = el('text', { x, y, ...attrs }, parent);
  t.textContent = s;
  return t;
}
const fmt = v => String(+v.toFixed(3)).replace('.', ',');
const range = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(+v.toFixed(6)); return r; };
const gauss = (x, mu, s) => Math.exp(-((x - mu) ** 2) / (2 * s * s));
const pth = (pts, sx, sy) => pts.map((p, i) => (i ? 'L' : 'M') + sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1)).join('');

function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
}

/* longitud de onda (nm) → color aproximado */
function wl2rgb(w) {
  if (w < 380) return 'rgb(58,40,96)';
  let r = 0, g = 0, b = 0;
  if (w < 440) { r = -(w - 440) / 60; b = 1; }
  else if (w < 490) { g = (w - 440) / 50; b = 1; }
  else if (w < 510) { g = 1; b = -(w - 510) / 20; }
  else if (w < 580) { r = (w - 510) / 70; g = 1; }
  else if (w < 645) { r = 1; g = -(w - 645) / 65; }
  else { r = 1; }
  let f = 1;
  if (w < 420) f = .35 + .65 * (w - 380) / 40;
  else if (w > 700) f = Math.max(.25, .35 + .65 * (780 - w) / 80);
  return `rgb(${Math.round(255 * r * f)},${Math.round(255 * g * f)},${Math.round(255 * b * f)})`;
}

function box(svg, W, H) {
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.aspectRatio = `${W} / ${H}`;
  return svg.querySelector('defs') || el('defs', {}, svg);
}
function marker(svg, color = '#9aa4c7') {
  const id = 'm' + (++uid);
  const d = svg.querySelector('defs') || el('defs', {}, svg);
  const m = el('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, d);
  el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, m);
  return `url(#${id})`;
}
function spectrumGradient(svg, x0, x1) {
  const id = 'sg' + (++uid);
  const d = svg.querySelector('defs') || el('defs', {}, svg);
  const g = el('linearGradient', { id, x1: 0, x2: 1, y1: 0, y2: 0 }, d);
  for (let w = x0; w <= x1; w += 5) el('stop', { offset: (w - x0) / (x1 - x0), 'stop-color': wl2rgb(w) }, g);
  return `url(#${id})`;
}

/* ---------- motor de gráficas ---------- */
function plot(svg, o) {
  const W = o.w || 560, H = o.h || 340;
  const m = { l: 64, r: 22, t: 18, b: 52, ...(o.m || {}) };
  const defs = box(svg, W, H);
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const sx = v => m.l + (v - o.x[0]) / (o.x[1] - o.x[0]) * pw;
  const sy = v => m.t + ph - (v - o.y[0]) / (o.y[1] - o.y[0]) * ph;
  const id = 'c' + (++uid);
  const cp = el('clipPath', { id }, defs);
  el('rect', { x: m.l, y: m.t, width: pw, height: ph }, cp);

  const ax = el('g', {}, svg);
  (o.xt || []).forEach(t => {
    const [v, l] = Array.isArray(t) ? t : [t, fmt(t)];
    el('line', { x1: sx(v), x2: sx(v), y1: m.t, y2: m.t + ph, class: 'grid' }, ax);
    txt(ax, sx(v), m.t + ph + 20, l, { 'text-anchor': 'middle', class: 'tick' });
  });
  (o.yt || []).forEach(t => {
    const [v, l] = Array.isArray(t) ? t : [t, fmt(t)];
    el('line', { x1: m.l, x2: m.l + pw, y1: sy(v), y2: sy(v), class: 'grid' }, ax);
    txt(ax, m.l - 9, sy(v) + 4, l, { 'text-anchor': 'end', class: 'tick' });
  });
  if (o.spectrum) {
    el('rect', { x: m.l, y: m.t + ph - 7, width: pw, height: 7, fill: spectrumGradient(svg, o.x[0], o.x[1]), opacity: .9 }, ax);
  }
  el('rect', { x: m.l, y: m.t, width: pw, height: ph, class: 'frame' }, ax);
  if (o.xl) txt(ax, m.l + pw / 2, H - 10, o.xl, { 'text-anchor': 'middle', class: 'axlabel' });
  if (o.yl) {
    const cy = m.t + ph / 2;
    txt(ax, 17, cy, o.yl, { 'text-anchor': 'middle', class: 'axlabel', transform: `rotate(-90 17 ${cy})` });
  }

  const layer = el('g', { 'clip-path': `url(#${id})` }, svg);
  const top = el('g', {}, svg);
  const P = { sx, sy, W, H, m, pw, ph, svg, top, layer };

  P.line = (pts, a = {}) => el('path', {
    d: pth(pts, sx, sy), fill: 'none', 'stroke-width': 2.6,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'draw', ...a
  }, layer);
  P.area = (pts, a = {}) => {
    const d = pth(pts, sx, sy) + `L${sx(pts[pts.length - 1][0])} ${sy(o.y[0])}L${sx(pts[0][0])} ${sy(o.y[0])}Z`;
    return el('path', { d, class: 'fade', ...a }, layer);
  };
  P.ref = (pts, a = {}) => el('path', { d: pth(pts, sx, sy), class: 'ref', ...a }, layer);
  P.dot = (x, y, a = {}) => el('circle', { cx: sx(x), cy: sy(y), r: 4.5, class: 'pop', ...a }, top);
  P.label = (x, y, s, a = {}) => txt(top, sx(x), sy(y), s, { class: 'note fade', ...a });
  P.legend = (items, x, y) => {
    const g = el('g', { class: 'fade' }, top);
    const wMax = Math.max(...items.map(i => i.label.length)) * 7.1 + 46;
    el('rect', { x: x - 10, y: y - 14, width: wMax, height: items.length * 21 + 8, rx: 8, fill: 'rgba(7,11,24,.75)', stroke: 'rgba(255,255,255,.1)' }, g);
    items.forEach((it, i) => {
      const yy = y + i * 21;
      if (it.dot) el('circle', { cx: x + 11, cy: yy, r: 5, fill: it.color }, g);
      else el('line', { x1: x, x2: x + 22, y1: yy, y2: yy, stroke: it.color, 'stroke-width': 3, 'stroke-dasharray': it.dash || '' , 'stroke-linecap': 'round'}, g);
      txt(g, x + 30, yy + 4.5, it.label, { 'font-size': 12.5 });
    });
    return g;
  };
  return P;
}

/* ==========================================================
   PORTADA
   ========================================================== */
function figInstrument(svg) {
  const W = 640, H = 300;
  box(svg, W, H);
  const y = 140;
  // lámpara
  el('circle', { cx: 58, cy: y, r: 36, fill: '#fde68a', opacity: .12, class: 'fade' }, svg);
  el('circle', { cx: 58, cy: y, r: 18, fill: '#fde68a' }, svg);
  txt(svg, 58, 205, 'Fuente', { 'text-anchor': 'middle', class: 'big' });
  txt(svg, 58, 225, 'D₂ / W', { 'text-anchor': 'middle', class: 'muted', 'font-size': 13 });
  // haz policromático
  el('line', { x1: 78, y1: y, x2: 196, y2: y, stroke: '#fff', 'stroke-width': 4, opacity: .85, class: 'draw' }, svg);
  // monocromador
  el('rect', { x: 166, y: 82, width: 130, height: 116, rx: 12, fill: 'rgba(255,255,255,.03)', stroke: 'rgba(255,255,255,.25)' }, svg);
  el('polygon', { points: `196,172 252,172 224,112`, fill: 'rgba(255,255,255,.12)', stroke: 'rgba(255,255,255,.6)' }, svg);
  const fan = ['#7c3aed', '#3b82f6', '#22d3ee', '#4ade80', '#facc15', '#f97316', '#ef4444'];
  fan.forEach((c, i) => el('line', { x1: 238, y1: 146, x2: 292, y2: 108 + i * 10, stroke: c, 'stroke-width': 2.4, class: 'draw' }, svg));
  txt(svg, 231, 225, 'Monocromador', { 'text-anchor': 'middle', class: 'big' });
  txt(svg, 231, 245, 'prisma / red', { 'text-anchor': 'middle', class: 'muted', 'font-size': 13 });
  // rendija
  el('rect', { x: 306, y: 96, width: 6, height: 40, fill: '#64748b' }, svg);
  el('rect', { x: 306, y: 144, width: 6, height: 40, fill: '#64748b' }, svg);
  // haz monocromático
  el('line', { x1: 292, y1: y, x2: 388, y2: y, stroke: '#a78bfa', 'stroke-width': 5, class: 'draw' }, svg);
  txt(svg, 350, y - 14, 'I₀', { 'text-anchor': 'middle', class: 'big mono' });
  // cubeta
  el('rect', { x: 388, y: 92, width: 44, height: 100, rx: 4, fill: 'rgba(255,255,255,.05)', stroke: 'rgba(255,255,255,.6)' }, svg);
  el('rect', { x: 391, y: 112, width: 38, height: 77, rx: 3, fill: '#a78bfa', opacity: .35 }, svg);
  el('line', { x1: 388, y1: 204, x2: 432, y2: 204, stroke: 'rgba(255,255,255,.5)', 'marker-start': marker(svg, '#9aa4c7'), 'marker-end': marker(svg, '#9aa4c7') }, svg);
  txt(svg, 410, 225, 'Muestra', { 'text-anchor': 'middle', class: 'big' });
  txt(svg, 410, 245, 'paso óptico b', { 'text-anchor': 'middle', class: 'muted', 'font-size': 13 });
  // haz transmitido
  el('line', { x1: 432, y1: y, x2: 498, y2: y, stroke: '#a78bfa', 'stroke-width': 2, opacity: .6, class: 'draw' }, svg);
  txt(svg, 466, y - 14, 'I', { 'text-anchor': 'middle', class: 'big mono' });
  // detector
  el('rect', { x: 498, y: 112, width: 34, height: 56, rx: 6, fill: '#334155', stroke: 'rgba(255,255,255,.4)' }, svg);
  el('rect', { x: 498, y: 126, width: 6, height: 28, fill: '#22d3ee' }, svg);
  txt(svg, 515, 225, 'Detector', { 'text-anchor': 'middle', class: 'big' });
  // pantalla
  el('path', { d: 'M532 140 C 548 140, 548 82, 560 82', fill: 'none', stroke: 'rgba(255,255,255,.4)', 'stroke-width': 1.5 }, svg);
  el('rect', { x: 556, y: 52, width: 78, height: 62, rx: 6, fill: '#0f172a', stroke: 'rgba(255,255,255,.4)' }, svg);
  const pts = range(0, 1, .02).map(t => [564 + t * 62, 104 - 40 * (0.85 * gauss(t, .3, .1) + .5 * gauss(t, .68, .09))]);
  el('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(''), fill: 'none', stroke: '#5eead4', 'stroke-width': 2, class: 'draw' }, svg);
  txt(svg, 595, 132, 'A vs λ', { 'text-anchor': 'middle', class: 'muted', 'font-size': 13 });
  txt(svg, 320, 284, 'A = log (I₀ / I)', { 'text-anchor': 'middle', class: 'mono', fill: '#c4b5fd', 'font-size': 17, 'font-weight': 700 });
}

function figSpectrumMap(svg) {
  const W = 640, H = 210;
  box(svg, W, H);
  const x0 = 190, x1 = 800, L = 30, R = 610;
  const sx = w => L + (w - x0) / (x1 - x0) * (R - L);
  const yb = 112;
  el('rect', { x: L, y: yb, width: R - L, height: 34, rx: 6, fill: spectrumGradient(svg, x0, x1) }, svg);
  // franja UV con rayado
  const pid = 'hp' + (++uid);
  const pat = el('pattern', { id: pid, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, svg.querySelector('defs'));
  el('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: 'rgba(196,181,253,.35)', 'stroke-width': 3 }, pat);
  el('rect', { x: L, y: yb, width: sx(380) - L, height: 34, rx: 6, fill: `url(#${pid})` }, svg);
  txt(svg, (L + sx(380)) / 2, yb + 22, 'UV', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 14 });
  txt(svg, (sx(380) + sx(750)) / 2, yb + 22, 'VISIBLE', { 'text-anchor': 'middle', 'font-weight': 800, 'font-size': 14, fill: '#0b1020', 'letter-spacing': '.2em' });
  [200, 300, 400, 500, 600, 700, 800].forEach(w => {
    el('line', { x1: sx(w), x2: sx(w), y1: yb + 34, y2: yb + 40, stroke: 'rgba(255,255,255,.4)' }, svg);
    txt(svg, sx(w), yb + 56, w, { 'text-anchor': 'middle', class: 'tick' });
  });
  txt(svg, R, yb + 76, 'nm', { 'text-anchor': 'end', class: 'tick' });
  const pins = [
    { w: 270, n: '01', c: '#5eead4', t: 'λmax', up: true },
    { w: 300, n: '05', c: '#38bdf8', t: '300', up: false },
    { w: 340, n: '03', c: '#fbbf24', t: '340', up: true },
    { w: 400, n: '05', c: '#38bdf8', t: '400', up: false },
    { w: 517, n: '02', c: '#c084fc', t: '517', up: true },
    { w: 522, n: '04', c: '#fb7185', t: '≈520', up: false },
  ];
  pins.forEach((p, i) => {
    const x = sx(p.w);
    const yTop = p.up ? 28 : 64;
    el('line', { x1: x, x2: x, y1: yTop + 14, y2: yb, stroke: p.c, 'stroke-width': 1.6, 'stroke-dasharray': '3 3', class: 'fade' }, svg);
    const g = el('g', { class: 'pop' }, svg);
    el('circle', { cx: x, cy: yTop, r: 14, fill: p.c }, g);
    txt(g, x, yTop + 4.5, p.n, { 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 800, fill: '#0b1020', class: 'mono' });
    txt(g, x + (p.up ? 20 : 20), yTop + 5, p.t, { 'font-size': 12, fill: p.c, 'font-weight': 600, class: 'mono' });
  });
}

/* ==========================================================
   1 · CARGA Y LIBERACIÓN
   ========================================================== */
function liposome(g, cx, cy, R, rand) {
  const r2 = R - 30;
  el('circle', { cx, cy, r: r2 - 6, fill: 'rgba(94,234,212,.08)' }, g);
  const leaflet = (r, inward) => {
    const n = Math.round(2 * Math.PI * r / 10.5);
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
      const t = inward ? -1 : 1;
      el('line', { x1: cx + c * (r - 4 * t), y1: cy + s * (r - 4 * t), x2: cx + c * (r - 13 * t), y2: cy + s * (r - 13 * t), stroke: '#7dd3fc', 'stroke-width': 1.3, opacity: .55 }, g);
      el('circle', { cx: cx + c * r, cy: cy + s * r, r: 4, fill: '#5eead4' }, g);
    }
  };
  leaflet(R, true);
  leaflet(r2, false);
  for (let i = 0; i < 24; i++) {
    const a = rand() * 2 * Math.PI, r = Math.sqrt(rand()) * (r2 - 16);
    el('circle', { cx: cx + Math.cos(a) * r, cy: cy + Math.sin(a) * r, r: 4.2, fill: '#fb923c' }, g);
  }
}

function fig1a(svg) {
  const W = 560, H = 340;
  box(svg, W, H);
  const rand = rng(7);
  const g = el('g', { class: 'fade' }, svg);
  liposome(g, 118, 158, 92, rand);
  // fármaco libre alrededor
  [[18, 60], [210, 52], [30, 270], [215, 262], [228, 160]].forEach(([x, y]) =>
    el('circle', { cx: x, cy: y, r: 4.2, fill: '#fb923c', opacity: .9 }, g));
  txt(svg, 118, 286, 'Liposoma cargado', { 'text-anchor': 'middle', class: 'big' });
  // leyenda
  el('circle', { cx: 30, cy: 318, r: 5, fill: '#fb923c' }, svg);
  txt(svg, 42, 322, 'fármaco', { 'font-size': 13, class: 'muted' });
  el('circle', { cx: 120, cy: 318, r: 5, fill: '#5eead4' }, svg);
  txt(svg, 132, 322, 'fosfolípido', { 'font-size': 13, class: 'muted' });

  // flecha separación
  const mk = marker(svg, '#9aa4c7');
  el('line', { x1: 240, y1: 158, x2: 282, y2: 158, stroke: '#9aa4c7', 'stroke-width': 2, 'marker-end': mk }, svg);
  txt(svg, 261, 140, 'centrifugar', { 'text-anchor': 'middle', 'font-size': 12, class: 'muted' });

  // tubo
  const tx = 294, ty = 66, tw = 44, th = 190;
  const tubeD = `M${tx} ${ty} L${tx} ${ty + th - tw / 2} A${tw / 2} ${tw / 2} 0 0 0 ${tx + tw} ${ty + th - tw / 2} L${tx + tw} ${ty}`;
  el('path', { d: `M${tx + 2} ${ty + 40} L${tx + 2} ${ty + th - tw / 2} A${tw / 2 - 2} ${tw / 2 - 2} 0 0 0 ${tx + tw - 2} ${ty + th - tw / 2} L${tx + tw - 2} ${ty + 40} Z`, fill: 'rgba(251,146,60,.22)' }, svg);
  el('ellipse', { cx: tx + tw / 2, cy: ty + th - 12, rx: tw / 2 - 6, ry: 10, fill: '#5eead4', opacity: .85 }, svg);
  [[0.3, 70], [0.65, 95], [0.4, 125], [0.7, 150]].forEach(([fx, dy]) => el('circle', { cx: tx + tw * fx, cy: ty + dy, r: 3.6, fill: '#fb923c' }, svg));
  el('path', { d: tubeD, fill: 'none', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 2 }, svg);
  el('rect', { x: tx - 5, y: ty - 10, width: tw + 10, height: 12, rx: 3, fill: '#475569' }, svg);
  txt(svg, tx + tw / 2, 286, 'Sobrenadante', { 'text-anchor': 'middle', class: 'big' });
  txt(svg, tx + tw / 2, 306, '= fármaco libre', { 'text-anchor': 'middle', 'font-size': 13, class: 'muted' });
  txt(svg, tx + tw + 8, ty + th - 8, 'pellet', { 'font-size': 12, class: 'muted' });

  // cubeta + haz
  const cx = 444, cy = 110;
  el('line', { x1: 392, y1: 168, x2: cx, y2: 168, stroke: '#a78bfa', 'stroke-width': 4, class: 'draw' }, svg);
  el('rect', { x: cx, y: cy, width: 40, height: 100, rx: 4, fill: 'rgba(255,255,255,.05)', stroke: 'rgba(255,255,255,.65)' }, svg);
  el('rect', { x: cx + 3, y: cy + 22, width: 34, height: 75, rx: 3, fill: '#fb923c', opacity: .3 }, svg);
  el('line', { x1: cx + 40, y1: 168, x2: 546, y2: 168, stroke: '#a78bfa', 'stroke-width': 2, opacity: .6, class: 'draw', 'marker-end': marker(svg, '#a78bfa') }, svg);
  txt(svg, 464, 286, 'A a λmax', { 'text-anchor': 'middle', class: 'big' });
  txt(svg, 464, 306, 'del fármaco', { 'text-anchor': 'middle', 'font-size': 13, class: 'muted' });
}

function fig1b(svg) {
  const P = plot(svg, { x: [0, 55], y: [0, 1.3], xt: [0, 10, 20, 30, 40, 50], yt: [0, .3, .6, .9, 1.2], xl: 'Concentración (µg/mL)', yl: 'Absorbancia' });
  const f = c => .022 * c + .005;
  P.line([[0, f(0)], [55, f(55)]], { stroke: '#5eead4' });
  const noise = [.01, -.008, .006, -.012, .009, -.004];
  [5, 10, 20, 30, 40, 50].forEach((c, i) => P.dot(c, f(c) + noise[i], { fill: '#5eead4' }));
  const A = .38, c = (A - .005) / .022;
  P.ref([[0, A], [c, A], [c, 0]], { stroke: '#fb923c' });
  P.dot(c, A, { fill: '#fb923c', r: 7, stroke: '#fff', 'stroke-width': 2 });
  P.label(c + 1.5, A - .07, `libre = ${fmt(+c.toFixed(1))} µg/mL`, { fill: '#fdba74', 'font-weight': 600 });
  P.label(2, 1.18, 'A = 0,022·c + 0,005', { class: 'note fade mono' });
  P.label(2, 1.06, 'R² = 0,999', { class: 'note fade mono muted' });
  const g = el('g', { class: 'pop' }, P.top);
  el('rect', { x: P.sx(30), y: P.sy(.62), width: 186, height: 58, rx: 10, fill: 'rgba(94,234,212,.12)', stroke: '#5eead4' }, g);
  txt(g, P.sx(30) + 93, P.sy(.62) + 22, 'Total: 95 µg/mL', { 'text-anchor': 'middle', 'font-size': 13, class: 'muted' });
  txt(g, P.sx(30) + 93, P.sy(.62) + 45, 'EE = 82 %', { 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 800, fill: '#5eead4' });
}

function fig1c(svg) {
  const P = plot(svg, { w: 1120, h: 340, x: [0, 48], y: [0, 105], xt: range(0, 48, 6), yt: [0, 25, 50, 75, 100], xl: 'Tiempo (h)', yl: '% liberado', m: { l: 70 } });
  const free = t => 100 * (1 - Math.exp(-1.8 * t));
  const nano74 = t => 22 * (1 - Math.exp(-.9 * t)) + 58 * (1 - Math.exp(-.055 * t));
  const nano55 = t => 30 * (1 - Math.exp(-1.1 * t)) + 66 * (1 - Math.exp(-.13 * t));
  const T = range(0, 48, .25);
  const pts = [0, .5, 1, 2, 4, 6, 8, 12, 24, 36, 48];
  P.area(T.map(t => [t, nano55(t)]), { fill: 'rgba(251,146,60,.07)' });
  [[free, '#94a3b8', 'Fármaco libre (solución)', '6 5'], [nano74, '#5eead4', 'Nanoformulación · pH 7,4 (plasma)', ''], [nano55, '#fb923c', 'Nanoformulación · pH 5,5 (tumor)', '']].forEach(([f, c, , dash]) => {
    P.line(T.map(t => [t, f(t)]), { stroke: c, 'stroke-dasharray': dash, class: dash ? '' : 'draw' });
    pts.forEach(t => P.dot(t, f(t), { fill: c, r: 4 }));
  });
  P.legend([
    { label: 'Fármaco libre (solución)', color: '#94a3b8', dash: '6 5' },
    { label: 'Nanoformulación · pH 7,4 (plasma)', color: '#5eead4' },
    { label: 'Nanoformulación · pH 5,5 (tumor)', color: '#fb923c' },
  ], P.sx(31), P.sy(42));
  P.label(2.4, 86, '← efecto burst', { fill: '#cbd5e1' });
  P.label(14, 40, 'liberación sostenida', { fill: '#99f6e4', 'font-weight': 600 });
  const mk = marker(svg, '#fb923c');
  el('line', { x1: P.sx(20), y1: P.sy(62), x2: P.sx(20), y2: P.sy(84), stroke: '#fb923c', 'stroke-width': 2, 'marker-end': mk, class: 'fade' }, P.top);
  P.label(20.8, 72, 'liberación acelerada por pH ácido', { fill: '#fdba74' });
}

/* ==========================================================
   2 · ANTIOXIDANTES (DPPH)
   ========================================================== */
const inh = (c, ic50, h) => c <= 0 ? 0 : 100 / (1 + Math.pow(ic50 / c, h));
const VIOLET = '#7e22ce', PALE = '#eadb85';

function fig2a(svg) {
  const P = plot(svg, { x: [400, 700], y: [0, 1.15], xt: range(400, 700, 50), yt: [0, .25, .5, .75, 1], xl: 'Longitud de onda (nm)', yl: 'Absorbancia', spectrum: true });
  const concs = [0, 5, 10, 25, 50, 100];
  P.ref([[517, 0], [517, 1.15]], { stroke: '#c084fc' });
  P.label(522, 1.08, '517 nm', { fill: '#d8b4fe', 'font-weight': 700, class: 'note fade mono' });
  concs.forEach((c, i) => {
    const A = 1 - inh(c, 22, 1.4) / 100;
    const col = mix('#c084fc', '#fde68a', i / (concs.length - 1));
    P.line(range(400, 700, 2).map(w => [w, .03 + A * gauss(w, 517, 46) + .02 * gauss(w, 420, 30)]), { stroke: col });
  });
  P.legend([
    { label: '0 µg/mL (control)', color: '#c084fc' },
    { label: '100 µg/mL', color: '#fde68a' },
  ], P.sx(600), P.sy(1.02));
  const mk = marker(svg, '#e9d5ff');
  el('line', { x1: P.sx(560), y1: P.sy(.82), x2: P.sx(560), y2: P.sy(.36), stroke: '#e9d5ff', 'stroke-width': 2, 'marker-end': mk, class: 'fade' }, P.top);
  P.label(566, .74, '[antioxidante] ↑', { fill: '#e9d5ff' });
}

function fig2b(svg) {
  const P = plot(svg, { x: [0, 2.5], y: [0, 128], xt: [[0, '1'], [.5, '3'], [1, '10'], [1.5, '30'], [2, '100'], [2.5, '300']], yt: [0, 25, 50, 75, 100], xl: 'Concentración (µg/mL, escala log)', yl: '% Inhibición' });
  const comps = [
    { n: 'Ácido ascórbico (ref.)', ic: 8, h: 1.6, c: '#fde68a' },
    { n: 'Extracto A', ic: 22, h: 1.4, c: '#c084fc' },
    { n: 'Extracto B', ic: 75, h: 1.2, c: '#818cf8' },
  ];
  P.ref([[0, 50], [2.5, 50]]);
  comps.forEach(k => {
    P.line(range(0, 2.5, .02).map(x => [x, inh(10 ** x, k.ic, k.h)]), { stroke: k.c });
    [0, .3, .6, 1, 1.3, 1.6, 2, 2.4].forEach(x => P.dot(x, inh(10 ** x, k.ic, k.h), { fill: k.c, r: 3.8 }));
    const lx = Math.log10(k.ic);
    P.ref([[lx, 50], [lx, 0]], { stroke: k.c });
    P.label(lx, 6, fmt(k.ic), { fill: k.c, 'text-anchor': 'middle', 'font-weight': 700, class: 'note fade mono', transform: '' });
  });
  P.label(.05, 54, 'IC₅₀', { 'font-weight': 700 });
  P.legend(comps.map(k => ({ label: `${k.n} · IC₅₀ ${k.ic}`, color: k.c })), P.sx(.08), P.sy(122));
}

function fig2c(svg) {
  const W = 1120, H = 340;
  box(svg, W, H);
  txt(svg, W / 2, 34, 'DPPH• (violeta, 517 nm)   +   AH (antioxidante)   →   DPPH–H (amarillo pálido)   +   A•', { 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 600, class: 'mono' });
  const concs = [0, 5, 10, 25, 50, 100];
  concs.forEach((c, i) => {
    const x = 150 + i * 164;
    const I = inh(c, 22, 1.4);
    const g = el('g', { class: 'pop' }, svg);
    g.style.animationDelay = (0.4 + i * .12) + 's';
    const col = mix(VIOLET, PALE, I / 100);
    el('ellipse', { cx: x, cy: 254, rx: 40, ry: 8, fill: col, opacity: .25 }, g);
    el('rect', { x: x - 24, y: 78, width: 48, height: 174, rx: 12, fill: 'rgba(255,255,255,.04)', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1.5 }, g);
    el('rect', { x: x - 21, y: 118, width: 42, height: 131, rx: 10, fill: col }, g);
    el('rect', { x: x - 15, y: 126, width: 6, height: 108, rx: 3, fill: '#fff', opacity: .25 }, g);
    el('rect', { x: x - 28, y: 66, width: 56, height: 16, rx: 4, fill: '#475569' }, g);
    txt(g, x, 282, c === 0 ? 'Control' : `${c} µg/mL`, { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600 });
    txt(g, x, 302, `${Math.round(I)} % inh.`, { 'text-anchor': 'middle', 'font-size': 13, class: 'muted mono' });
  });
  const gid = 'vg' + (++uid);
  const lg = el('linearGradient', { id: gid }, svg.querySelector('defs'));
  el('stop', { offset: 0, 'stop-color': VIOLET }, lg);
  el('stop', { offset: 1, 'stop-color': PALE }, lg);
  el('rect', { x: 120, y: 318, width: 880, height: 6, rx: 3, fill: `url(#${gid})`, class: 'fade' }, svg);
  el('line', { x1: 990, y1: 321, x2: 1040, y2: 321, stroke: PALE, 'stroke-width': 2, 'marker-end': marker(svg, PALE), class: 'fade' }, svg);
}

/* ==========================================================
   3 · CINÉTICA ENZIMÁTICA
   ========================================================== */
function fig3a(svg) {
  const P = plot(svg, { x: [0, 300], y: [0, 1.4], xt: range(0, 300, 60), yt: [0, .35, .7, 1.05, 1.4], xl: 'Tiempo (s)', yl: 'A₃₄₀' });
  const sets = [
    { n: 'Control (sin inhibidor)', k: .0030, c: '#fbbf24' },
    { n: 'Inhibidor 10 µM', k: .0018, c: '#f97316' },
    { n: 'Inhibidor 50 µM', k: .0007, c: '#ef4444' },
  ];
  const r = rng(3);
  sets.forEach(s => {
    P.line([[0, 1.25], [300, 1.25 - s.k * 300]], { stroke: s.c });
    range(0, 300, 30).forEach(t => P.dot(t, 1.25 - s.k * t + (r() - .5) * .025, { fill: s.c, r: 3.6 }));
  });
  P.legend(sets.map(s => ({ label: s.n, color: s.c })), P.sx(14), P.sy(.48));
  P.label(150, 1.33, 'pendiente = ΔA/Δt → v₀', { 'text-anchor': 'middle', fill: '#fde68a', 'font-weight': 600 });
}

function fig3b(svg) {
  const P = plot(svg, { x: [0, 20], y: [0, 115], xt: range(0, 20, 4), yt: [0, 25, 50, 75, 100], xl: '[S] (mM)', yl: 'v₀ (µM/min)' });
  const V = 100, mm = (s, km) => V * s / (km + s);
  P.ref([[0, V], [20, V]], { stroke: '#fde68a' });
  P.ref([[0, 50], [6, 50]]);
  P.ref([[2, 50], [2, 0]], { stroke: '#fbbf24' });
  P.ref([[6, 50], [6, 0]], { stroke: '#ef4444' });
  const S = range(0, 20, .1);
  P.line(S.map(s => [s, mm(s, 2)]), { stroke: '#fbbf24' });
  P.line(S.map(s => [s, mm(s, 6)]), { stroke: '#ef4444' });
  [.5, 1, 2, 4, 8, 12, 16, 20].forEach(s => { P.dot(s, mm(s, 2), { fill: '#fbbf24', r: 3.8 }); P.dot(s, mm(s, 6), { fill: '#ef4444', r: 3.8 }); });
  P.label(19.6, 105, 'Vmáx', { 'text-anchor': 'end', fill: '#fde68a', 'font-weight': 700 });
  P.label(.3, 54, 'Vmáx/2', { class: 'note fade muted' });
  P.label(2.2, 6, 'Km', { fill: '#fbbf24', 'font-weight': 700 });
  P.label(6.2, 6, 'Km,ap', { fill: '#f87171', 'font-weight': 700 });
  P.legend([{ label: 'Sin inhibidor', color: '#fbbf24' }, { label: '+ inhibidor competitivo', color: '#ef4444' }], P.sx(10.5), P.sy(38));
}

function fig3c(svg) {
  const P = plot(svg, { x: [230, 420], y: [0, 1.15], xt: range(240, 420, 30), yt: [0, .25, .5, .75, 1], xl: 'Longitud de onda (nm)', yl: 'Absorbancia', spectrum: true });
  const W = range(230, 420, 1);
  const nad = w => 1.0 * gauss(w, 260, 15);
  const nadh = w => .95 * gauss(w, 259, 15) + .38 * gauss(w, 340, 21);
  P.area(W.map(w => [w, nadh(w)]), { fill: 'rgba(251,191,36,.08)' });
  P.line(W.map(w => [w, nad(w)]), { stroke: '#94a3b8', 'stroke-dasharray': '6 5', class: '' });
  P.line(W.map(w => [w, nadh(w)]), { stroke: '#fbbf24' });
  P.ref([[340, 0], [340, 1.15]], { stroke: '#fbbf24' });
  P.label(345, .5, '340 nm: sólo NADH', { fill: '#fde68a', 'font-weight': 700 });
  P.label(268, 1.04, '260 nm (adenina)', { class: 'note fade muted' });
  P.legend([{ label: 'NADH (reducido)', color: '#fbbf24' }, { label: 'NAD⁺ (oxidado)', color: '#94a3b8', dash: '6 5' }], P.sx(345), P.sy(1.02));
}

function fig3d(svg) {
  const P = plot(svg, { x: [-.6, 2.1], y: [0, .075], xt: [-.5, 0, .5, 1, 1.5, 2], yt: [0, .02, .04, .06], xl: '1/[S] (mM⁻¹)', yl: '1/v₀' });
  P.ref([[0, 0], [0, .075]], { stroke: 'rgba(255,255,255,.6)', 'stroke-dasharray': '' });
  const ctl = x => .02 * x + .01, inhb = x => .06 * x + .01;
  P.line([[-.5, ctl(-.5)], [2.1, ctl(2.1)]], { stroke: '#fbbf24' });
  P.line([[-1 / 6, 0], [1.08, inhb(1.08)]], { stroke: '#ef4444' });
  [2, 1, .5, .25, .125].forEach(x => { P.dot(x, ctl(x), { fill: '#fbbf24', r: 3.8 }); if (x <= 1) P.dot(x, inhb(x), { fill: '#ef4444', r: 3.8 }); });
  P.dot(0, .01, { fill: '#fff', r: 6.5, stroke: '#0b1020', 'stroke-width': 2 });
  P.label(.06, .004, '1/Vmáx', { 'font-weight': 700 });
  P.label(-.58, .016, '−1/Km', { fill: '#fbbf24', 'font-weight': 700 });
  P.label(1.15, .066, '+ inhibidor', { fill: '#f87171', 'font-weight': 600 });
  P.label(1.45, .043, 'control', { fill: '#fde68a', 'font-weight': 600 });
  P.label(1.0, .013, 'Intersección común en el eje Y', { class: 'note fade muted' });
  P.label(1.0, .006, '→ inhibición competitiva', { class: 'note fade muted' });
}

/* ==========================================================
   4 · BIOSENSORES (SPR)
   ========================================================== */
function goldGradient(svg) {
  const id = 'au' + (++uid);
  const g = el('radialGradient', { id, cx: .38, cy: .35, r: .7 }, svg.querySelector('defs'));
  el('stop', { offset: 0, 'stop-color': '#fff7d6' }, g);
  el('stop', { offset: .35, 'stop-color': '#fbbf24' }, g);
  el('stop', { offset: 1, 'stop-color': '#92400e' }, g);
  return `url(#${id})`;
}
function antibody(g, cx, cy, r, a, bound) {
  const c = Math.cos(a), s = Math.sin(a);
  const p = d => [cx + c * d, cy + s * d];
  const [x1, y1] = p(r), [x2, y2] = p(r + 20);
  el('line', { x1, y1, x2, y2, stroke: '#93c5fd', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  [-.32, .32].forEach(da => {
    const x3 = cx + Math.cos(a + da * 0.5) * (r + 36), y3 = cy + Math.sin(a + da * 0.5) * (r + 36);
    el('line', { x1: x2, y1: y2, x2: x3, y2: y3, stroke: '#93c5fd', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  });
  if (bound) {
    const [bx, by] = p(r + 44);
    el('circle', { cx: bx, cy: by, r: 8, fill: '#f472b6', stroke: '#fff', 'stroke-width': 1.2 }, g);
  }
}

function fig4a(svg) {
  const W = 560, H = 700;
  box(svg, W, H);
  const au = goldGradient(svg);
  txt(svg, 20, 28, 'Biorreconocimiento en la superficie', { class: 'big' });
  const y = 165;
  [[130, false], [420, true]].forEach(([cx, bound], k) => {
    const g = el('g', { class: k ? 'pop' : 'fade' }, svg);
    if (k) g.style.animationDelay = '.7s';
    el('circle', { cx, cy: y, r: 58, fill: au }, g);
    for (let i = 0; i < 8; i++) antibody(g, cx, y, 58, i / 8 * 2 * Math.PI + .2, bound && i % 4 !== 3);
  });
  el('line', { x1: 238, y1: y, x2: 306, y2: y, stroke: '#f472b6', 'stroke-width': 2.5, 'marker-end': marker(svg, '#f472b6') }, svg);
  txt(svg, 272, y - 14, '+ analito', { 'text-anchor': 'middle', fill: '#f9a8d4', 'font-size': 13, 'font-weight': 600 });
  txt(svg, 130, 288, 'AuNP + anticuerpo', { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600 });
  txt(svg, 420, 288, 'Complejo AuNP–analito', { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600 });

  el('line', { x1: 20, y1: 318, x2: 540, y2: 318, stroke: 'rgba(255,255,255,.1)' }, svg);
  txt(svg, 20, 346, 'Resonancia de plasmón de superficie', { class: 'big' });
  const wave = range(0, 1, .01).map(t => [40 + t * 480, 384 + 16 * Math.sin(t * Math.PI * 6)]);
  el('path', { d: wave.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(''), fill: 'none', stroke: '#fde68a', 'stroke-width': 2.2, class: 'draw' }, svg);
  txt(svg, 520, 356, 'E (luz)', { 'text-anchor': 'end', 'font-size': 12, fill: '#fde68a' });
  el('circle', { cx: 200, cy: 448, r: 40, fill: au }, svg);
  el('ellipse', { cx: 222, cy: 448, rx: 50, ry: 44, fill: 'rgba(147,197,253,.18)', stroke: '#93c5fd', 'stroke-dasharray': '4 4', class: 'fade' }, svg);
  txt(svg, 176, 454, '+', { 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: '#7c2d12' });
  txt(svg, 252, 456, '−', { 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 800, fill: '#1e3a8a' });
  txt(svg, 290, 440, 'Oscilación colectiva', { 'font-size': 14, 'font-weight': 600 });
  txt(svg, 290, 460, 'de electrones', { 'font-size': 14, 'font-weight': 600 });
  txt(svg, 290, 480, 'banda intensa ~520 nm', { 'font-size': 13, class: 'muted' });

  el('line', { x1: 20, y1: 506, x2: 540, y2: 506, stroke: 'rgba(255,255,255,.1)' }, svg);
  txt(svg, 20, 534, 'Respuesta colorimétrica', { class: 'big' });
  [['#dc2626', 'Dispersas', '520 nm'], ['#a21caf', 'Analito unido', '~535 nm'], ['#4338ca', 'Agregadas', '~620 nm']].forEach(([c, n, l], i) => {
    const x = 110 + i * 170;
    const g = el('g', { class: 'pop' }, svg);
    g.style.animationDelay = (0.9 + i * .15) + 's';
    el('rect', { x: x - 22, y: 552, width: 44, height: 92, rx: 10, fill: 'rgba(255,255,255,.04)', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1.5 }, g);
    el('rect', { x: x - 19, y: 574, width: 38, height: 67, rx: 8, fill: c }, g);
    el('rect', { x: x - 13, y: 580, width: 5, height: 52, rx: 2.5, fill: '#fff', opacity: .25 }, g);
    txt(g, x, 666, n, { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600 });
    txt(g, x, 686, l, { 'text-anchor': 'middle', 'font-size': 13, class: 'muted mono' });
  });
}

function fig4b(svg) {
  const P = plot(svg, { x: [400, 800], y: [0, 1.25], xt: range(400, 800, 100), yt: [0, .25, .5, .75, 1], xl: 'Longitud de onda (nm)', yl: 'Absorbancia', spectrum: true });
  const ib = w => .32 * Math.exp(-(w - 400) / 70);
  const W = range(400, 800, 2);
  const s0 = w => ib(w) + 1.0 * gauss(w, 520, 38);
  const s1 = w => ib(w) + 1.04 * gauss(w, 534, 42);
  const s2 = w => ib(w) + .5 * gauss(w, 525, 38) + .5 * gauss(w, 630, 75);
  P.line(W.map(w => [w, s0(w)]), { stroke: '#ef4444' });
  P.line(W.map(w => [w, s1(w)]), { stroke: '#d946ef' });
  P.line(W.map(w => [w, s2(w)]), { stroke: '#818cf8', 'stroke-dasharray': '6 5', class: '' });
  P.ref([[520, 0], [520, 1.07]], { stroke: '#ef4444' });
  P.ref([[534, 0], [534, 1.1]], { stroke: '#d946ef' });
  el('line', { x1: P.sx(520), x2: P.sx(534), y1: P.sy(1.16), y2: P.sy(1.16), stroke: '#fff', 'stroke-width': 2, 'marker-end': marker(svg, '#fff'), class: 'fade' }, P.top);
  P.label(538, 1.14, 'Δλ = 14 nm (corrimiento al rojo)', { 'font-weight': 700, fill: '#f5d0fe' });
  P.legend([{ label: 'AuNP · 520 nm', color: '#ef4444' }, { label: '+ biomarcador · 534 nm', color: '#d946ef' }, { label: 'agregación · 630 nm', color: '#818cf8', dash: '6 5' }], P.sx(635), P.sy(.9));
}

function fig4c(svg) {
  const P = plot(svg, { x: [-1.2, 3.2], y: [0, 18], xt: [[-1, '0,1'], [0, '1'], [1, '10'], [2, '100'], [3, '1000']], yt: [0, 4, 8, 12, 16], xl: '[Biomarcador] (ng/mL, escala log)', yl: 'Δλ (nm)' });
  const f = x => 16.5 / (1 + Math.pow(10, (1 - x) * .9));
  P.area(range(-1.2, 3.2, .02).map(x => [x, f(x)]), { fill: 'rgba(251,113,133,.08)' });
  P.line(range(-1.2, 3.2, .02).map(x => [x, f(x)]), { stroke: '#fb7185' });
  const r = rng(11);
  [-1, -.5, 0, .5, 1, 1.5, 2, 2.5, 3].forEach(x => {
    const y = f(x) + (r() - .5) * .6, e = .5 + r() * .4;
    el('line', { x1: P.sx(x), x2: P.sx(x), y1: P.sy(y - e), y2: P.sy(y + e), stroke: '#fda4af', 'stroke-width': 1.5, class: 'fade' }, P.top);
    P.dot(x, y, { fill: '#fb7185', r: 4.2 });
  });
  P.ref([[-1, 0], [-1, 3]], { stroke: '#fde68a' });
  P.label(-.95, 3.6, 'LOD ≈ 0,1 ng/mL', { fill: '#fde68a', 'font-weight': 700 });
  P.label(.2, 15.5, 'Detección de trazas', { 'font-weight': 600 });
  P.label(.2, 14, 'en el rango sub-ng/mL', { class: 'note fade muted' });
}

/* ==========================================================
   5 · REDUCCIÓN CATALÍTICA Y SÍNTESIS
   ========================================================== */
const NP = w => 1.6 * gauss(w, 400, 31);
const AP = w => .55 * gauss(w, 300, 21) + .12 * gauss(w, 250, 14);
const K5 = .22;

function fig5a(svg) {
  const P = plot(svg, { x: [250, 500], y: [0, 1.75], xt: range(250, 500, 50), yt: [0, .4, .8, 1.2, 1.6], xl: 'Longitud de onda (nm)', yl: 'Absorbancia', spectrum: true });
  const times = [0, 2, 4, 6, 8, 10, 14, 20];
  const W = range(250, 500, 1);
  times.forEach((t, i) => {
    const f = Math.exp(-K5 * t);
    P.line(W.map(w => [w, f * NP(w) + (1 - f) * AP(w)]), { stroke: mix('#facc15', '#38bdf8', i / (times.length - 1)), 'stroke-width': 2.2 });
  });
  // punto isosbéstico
  for (let w = 300; w < 400; w += .25) {
    if ((NP(w) - AP(w)) * (NP(w + .25) - AP(w + .25)) <= 0) {
      P.dot(w, NP(w), { fill: '#fff', r: 6, stroke: '#0b1020', 'stroke-width': 2 });
      el('line', { x1: P.sx(292), y1: P.sy(1.07), x2: P.sx(w), y2: P.sy(NP(w)), stroke: '#fff', 'stroke-width': 1, opacity: .6, class: 'fade' }, P.top);
      P.label(258, 1.12, 'punto isosbéstico', { 'font-weight': 600 });
      break;
    }
  }
  P.label(404, 1.62, '400 nm · 4-nitrofenolato ↓', { fill: '#fde047', 'font-weight': 700 });
  P.label(256, .74, '300 nm · 4-aminofenol ↑', { fill: '#7dd3fc', 'font-weight': 700 });
  P.legend([{ label: 't = 0 min', color: '#facc15' }, { label: 't = 20 min', color: '#38bdf8' }], P.sx(430), P.sy(1.2));
}

function fig5b(svg) {
  const P = plot(svg, { x: [0, 20], y: [-4.8, .3], xt: range(0, 20, 4), yt: [0, -1, -2, -3, -4], xl: 'Tiempo (min)', yl: 'ln(Aₜ / A₀)' });
  P.line([[0, 0], [20, -K5 * 20]], { stroke: '#38bdf8' });
  const r = rng(5);
  range(0, 20, 2).forEach(t => P.dot(t, -K5 * t + (r() - .5) * .12, { fill: '#38bdf8', r: 4.5 }));
  const g = el('g', { class: 'pop' }, P.top);
  el('rect', { x: P.sx(1), y: P.sy(-2.9), width: 206, height: 66, rx: 10, fill: 'rgba(56,189,248,.12)', stroke: '#38bdf8' }, g);
  txt(g, P.sx(1) + 103, P.sy(-2.9) + 27, 'kapp = 0,22 min⁻¹', { 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#7dd3fc', class: 'mono' });
  txt(g, P.sx(1) + 103, P.sy(-2.9) + 50, 't½ = 3,2 min · R² = 0,998', { 'text-anchor': 'middle', 'font-size': 12.5, class: 'muted mono' });
}

function benzene(g, cx, cy, r, top, bottom, hi) {
  const pts = range(0, 5, 1).map(k => {
    const a = -Math.PI / 2 + k * Math.PI / 3;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  el('polygon', { points: pts, fill: 'rgba(255,255,255,.03)', stroke: '#e2e8f0', 'stroke-width': 2.4 }, g);
  el('circle', { cx, cy, r: r * .58, fill: 'none', stroke: '#e2e8f0', 'stroke-width': 1.8 }, g);
  el('line', { x1: cx, y1: cy - r, x2: cx, y2: cy - r - 22, stroke: '#e2e8f0', 'stroke-width': 2.4 }, g);
  el('line', { x1: cx, y1: cy + r, x2: cx, y2: cy + r + 22, stroke: '#e2e8f0', 'stroke-width': 2.4 }, g);
  txt(g, cx, cy - r - 30, top, { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: hi || '#e2e8f0', class: 'mono' });
  txt(g, cx, cy + r + 44, bottom, { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#e2e8f0', class: 'mono' });
}

function fig5c(svg) {
  const W = 1120, H = 340;
  box(svg, W, H);
  const cy = 148, r = 40;
  const mols = [
    { x: 170, top: 'NO₂', bot: 'O⁻', hi: '#facc15', n: '4-nitrofenolato', s: '400 nm · amarillo', c: '#facc15' },
    { x: 560, top: 'NH₂', bot: 'OH', hi: '#7dd3fc', n: '4-aminofenol', s: '300 nm · incoloro', c: '#e2e8f0' },
    { x: 950, top: 'NHCOCH₃', bot: 'OH', hi: '#5eead4', n: 'Paracetamol', s: 'principio activo', c: '#5eead4' },
  ];
  mols.forEach((m, i) => {
    const g = el('g', { class: 'pop' }, svg);
    g.style.animationDelay = (0.3 + i * .35) + 's';
    el('circle', { cx: m.x, cy, r: 92, fill: m.c, opacity: .06 }, g);
    benzene(g, m.x, cy, r, m.top, m.bot, m.hi);
    el('circle', { cx: m.x - 70, cy: 296, r: 7, fill: m.c }, g);
    txt(g, m.x - 56, 301, m.n, { 'font-size': 16, 'font-weight': 700 });
    txt(g, m.x - 56, 322, m.s, { 'font-size': 13, class: 'muted mono' });
  });
  const arrow = (x1, x2, a, b, c) => {
    el('line', { x1, y1: cy, x2, y2: cy, stroke: c, 'stroke-width': 3, 'marker-end': marker(svg, c), class: 'draw' }, svg);
    txt(svg, (x1 + x2) / 2, cy - 14, a, { 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: c });
    txt(svg, (x1 + x2) / 2, cy + 26, b, { 'text-anchor': 'middle', 'font-size': 13, class: 'muted' });
  };
  arrow(280, 450, 'NaBH₄', 'nanocatalizador Au / Ag', '#38bdf8');
  arrow(670, 840, 'Acetilación', '(CH₃CO)₂O', '#5eead4');
  txt(svg, 365, 205, 'seguimiento UV-Vis', { 'text-anchor': 'middle', 'font-size': 12.5, fill: '#7dd3fc', class: 'mono' });
  txt(svg, 365, 222, 'en tiempo real', { 'text-anchor': 'middle', 'font-size': 12.5, fill: '#7dd3fc', class: 'mono' });
}

/* ---------- construir figuras ---------- */
const FIGS = {
  f0a: figInstrument, f0b: figSpectrumMap,
  f1a: fig1a, f1b: fig1b, f1c: fig1c,
  f2a: fig2a, f2b: fig2b, f2c: fig2c,
  f3a: fig3a, f3b: fig3b, f3c: fig3c, f3d: fig3d,
  f4a: fig4a, f4b: fig4b, f4c: fig4c,
  f5a: fig5a, f5b: fig5b, f5c: fig5c,
};
for (const id in FIGS) {
  const svg = document.getElementById(id);
  if (svg) { el('defs', {}, svg); FIGS[id](svg); }
}

/* ==========================================================
   NAVEGACIÓN
   ========================================================== */
const slides = [...document.querySelectorAll('.slide')];
const dots = document.getElementById('dots');
const notesPanel = document.getElementById('notesPanel');
const notesBtn = document.getElementById('notesBtn');
let cur = -1, showNotes = false;

slides.forEach((_, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', `Ir a diapositiva ${i + 1}`);
  b.onclick = () => go(i);
  dots.appendChild(b);
});

function animate(slide) {
  slide.querySelectorAll('.draw').forEach((p, i) => {
    const L = p.getTotalLength();
    p.style.transition = 'none';
    p.style.strokeDasharray = L;
    p.style.strokeDashoffset = L;
    p.getBoundingClientRect();
    p.style.transition = `stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1) ${0.15 + i * 0.08}s`;
    p.style.strokeDashoffset = 0;
  });
  slide.querySelectorAll('.pop').forEach((p, i) => {
    if (!p.style.animationDelay || p.dataset.auto) { p.dataset.auto = 1; p.style.animationDelay = (0.6 + i * 0.025) + 's'; }
  });
}

function go(n) {
  n = Math.max(0, Math.min(slides.length - 1, n));
  if (n === cur) return;
  cur = n;
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === cur);
    s.classList.toggle('past', i < cur);
  });
  animate(slides[cur]);
  [...dots.children].forEach((d, i) => d.classList.toggle('on', i === cur));
  document.getElementById('count').textContent = `${cur + 1} / ${slides.length}`;
  document.getElementById('bar').style.width = `${(cur / (slides.length - 1)) * 100}%`;
  history.replaceState(null, '', '#' + (cur + 1));
  renderNotes();
}

function renderNotes() {
  const n = slides[cur].querySelector('.notes');
  notesPanel.hidden = !(showNotes && n);
  if (n) notesPanel.textContent = n.textContent;
  notesBtn.classList.toggle('on', showNotes);
}
function toggleNotes() { showNotes = !showNotes; renderNotes(); }
function toggleFs() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
}

document.getElementById('prev').onclick = () => go(cur - 1);
document.getElementById('next').onclick = () => go(cur + 1);
notesBtn.onclick = toggleNotes;
document.getElementById('fsBtn').onclick = toggleFs;
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));

document.addEventListener('keydown', e => {
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(cur + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
  else if (e.key === 'Home') go(0);
  else if (e.key === 'End') go(slides.length - 1);
  else if (e.key.toLowerCase() === 'n') toggleNotes();
  else if (e.key.toLowerCase() === 'f') toggleFs();
});

let tx = null;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1));
  tx = null;
});

const start = parseInt(location.hash.slice(1), 10);
go(Number.isFinite(start) ? start - 1 : 0);
