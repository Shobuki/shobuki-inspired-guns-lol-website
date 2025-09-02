"use client";

import React, { useEffect, useMemo, useRef } from "react";

/** ===== SATU GEAR PENUH (cycloidal) -> markup siap tempel ===== */
function makeFullCycloidalGearMarkup(opts: {
  teeth: number;
  pitchRadius: number;     // R
  rollRatio?: number;      // Rr = R/rollRatio
  clearance?: number;      // root clearance
  tipScale?: number;       // tambahan ujung gigi
  stroke?: number;
}) {
  const {
    teeth,
    pitchRadius: R,
    rollRatio = 7,
    clearance = Math.max(1.2, R * 0.012),
    tipScale = 1.0,
    stroke = 1.0,
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
    <g fill="url(#brassDark)" stroke="#3a2a0c" stroke-width="${stroke}" stroke-linejoin="round">
      ${all.join("\n")}
      ${core}
    </g>
  `;
}

/** ===== FIELD GEARLET TERSEBAR RAPAT (posisi DIAM, masing-masing ROTATE di tempat) =====
 *  Metode: polar grid packing (ring demi ring) + golden-angle offset + jitter.
 *  Ini menjamin coverage dari pusat sampai tepi jendela.
 */
function makePackedField(opts: {
  windowR: number;
  rMin?: number; rMax?: number;
  teethMin?: number; teethMax?: number;
  rollRatio?: number; clearance?: number; tipScale?: number;
  seed?: number;
  minPeriodSec?: number; maxPeriodSec?: number;
  density?: number;         // kepadatan tiap layer
  layers?: number;          // jumlah layer (z-depth)
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
  } = opts;

  let s = seed >>> 0;
  const rand = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff);
  const pick = (a: number, b: number) => a + (b - a) * rand();
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  // setting per-layer: belakang → depan
  const layerSettings = Array.from({ length: layers }, (_, i) => {
    const t = i / Math.max(1, layers - 1);           // 0..1
    return {
      // skala global layer (belakang sedikit lebih kecil)
      scale: 0.94 + t * 0.10,                        // 0.94..1.04
      // opacity layer (belakang lebih redup)
      layerOpacity: 0.75 + t * 0.23,                 // 0.75..0.98
      // modifier ukuran gear di layer ini (belakang cenderung lebih kecil)
      rMul: 0.85 + t * 0.25,                         // 0.85..1.10
      // kepadatan per layer (sedikit lebih padat di tengah layer)
      densMul: 0.9 + 0.2 * (0.5 - Math.abs(t - 0.5)) // 0.9..1.0..0.9
    };
  });

  const MARGIN = 3;
  const piecesLayered: string[] = [];

  for (let L = 0; L < layers; L++) {
    const { scale, layerOpacity, rMul, densMul } = layerSettings[L];

    type Slot = {
      x: number; y: number;
      outerR: number; pitchR: number; teeth: number;
      start: number; dir: 1 | -1; dur: string; op: number;
    };
    const placed: Slot[] = [];

    // target jumlah node untuk layer ini
    const area = Math.PI * (windowR * scale) * (windowR * scale);
    const target = Math.floor((area / (Math.PI * (rMax * rMax))) * 10 * density * densMul);

    const collide = (x: number, y: number, R: number) => {
      for (const g of placed) {
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

      // dekat tepi layer => lebih kecil
      const edgeFactor = clamp(1 - rr / (windowR * scale), 0.35, 1);
      const pitchR = clamp(
        pick(rMin, rMax) * (0.72 + 0.55 * edgeFactor) * rMul,
        rMin * 0.8,
        rMax * 1.15
      );

      const rRoll = pitchR / rollRatio;
      const tipR = pitchR + rRoll * tipScale;
      const outerR = tipR + 1.2;

      if (Math.hypot(x, y) + outerR > windowR * scale - MARGIN) continue;

      if (collide(x, y, outerR)) continue;
      placed.push({ x, y, outerR, pitchR, teeth: 0, start: 0, dir: 1, dur: "0s", op: 1 });
      if (placed.length >= target) break;
    }

    // render layer ini (di‐wrap oleh <g transform="scale(...)"> lalu translate global di luar)
    const pieces: string[] = [];
    for (const p of placed) {
      const t = teethMin + (teethMax - teethMin) * ((p.pitchR - rMin) / (rMax - rMin));
      p.teeth = Math.max(teethMin, Math.min(teethMax, Math.round(t)));

      p.start = Math.round(rand() * 360);
      p.dir = (rand() < 0.5 ? -1 : 1) as 1 | -1;
      p.dur = pick(minPeriodSec, maxPeriodSec).toFixed(1) + "s";
      p.op = clamp(layerOpacity * (0.92 + 0.12 * rand()), 0.65, 1);

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
          <g transform="rotate(${p.start})" filter="url(#soft)">
            ${gearMarkup}
            <animateTransform attributeName="transform" attributeType="XML"
              type="rotate" by="${p.dir * 360}" dur="${p.dur}"
              repeatCount="indefinite" additive="sum" />
          </g>
        </g>
      `);
    }

    // group per layer: skala layer + sedikit tint (pakai opacity layer)
    piecesLayered.push(`
      <g transform="scale(${scale.toFixed(3)})">
        ${pieces.join("\n")}
      </g>
    `);
  }

  // belakang → depan (sudah dikerjakan urut L=0..layers-1)
  return piecesLayered.join("\n");
}

