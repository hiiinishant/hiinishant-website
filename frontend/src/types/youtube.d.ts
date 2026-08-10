declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onError?: (event: OnErrorEvent) => void;
    };
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent extends PlayerEvent {
    data: PlayerState;
  }

  interface OnErrorEvent extends PlayerEvent {
    data: number;
  }

  interface VideoData {
    video_id: string;
    title: string;
    author: string;
  }

  interface Player {
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    nextVideo(): void;
    previousVideo(): void;
    playVideoAt(index: number): void;
    getPlayerState(): PlayerState;
    getPlaylist(): string[] | null;
    getPlaylistIndex(): number;
    getVideoData(): VideoData;
    getCurrentTime(): number;
    getDuration(): number;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    setVolume(volume: number): void;
    getVolume(): number;
    isMuted(): boolean;
    mute(): void;
    unMute(): void;
    setShuffle(shufflePlaylist: boolean): void;
    setLoop(loopPlaylists: boolean): void;
    loadPlaylist(options: { listType: string; list: string; index?: number; startSeconds?: number }): void;
    destroy(): void;
  }

  var Player: {
    new (elementId: string | HTMLElement, options: PlayerOptions): Player;
  };
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
