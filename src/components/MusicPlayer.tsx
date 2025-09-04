"use client";

import React, { useEffect, useRef, useState } from "react";
import YouTube, { YouTubeProps } from "./YouTubeClient";
import {
  FaPlay, FaPause, FaForward, FaBackward,
  FaRandom, FaRedo,
  FaVolumeUp, FaVolumeMute, FaVolumeDown,
  FaMusic, FaChevronDown, FaChevronUp
} from "react-icons/fa";

/** ================== Types & Data ================== */
type Song = {
  title: string;
  artist?: string;
  youtubeId: string;
  /** optional: [start, end] (detik) yang akan dilewati */
  skipSegments?: Array<[number, number]>;
};

const playlist: Song[] = [
  { title: "Trust in you", artist: "sweet ARMS", youtubeId: "s2H9q3veCUM" },
  { title: "Ai no Scenario", artist: "Chico with HoneyWorks", youtubeId: "P_At3pIE5BU" },
  { title: "Romeo", artist: "HoneyWorks", youtubeId: "00DPgfp7j3Y" },
  { title: "Monster", artist: "YOASOBI", youtubeId: "Ap9SbbGkncg" },
  { title: "5 Years Time", artist: "Noah and The Whale", youtubeId: "Ap9SbbGkncg" },
];

