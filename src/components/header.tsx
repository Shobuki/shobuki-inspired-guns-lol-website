"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link"
import ClockSteampunk from "./clock"
import ZombieFPS from "@/components/ZombieFPS";


// ───────────────────────────────────────────────────────────────────────────────
// Kurumi clock kecil (tanpa perubahan besar)
function KurumiClockBadge() {
  return (
    <div className="relative size-8 md:size-9 ml-3" aria-hidden="true" title="Kurumi gold clock">
      <svg viewBox="0 0 100 100" className="absolute inset-0" style={{ animation: "spin 10s linear infinite" }}>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#D4AF37" strokeWidth="3" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6
          const x1 = 50 + Math.cos(a) * 36
          const y1 = 50 + Math.sin(a) * 36
          const x2 = 50 + Math.cos(a) * 42
          const y2 = 50 + Math.sin(a) * 42
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#D4AF37"
              strokeWidth={i % 3 === 0 ? 3 : 1.5}
              strokeLinecap="round"
            />
          )
        })}
        <circle cx="50" cy="50" r="2.5" fill="#D4AF37" />
      </svg>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// Header dengan transisi super halus
export default function Header() {
  const [showZombie, setShowZombie] = useState(false);
  // Lock background scroll when modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showZombie) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showZombie]);
  // batas vertikal merah (panel merah tidak boleh melewati ini)
  const dividerX = "56%"           // bisa ganti ke "600px" kalau mau fixed
  // lebar video (harus sama dengan class width di bawah)
  const videoWMobile = 150          // w-[150px]
  const videoWMD = 180              // md:w-[180px]
  // lebar area “seam” transisi setelah video
  const seamWMobile = 112           // dibuat sedikit lebih lebar agar makin lembut
  const seamWMD = 144

  // warna dasar maroon (pakai oklab mix biar smooth di layar gelap)
  const maroonStrong = "color-mix(in oklab, #6a0f15 90%, #000 10%)"
  const maroonMid    = "color-mix(in oklab, #4d0c12 74%, #000 26%)"
  const maroonDark   = "color-mix(in oklab, #160809 50%, #000 50%)"

  return (<>
    <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 border-b border-white/5 bg-black">
      <div className="relative h-full flex items-center justify-between px-4 md:px-6 overflow-hidden">

        {/* ░░ VIDEO (tanpa blend/mask) ░░ */}
        <Link href="/" className="relative h-full w-[150px] md:w-[180px] shrink-0 z-10">
          <video
            src="/wallpaper/staring.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </Link>

        {/* ░░ SEAM FEATHER: hitam → transparan (multi-stop) ░░ */}
        {/* mobile */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 md:hidden z-0"
          style={{
            left: `${videoWMobile}px`,
            width: `${seamWMobile}px`,
            background:
              "linear-gradient(to right, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.78) 28%, rgba(0,0,0,0.56) 56%, rgba(0,0,0,0.30) 82%, rgba(0,0,0,0.10) 94%, rgba(0,0,0,0) 100%)",
            mixBlendMode: "multiply",
          }}
        />
        {/* md+ */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden md:block z-0"
          style={{
            left: `${videoWMD}px`,
            width: `${seamWMD}px`,
            background:
              "linear-gradient(to right, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.78) 28%, rgba(0,0,0,0.56) 56%, rgba(0,0,0,0.30) 82%, rgba(0,0,0,0.10) 94%, rgba(0,0,0,0) 100%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* ░░ PREMIX FEATHER: tint maroon tipis di seam (membaurkan nada) ░░ */}
        {/* mobile */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 md:hidden z-0"
          style={{
            left: `${videoWMobile}px`,
            width: `${seamWMobile}px`,
            background:
              "linear-gradient(to right, rgba(106,15,21,0.00) 0%, rgba(106,15,21,0.10) 35%, rgba(106,15,21,0.18) 70%, rgba(106,15,21,0.22) 100%)",
            mixBlendMode: "soft-light",
          }}
        />
        {/* md+ */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden md:block z-0"
          style={{
            left: `${videoWMD}px`,
            width: `${seamWMD}px`,
            background:
              "linear-gradient(to right, rgba(106,15,21,0.00) 0%, rgba(106,15,21,0.10) 35%, rgba(106,15,21,0.18) 70%, rgba(106,15,21,0.22) 100%)",
            mixBlendMode: "soft-light",
          }}
        />

        {/* ░░ PANEL MERAH: ada MASK di tepi kiri agar fade-in ░░ */}
        {/* mobile */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 md:hidden z-0"
          style={{
            left: `${videoWMobile + seamWMobile}px`,
            width: `calc(${dividerX} - ${videoWMobile + seamWMobile}px)`,
            background: `
              radial-gradient(120px 88px at 0% 50%, ${maroonStrong} 0%, transparent 78%),
              linear-gradient(to right, ${maroonStrong} 0%, ${maroonMid} 62%, ${maroonDark} 100%)
            `,
            backgroundBlendMode: "multiply",
            // >>> Fade-in halus dari sisi kiri
            WebkitMaskImage:
              "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 10%, rgba(0,0,0,0.40) 22%, rgba(0,0,0,0.70) 40%, rgba(0,0,0,0.85) 58%, rgba(0,0,0,1) 78%)",
            maskImage:
              "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 10%, rgba(0,0,0,0.40) 22%, rgba(0,0,0,0.70) 40%, rgba(0,0,0,0.85) 58%, rgba(0,0,0,1) 78%)",
          }}
        />
        {/* md+ */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden md:block z-0"
          style={{
            left: `${videoWMD + seamWMD}px`,
            width: `calc(${dividerX} - ${videoWMD + seamWMD}px)`,
            background: `
              radial-gradient(160px 110px at 0% 50%, ${maroonStrong} 0%, transparent 80%),
              linear-gradient(to right, ${maroonStrong} 0%, ${maroonMid} 64%, ${maroonDark} 100%)
            `,
            backgroundBlendMode: "multiply",
            WebkitMaskImage:
              "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.16) 8%, rgba(0,0,0,0.38) 20%, rgba(0,0,0,0.68) 38%, rgba(0,0,0,0.86) 56%, rgba(0,0,0,1) 76%)",
            maskImage:
              "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.16) 8%, rgba(0,0,0,0.38) 20%, rgba(0,0,0,0.68) 38%, rgba(0,0,0,0.86) 56%, rgba(0,0,0,1) 76%)",
          }}
        />

        {/* ░░ NOISE DITHER: kurangi banding di gradient panjang ░░ */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.018) 0, rgba(0,0,0,0.018) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)",
            mixBlendMode: "multiply",
          }}
        />

        {/* (opsional) garis pembatas vertikal */}
        <span
          aria-hidden
          className="absolute inset-y-2 top-0"
          style={{
            left: dividerX,
            width: "1px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.00) 70%)",
            mixBlendMode: "screen",
          }}
        />

        {/* ── Right: Brand & Nav ─────────────────────────────────────────────── */}
        <div className="relative z-[1] flex items-center justify-between w-full pl-4 md:pl-6">
          <div className="flex items-center">
            <Link
              href="/"
              className="font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#ffd166] via-[#ffe08a] to-[#fff2bf] drop-shadow-[0_1px_0_rgba(0,0,0,0.25)] text-base md:text-lg"
            >
              Shobuki
            </Link>
            <div className="ml-3 size-8 md:size-9 mb-5" aria-hidden>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/85">
            <button
              onClick={() => setShowZombie(true)}
              className="px-3 py-1.5 rounded-md bg-[#6a0f15] text-white/95 hover:bg-[#8c1b23] ring-1 ring-white/10 transition"
              title="Play Zombie FPS"
            >
              Zombie FPS
            </button>
          </nav>
          <button
            onClick={() => setShowZombie(true)}
            className="sm:hidden px-3 py-1.5 rounded-md bg-[#6a0f15] text-white/95 ring-1 ring-white/10"
            title="Play Zombie FPS"
          >
            Zombie
          </button>
        </div>
      </div>
    </header>
    {/* Modal: Zombie FPS */}
    {showZombie && (
      <div
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm"
        aria-modal="true"
        role="dialog"
        data-lenis-prevent
      >
        <button
          onClick={() => setShowZombie(false)}
          className="absolute top-4 right-4 px-3 py-1.5 rounded-md bg-white/90 text-black font-semibold hover:bg-white"
          aria-label="Close"
        >
          Close
        </button>
        <div className="absolute inset-0 overflow-auto">
          <div className="min-h-full w-full flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
              <ZombieFPS />
            </div>
          </div>
        </div>
      </div>
    )}
  </>)
}
