"use client";
import React from "react";
import Lenis from "lenis";
import ClockSteampunk from "@/components/clock";
import Link from "next/link";
import { motion } from "framer-motion";
import OpeningGate from "@/components/OpeningGate";
import MusicPlayer from "@/components/MusicPlayer";
import { FaSteam, FaSpotify, FaDiscord } from "react-icons/fa6";
import { SiRoblox } from "react-icons/si";

/** Tinggi panel seragam */
const CARD_MIN_H = "min-h-[520px] md:min-h-[560px] lg:min-h-[600px]";

export default function Page() {
  // Steam: auto-fetch display name from profile title (client-side)
  const steamHref = "https://steamcommunity.com/id/forgotmylink/";
  const [steamUsername, setSteamUsername] = React.useState<string | null>(null);

  function extractSteamNameFromTitle(title: string): string | null {
    const t = title.trim();
    const prefix = "Steam Community ::";
    if (t.startsWith(prefix)) {
      return t.substring(prefix.length).trim();
    }
    const suffix = "- Steam Community";
    if (t.endsWith(suffix)) {
      return t.substring(0, t.length - suffix.length).trim();
    }
    return null;
  }

  React.useEffect(() => {
    // Smooth scrolling with Lenis (Kurumi vibe)
    const lenis = new Lenis({
      duration: 1.12,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.1,
      wheelMultiplier: 1,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        // Use a public CORS proxy to fetch cross-origin HTML client-side
        const target = steamHref.replace(/\/$/, "");
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
        const res = await fetch(proxied, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const rawTitle = titleMatch?.[1]?.trim();
        let name = rawTitle ? extractSteamNameFromTitle(rawTitle) ?? rawTitle : null;

        // Fallback: try XML endpoint
        if (!name) {
          const xmlRes = await fetch(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(target + "?xml=1")}`,
            { signal: controller.signal, cache: "no-store" }
          );
          if (xmlRes.ok) {
            const xml = await xmlRes.text();
            const m = xml.match(/<steamID>(?:<!\[CDATA\[)?([^<\]]+)(?:\]\]>)?<\/steamID>/i);
            if (m?.[1]) name = m[1].trim();
          }
        }

        if (name) setSteamUsername(name);
      } catch {
        // ignore; keep fallback username
      }
    })();
    return () => controller.abort();
  }, [steamHref]);

  return (
    <>
      <OpeningGate />
      <main className="min-h-dvh bg-black text-white md:pt-5">
        <section className="w-full px-4 md:px-8 pt-15 ">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-stretch">
            {/* Kolom 1: Jam */}
            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className={`h-full ${CARD_MIN_H} rounded-2xl bg-black/40 ring-1 ring-white/10 shadow-lg shadow-black/50 p-4 overflow-hidden`}>
                <div className="h-full w-full grid place-items-center">
  <div className="w-full md:w-[min(100%,420px)] lg:w-[min(100%,520px)]">
    <ClockSteampunk size="100%" />
  </div>
</div>
              </div>
            </motion.div>

            {/* Kolom 2: Social Links + Music */}
            <motion.div
              className="h-full"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div
                className={`
                  h-full
                  rounded-2xl ring-1 ring-white/10 shadow-lg shadow-black/40
                  bg-[#0b0b0b]/60 backdrop-blur-sm
                  p-6 flex flex-col

                  /* Scrollable on larger screens to keep content visible */
                  md:max-h-[calc(100dvh-6rem)] md:overflow-y-auto md:overscroll-contain

                  /* Keep reasonable height on small screens */
                  min-h-[520px]
                `}
                data-lenis-prevent
              >
                <h2 className="text-lg font-semibold text-white/80 text-center mb-4">
                  Find me on
                </h2>

                <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                  <SocialLink href="https://www.roblox.com/users/231699339/profile" bg="bg-[#E2231A]" text="Roblox" sub="Profile" username="@DragonZai133">
                    <SiRoblox className="w-7 h-7" />
                  </SocialLink>
                  <SocialLink href={steamHref} bg="bg-[#171A21]" text="Steam" sub="Profile" username={steamUsername ?? "your_steam_id"}>
                    <FaSteam className="w-7 h-7" />
                  </SocialLink>
                  <SocialLink href="https://open.spotify.com/user/blos2281hb2cxmlcujf15dlm6" bg="bg-[#1DB954]" text="Spotify" sub="Listen" username="Kazuma">
                    <FaSpotify className="w-7 h-7" />
                  </SocialLink>
                  <SocialLink href="https://discord.com/users/317183945353592833/" bg="bg-[#5865F2]" text="Discord" sub="Contact" username="demokrasi">
                    <FaDiscord className="w-7 h-7" />   {/* <-- ikon dibesarkan */}
                  </SocialLink>
                </div>

                <div className="flex-1" />

                <div className="w-full max-w-sm mx-auto mt-4">
                  <MusicPlayer />
                </div>
              </div>
            </motion.div>

            {/* Kolom 3: Video */}
            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className={`relative h-full ${CARD_MIN_H} rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-black/40`}>
                <video
                  src="/wallpaper/hollow.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}

function SocialLink({ href, bg, text, sub, username, children }: {
  href: string; bg: string; text: string; sub?: string; username?: string; children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group ${bg} w-full rounded-xl px-4 py-3 flex items-center gap-4 shadow-md shadow-black/40 hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all`}
      target="_blank" rel="noopener noreferrer"
    >
      <IconBox>{children}</IconBox>

      <span className="flex flex-col text-left">
        <span className="font-semibold leading-tight">{text}</span>
        {(sub || username) ? (
          <span className="text-xs text-white/70 leading-tight">
            {sub && username ? `${sub}: ${username}` : (sub || username || "")}
          </span>
        ) : null}
      </span>

      <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-white/80">�+-</span>
    </Link>
  );
}
function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 inline-grid place-items-center size-12 rounded-xl bg-black/25 ring-1 ring-white/15 shadow-inner text-white p-2.5">
      {children}
    </span>
  );
}

/* Roblox â€” diamond tanpa rotate; tanpa width/height atribut */
function RobloxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Roblox" fill="currentColor" className="block" {...props}>
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 2 22 12 12 22 2 12 12 2ZM14.2 12 12 9.8 9.8 12 12 14.2 14.2 12Z" />
    </svg>
  );
}

/* Steam â€” simple & rapi; tanpa width/height atribut */
function SteamIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Steam" fill="currentColor" className="block" {...props}>
      <path d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.5 10.5 0 0 0 12 1.5Zm4.5 4.25a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5ZM6.9 14.6l2.8 1.2a2.6 2.6 0 0 0 3.35-1.46l1.22-2.86a4.66 4.66 0 0 0 2.12 1l-1.27 2.96a4.7 4.7 0 0 1-2.89 2.63l-3.12 1.33a4.7 4.7 0 0 1-3.03-2.64l.82-2.16Z" />
    </svg>
  );
}

/* Spotify â€” resmi, tanpa width/height atribut */
function SpotifyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Spotify" fill="currentColor" className="block" {...props}>
      <path d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.51 10.51 0 0 0 12 1.5Zm5.02 13.86c-.2.33-.63.44-.96.25-3.06-1.86-6.73-2.31-10.95-1.3a.75.75 0 0 1-.36-1.46c4.54-1.07 8.58-.58 11.96 1.43.33.2.44.63.25.96Zm1.18-3.33c-.23.37-.72.49-1.09.27-3.47-2.11-8.71-2.66-12.75-1.48a.85.85 0 0 1-.46-1.63c4.28-1.29 9.92-.7 13.77 1.62.37.22.49.71.27 1.09Zm.12-3.42c-.25.4-.79.53-1.2.3-3.86-2.27-10.34-2.63-14.47-1.52a.9.9 0 0 1-.45-1.73c4.49-1.16 11.39-.79 15.66 1.74.4.23.53.78.3 1.2Z" />
    </svg>
  );
}

// (removed unused DiscordIcon)





