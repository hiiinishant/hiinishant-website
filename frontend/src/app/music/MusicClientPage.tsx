"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import PageHeader from "@/components/layout/PageHeader";
import {
  loadYouTubeApi,
  fetchVideoTitle,
  fetchAllVideoTitles,
  cacheVideoTitle,
  getKnownOrCachedTitle,
  videoThumbnailUrl,
  type MusicSettings,
} from "@/lib/youtube";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Tv,
  Music,
  Sparkles,
  ListMusic,
} from "lucide-react";

interface PlaylistTrack {
  videoId: string;
  title: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function MusicClientPage({
  initialSettings,
}: {
  initialSettings: MusicSettings;
}) {
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerId = "youtube-music-player";

  const [settings] = useState<MusicSettings>(initialSettings);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerInitializing, setPlayerInitializing] = useState(false);
  const playerInitializingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTitle, setCurrentTitle] = useState(
    initialSettings.initialTracks?.[0]?.title || ""
  );
  const [tracks, setTracks] = useState<PlaylistTrack[]>(
    initialSettings.initialTracks || []
  );
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Progress & Duration
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Volume & Mute
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  // Modes
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [viewMode, setViewMode] = useState<"visualizer" | "video">("visualizer");

  const tracksLoadedRef = useRef(false);
  const playWhenReadyRef = useRef(false);
  const isLoopRef = useRef(false);

  // Keep isLoopRef in sync with isLoop state
  useEffect(() => { isLoopRef.current = isLoop; }, [isLoop]);

  const syncCurrentTrack = useCallback((player: YT.Player) => {
    try {
      const data = player.getVideoData();
      const index = player.getPlaylistIndex();
      const dur = player.getDuration();
      const cur = player.getCurrentTime();

      const idx = index >= 0 ? index : 0;
      const liveTitle = data.title;
      const isPlaceholder = !liveTitle || liveTitle.startsWith("Song ") || liveTitle.startsWith("Track ") || liveTitle.startsWith("Video ");
      const fallbackTitle = (data.video_id && getKnownOrCachedTitle(data.video_id)) || (tracks[idx]?.title) || `Track ${idx + 1}`;
      const effectiveTitle = !isPlaceholder ? liveTitle : fallbackTitle;

      setCurrentIndex(idx);
      setCurrentTitle(effectiveTitle);
      setPlaying(player.getPlayerState() === YT.PlayerState.PLAYING);
      if (dur > 0) setDuration(dur);
      if (cur >= 0) setCurrentTime(cur);

      // LIVE AUTO-REPLACE: When YouTube player provides the actual song title,
      // update the playlist row and cache it so it never shows "Song X" or "Track X" again!
      if (!isPlaceholder && data.video_id) {
        cacheVideoTitle(data.video_id, liveTitle);
        setTracks((prev) => {
          if (prev[idx] && prev[idx].title !== liveTitle) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], title: liveTitle };
            return updated;
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn("Error syncing track state:", e);
    }
  }, [tracks]);

  const loadTrackTitles = useCallback(async (videoIds: string[]) => {
    // Populate immediately with known/cached titles so tracklist has genuine song names from frame 1
    setTracks(
      videoIds.map((videoId, i) => {
        const known =
          getKnownOrCachedTitle(videoId) ||
          initialSettings.initialTracks?.find((t) => t.videoId === videoId)?.title;
        return {
          videoId,
          title: known || `Track ${i + 1}`,
        };
      })
    );

    // Fetch actual titles in controlled background batches for any uncached tracks
    await fetchAllVideoTitles(videoIds, (index, title) => {
      setTracks((prev) => {
        if (prev[index] && prev[index].title !== title) {
          const updated = [...prev];
          updated[index] = { ...updated[index], title };
          return updated;
        }
        return prev;
      });
    });
  }, [initialSettings.initialTracks]);

  // Poll getPlaylist() until available
  const tryLoadPlaylist = useCallback(
    function tryLoadPlaylist(player: YT.Player, attempts = 0) {
      if (tracksLoadedRef.current) return;
      try {
        const playlist = player.getPlaylist();
        if (playlist && playlist.length > 0) {
          tracksLoadedRef.current = true;
          loadTrackTitles(playlist);
        } else if (attempts < 20) {
          setTimeout(() => tryLoadPlaylist(player, attempts + 1), 400);
        }
      } catch {
        if (attempts < 20) {
          setTimeout(() => tryLoadPlaylist(player, attempts + 1), 400);
        }
      }
    },
    [loadTrackTitles]
  );

  const initPlayer = useCallback(
    async (playlistId: string, playWhenReady = false) => {
      // Use ref for guard so this callback doesn't need playerInitializing in its deps
      if (playerRef.current || playerInitializingRef.current) return;

      playWhenReadyRef.current = playWhenReady;
      playerInitializingRef.current = true;
      setPlayerInitializing(true);
      setError("");

      try {
        await loadYouTubeApi();

        if (typeof window === "undefined" || !window.YT) {
          playerInitializingRef.current = false;
          setPlayerInitializing(false);
          return;
        }

        tracksLoadedRef.current = false;

        playerRef.current = new window.YT.Player(playerContainerId, {
          height: "100%",
          width: "100%",
          playerVars: {
            listType: "playlist",
            list: playlistId,
            autoplay: playWhenReady ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "",
          },
          events: {
            onReady: (event) => {
              playerInitializingRef.current = false;
              setPlayerReady(true);
              setPlayerInitializing(false);
              syncCurrentTrack(event.target);
              tryLoadPlaylist(event.target);
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
                syncCurrentTrack(event.target);
                tryLoadPlaylist(event.target);
              }
              if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
              if (event.data === YT.PlayerState.PAUSED) setPlaying(false);
              if (event.data === (0 as YT.PlayerState)) {
                // Song ended — auto-play next track
                const player = event.target;
                try {
                  const playlist = player.getPlaylist();
                  const currentIdx = player.getPlaylistIndex();
                  const total = playlist ? playlist.length : 0;
                  if (total > 0 && currentIdx < total - 1) {
                    // More songs remain — go next
                    player.nextVideo();
                  } else if (isLoopRef.current && total > 0) {
                    // Last song + loop on — restart from beginning
                    player.playVideoAt(0);
                  } else {
                    // Last song + no loop — stop
                    setPlaying(false);
                  }
                } catch {
                  setPlaying(false);
                }
              }
            },
            onError: (event) => {
              console.error("Player error:", event.data);
              playerInitializingRef.current = false;
              setPlayerInitializing(false);
              setError("Failed to load playlist. The playlist may be private or unavailable.");
            },
          },
        });
      } catch (err) {
        console.error("Error initializing player:", err);
        playerInitializingRef.current = false;
        setPlayerInitializing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncCurrentTrack, tryLoadPlaylist, volume]
  );

  // Initialize once on mount — deliberately omit initPlayer from deps to prevent re-init loops
  useEffect(() => {
    if (settings.playlistId) {
      initPlayer(settings.playlistId, false);
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
  }, [settings.playlistId]);

  // ─── Keyboard volume control ───────────────────────────────────────────────
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
            if (next > 0 && isMuted) { player.unMute(); setIsMuted(false); }
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
          if (prev) { player.unMute(); } else { player.mute(); }
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
  // ──────────────────────────────────────────────────────────────────────────

  // Update current time & duration periodically during playback

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

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) {
      if (settings.playlistId) {
        initPlayer(settings.playlistId, true);
      }
      return;
    }
    try {
      const state = player.getPlayerState();
      // -1 = UNSTARTED, 5 = CUED — both need playVideo()
      if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        setPlaying(false);
      } else {
        // If player is unstarted/cued, load the playlist first then play
        if (state === -1) {
          player.loadPlaylist({ listType: "playlist", list: settings.playlistId });
        }
        player.playVideo();
        setPlaying(true);
      }
    } catch {
      player.playVideo();
      setPlaying(true);
    }
  };

  const playAt = (index: number) => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.playVideoAt(index);
      setCurrentIndex(index);
      setPlaying(true);
    } catch (e) {
      console.warn("Could not play video at index:", index, e);
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

  const toggleShuffle = () => {
    const player = playerRef.current;
    const nextState = !isShuffle;
    setIsShuffle(nextState);
    if (player && typeof player.setShuffle === "function") {
      player.setShuffle(nextState);
    }
  };

  const toggleLoop = () => {
    const player = playerRef.current;
    const nextState = !isLoop;
    setIsLoop(nextState);
    if (player && typeof player.setLoop === "function") {
      player.setLoop(nextState);
    }
  };

  if (!settings.playlistId) {
    return (
      <main className="min-h-screen pb-16">
        <PageHeader
          label="Music Corner"
          title={
            <>
              Curated <span className="text-accent">Playlist</span>
            </>
          }
          description="A hand-picked collection of songs to study, vibe, and unwind to."
        />
        <div className="max-w-xl mx-auto px-5 mt-8">
          <div className="glass-strong border border-white/10 rounded-2xl p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
              🎵
            </div>
            <p className="text-brand-300 text-sm">No playlist has been configured yet. Check back soon!</p>
          </div>
        </div>
      </main>
    );
  }

  const currentTrackThumb =
    tracks[currentIndex]?.videoId
      ? videoThumbnailUrl(tracks[currentIndex].videoId)
      : settings.playlistThumbnail;

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
          <svg className="w-4 h-4 text-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {(volumeToast ?? 0) === 0
              ? <><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
              : <><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
            }
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
        label="Music Corner"
        title={
          <>
            Curated <span className="text-accent">Playlist</span>
          </>
        }
        description="Press play and stay on the page — no YouTube tab hopping required."
      />

      {/* Speed & Readiness Badge */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-2 mb-3 flex items-center justify-between flex-wrap gap-2.5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Nishant&apos;s Favorite Songs</span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
          <button
            onClick={() => setViewMode("visualizer")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === "visualizer"
                ? "bg-accent text-black font-semibold shadow-sm"
                : "text-brand-300 hover:text-white"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Visualizer</span>
          </button>
          <button
            onClick={() => setViewMode("video")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === "video"
                ? "bg-accent text-black font-semibold shadow-sm"
                : "text-brand-300 hover:text-white"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="glass-strong border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          {/* Main Display: Visualizer or Video */}
          <div className="relative bg-zinc-950 aspect-video max-h-[420px] w-full flex items-center justify-center overflow-hidden">
            {/* Hidden YouTube Iframe Player container */}
            <div
              className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                viewMode === "video" ? "opacity-100 z-20 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <div id={playerContainerId} className="w-full h-full" />
            </div>

            {/* Audio Visualizer View */}
            {viewMode === "visualizer" && (
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-zinc-900/90 via-black to-zinc-950/90">
                {/* Ambient Background Glow */}
                {playing && (
                  <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none" />
                )}

                {/* Album Cover / Artwork */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/15 mb-4 shrink-0">
                  <Image
                    src={currentTrackThumb || settings.playlistThumbnail}
                    alt={currentTitle || "Now Playing"}
                    fill
                    sizes="(min-width: 640px) 176px, 144px"
                    className={`object-cover transition-transform duration-700 ${
                      playing ? "scale-105" : "scale-100"
                    }`}
                  />
                </div>

                {/* Animated Equalizer Bars when playing */}
                {playing ? (
                  <div className="flex items-end gap-1.5 h-6 mb-3">
                    <span className="w-1.5 bg-accent rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                    <span className="w-1.5 bg-accent rounded-full animate-[bounce_1s_infinite_300ms] h-3/4" />
                    <span className="w-1.5 bg-accent rounded-full animate-[bounce_1s_infinite_200ms] h-1/2" />
                    <span className="w-1.5 bg-accent rounded-full animate-[bounce_1s_infinite_400ms] h-5/6" />
                    <span className="w-1.5 bg-accent rounded-full animate-[bounce_1s_infinite_150ms] h-2/3" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 h-6 mb-3 opacity-40">
                    <span className="w-1.5 h-2 bg-brand-500 rounded-full" />
                    <span className="w-1.5 h-4 bg-brand-500 rounded-full" />
                    <span className="w-1.5 h-3 bg-brand-500 rounded-full" />
                    <span className="w-1.5 h-5 bg-brand-500 rounded-full" />
                    <span className="w-1.5 h-2 bg-brand-500 rounded-full" />
                  </div>
                )}

                {/* Song Title & Playlist */}
                <h3 className="text-lg sm:text-xl font-bold text-white max-w-lg line-clamp-1 mb-1 px-4">
                  {currentTitle || "Select a track"}
                </h3>
                <p className="text-xs text-brand-400 font-medium max-w-md line-clamp-1">
                  {settings.playlistTitle}
                </p>
              </div>
            )}
          </div>

          {/* Integrated Control Bar */}
          <div className="p-5 sm:p-6 bg-black/40 border-t border-white/5 flex flex-col gap-4">
            {/* Seek Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-brand-400 mb-1.5">
                <span>{formatTime(currentTime)}</span>
                <span className="text-accent font-semibold">
                  {tracks.length > 0 ? `${currentIndex + 1} / ${tracks.length}` : "Now Playing"}
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
                aria-label="Seek track position"
              />
            </div>

            {/* ── Mobile Player Controls (Clean single unified row + compact volume) ── */}
            <div className="flex sm:hidden flex-col gap-3 pt-1">
              {/* Row 1: Shuffle · SkipBack · Play/Pause · SkipForward · Loop */}
              <div className="flex items-center justify-between px-2 max-w-sm mx-auto w-full">
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  disabled={!playerReady}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
                    isShuffle
                      ? "bg-accent/20 border-accent/40 text-accent shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                      : "bg-white/5 border-white/10 text-brand-400 active:text-white"
                  }`}
                  title="Toggle Shuffle"
                  aria-label="Toggle Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                {/* SkipBack */}
                <button
                  onClick={() => {
                    try {
                      playerRef.current?.previousVideo();
                    } catch {}
                  }}
                  disabled={!playerReady}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-300 active:text-white active:bg-white/10 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Play / Pause Hero Button */}
                <button
                  onClick={togglePlay}
                  disabled={playerInitializing}
                  className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent-hover text-black flex items-center justify-center transition-all shadow-[0_0_24px_rgba(245,158,11,0.45)] active:scale-95 disabled:opacity-50 cursor-pointer"
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

                {/* SkipForward */}
                <button
                  onClick={() => {
                    try {
                      playerRef.current?.nextVideo();
                    } catch {}
                  }}
                  disabled={!playerReady}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-300 active:text-white active:bg-white/10 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Next track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Loop */}
                <button
                  onClick={toggleLoop}
                  disabled={!playerReady}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
                    isLoop
                      ? "bg-accent/20 border-accent/40 text-accent shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                      : "bg-white/5 border-white/10 text-brand-400 active:text-white"
                  }`}
                  title="Toggle Loop"
                  aria-label="Toggle Loop"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* Row 2: Compact Centered Volume Slider */}
              <div className="flex items-center justify-center pt-1">
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 shadow-sm">
                  <button
                    onClick={toggleMute}
                    disabled={!playerReady}
                    className="text-brand-300 hover:text-white transition-colors cursor-pointer"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-brand-300" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    disabled={!playerReady}
                    className="w-36 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
                    aria-label="Volume slider"
                  />
                </div>
              </div>
            </div>

            {/* ── Desktop Player Controls (Original 3-Column Layout Untouched) ── */}
            <div className="hidden sm:grid sm:grid-cols-3 items-center gap-4 pt-1">
              {/* Left: Shuffle & Loop Toggles */}
              <div className="flex items-center justify-start gap-2.5">
                <button
                  onClick={toggleShuffle}
                  disabled={!playerReady}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
                    isShuffle
                      ? "bg-accent/20 border-accent/40 text-accent"
                      : "bg-white/5 border-white/10 text-brand-400 hover:text-white"
                  }`}
                  title="Toggle Shuffle"
                  aria-label="Toggle Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleLoop}
                  disabled={!playerReady}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
                    isLoop
                      ? "bg-accent/20 border-accent/40 text-accent"
                      : "bg-white/5 border-white/10 text-brand-400 hover:text-white"
                  }`}
                  title="Toggle Loop"
                  aria-label="Toggle Loop"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* Center: Main Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    try {
                      playerRef.current?.previousVideo();
                    } catch {}
                  }}
                  disabled={!playerReady}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Previous track"
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
                    try {
                      playerRef.current?.nextVideo();
                    } catch {}
                  }}
                  disabled={!playerReady}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 cursor-pointer"
                  aria-label="Next track"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Right: Volume Slider */}
              <div className="flex items-center justify-end">
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

          {/* Playlist Track List */}
          <div className="border-t border-white/5">
            <div className="px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white/[0.02]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-300 flex items-center gap-2 shrink-0">
                <ListMusic className="w-4 h-4 text-accent" />
                <span>Playlist · {tracks.length > 0 ? `${tracks.length} songs` : "Loading tracks..."}</span>
              </h3>
              {tracks.length > 0 && (
                <div className="relative w-full sm:w-auto">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-7 py-2 sm:py-1.5 text-xs bg-white/5 border border-white/10 rounded-xl sm:rounded-lg text-white placeholder:text-brand-500 focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all w-full sm:w-44"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-500 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {tracks.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {tracks.filter(t =>
                  t.title.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <li className="px-6 sm:px-8 py-6 text-center text-brand-500 text-xs">
                    No songs match &ldquo;{searchQuery}&rdquo;
                  </li>
                ) : null}
                {tracks.filter(t =>
                  t.title.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((track) => {
                  const index = tracks.findIndex(t => t.videoId === track.videoId && t.title === track.title);
                  const isActive = index === currentIndex;
                  return (
                    <li key={track.videoId + index}>
                      <button
                        onClick={() => playAt(index)}
                        className={`w-full flex items-center gap-3.5 px-6 sm:px-8 py-3 text-left transition-all cursor-pointer group ${
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
                        <div className="relative w-12 h-9 rounded-md overflow-hidden shrink-0 border border-white/5">
                          <Image
                            src={videoThumbnailUrl(track.videoId)}
                            alt={track.title ? `${track.title} — Nishant Kumar Music` : "Music track thumbnail — Nishant Kumar"}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <span
                          className={`text-sm truncate ${
                            isActive ? "text-white font-semibold" : "text-brand-300 group-hover:text-white"
                          }`}
                        >
                          {track.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="flex items-center gap-1.5 h-6">
                  <span className="w-1.5 h-4 bg-accent/60 rounded-full animate-pulse" />
                  <span className="w-1.5 h-6 bg-accent rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-3 bg-accent/40 rounded-full animate-pulse [animation-delay:300ms]" />
                </div>
                <p className="text-xs font-medium text-brand-300">
                  Tuning into Nishant&apos;s playlist...
                </p>
                <span className="text-[10px] text-brand-500 font-mono">
                  Curating songs for you
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

