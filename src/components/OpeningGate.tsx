"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "kurumi-gate-entered.v1"; // jika dulu pernah tersimpan

export default function OpeningGate({
  // biarkan default = false agar selalu muncul tiap refresh
  remember = false,
}: { remember?: boolean }) {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const prevOverflowRef = useRef<string>("");

  // SELALU TAMPIL: hapus flag lama (kalau ada), lalu tampilkan
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (!remember) window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    setShow(true);
  }, [remember]);

  // Lock scroll only while the gate is visible
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.documentElement;
    if (show) {
      prevOverflowRef.current = el.style.overflow;
      el.style.overflow = "hidden";
    } else {
      el.style.overflow = prevOverflowRef.current;
    }
    return () => {
      el.style.overflow = prevOverflowRef.current;
    };
  }, [show]);

  const dismiss = useCallback(() => {
    if (closing) return;
    setClosing(true);
    try {
      if (remember && typeof window !== "undefined") {
        // hanya simpan kalau kamu set remember=true
        window.localStorage.setItem(STORAGE_KEY, "1");
      }
    } catch {}
    setTimeout(() => setShow(false), 650);
  }, [closing, remember]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, dismiss]);

  const embers = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${4 + Math.random() * 8}px`,
        dur: `${6 + Math.random() * 8}s`,
        delay: `${Math.random() * 4}s`,
        blur: `${1 + Math.random() * 3}px`,
        opacity: 0.35 + Math.random() * 0.4,
      })),
    []
  );

  const ctaClass = [
    "inline-flex","items-center","gap-2","rounded-xl","px-6","py-3","font-semibold",
    "bg-gradient-to-br","from-[#f43b3b]","via-[#c81e1e]","to-[#6b0b0b]",
    "ring-1","ring-white/15","shadow-[0_8px_30px_rgba(255,0,0,.15)]",
    "hover:brightness-110","active:scale-[.98]","transition"
  ].join(" ");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: closing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-[999] text-white"
          aria-label="Opening gate"
        >
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_40%,#2a0006_0%,#0b0b0b_65%,#000_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,transparent,rgba(0,0,0,0.6))]" />

          <div className="pointer-events-none absolute inset-0 mix-blend-screen">
            {embers.map(e => (
              <span
                key={e.id}
                className="absolute rounded-full bg-[#ff1e1e]"
                style={{
                  left: e.left, top: e.top, width: e.size, height: e.size,
                  filter: `blur(${e.blur})`, opacity: e.opacity,
                  animation: `emberFloat ${e.dur} ease-in-out ${e.delay} infinite`,
                }}
              />
            ))}
          </div>

          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <svg className="w-[64vmin] h-[64vmin] opacity-60" viewBox="0 0 200 200" fill="none">
              <defs>
                <radialGradient id="rg" r="1" cx="0" cy="0"
                  gradientTransform="translate(100 100) rotate(90) scale(100)">
                  <stop offset="0" stopColor="#ffb84d" />
                  <stop offset="0.55" stopColor="#d48a1a" />
                  <stop offset="1" stopColor="#7b4300" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="90" stroke="url(#rg)" strokeWidth="2" opacity="0.28" />
              <g className="animate-[spin_24s_linear_infinite] origin-center">
                {Array.from({ length: 60 }).map((_, i) => {
                  const a = (i * Math.PI * 2) / 60;
                  const r1 = 82;
                  const r2 = i % 5 === 0 ? 70 : 76;
                  const x1 = 100 + Math.cos(a) * r1;
                  const y1 = 100 + Math.sin(a) * r1;
                  const x2 = 100 + Math.cos(a) * r2;
                  const y2 = 100 + Math.sin(a) * r2;
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#ffb84d" strokeOpacity={i % 5 === 0 ? 0.6 : 0.28}
                      strokeWidth={i % 5 === 0 ? 0.9 : 0.5} strokeLinecap="round" />
                  );
                })}
              </g>
              <circle cx="100" cy="100" r="58" stroke="#ff3b3b" strokeOpacity="0.18" strokeWidth="1.2" />
            </svg>
          </div>

          <div className="relative h-full grid place-items-center">
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="text-center px-6"
            >
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-[0.25em] md:tracking-[0.35em] mb-4">
                <span className="select-none gradient-text drop-shadow-[0_0_12px_rgba(255,49,49,.35)]">
                  Shobuki Lair
                </span>
              </h1> 
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                Tick tock tick tock...
              </p>
              <button type="button" onClick={dismiss} className={ctaClass}>
                Click to enter <span className="animate-pulse">↘</span>
              </button>
              <div className="mt-4 text-xs text-white/50">or press Enter / Space</div>
            </motion.div>
          </div>

          <style jsx global>{`
            @keyframes emberFloat {
              0% { transform: translateY(0) translateX(0) scale(1); }
              50% { transform: translateY(-10px) translateX(6px) scale(1.08); }
              100% { transform: translateY(0) translateX(0) scale(1); }
            }
            .gradient-text {
              background: linear-gradient(180deg,#ffd27a 0%,#f8b74e 40%,#e28619 70%,#b56a0e 100%);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
