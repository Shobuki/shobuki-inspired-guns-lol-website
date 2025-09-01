"use client";
import React from "react"
import { motion } from "framer-motion"
import { Github, Instagram, Twitter, Youtube, Link2, Mail, Music2, ArrowRight, Copy, Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// ============================
// Guns.lol-inspired profile landing
// Theme: Red/Black
// Animations: stylized silhouettes (MC with scythe) & a clock motif (Kurumi-inspired) without using copyrighted art.
// Drop this component into app/page.tsx in a Next.js (App Router) project with Tailwind + shadcn/ui.
// ============================

const socials = [
  { label: "GitHub", href: "https://github.com/yourname", icon: Github },
  { label: "Instagram", href: "https://instagram.com/yourname", icon: Instagram },
  { label: "Twitter/X", href: "https://twitter.com/yourname", icon: Twitter },
  { label: "YouTube", href: "https://youtube.com/@yourname", icon: Youtube },
  { label: "Portfolio", href: "https://yourdomain.com", icon: Link2 },
  { label: "Email", href: "mailto:you@domain.com", icon: Mail },
  { label: "Spotify", href: "https://open.spotify.com/user/yourname", icon: Music2 },
]

export default function Page() {
  return (
    <main className="min-h-dvh bg-black text-white relative overflow-hidden">
      {/* Background gradient + vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,0,0,0.24),transparent_60%)] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.8)]" />

      {/* Subtle animated grid */}
      <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(239,68,68,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(239,68,68,0.15)_1px,transparent_1px)] bg-[size:96px_96px]"
          animate={{ backgroundPositionX: [0, 96], backgroundPositionY: [0, 96] }}
          transition={{ duration: 16, ease: "linear", repeat: Infinity }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-red-600/90 ring-2 ring-red-400/30 grid place-items-center font-black">G</div>
          <span className="font-semibold tracking-wide text-red-300">guns.lol — inspired</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
          <Shield className="h-4 w-4" /> <span>Dark/Crimson Mode</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12">
        <div className="mx-auto max-w-5xl grid md:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          {/* Left: Profile + Links */}
          <div>
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-2xl bg-zinc-900 ring-2 ring-red-500/50 overflow-hidden">
                {/* Replace with <Image .../> if you have an avatar */}
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1544441892-5b7b2c8b5a17?q=80&w=400&auto=format&fit=crop')] bg-cover bg-center" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shobuki</h1>
                <p className="text-sm text-zinc-400">Full‑stack dev • Designer • Anime / rhythm gamer</p>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-6 text-zinc-300/90 leading-relaxed">
              Welcome to my lair. Building <span className="text-red-400">high‑performance web apps</span> and crafting
              <span className="text-red-400"> slick UI</span>. Inspired by crimson night themes and clockwork aesthetics.
            </p>

            {/* Link cards */}
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {socials.map((s) => (
                <LinkCard key={s.label} href={s.href} label={s.label} Icon={s.icon} />
              ))}
            </div>

            {/* CTA row */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-5">
                <a href="#contact">Contact <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800"
                onClick={() => {
                  navigator.clipboard?.writeText("gunslol.com/yourname").catch(() => {})
                }}
              >
                Copy guns‑style link <Copy className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right: Animated Silhouettes */}
          <div className="relative aspect-[4/5]">
            {/* MC with Scythe silhouette */}
            <motion.svg
              viewBox="0 0 300 380"
              className="absolute inset-0 w-full h-full opacity-90"
              initial={{ x: 20, rotate: -2, opacity: 0 }}
              animate={{ x: 0, rotate: 0, opacity: 0.95 }}
              transition={{ type: "spring", stiffness: 60, damping: 14 }}
            >
              <defs>
                <linearGradient id="blade" x1="0" x2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* body */}
              <motion.path
                d="M130 300c-10-20 5-45 10-70 3-15-2-34 10-53 8-13 22-20 28-34 8-18-3-38 9-54 10-12 27-17 42-12 18 6 29 26 26 44-4 23-26 37-46 43-12 4-25 4-36 10-23 13-19 47-28 70-8 20-18 37-15 56 1 5-1 10-5 13-6 4-16 1-21-13z"
                fill="#0a0a0a"
                stroke="#ef4444"
                strokeOpacity={0.5}
                filter="url(#glow)"
              />
              {/* scythe pole */}
              <motion.rect
                x="190"
                y="60"
                width="8"
                height="210"
                rx="4"
                fill="#a1a1aa"
                animate={{ rotate: [0, -6, 3, 0], transformOrigin: "194px 60px" }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* scythe blade */}
              <motion.path
                d="M198 66C210 38 250 18 292 24 257 30 230 46 214 66"
                stroke="url(#blade)"
                strokeWidth={10}
                strokeLinecap="round"
                fill="none"
                animate={{ d: [
                  "M198 66C210 38 250 18 292 24 257 30 230 46 214 66",
                  "M198 66C212 34 252 12 292 20 256 30 232 52 214 66",
                  "M198 66C210 38 250 18 292 24 257 30 230 46 214 66",
                ] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                filter="url(#glow)"
              />
            </motion.svg>

            {/* Kurumi‑inspired clock motif (abstract) */}
            <motion.div
              className="absolute -right-6 -top-6 size-48 md:size-64 rounded-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2 }}
            >
              <ClockAureole />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contact" className="relative z-10 px-6 md:px-12 mt-14 pb-14">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Work with me</h2>
            <p className="text-sm text-zinc-400 mt-2">
              Need a crimson‑themed, anime‑inspired profile or a full web app? Let’s build it.
            </p>
          </div>
          <form
            className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              alert("Thanks! I’ll reply soon.")
            }}
          >
            <input className="rounded-xl bg-black/50 border border-zinc-800 px-3 py-2 outline-none focus:border-red-500" placeholder="Your email" />
            <textarea className="rounded-xl bg-black/50 border border-zinc-800 px-3 py-2 outline-none focus:border-red-500 min-h-24" placeholder="Project details" />
            <Button type="submit" className="bg-red-600 hover:bg-red-500 rounded-xl">Send</Button>
          </form>
        </div>
      </footer>

      {/* Floating particles */}
      <Particles />
    </main>
  )
}