/** Helpers */
const fmt = (sec: number) => {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

/** ================== Component ================== */
type MusicPlayerProps = {
    inline?: boolean;
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({ inline = false }) => {
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [showList, setShowList] = useState(false);

  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(40);
  // responsive max height for playlist
  const [listMax, setListMax] = useState<number>(280);

  type YTPlayer = Parameters<NonNullable<YouTubeProps["onReady"]>>[0]["target"];
  const playerRef = useRef<YTPlayer | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const cur = playlist[idx];

  /** ====== Progress updater + skipSegments ====== */
  useEffect(() => {
    if (ticker.current) clearInterval(ticker.current);
    if (!playerRef.current) return;

    ticker.current = setInterval(async () => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const t = await p.getCurrentTime();
      const d = (await p.getDuration()) || 0;
      setTime(t);
      setDuration(d);
      setProgress(d ? (t / d) * 100 : 0);

      const segs = cur.skipSegments || [];
      for (const [s, e] of segs) {
        if (t >= s && t < e) {
          p.seekTo(e, true);
          break;
        }
      }
    }, 500);

    return () => { if (ticker.current) clearInterval(ticker.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, isPlaying]);

  /** ====== Responsive list max height ====== */
  useEffect(() => {
    const calc = () => {
      if (typeof window === "undefined") return;
      const h = window.innerHeight || 800;
      // clamp between 180 and 360, proportional to viewport height
      const target = Math.min(360, Math.max(180, Math.floor(h * 0.35)));
      setListMax(target);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  /** ====== YouTube events ====== */
  const onReady: NonNullable<YouTubeProps["onReady"]> = (e) => {
    playerRef.current = e.target;
    e.target.setVolume(volume);
    setTimeout(() => {
      // Autoplay sering diblokir; kalau boleh akan jalan.
      try { e.target.playVideo(); } catch {}
    }, 100);
  };

  const onState: NonNullable<YouTubeProps["onStateChange"]> = (e) => {
    // 1 = playing, 2 = paused, 0 = ended
    if (e.data === 1) setIsPlaying(true);
    if (e.data === 2) setIsPlaying(false);
    if (e.data === 0) {
      if (repeat && playerRef.current?.seekTo) {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
        setIsPlaying(true);
      } else {
        next();
      }
    }
  };

  /** ====== Controls ====== */
  const playPause = () => {
    const p = playerRef.current;
    if (!p) return;
    (isPlaying ? p.pauseVideo() : p.playVideo());
  };
  const seek = (v: number) => {
    const p = playerRef.current;
    if (!p || !duration) return;
    const to = (v / 100) * duration;
    p.seekTo(to, true);
    setProgress(v);
    setTime(to);
  };
  const prev = () => {
    setIdx((i) => (i - 1 + playlist.length) % playlist.length);
    setTimeout(() => playerRef.current?.playVideo(), 150);
  };
  const next = () => {
    setIdx((i) =>
      shuffle ? Math.floor(Math.random() * playlist.length) : (i + 1) % playlist.length
    );
    setTimeout(() => playerRef.current?.playVideo(), 150);
  };
  const pick = (i: number) => {
    setIdx(i);
    setTimeout(() => {
      const p = playerRef.current;
      if (!p?.playVideo) return;
      p.playVideo();
      p.setVolume(volume);
      setIsPlaying(true);
    }, 150);
  };

  const setVol = (v: number) => {
    setVolume(v);
    playerRef.current?.setVolume?.(v);
  };

  let VolIcon = <FaVolumeUp />;
  if (volume === 0) VolIcon = <FaVolumeMute />;
  else if (volume <= 40) VolIcon = <FaVolumeDown />;

  /** ================== UI ================== */
  const gold = "#CFA033";
  const red = "#e71d36";

  return (
    <div
      className="
        relative z-10
        w-full max-w-sm mx-auto
        rounded-2xl overflow-hidden
        ring-1 ring-[rgba(207,160,51,0.18)]
        shadow-[0_10px_40px_rgba(0,0,0,.55)]
        bg-[radial-gradient(120%_100%_at_50%_0%,rgba(231,29,54,.18),transparent_40%),_linear-gradient(180deg,#0b0b0d,#120e10)]
      "
    >
      {/* Header mini-clock + title */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        {/* dekor ring kecil ala jam (dipusatkan) */}
        <div className="relative shrink-0 size-9">
          <div className="absolute inset-0 rounded-full border border-[rgba(207,160,51,0.35)] bg-black/40" />
          {Array.from({ length: 12 }).map((_, i) => {
            const SIZE = 36; // px (sesuai size-9)
            const C = SIZE / 2; // center
            const R = C - 5; // radius di dalam border
            const a = (i / 12) * Math.PI * 2;
            const x = C + Math.cos(a) * R;
            const y = C + Math.sin(a) * R;
            return (
              <span
                key={i}
                className="absolute block"
                style={{
                  left: x,
                  top: y,
                  width: 2,
                  height: 2,
                  background: gold,
                  borderRadius: 2,
                  transform: "translate(-50%,-50%)",
                  opacity: 0.9,
                }}
              />
            );
          })}
          <span className="absolute inset-0 rounded-full shadow-[0_0_10px_rgba(207,160,51,.35)_inset]" />
        </div>

        <div className="min-w-0">
          <div className="text-[13px] tracking-wide uppercase text-[rgba(255,255,255,0.72)] flex items-center gap-2">
            <FaMusic className="text-[rgba(231,29,54,0.85)]" />
            DJ YOOO
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {cur.title}
          </div>
          {cur.artist ? (
            <div className="text-[12px] text-white/60 truncate">{cur.artist}</div>
          ) : null}
        </div>
      </div>

      {/* Hidden YT iframe */}
      <YouTube
        videoId={cur.youtubeId}
        onReady={onReady}
        onStateChange={onState}
        opts={{
          height: "0",
          width: "0",
          playerVars: {
            autoplay: 1,
            controls: 0,
            fs: 0,
            rel: 0,
            modestbranding: 1,
          },
        }}
      />

      {/* Progress */}
      <div className="px-4">
        <div className="flex items-center gap-2 text-[12px] text-white/70 mb-1">
          <span className="font-mono">{fmt(time)}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="flex-1 accent-[--accent] cursor-pointer"
            style={{
              // garis gradient merah→emas
              background: `linear-gradient(90deg, ${red} 0%, ${gold} 100%)`,
              height: 4,
              borderRadius: 8,
              outline: "none",
            }}
          />
          <span className="font-mono">{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setShuffle((s) => !s)}
            title="Shuffle"
            className={`rounded-full p-2 transition ${
              shuffle ? "bg-[#1b1114] ring-1 ring-[rgba(231,29,54,.6)]" : "hover:bg-white/10"
            }`}
          >
            <FaRandom className={shuffle ? "text-white" : "text-white/80"} />
          </button>

          <button onClick={prev} title="Previous" className="rounded-full p-2 hover:bg-white/10">
            <FaBackward />
          </button>

          <button
            onClick={playPause}
            className="p-3 rounded-full border-2"
            title="Play/Pause"
            style={{
              borderColor: "rgba(207,160,51,.6)",
              background:
                "radial-gradient(circle at 30% 30%, rgba(231,29,54,.9), rgba(231,29,54,.75))",
              boxShadow:
                "0 6px 24px rgba(231,29,54,.35), inset 0 0 18px rgba(207,160,51,.25)",
              color: "#fff",
            }}
          >
            {isPlaying ? (
              <FaPause style={{ fontSize: 22 }} />
            ) : (
              <FaPlay style={{ fontSize: 22, marginLeft: 2 }} />
            )}
          </button>

          <button onClick={next} title="Next" className="rounded-full p-2 hover:bg-white/10">
            <FaForward />
          </button>

          <button
            onClick={() => setRepeat((r) => !r)}
            title="Repeat"
            className={`rounded-full p-2 transition ${
              repeat ? "bg-[#171008] ring-1 ring-[rgba(207,160,51,.6)]" : "hover:bg-white/10"
            }`}
          >
            <FaRedo className={repeat ? "text-white" : "text-white/80"} />
          </button>
        </div>

        {/* Volume */}
        <div className="mt-3 flex items-center gap-2 text-white/80">
          {VolIcon}
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVol(parseInt(e.target.value))}
            className="flex-1 accent-[--accent] cursor-pointer"
            style={{
              background: `linear-gradient(90deg, #fff 0%, ${red} 80%)`,
              height: 6,
              borderRadius: 8,
              outline: "none",
            }}
          />
          <span className="font-mono text-xs w-10 text-right">{volume}%</span>
        </div>
      </div>

      {/* Toggle playlist */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setShowList((v) => !v)}
          className="
            w-full flex items-center justify-center gap-2
            text-xs font-bold tracking-wide
            rounded-xl px-3 py-2 transition
            bg-gradient-to-r from-[#1b1114] to-[#0f0c0d]
            ring-1 ring-[rgba(207,160,51,.25)]
            hover:ring-[rgba(207,160,51,.5)]
            text-[rgba(255,255,255,.9)]
          "
        >
          <FaMusic className="text-[rgba(231,29,54,.9)]" />
          {showList ? "Close Playlist" : "Show Playlist"}
          <span
            className="ml-2 px-2 py-[2px] rounded-full text-[10px] font-mono"
            style={{ background: "rgba(207,160,51,.25)", color: gold }}
          >
            {playlist.length}
          </span>
          {showList ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

      {/* Playlist (collapsible) */}
      <div
        className="transition-all duration-300"
        style={{
          maxHeight: showList ? listMax : 0,
          overflowY: showList ? "auto" as const : "hidden" as const,
          overflowX: "hidden",
          WebkitOverflowScrolling: showList ? ("touch" as const) : ("auto" as const),
        }}
        data-lenis-prevent
      >
        <ul className="px-3 pr-2 pb-4 space-y-1 pointer-events-auto">
          {playlist.map((s, i) => (
            <li
              key={i}
              onClick={() => pick(i)}
              className={`
                cursor-pointer rounded-xl px-3 py-2 transition flex items-center gap-2
                ${
                  i === idx
                    ? "bg-gradient-to-r from-[rgba(231,29,54,.8)] to-[rgba(207,160,51,.85)] text-black font-semibold shadow"
                    : "hover:bg-white/10 text-white/85"
                }
              `}
            >
              <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: red }} aria-hidden />
              <span className="truncate">{s.title}</span>
              {s.artist ? (
                <span className="ml-auto text-[11px] italic text-white/70">{s.artist}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MusicPlayer;
