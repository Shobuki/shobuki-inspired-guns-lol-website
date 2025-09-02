"use client";
import React from "react";
import ClockSteampunk from "@/components/clock";
import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-dvh bg-black text-white pt-16 md:pt-20">
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Kolom 1: Jam */}
          <div className="flex items-start justify-center md:justify-start">
            <div className="w-64 sm:w-72 md:w-80 lg:w-96">
              <ClockSteampunk size="100%" smoothSeconds={false} />
            </div>
          </div>

          {/* Kolom 2: Roblox, Steam, Spotify, Discord */}
          <div className="flex flex-col gap-4 self-center md:self-start">
            <SocialLink href="#" bg="bg-[#E2231A]" text="Roblox" sub="Profile">
              <RobloxIcon />
            </SocialLink>
            <SocialLink href="#" bg="bg-[#171A21]" text="Steam" sub="Profile">
              <SteamIcon />
            </SocialLink>
            <SocialLink href="#" bg="bg-[#1DB954]" text="Spotify" sub="Listen">
              <SpotifyIcon />
            </SocialLink>
            <SocialLink href="#" bg="bg-[#5865F2]" text="Discord" sub="Contact">
              <DiscordIcon />
            </SocialLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function SocialLink({ href, bg, text, sub, children }: {
  href: string;
  bg: string;
  text: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group ${bg} rounded-xl px-4 py-3 flex items-center gap-4 shadow-md shadow-black/40 hover:brightness-110 transition-transform hover:-translate-y-0.5 active:translate-y-0`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="shrink-0 inline-flex items-center justify-center size-9 rounded-lg bg-black/20 ring-1 ring-white/10">
        {children}
      </span>
      <span className="flex flex-col">
        <span className="font-semibold leading-tight">{text}</span>
        {sub ? <span className="text-xs text-white/70 leading-tight">{sub}</span> : null}
      </span>
      <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-white/80">↗</span>
    </Link>
  );
}

function RobloxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
      <path d="M3.5 3.5 20.5 3.5 20.5 20.5 3.5 20.5 3.5 3.5z M10 10 9 15 14 16 15 11z" />
    </svg>
  );
}

function SteamIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
      <path d="M12 2a10 10 0 1 0 9.95 11.11l-4.44-1.86a3.5 3.5 0 1 1-4.37-4.44L12 2zM7.9 14.8l2.54 1.07a2.6 2.6 0 0 1-4.26-1.07c-.1-.36-.14-.74-.1-1.12l1.82.76zM16.5 6.5a2.75 2.75 0 1 0 0 5.5 2.75 2.75 0 0 0 0-5.5zm0 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z" />
    </svg>
  );
}

function SpotifyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
      <path d="M12 1.8A10.2 10.2 0 1 0 22.2 12 10.2 10.2 0 0 0 12 1.8zm4.64 14.92a.9.9 0 0 1-1.24.3c-3.39-2.07-7.66-2.54-12.7-1.41a.9.9 0 0 1-.37-1.77c5.47-1.26 10.2-.72 14 1.58a.9.9 0 0 1 .31 1.3zm1.7-3.24a1.12 1.12 0 0 1-1.54.37c-3.88-2.37-9.8-3.07-14.37-1.71a1.12 1.12 0 0 1-.64-2.14c5.2-1.57 11.72-.78 16.12 1.93a1.12 1.12 0 0 1 .43 1.55zm.17-3.38c-4.44-2.64-11.86-2.9-16.04-1.76a1.32 1.32 0 1 1-.7-2.54c4.78-1.31 12.97-1 18.18 2.07a1.32 1.32 0 1 1-1.44 2.23z" />
    </svg>
  );
}

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
      <path d="M20.3 4.6A18.7 18.7 0 0 0 15.9 3l-.22.44c1.1.25 2.08.63 2.93 1.1a9 9 0 0 0-8.2 0c.85-.47 1.83-.85 2.93-1.1L13.1 3c-1.63.2-3.23.7-4.4 1.6C6.2 6.4 5 9 5 12c0 0 1.16 2 4 2.4 0 0 .5-.6.9-1.1-1.8-.55-2.5-1.7-2.5-1.7s.14.1.4.25c.03.02.05.03.08.04.02.02.05.03.08.04.8.45 1.6.75 2.3.9.6.1 1.2.2 1.9.2s1.3-.1 1.9-.2c.7-.15 1.5-.45 2.3-.9l.16-.09.24-.14s-.7 1.15-2.5 1.7c.4.5.9 1.1.9 1.1 2.84-.4 4-2.4 4-2.4 0-3-1.2-5.6-3.7-7.4zM9.75 13.8c-.55 0-1-.53-1-1.18s.45-1.18 1-1.18 1 .53 1 1.18-.45 1.18-1 1.18zm4.5 0c-.55 0-1-.53-1-1.18s.45-1.18 1-1.18 1 .53 1 1.18-.45 1.18-1 1.18z" />
    </svg>
  );
}
