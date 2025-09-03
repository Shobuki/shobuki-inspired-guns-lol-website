"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

/** ===== SATU GEAR PENUH (cycloidal) -> markup siap tempel ===== */
function makeFullCycloidalGearMarkup(opts: {
  teeth: number;
  pitchRadius: number;     // R
  rollRatio?: number;      // Rr = R/rollRatio
  clearance?: number;      // root clearance
  tipScale?: number;       // tambahan ujung gigi
  stroke?: number;
  fillId?: string;         // default 'brassDark'
}) {
  const {
    teeth,
    pitchRadius: R,
    rollRatio = 7,
    clearance = Math.max(1.2, R * 0.012),
    tipScale = 1.0,
    stroke = 1.0,
    fillId = "brassDark",
  } = opts;

  const r = R / rollRatio;
  const Ra = R + r * tipScale;
  const Rf = Math.max(2, R - r - clearance);

  const epi = (t: number) => {
    const k = (R + r) / r;
    return [
      (R + r) * Math.cos(t) - r * Math.cos(k * t),
      (R + r) * Math.sin(t) - r * Math.sin(k * t),
    ] as const;
  };
  const hypo = (t: number) => {
    const k = (R - r) / r;
    return [
      (R - r) * Math.cos(t) + r * Math.cos(k * t),
      (R - r) * Math.sin(t) - r * Math.sin(k * t),
    ] as const;
  };

  const solveT = (target: number, fn: (t: number) => readonly [number, number], t0: number, t1: number) => {
    let a = t0, b = t1;
    for (let i = 0; i < 22; i++) {
      const m = (a + b) / 2;
      const [x, y] = fn(m);
      (Math.hypot(x, y) > target) ? (b = m) : (a = m);
    }
    return (a + b) / 2;
  };

  const tau = (2 * Math.PI) / teeth;
  const halfTooth = tau * 0.40;
  const tHypoEnd = solveT(Rf, hypo, 0, Math.PI / rollRatio);
  const tEpiEnd  = solveT(Ra, epi, 0, Math.PI / rollRatio);

  // profil 1 gigi -> path d
  const N = 8;
  const left: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const tt = (i / N) * tEpiEnd;
    const [x, y] = epi(tt);
    const rot = halfTooth;
    left.push([x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  const rightHypo: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const tt = (i / N) * tHypoEnd;
    const [x, y] = hypo(tt);
    const rot = -halfTooth;
    rightHypo.push([x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
  }

  const tipL = left[left.length - 1];
  const tipR: [number, number] = [-tipL[0], tipL[1]];
  const seg: string[] = [];
  const [rx, ry] = rightHypo[0];
  seg.push(`M ${rx.toFixed(3)} ${ry.toFixed(3)}`);
  for (let i = 1; i < rightHypo.length; i++) {
    const [x, y] = rightHypo[i]; seg.push(`L ${x.toFixed(3)} ${y.toFixed(3)}`);
  }
  for (let i = 0; i < left.length; i++) {
    const [x, y] = left[i]; seg.push(`L ${(-x).toFixed(3)} ${y.toFixed(3)}`);
  }
  seg.push(`A ${Ra} ${Ra} 0 0 1 ${tipR[0].toFixed(3)} ${tipR[1].toFixed(3)}`);
  seg.push(`A ${Rf} ${Rf} 0 0 1 ${rx.toFixed(3)} ${ry.toFixed(3)} Z`);
  const toothD = seg.join(" ");

  // replikasi keliling -> satu gear penuh
  const all: string[] = [];
  for (let k = 0; k < teeth; k++) {
    all.push(`<path d="${toothD}" transform="rotate(${(k * 360) / teeth})" />`);
  }
  const core = `<circle r="${Math.max(2, Rf * 0.7).toFixed(2)}" />`;

  return `
    <g fill="url(#${fillId})" stroke="#3a2a0c" stroke-width="${stroke}" stroke-linejoin="round">
      ${all.join("\n")}
      ${core}
    </g>
  `;
}

/** ===== RODA PUSAT KHUSUS (beda bentuk) ===== */
function makeCenterSpecialGearMarkup(opts: {
  teeth?: number;
  pitchRadius?: number;
  rollRatio?: number;
  tipScale?: number;
  stroke?: number;
}) {
  const {
    teeth = 12,
    pitchRadius = 34,
    rollRatio = 7,
    tipScale = 1.04,
    stroke = 1.0,
  } = opts;

  const base = makeFullCycloidalGearMarkup({
    teeth,
    pitchRadius,
    rollRatio,
    tipScale,
    stroke,
    fillId: "brassCenter",
  });

  const spokes: string[] = [];
  const spokeW = Math.max(2.8, pitchRadius * 0.12);
  const spokeL = pitchRadius * 0.70;
  for (let i = 0; i < 6; i++) {
    const a = (i * 60).toFixed(2);
    spokes.push(`<rect x="${-spokeW/2}" y="${-spokeL}" width="${spokeW}" height="${spokeL}"
                  rx="${spokeW/2}" fill="#1a1210" opacity="0.9" transform="rotate(${a})" />`);
  }

  const hub = `
    <circle r="${pitchRadius * 0.26}" fill="#0f0f0f" stroke="#3a2a0c" stroke-width="1.2" />
    <circle r="${pitchRadius * 0.08}" fill="#1b1b1b" />
  `;

  return `
    <g>
      ${base}
      ${spokes.join("\n")}
      ${hub}
    </g>
  `;
}

/** ===== PACKED FIELD (statis/raster) + pilih beberapa overlay animated ===== */
function buildPackedField(opts: {
  windowR: number;
  rMin?: number; rMax?: number;
  teethMin?: number; teethMax?: number;
  rollRatio?: number; clearance?: number; tipScale?: number;
  seed?: number;
  minPeriodSec?: number; maxPeriodSec?: number;
  density?: number; layers?: number;
  overlayCount?: number;
}) {
  const {
    windowR,
    rMin = 8, rMax = 36,
    teethMin = 6, teethMax = 22,
    rollRatio = 7, clearance = 1.6, tipScale = 1.02,
    seed = 20240902,
    minPeriodSec = 10, maxPeriodSec = 40,
    density = 0.88,
    layers = 3,
    overlayCount = 3,
  } = opts;

  let s = seed >>> 0;
  const rand = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff);
  const pick = (a: number, b: number) => a + (b - a) * rand();
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const layerSettings = Array.from({ length: layers }, (_, i) => {
    const t = i / Math.max(1, layers - 1);
    return {
      scale: 0.94 + t * 0.10,
      layerOpacity: 0.75 + t * 0.23,
      rMul: 0.85 + t * 0.25,
      densMul: 0.9 + 0.2 * (0.5 - Math.abs(t - 0.5)),
    };
  });

  const MARGIN = 6;

  type Slot = {
    x: number; y: number;
    outerR: number; pitchR: number; teeth: number;
    start: number; dir: 1 | -1; dur: string; op: number;
  };
  const placedPerLayer: { scale: number; layerOpacity: number; slots: Slot[] }[] = [];

  for (let L = 0; L < layers; L++) {
    const { scale, layerOpacity, rMul, densMul } = layerSettings[L];
    const slots: Slot[] = [];

    const area = Math.PI * (windowR * scale) * (windowR * scale);
    const target = Math.floor((area / (Math.PI * (rMax * rMax))) * 10 * density * densMul);

    const collide = (x: number, y: number, R: number) => {
      for (const g of slots) {
        const dx = x - g.x, dy = y - g.y;
        if (dx * dx + dy * dy < (R + g.outerR - 1.2) ** 2) return true;
      }
      return false;
    };

    const attempts = target * 4;
    for (let k = 0; k < attempts; k++) {
      const a = pick(0, Math.PI * 2);
      const rr = Math.sqrt(rand()) * (windowR * scale - MARGIN);
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;

      const edgeFactor = clamp(1 - rr / (windowR * scale), 0.35, 1);
      const pitchR = clamp(
        pick(rMin, rMax) * (0.72 + 0.55 * edgeFactor) * rMul,
        rMin * 0.8,
        rMax * 1.15
      );

      const rRoll = pitchR / rollRatio;
      const tipR = pitchR + rRoll * tipScale;
      const SAFE = 1.1;
      const outerR = tipR * SAFE;

      if (Math.hypot(x, y) + outerR > windowR * scale - MARGIN) continue;
      if (collide(x, y, outerR)) continue;

      slots.push({ x, y, outerR, pitchR, teeth: 0, start: 0, dir: 1, dur: "0s", op: 1 });
      if (slots.length >= target) break;
    }

    placedPerLayer.push({ scale, layerOpacity, slots });
  }

  // urutkan untuk ambil overlay terbesar
  const allRefs: Array<{layerIdx:number; slotIdx:number; score:number}> = [];
  placedPerLayer.forEach((layer, li) => {
    layer.slots.forEach((p, si) => {
      allRefs.push({ layerIdx: li, slotIdx: si, score: p.outerR * layer.scale });
    });
  });
  allRefs.sort((a,b) => b.score - a.score);
  const overlayRefs = allRefs.slice(0, Math.max(0, overlayCount));

  // rakit background & overlay
  const bgPieces: string[] = [];
  const overlay: Array<{
    x:number; y:number; scale:number; start:number; dir:1|-1; dur:string;
    pitchR:number; teeth:number; opacity:number;
  }> = [];

  for (let L = 0; L < layers; L++) {
    const { scale, layerOpacity, slots } = placedPerLayer[L];
    const pieces: string[] = [];

    for (let i = 0; i < slots.length; i++) {
      const p = slots[i];
      const t = teethMin + (teethMax - teethMin) * ((p.pitchR - rMin) / (rMax - rMin));
      p.teeth = Math.max(teethMin, Math.min(teethMax, Math.round(t)));

      p.start = Math.round(rand() * 360);
      p.dir = (rand() < 0.5 ? -1 : 1) as 1 | -1;
      p.dur = pick(minPeriodSec, maxPeriodSec).toFixed(1) + "s";
      p.op = Math.max(0.65, Math.min(1, layerOpacity * (0.92 + 0.12 * rand())));

      const isOverlay = overlayRefs.some(r => r.layerIdx === L && r.slotIdx === i);
      if (isOverlay) {
        overlay.push({
          x: p.x, y: p.y, scale, start: p.start, dir: p.dir, dur: p.dur,
          pitchR: p.pitchR, teeth: p.teeth, opacity: p.op
        });
        continue;
      }

      const gearMarkup = makeFullCycloidalGearMarkup({
        teeth: p.teeth,
        pitchRadius: p.pitchR,
        rollRatio,
        clearance,
        tipScale,
        stroke: 0.9,
      });

      pieces.push(`
        <g transform="translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})" opacity="${p.op}">
          <g transform="rotate(${p.start})">
            ${gearMarkup}
          </g>
        </g>
      `);
    }

    bgPieces.push(`
      <g transform="scale(${scale.toFixed(3)})">
        ${pieces.join("\n")}
      </g>
    `);
  }

  return {
    backgroundFieldHTML: bgPieces.join("\n"),
    overlays: overlay,
  };
}

/** Raster helper — ubah satu SVG penuh (700x700) ke dataURL PNG */
async function rasterizeSVG700(svgInner: string) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" width="700" height="700">
    ${svgInner}
  </svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
    const canvas = document.createElement("canvas");
    const W = 700, H = 700; // dpr=1 biar ringan
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, W, H);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Props = {
  size?: number | string;
  smoothSeconds?: boolean;     // true = 5 FPS; false = loncat per detik
  className?: string;
  rotateCenter?: boolean;      // roda pusat berputar?
  extraRotating?: number;      // berapa roda lain berputar (overlay)
};

function ClockSteampunk({
  size = 360,
  smoothSeconds = true,
  className = "",
  rotateCenter = true,
  extraRotating = 10,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Refs jarum (satu set)
  const hourRef = useRef<SVGGElement | null>(null);
  const minuteRef = useRef<SVGGElement | null>(null);
  const secondRef = useRef<SVGGElement | null>(null);

  // 1) Field + overlay
  const field = useMemo(() => buildPackedField({
    windowR: 178,
    rMin: 7,
    rMax: 38,
    teethMin: 6,
    teethMax: 26,
    rollRatio: 7,
    clearance: 1.6,
    tipScale: 1.02,
    seed: 987654321,
    minPeriodSec: 10,
    maxPeriodSec: 38,
    density: 0.92,
    layers: 3,
    overlayCount: extraRotating,
  }), [extraRotating]);

  // 2) Static SVG (face + field) untuk raster
  const staticSVGInner = useMemo(() => {
    const face = `
      <circle cx="350" cy="350" r="330" fill="#0c1014" />
      <circle cx="350" cy="350" r="316" fill="none" stroke="url(#gold)" stroke-width="16" />
      <circle cx="350" cy="350" r="302" fill="none" stroke="#141414" stroke-width="10" />
      ${Array.from({ length: 80 }).map((_, i) => {
        const a = (i / 80) * Math.PI * 2;
        const R1 = 300, R2 = 286;
        const x = 350 + Math.cos(a) * ((R1 + R2) / 2);
        const y = 350 + Math.sin(a) * ((R1 + R2) / 2);
        return `<circle cx="${x}" cy="${y}" r="5.5" fill="url(#gold)" />`;
      }).join("")}
      <circle cx="350" cy="350" r="260" fill="url(#face)" />
      <circle cx="350" cy="350" r="260" fill="none" stroke="#6b4e15" stroke-width="2" />
      <circle cx="350" cy="350" r="228" fill="none" stroke="#6b4e15" stroke-width="2" />
      ${Array.from({ length: 60 }).map((_, i) => {
        const long = i % 5 === 0;
        const a = (i * 6 - 90) * (Math.PI / 180);
        const r1 = 248, r2 = long ? 232 : 241;
        const x1 = 350 + Math.cos(a) * r1;
        const y1 = 350 + Math.sin(a) * r1;
        const x2 = 350 + Math.cos(a) * r2;
        const y2 = 350 + Math.sin(a) * r2;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                 stroke="#2c1f08" stroke-width="${long ? 3.2 : 1.6}"
                 stroke-linecap="round" opacity=".92" />`;
      }).join("")}
      <g clip-path="url(#gearWindowClip)">
        <g transform="translate(350 350)">
          <circle r="178" fill="#1b140a" />
          ${field.backgroundFieldHTML}
          <circle r="182" fill="none" stroke="#3b2a0c" stroke-width="8" />
        </g>
      </g>
    `;
    const defs = `
      <defs>
        <radialGradient id="face" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stop-color="#FFF2CC" />
          <stop offset="55%" stop-color="#F6D472" />
          <stop offset="100%" stop-color="#CFA033" />
        </radialGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#C69B3C" />
          <stop offset="100%" stop-color="#8E6A22" />
        </linearGradient>
        <linearGradient id="brassDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#AA7A2B" />
          <stop offset="100%" stop-color="#6E5119" />
        </linearGradient>
        <clipPath id="gearWindowClip">
          <circle cx="350" cy="350" r="178" />
        </clipPath>
      </defs>
    `;
    return defs + face;
  }, [field.backgroundFieldHTML]);

  // 3) Raster jadi bitmap
  const [faceURL, setFaceURL] = useState<string | null>(null);
  useEffect(() => {
    let dead = false;
    (async () => {
      const url = await rasterizeSVG700(staticSVGInner);
      if (!dead) setFaceURL(url);
    })();
    return () => { dead = true; };
  }, [staticSVGInner]);

  // 4) Overlay beberapa roda berputar
  const overlayMarkup = useMemo(() => {
    if (!field.overlays.length) return null;
    const parts = field.overlays.map((g) => {
      const gearMarkup = makeFullCycloidalGearMarkup({
        teeth: g.teeth,
        pitchRadius: g.pitchR,
        stroke: 0.9,
        fillId: "brassDark",
      });
      return `
        <g transform="scale(${g.scale.toFixed(3)}) translate(${g.x.toFixed(2)} ${g.y.toFixed(2)})" opacity="${g.opacity}">
          <g transform="rotate(${g.start})">
            ${gearMarkup}
            <animateTransform attributeName="transform" attributeType="XML"
              type="rotate" by="${g.dir * 360}" dur="${g.dur}"
              repeatCount="indefinite" additive="sum" />
          </g>
        </g>
      `;
    });
    return parts.join("\n");
  }, [field.overlays]);

  // 5) Roda pusat beda bentuk — tepat di pusat jarum
  const centerMarkup = useMemo(() => {
    const center = makeCenterSpecialGearMarkup({
      teeth: 12,
      pitchRadius: 34,
      tipScale: 1.06,
      stroke: 1.0,
    });
    const dur = "32s";
    return `
      <g transform="translate(350 350)">
        <g transform="rotate(0)">
          ${center}
          ${rotateCenter ? `<animateTransform attributeName="transform" attributeType="XML"
            type="rotate" by="360" dur="${dur}" repeatCount="indefinite" additive="sum" />` : ``}
        </g>
      </g>
    `;
  }, [rotateCenter]);

  // 6) Jarum — ambil waktu dari device user (new Date)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const period = smoothSeconds ? 200 : 1000; // 5 FPS hemat atau 1 FPS
    const update = () => {
      const now = new Date(); // ← waktu lokal device user
      const ms = now.getMilliseconds();
      const s = now.getSeconds() + (smoothSeconds ? ms / 1000 : 0);
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;

      if (secondRef.current) secondRef.current.setAttribute("transform", `rotate(${s * 6})`);
      if (minuteRef.current) minuteRef.current.setAttribute("transform", `rotate(${m * 6})`);
      if (hourRef.current)   hourRef.current.setAttribute("transform", `rotate(${h * 30})`);
    };
    update();
    timer = setInterval(update, period);
    return () => { if (timer) clearInterval(timer); };
  }, [smoothSeconds]);

  // Pause SMIL saat tab hidden
  useEffect(() => {
    const onVis = () => {
      const svg = svgRef.current as any;
      if (!svg || typeof svg.pauseAnimations !== "function") return;
      if (document.visibilityState === "hidden") svg.pauseAnimations();
      else svg.unpauseAnimations();
    };
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div
      className={`relative mx-auto aspect-square ${className}`}
      style={{ width: typeof size === "number" ? `${size}px` : size }}
      aria-label="Steampunk clock (bitmap face + multi-rotating overlays + center special gear)">
      <svg
        ref={svgRef}
        viewBox="0 0 700 700"
        className="absolute inset-0"
        aria-hidden
        style={{ pointerEvents: "none" }}>

        {/* Defs untuk overlay (live) */}
        <defs>
          <linearGradient id="brassDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#AA7A2B" />
            <stop offset="100%" stopColor="#6E5119" />
          </linearGradient>
          <linearGradient id="brassCenter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4922E" />
            <stop offset="100%" stopColor="#704C14" />
          </linearGradient>
        </defs>

        {/* Bitmap semua elemen statis */}
        {faceURL ? (
          <image href={faceURL} x={0} y={0} width={700} height={700} />
        ) : (
          <rect x="0" y="0" width="700" height="700" fill="#0c1014" />
        )}

        {/* Overlay: beberapa roda berputar */}
        <g transform="translate(350 350)">
          {overlayMarkup && <g dangerouslySetInnerHTML={{ __html: overlayMarkup }} />}
        </g>

        {/* Roda pusat khusus (di pusat jarum) */}
        {centerMarkup && <g dangerouslySetInnerHTML={{ __html: centerMarkup }} />}

        {/* Jarum — batang ke arah −Y supaya nyambung dgn kepala */}
        <g transform="translate(350 350)">
          {/* Hour hand */}
          <g ref={hourRef}>
            <path d="M0 0 L0 -130 L10 -122 L0 -160 L-10 -122 L0 -130 Z" fill="#121212"/>
            {/* dari -140 ke 0 (nyambung ke kepala) */}
            <rect x="-4.5" y="-140" width="9" height="140" rx="4.5" fill="#121212"/>
          </g>
          {/* Minute hand */}
          <g ref={minuteRef}>
            <path d="M0 0 L0 -188 L8 -182 L0 -208 L-8 -182 L0 -188 Z" fill="#121212"/>
            {/* dari -200 ke 0 */}
            <rect x="-3.5" y="-200" width="7" height="200" rx="3.5" fill="#121212"/>
          </g>
          {/* Second hand (simetris melewati pusat) */}
          <g ref={secondRef}>
            <rect x="-1.6" y="-232" width="3.2" height="248" fill="#121212"/>
            <circle cx="0" cy="-232" r="4" fill="#121212"/>
          </g>
          {/* Tutup poros */}
          <circle r="9.5" fill="#0e0e0e"/>
          <circle r="4.8" fill="#1a1a1a"/>
        </g>
      </svg>
    </div>
  );
}

export default React.memo(ClockSteampunk);
