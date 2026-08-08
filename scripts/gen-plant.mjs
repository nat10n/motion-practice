// Deterministic generator for compositions/plant.html
// Seeded PRNG -> all geometry is fixed at author time (no runtime randomness).

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260808);
const range = (lo, hi) => lo + (hi - lo) * rnd();
const irange = (lo, hi) => Math.floor(lo + (hi - lo + 1) * rnd());
const r2 = (n) => Math.round(n * 100) / 100;

const W = 1920, H = 1080;
const ORIGIN = { x: 960, y: 1000 }; // near bottom centre
const INK = "#19191A";

const deg = (d) => (d * Math.PI) / 180;
const dir = (d) => ({ x: Math.sin(deg(d)), y: -Math.cos(deg(d)) }); // up = -y
const add = (p, v, len) => ({ x: p.x + v.x * len, y: p.y + v.y * len });
const perp = (v) => ({ x: -v.y, y: v.x });

// Slightly curved stroke from a -> b, control point bowed perpendicular.
function curve(a, b, bow) {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const vx = b.x - a.x, vy = b.y - a.y;
  const len = Math.hypot(vx, vy) || 1;
  const pv = perp({ x: vx / len, y: vy / len });
  const c = { x: mid.x + pv.x * bow, y: mid.y + pv.y * bow };
  return `M ${r2(a.x)} ${r2(a.y)} Q ${r2(c.x)} ${r2(c.y)} ${r2(b.x)} ${r2(b.y)}`;
}

// --- timing ---
const MAIN_STAGGER = 0.45;
const MAIN_DUR = 0.6;
const SUB_DUR = 0.5;
const SUB_OFFSET = 0.08;   // 2nd sub-branch of a fork starts a touch later
const CIRC_STAGGER = 0.09; // 90ms
const CIRC_DUR = 0.25;

const baseAngles = [-46, -18, 18, 46];
const paths = [];   // {id, d, start, dur}
const circles = []; // {id, cx, cy, r, start}
let activeEnd = 0;

baseAngles.forEach((base, i) => {
  const ang = base + range(-5, 5);
  const mainLen = range(250, 320);
  const S = add(ORIGIN, dir(ang), mainLen); // split point
  const mainStart = i * MAIN_STAGGER;
  const mainBow = rentBow();
  paths.push({ id: `m${i}`, d: curve(ORIGIN, S, mainBow), start: r2(mainStart), dur: MAIN_DUR });
  const mainFinish = mainStart + MAIN_DUR;

  const spread = range(20, 30);
  [-1, 1].forEach((sgn, j) => {
    const subAng = ang + sgn * spread;
    const subLen = range(120, 175);
    const T = add(S, dir(subAng), subLen);
    const subStart = mainFinish + j * SUB_OFFSET;
    paths.push({ id: `s${i}${j}`, d: curve(S, T, rentBow()), start: r2(subStart), dur: SUB_DUR });
    const subFinish = subStart + SUB_DUR;

    // cluster of 4-8 circles around the tip
    const n = irange(4, 8);
    const spreadR = range(18, 30);
    for (let k = 0; k < n; k++) {
      // first circle sits at the tip; rest fan out within spreadR
      const a = rnd() * Math.PI * 2;
      const dist = k === 0 ? range(0, 4) : range(6, spreadR);
      const cx = T.x + Math.cos(a) * dist;
      const cy = T.y + Math.sin(a) * dist;
      const rad = k === 0 ? range(18, 28) : range(8, 20);
      const start = subFinish + k * CIRC_STAGGER;
      circles.push({ id: `c${i}${j}${k}`, cx: r2(cx), cy: r2(cy), r: r2(rad), start: r2(start) });
      activeEnd = Math.max(activeEnd, start + CIRC_DUR);
    }
  });
});

function rentBow() {
  // small perpendicular bow, random sign, for organic sway
  return (rnd() < 0.5 ? -1 : 1) * range(10, 26);
}

const DURATION = 4.5;
const holdEst = r2(DURATION - activeEnd);

// --- build SVG markup ---
const pathEls = paths
  .map((p) => `        <path id="${p.id}" d="${p.d}" />`)
  .join("\n");
const circleEls = circles
  .map((c) => `        <circle id="${c.id}" cx="${c.cx}" cy="${c.cy}" r="${c.r}" />`)
  .join("\n");

// --- build timeline specs ---
const drawSpecs = paths.map((p) => ({ t: "draw", id: p.id, start: p.start, dur: p.dur }));
const popSpecs = circles.map((c) => ({ t: "pop", id: c.id, start: c.start }));
const specs = [...drawSpecs, ...popSpecs];

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/DrawSVGPlugin.min.js"><\/script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        background: #ebedf3;
      }
      .bg { position: absolute; inset: 0; background: #ebedf3; }
      .scene { position: absolute; inset: 0; }
      svg { display: block; width: 1920px; height: 1080px; }
      .stem {
        fill: none;
        stroke: ${INK};
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .bloom { fill: ${INK}; }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="plant"
      data-start="0"
      data-duration="${DURATION}"
      data-width="1920"
      data-height="1080"
    >
      <div class="bg"></div>

      <div class="scene clip" id="plant-scene" data-start="0" data-duration="${DURATION}" data-track-index="1">
        <svg viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
          <g class="stem">
${pathEls}
          </g>
          <g class="bloom">
${circleEls}
          </g>
        </svg>
      </div>
    </div>

    <script>
      gsap.registerPlugin(DrawSVGPlugin);
      window.__timelines = window.__timelines || {};

      // All geometry + timing is precomputed (seeded) at author time.
      const SPECS = ${JSON.stringify(specs)};

      const tl = gsap.timeline({ paused: true });

      for (const s of SPECS) {
        const el = "#" + s.id;
        if (s.t === "draw") {
          // Lines draw on from the base outward.
          tl.from(el, { drawSVG: "0%", duration: s.dur, ease: "power2.out" }, s.start);
        } else {
          // Circles pop in: scale 0.6 -> 1.04 -> 1 over 250ms.
          tl.fromTo(
            el,
            { scale: 0.6, autoAlpha: 0, transformOrigin: "50% 50%" },
            {
              keyframes: [
                { scale: 1.04, autoAlpha: 1, duration: 0.15, ease: "power2.out" },
                { scale: 1, duration: 0.1, ease: "power2.inOut" },
              ],
              transformOrigin: "50% 50%",
            },
            s.start
          );
        }
      }

      window.__timelines["plant"] = tl;
    <\/script>
  </body>
</html>
`;

process.stdout.write(html);
console.error(
  `paths=${paths.length} circles=${circles.length} activeEnd=${r2(activeEnd)}s hold~${holdEst}s duration=${DURATION}s`
);