function LinkCard({ href, label, Icon }: { href: string; label: string; Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-red-500/60 transition-colors">
      <CardContent className="p-3">
        <a href={href} target="_blank" className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <span className="inline-flex size-9 rounded-xl bg-zinc-900 border border-zinc-800 items-center justify-center">
              <Icon className="h-4 w-4" />
            </span>
            <span className="font-medium">{label}</span>
          </span>
          <ArrowRight className="h-4 w-4 text-zinc-400" />
        </a>
      </CardContent>
    </Card>
  )
}

function Particles() {
  // CSS-only dots drifting
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 26 }).map((_, i) => (
        <span
          key={i}
          className="absolute block rounded-full bg-red-500/30 blur-[1px]"
          style={{
            width: Math.random() * 6 + 2 + "px",
            height: Math.random() * 6 + 2 + "px",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            animation: `float${i} ${10 + Math.random() * 12}s linear infinite`,
          }}
        />
      ))}
      <style>{`
        ${Array.from({ length: 26 })
          .map((_, i) => {
            const dx = (Math.random() * 40 - 20).toFixed(1)
            const dy = (Math.random() * -40 - 10).toFixed(1)
            return `@keyframes float${i}{0%{transform:translate(0,0);opacity:.4}50%{transform:translate(${dx}px,${dy}px);opacity:.9}100%{transform:translate(0,0);opacity:.4}}`
          })
          .join("\n")}
      `}</style>
    </div>
  )
}

function ClockAureole() {
  return (
    <div className="relative size-full">
      {/* outer glowing ring */}
      <div className="absolute inset-0 rounded-full border-2 border-red-600/60 shadow-[0_0_60px_10px_rgba(239,68,68,0.25)_inset]" />
      {/* rotating numerals */}
      <motion.div
        className="absolute inset-2 rounded-full border border-red-500/30 grid place-items-center text-[10px] md:text-xs tracking-[0.35em] text-red-300/70"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        <div className="[writing-mode:vertical-rl] rotate-180">
          XII · I · II · III · IV · V · VI · VII · VIII · IX · X · XI ·
        </div>
      </motion.div>
      {/* inner gear */}
      <motion.svg viewBox="0 0 100 100" className="absolute inset-6">
        <g fill="#111">
          <circle cx="50" cy="50" r="40" stroke="#ef4444" strokeOpacity=".5" />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x={48}
              y={6}
              width={4}
              height={12}
              rx={1}
              transform={`rotate(${(i * 360) / 12} 50 50)`}
              fill="#ef4444"
              opacity={0.7}
            />
          ))}
        </g>
        {/* hands */}
        <motion.line x1="50" y1="50" x2="50" y2="20" stroke="#ef4444" strokeWidth="2"
          animate={{ rotate: 360 }}
          transform="rotate(0 50 50)"
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.line x1="50" y1="50" x2="50" y2="14" stroke="#fca5a5" strokeWidth="1.5"
          animate={{ rotate: 360 }}
          transform="rotate(0 50 50)"
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </motion.svg>

      {/* silhouette hint (twin-tail profile) */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 2 }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path d="M90 150c-8-10-14-22-14-36 0-24 18-44 40-44s38 18 38 42c0 16-8 30-18 40 4 8 10 12 16 15-16 2-34-2-44-17-6 6-12 9-18 12z" fill="#ef4444" opacity="0.35" />
          <path d="M62 90c-8-10-10-22-6-34 6 10 14 18 26 22-8 4-14 8-20 12zM164 90c8-10 10-22 6-34-6 10-14 18-26 22 8 4 14 8 20 12z" fill="#b91c1c" opacity="0.35" />
        </svg>
      </motion.div>
    </div>
  )
}