type Props = {
  size?: number | string;
  smoothSeconds?: boolean;
  className?: string;
};

export default function ClockSteampunk({
  size = 360,
  smoothSeconds = true,
  className = "",
}: Props) {
  // Optimasi: hindari re-render per frame; update transform via DOM.
  const hRef = useRef<SVGGElement | null>(null);
  const mRef = useRef<SVGGElement | null>(null);
  const sRef = useRef<SVGGElement | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const update = () => {
      const now = new Date();
      const ms = now.getMilliseconds();
      const s = now.getSeconds() + (smoothSeconds ? ms / 1000 : 0);
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;

      const angS = s * 6;
      const angM = m * 6;
      const angH = h * 30;

      if (sRef.current) sRef.current.setAttribute("transform", `rotate(${angS})`);
      if (mRef.current) mRef.current.setAttribute("transform", `rotate(${angM})`);
      if (hRef.current) hRef.current.setAttribute("transform", `rotate(${angH})`);
    };

    if (smoothSeconds) {
      const tick = () => { update(); raf.current = requestAnimationFrame(tick); };
      raf.current = requestAnimationFrame(tick);
      return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    } else {
      update();
      intervalId = setInterval(update, 1000);
      return () => { if (intervalId) clearInterval(intervalId); };
    }
  }, [smoothSeconds]);

  // ===== FIELD GEARLET PADAT (radius jendela = 178) =====
 const gearField = useMemo(
  () =>
    makePackedField({
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
      density: 0.92,  // lebih padat seperti gambar
    }),
  []
);

  return (
    <div
      className={`relative mx-auto aspect-square ${className}`}
      style={{ width: typeof size === "number" ? `${size}px` : size }}
      aria-label="Steampunk clock (gearlets packed)"
    >
      <svg viewBox="0 0 700 700" className="absolute inset-0" aria-hidden>
        <defs>
          <radialGradient id="face" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#FFF2CC" />
            <stop offset="55%" stopColor="#F6D472" />
            <stop offset="100%" stopColor="#CFA033" />
          </radialGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C69B3C" />
            <stop offset="100%" stopColor="#8E6A22" />
          </linearGradient>
          <linearGradient id="brassDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#AA7A2B" />
            <stop offset="100%" stopColor="#6E5119" />
          </linearGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.6" floodOpacity="0.45" />
          </filter>
          <filter id="inner" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.3" result="b" />
            <feOffset dy="1" />
            <feComposite in2="b" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 .9 0"/>
          </filter>

          {/* CLIP: supaya field nggak keluar jendela */}
          <clipPath id="gearWindowClip">
            <circle cx="350" cy="350" r="178" />
          </clipPath>
        </defs>

        {/* rim luar */}
        <circle cx="350" cy="350" r="330" fill="#0c1014" />
        <circle cx="350" cy="350" r="316" fill="none" stroke="url(#gold)" strokeWidth="16" />
        <circle cx="350" cy="350" r="302" fill="none" stroke="#141414" strokeWidth="10" />

        {/* paku/index luar */}
        {Array.from({ length: 80 }).map((_, i) => {
          const a = (i / 80) * Math.PI * 2;
          const R1 = 300, R2 = 286;
          const x = 350 + Math.cos(a) * ((R1 + R2) / 2);
          const y = 350 + Math.sin(a) * ((R1 + R2) / 2);
          return <circle key={i} cx={x} cy={y} r="5.5" fill="url(#gold)" filter="url(#soft)" />;
        })}

        {/* ring romawi */}
        <circle cx="350" cy="350" r="260" fill="url(#face)" filter="url(#inner)" />
        <circle cx="350" cy="350" r="260" fill="none" stroke="#6b4e15" strokeWidth="2" />
        <circle cx="350" cy="350" r="228" fill="none" stroke="#6b4e15" strokeWidth="2" />

        {/* index menit */}
        {Array.from({ length: 60 }).map((_, i) => {
          const long = i % 5 === 0;
          const a = (i * 6 - 90) * (Math.PI / 180);
          const r1 = 248, r2 = long ? 232 : 241;
          const x1 = 350 + Math.cos(a) * r1;
          const y1 = 350 + Math.sin(a) * r1;
          const x2 = 350 + Math.cos(a) * r2;
          const y2 = 350 + Math.sin(a) * r2;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#2c1f08" strokeWidth={long ? 3.2 : 1.6}
              strokeLinecap="round" opacity=".92" />
          );
        })}

        {/* angka romawi */}
        {["XII","I","II","III","IV","V","VI","VII","VIII","IX","X","XI"].map((t, i) => {
          const deg = i * 30 - 90;
          const a = (deg * Math.PI) / 180;
          const R = 214;
          const x = 350 + Math.cos(a) * R;
          const y = 358 + Math.sin(a) * R;
          return (
            <text key={t} x={x} y={y} textAnchor="middle"
              fontSize="34" fontWeight={900}
              fill="#241a08" stroke="#fff6dc" strokeWidth={2.2}
              paintOrder="stroke fill" style={{ letterSpacing: "0.04em" }}>
              {t}
            </text>
          );
        })}

        {/* ===== JENDELA MEKANIK: field gear padat ===== */}
        <g clipPath="url(#gearWindowClip)">
          <g transform="translate(350 350)">
            <circle r="178" fill="#1b140a" />
            <g dangerouslySetInnerHTML={{ __html: gearField }} />
            <circle r="182" fill="none" stroke="#3b2a0c" strokeWidth="8" />
          </g>
        </g>

        {/* ===== JARUM ===== */}
        <g transform="translate(350 350)" filter="url(#soft)">
          <g ref={hRef}>
            <path d="M0 0 L0 -130 L10 -122 L0 -160 L-10 -122 L0 -130 Z" fill="#121212"/>
            <rect x="-4.5" y="0" width="9" height="44" rx="4.5" fill="#121212"/>
          </g>
          <g ref={mRef}>
            <path d="M0 0 L0 -188 L8 -182 L0 -208 L-8 -182 L0 -188 Z" fill="#121212"/>
            <rect x="-3.5" y="0" width="7" height="60" rx="3.5" fill="#121212"/>
          </g>
          <g ref={sRef}>
            <rect x="-1.6" y="-232" width="3.2" height="248" fill="#121212"/>
            <circle cx="0" cy="-232" r="4" fill="#121212"/>
          </g>
          <circle r="9.5" fill="#0e0e0e"/>
          <circle r="4.8" fill="#1a1a1a"/>
        </g>
      </svg>
    </div>
  );
}
