"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/components/layout/PageHeader";
import { loadYouTubeApi, fetchVideoTitle, videoThumbnailUrl } from "@/lib/youtube";
import { type VlogSettings, type VlogVideo, NISHANT_ACTUAL_VLOGS } from "@/data/vlogs";
import { apiUrl } from "@/lib/api";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Video,
  ListVideo,
  ExternalLink,
} from "lucide-react";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function sanitizeVlogVideos(list?: VlogVideo[]): VlogVideo[] {
  if (!list || list.length === 0) return NISHANT_ACTUAL_VLOGS;
  const hasDummy = list.some(
    (v) => v.videoId === "dQw4w9WgXcQ" || v.title?.includes("My College Life Vlog — Day 1")
  );
  if (hasDummy) return NISHANT_ACTUAL_VLOGS;
  return list;
}

export default function VlogClientPage({
  initialSettings,
}: {
  initialSettings: VlogSettings;
}) {
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerId = "youtube-vlog-player";

  const [settings] = useState<VlogSettings>(initialSettings);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerInitializing, setPlayerInitializing] = useState(false);
  const playerInitializingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTitle, setCurrentTitle] = useState("");
  const [videos, setVideos] = useState<VlogVideo[]>(() =>
    sanitizeVlogVideos(initialSettings.initialVideos)
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Progress & Duration
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Volume & Mute
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const tracksLoadedRef = useRef(false);
  const playWhenReadyRef = useRef(false);

  const syncCurrentVideo = useCallback((player: YT.Player) => {
    try {
      const data = player.getVideoData();
      const dur = player.getDuration();
      const cur = player.getCurrentTime();

      if (data.title) setCurrentTitle(data.title);
      setPlaying(player.getPlayerState() === YT.PlayerState.PLAYING);
      if (dur > 0) setDuration(dur);
      if (cur >= 0) setCurrentTime(cur);
    } catch (e) {
      console.warn("Error syncing video state:", e);
    }
  }, []);

  const initPlayer = useCallback(
    async (videoId: string, playWhenReady = false) => {
      if (playerRef.current || playerInitializingRef.current) return;

      playWhenReadyRef.current = playWhenReady;
      playerInitializingRef.current = true;
      setPlayerInitializing(true);

      try {
        await loadYouTubeApi();

        if (typeof window === "undefined" || !window.YT) {
          playerInitializingRef.current = false;
          setPlayerInitializing(false);
          return;
        }

        const playerVars: Record<string, string | number> = {
          autoplay: playWhenReady ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        };

        if (settings.playlistId) {
          playerVars.listType = "playlist";
          playerVars.list = settings.playlistId;
        }

        playerRef.current = new window.YT.Player(playerContainerId, {
          height: "100%",
          width: "100%",
          videoId: videoId,
          playerVars,
          events: {
            onReady: (event) => {
              playerInitializingRef.current = false;
              setPlayerReady(true);
              setPlayerInitializing(false);
              syncCurrentVideo(event.target);
              event.target.setVolume(volume);
              if (playWhenReadyRef.current) {
                event.target.playVideo();
                setPlaying(true);
                playWhenReadyRef.current = false;
              }
            },
            onStateChange: (event) => {
              if (
                event.data === YT.PlayerState.PLAYING ||
                event.data === YT.PlayerState.PAUSED ||
                event.data === YT.PlayerState.CUED
              ) {
                syncCurrentVideo(event.target);
              }
              if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
              if (event.data === YT.PlayerState.PAUSED) setPlaying(false);
              if (event.data === (0 as YT.PlayerState)) {
                // Video ended — play next
                setPlaying(false);
                setCurrentIndex((prevIdx) => {
                  const nextIdx = prevIdx + 1;
                  if (nextIdx < videos.length) {
                    playAt(nextIdx);
                    return nextIdx;
                  }
                  return prevIdx;
                });
              }
            },
          },
        });
      } catch (err) {
        console.error("Error initializing vlog player:", err);
        playerInitializingRef.current = false;
        setPlayerInitializing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncCurrentVideo, volume, videos.length]
  );

  // Initialize on mount and sync fresh video settings
  useEffect(() => {
    async function loadFreshSettings() {
      try {
        const res = await fetch(apiUrl("/api/vlogs"));
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const data = await res.json();
            if (data.initialVideos && Array.isArray(data.initialVideos)) {
              setVideos(sanitizeVlogVideos(data.initialVideos));
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch fresh vlog settings, using sanitized list:", err);
      }
    }
    loadFreshSettings();

    if (videos.length > 0) {
      initPlayer(videos[0].videoId, false);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
        playerInitializingRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync keyboard volume toast & shortcuts
  const [volumeToast, setVolumeToast] = useState<number | null>(null);
  const volumeToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const STEP = 5;

    const showToast = (vol: number) => {
      setVolumeToast(vol);
      if (volumeToastTimer.current) clearTimeout(volumeToastTimer.current);
      volumeToastTimer.current = setTimeout(() => setVolumeToast(null), 1500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setVolume((prev) => {
          const next = Math.min(100, prev + STEP);
          const player = playerRef.current;
          if (player) {
            player.setVolume(next);
            if (next > 0 && isMuted) {
              player.unMute();
              setIsMuted(false);
            }
          }
          showToast(next);
          return next;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setVolume((prev) => {
          const next = Math.max(0, prev - STEP);
          const player = playerRef.current;
          if (player) player.setVolume(next);
          showToast(next);
          return next;
        });
      } else if (e.key === "m" || e.key === "M") {
        const player = playerRef.current;
        if (!player || !playerReady) return;
        setIsMuted((prev) => {
          if (prev) {
            player.unMute();
          } else {
            player.mute();
          }
          return !prev;
        });
      } else if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (volumeToastTimer.current) clearTimeout(volumeToastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady, isMuted]);

  // Update current time & duration periodically
  useEffect(() => {
    if (!playing || !playerReady) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player && typeof player.getCurrentTime === "function") {
        try {
          const cur = player.getCurrentTime();
          const dur = player.getDuration();
          if (cur >= 0) setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
        } catch {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [playing, playerReady]);

  const playAt = (index: number) => {
    setCurrentIndex(index);
    const video = videos[index];
    if (!video) return;

    setCurrentTitle(video.title);

    const player = playerRef.current as any;
    if (player && typeof player.loadVideoById === "function") {
      try {
        player.loadVideoById(video.videoId);
        setPlaying(true);
      } catch (e) {
        console.warn("Could not load video by id:", e);
      }
    } else {
      initPlayer(video.videoId, true);
    }
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) {
      if (videos.length > 0) {
        initPlayer(videos[currentIndex].videoId, true);
      }
      return;
    }
    try {
      const state = player.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        setPlaying(false);
      } else {
        player.playVideo();
        setPlaying(true);
      }
    } catch {
      player.playVideo();
      setPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    const player = playerRef.current;
    if (player && typeof player.seekTo === "function") {
      player.seekTo(newTime, true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    const player = playerRef.current;
    if (player && typeof player.setVolume === "function") {
      player.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        player.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const currentVideo = videos[currentIndex] || videos[0];
  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen pb-16">
      {/* Keyboard Volume Toast */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          volumeToast !== null
            ? "opacity-100 translate-y-0 pointer-events-none"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-3 shadow-2xl min-w-[200px]">
          <svg
            className="w-4 h-4 text-accent shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {(volumeToast ?? 0) === 0 ? (
              <>
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            ) : (
              <>
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            )}
          </svg>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-brand-300 font-medium">Volume</span>
              <span className="text-xs font-bold text-white">{volumeToast ?? 0}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-150"
                style={{ width: `${volumeToast ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <PageHeader
        label="Vlog Corner"
        title={
          <>
            Nishant&apos;s <span className="text-accent">Vlogs & Stories</span>
          </>
        }
        description="Press play and watch inline — no YouTube tab hopping required."
      />

      {/* Speed & Readiness Badge */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-2 mb-3 flex items-center justify-between flex-wrap gap-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Nishant&apos;s Official Vlogs</span>
        </div>

        <div className="flex items-center gap-2">
          {settings.playlistUrl && (
            <a
              href={settings.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-xs font-medium text-accent hover:bg-accent/20 transition-all"
            >
              <span>{settings.playlistTitle || "Vlog Playlist"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <a
            href={`https://youtube.com/${settings.channelHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-brand-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <span>Subscribe on YouTube</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="glass-strong border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          {/* Main Video Display Container */}
          <div className="relative bg-zinc-950 aspect-video max-h-[460px] w-full flex items-center justify-center overflow-hidden">
            <div id={playerContainerId} className="w-full h-full" />
          </div>

          {/* Integrated Control Bar */}
          <div className="p-5 sm:p-6 bg-black/40 border-t border-white/5 flex flex-col gap-4">
            {/* Seek Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-brand-400 mb-1.5">
                <span>{formatTime(currentTime)}</span>
                <span className="text-accent font-semibold">
                  {videos.length > 0 ? `${currentIndex + 1} / ${videos.length}` : "Playing Video"}
                </span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled={!playerReady}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
                aria-label="Seek video position"
              />
            </div>

            {/* Control Buttons & Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 pt-1">
              {/* Left Info / Title */}
              <div className="hidden sm:block truncate">
                <h4 className="text-xs font-bold text-white truncate">
                  {currentTitle || currentVideo?.title}
                </h4>
                <p className="text-[11px] text-brand-400 truncate">
                  {currentVideo?.description || settings.channelName}
                </p>
              </div>

              {/* Center: Main Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    if (currentIndex > 0) playAt(currentIndex - 1);
                  }}
                  disabled={!playerReady || currentIndex === 0}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Previous vlog"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={playerInitializing}
                  className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent-hover text-black flex items-center justify-center transition-all hover:shadow-[0_0_24px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playerInitializing ? (
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : playing ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => {
                    if (currentIndex < videos.length - 1) playAt(currentIndex + 1);
                  }}
                  disabled={!playerReady || currentIndex === videos.length - 1}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Next vlog"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Right: Volume Slider */}
              <div className="flex items-center justify-center sm:justify-end">
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <button
                    onClick={toggleMute}
                    disabled={!playerReady}
                    className="text-brand-300 hover:text-white transition-colors cursor-pointer"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    disabled={!playerReady}
                    className="w-20 sm:w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
                    aria-label="Volume slider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vlog Video List */}
          <div className="border-t border-white/5">
            <div className="px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white/[0.02]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-300 flex items-center gap-2 shrink-0">
                <ListVideo className="w-4 h-4 text-accent" />
                <span>Vlog Collection · {videos.length} videos</span>
              </h3>
              <div className="relative w-full sm:w-auto">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-500 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search vlogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-8 py-2 text-sm sm:text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-brand-500 focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-500 hover:text-white transition-colors p-0.5"
                    aria-label="Clear search"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <ul className="max-h-72 sm:max-h-96 overflow-y-auto divide-y divide-white/5">
              {filteredVideos.length === 0 ? (
                <li className="px-6 sm:px-8 py-6 text-center text-brand-500 text-xs">
                  No vlogs match &ldquo;{searchQuery}&rdquo;
                </li>
              ) : null}
              {filteredVideos.map((vlog) => {
                const index = videos.findIndex((v) => v.videoId === vlog.videoId && v.title === vlog.title);
                const isActive = index === currentIndex;
                return (
                  <li key={vlog.videoId + index}>
                    <button
                      onClick={() => playAt(index)}
                      className={`w-full flex items-center gap-3 px-3 sm:px-8 py-3 text-left transition-all cursor-pointer group ${
                        isActive
                          ? "bg-accent/10 border-l-2 border-accent"
                          : "hover:bg-white/[0.03] border-l-2 border-transparent"
                      }`}
                    >
                      <span
                        className={`w-6 text-center text-xs font-mono shrink-0 ${
                          isActive ? "text-accent font-bold" : "text-brand-500"
                        }`}
                      >
                        {isActive && playing ? (
                          <span className="inline-flex gap-0.5 items-end h-3">
                            <span className="w-0.5 h-2 bg-accent animate-pulse" />
                            <span className="w-0.5 h-3 bg-accent animate-pulse [animation-delay:150ms]" />
                            <span className="w-0.5 h-1.5 bg-accent animate-pulse [animation-delay:300ms]" />
                          </span>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="relative w-16 h-10 rounded-md overflow-hidden shrink-0 border border-white/5">
                        <Image
                          src={videoThumbnailUrl(vlog.videoId)}
                          alt={vlog.title}
                          fill
                          sizes="64px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isActive ? "text-accent" : "text-white group-hover:text-accent-light"
                          }`}
                        >
                          {vlog.title}
                        </p>
                        {vlog.description && (
                          <p className="text-xs text-brand-400 truncate">{vlog.description}</p>
                        )}
                        <Link
                          href={`/vlogs/${vlog.videoId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-brand-500 hover:text-accent transition-colors mt-0.5 inline-block"
                        >
                          View page ↗
                        </Link>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
