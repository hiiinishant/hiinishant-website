"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { apiUrl } from "@/lib/api";
import { defaultMusicPlaylist } from "@/data/music";
import { loadYouTubeApi, fetchVideoTitle, videoThumbnailUrl, type MusicSettings } from "@/lib/youtube";

interface PlaylistTrack {
  videoId: string;
  title: string;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function SkipIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      {direction === "prev" ? (
        <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
      ) : (
        <path d="M16 18h2V6h-2v12zm-11-6l8.5-6v12L5 12z" />
      )}
    </svg>
  );
}

export default function MusicClientPage() {
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerId = "youtube-music-player";

  const [settings, setSettings] = useState<MusicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTitle, setCurrentTitle] = useState("");
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [error, setError] = useState("");

  const syncCurrentTrack = useCallback((player: YT.Player) => {
    const data = player.getVideoData();
    const index = player.getPlaylistIndex();
    setCurrentIndex(index >= 0 ? index : 0);
    setCurrentTitle(data.title || "Now playing");
    setPlaying(player.getPlayerState() === YT.PlayerState.PLAYING);
  }, []);

  const loadTrackTitles = useCallback(async (videoIds: string[]) => {
    const titles = await Promise.all(videoIds.map((id) => fetchVideoTitle(id)));
    setTracks(videoIds.map((videoId, i) => ({ videoId, title: titles[i] })));
  }, []);

  const initPlayer = useCallback(
    async (playlistId: string) => {
      await loadYouTubeApi();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new YT.Player(playerContainerId, {
        height: "100%",
        width: "100%",
        playerVars: {
          listType: "playlist",
          list: playlistId,
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            setPlayerReady(true);
            const playlist = event.target.getPlaylist();
            if (playlist && playlist.length > 0) {
              loadTrackTitles(playlist);
            }
            syncCurrentTrack(event.target);
          },
          onStateChange: (event) => {
            if (
              event.data === YT.PlayerState.PLAYING ||
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.CUED
            ) {
              syncCurrentTrack(event.target);
            }
            if (event.data === YT.PlayerState.ENDED) {
              setPlaying(false);
            }
          },
        },
      });
    },
    [loadTrackTitles, syncCurrentTrack]
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(apiUrl("/api/music"));
        let data: MusicSettings;
        if (!res.ok) {
          data = defaultMusicPlaylist;
        } else {
          data = await res.json();
          if (!data.playlistId) data = defaultMusicPlaylist;
        }
        setSettings(data);
        if (!data.playlistId) {
          setLoading(false);
          return;
        }
        await initPlayer(data.playlistId);
      } catch {
        setError("Could not load the music playlist. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [initPlayer]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
      setPlaying(false);
    } else {
      player.playVideo();
      setPlaying(true);
    }
  };

  const playAt = (index: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.playVideoAt(index);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-24 pb-20">
        <PageHeader label="Music Corner" title="Curated Playlist" description="Loading your music…" />
        <div className="max-w-4xl mx-auto px-5 text-center text-brand-400 text-sm animate-pulse">
          Tuning the player…
        </div>
      </main>
    );
  }

  if (!settings?.playlistId) {
    return (
      <main className="min-h-screen pt-24 pb-20">
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

  return (
    <main className="min-h-screen pt-24 pb-20">
      <PageHeader
        label="Music Corner"
        title={
          <>
            Curated <span className="text-accent">Playlist</span>
          </>
        }
        description="Press play and stay on the page — no YouTube tab hopping required."
      />

      {error && (
        <div className="max-w-4xl mx-auto px-5 mb-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="glass-strong border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          {/* Player + now playing */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Video embed */}
            <div className="lg:col-span-3 relative bg-black aspect-video lg:aspect-auto lg:min-h-[320px]">
              <div id={playerContainerId} className="absolute inset-0 w-full h-full" />
              {!playerReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-brand-400 text-sm">
                  Loading player…
                </div>
              )}
            </div>

            {/* Sidebar: thumbnail, title, controls */}
            <div className="lg:col-span-2 p-6 sm:p-8 flex flex-col gap-5 border-t lg:border-t-0 lg:border-l border-white/5">
              <div className="flex gap-4 items-start">
                {settings.playlistThumbnail && (
                  <img
                    src={settings.playlistThumbnail}
                    alt={settings.playlistTitle}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10 shadow-lg"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">
                    Now Playing
                  </p>
                  <h2 className="text-base font-bold text-white leading-snug line-clamp-2">
                    {currentTitle || "Select a track"}
                  </h2>
                  <p className="text-xs text-brand-400 mt-1 line-clamp-2">{settings.playlistTitle}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 mt-auto">
                <button
                  onClick={() => playerRef.current?.previousVideo()}
                  disabled={!playerReady}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Previous track"
                >
                  <SkipIcon direction="prev" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={!playerReady}
                  className="w-14 h-14 rounded-2xl bg-accent hover:bg-accent-hover text-black flex items-center justify-center transition-all hover:shadow-[0_0_24px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7 ml-0.5" />}
                </button>

                <button
                  onClick={() => playerRef.current?.nextVideo()}
                  disabled={!playerReady}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Next track"
                >
                  <SkipIcon direction="next" />
                </button>
              </div>

              {tracks.length > 0 && (
                <p className="text-center text-[10px] text-brand-500 font-mono">
                  Track {currentIndex + 1} of {tracks.length}
                </p>
              )}
            </div>
          </div>

          {/* Playlist track list */}
          {tracks.length > 0 && (
            <div className="border-t border-white/5">
              <div className="px-6 sm:px-8 py-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-300">
                  Playlist · {tracks.length} songs
                </h3>
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {tracks.map((track, index) => {
                  const isActive = index === currentIndex;
                  return (
                    <li key={track.videoId}>
                      <button
                        onClick={() => playAt(index)}
                        className={`w-full flex items-center gap-3 px-6 sm:px-8 py-3 text-left transition-all cursor-pointer group ${
                          isActive
                            ? "bg-accent/10 border-l-2 border-accent"
                            : "hover:bg-white/3 border-l-2 border-transparent"
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
                        <img
                          src={videoThumbnailUrl(track.videoId)}
                          alt=""
                          className="w-12 h-9 rounded-md object-cover shrink-0 border border-white/5"
                        />
                        <span
                          className={`text-sm truncate ${
                            isActive ? "text-white font-medium" : "text-brand-300 group-hover:text-white"
                          }`}
                        >
                          {track.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
