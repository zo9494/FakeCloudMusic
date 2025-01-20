import { throttle, round } from 'lodash';

interface Options {
  src: string;
  volume: number;
}

enum EVENTS {
  progress = 'progress',
  cacheProgress = 'cacheProgress',
  timeupdate = 'timeupdate',
  ended = 'ended',
  canplay = 'canplay',
  paused = 'paused',
  playing = 'playing',
}
type event = keyof typeof EVENTS;
type cb = (data?: any) => void;
interface mediaDataType {
  title: string;
  artist: string;
  album: string;
  alPicUrl: string;
}
interface ActionType {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
}

export class FCMAudio extends Audio {
  private callbackMaps: Partial<Record<EVENTS, cb>> = {};
  public canPlay = false;
  constructor(options?: Partial<Options>) {
    super(options?.src);
    this.volume = options?.volume || 0.5;
    this.style.display = 'none';
    document.body.appendChild(this);
    this.listener();
  }
  get currentTime() {
    return round(super.currentTime, 3);
  }
  set currentTime(val: number) {
    super.currentTime = val;
  }

  get duration() {
    return round(super.duration, 3);
  }
  private listener() {
    const map: { [propName: string]: any } = {
      progress: () => {
        this.callbackMaps.progress?.(
          (super.buffered.end(0) / super.duration) * 100
        );
      },
      timeupdate: throttle(() => {
        this.callbackMaps.timeupdate?.(round(super.currentTime, 3));
      }, 200),
      ended: () => {
        this.canPlay = false;
        this.callbackMaps.ended?.();
        this.callbackMaps.paused?.(true);
      },
      canplay: () => {
        this.canPlay = true;
        this.callbackMaps.canplay?.();
      },
      paused: () => {
        this.callbackMaps.paused?.(true);
      },
      playing: () => {
        this.callbackMaps.playing?.(false);
      },
    };

    for (const key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        super.addEventListener(key, map[key]);
      }
    }
  }
  on(e: event, cb: cb) {
    this.callbackMaps[e] = cb;
  }

  play() {
    this.callbackMaps.paused?.(false);
    return super.play();
  }
  pause() {
    super.pause();
    this.callbackMaps.paused?.(true);
  }

  setMediaMetadata(params: Partial<mediaDataType>) {
    const { title, alPicUrl: src, album, artist } = params;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork: [
        {
          src: src ? `${src}?param=300y300` : '',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
    });
  }

  setActionHandler(actions: Partial<ActionType>) {
    navigator.mediaSession.setActionHandler(
      'pause',
      actions.pause || this.pause.bind(this)
    );
    navigator.mediaSession.setActionHandler(
      'play',
      actions.play || this.play.bind(this)
    );
    navigator.mediaSession.setActionHandler('nexttrack', actions.next || null);
    navigator.mediaSession.setActionHandler(
      'previoustrack',
      actions.previous || null
    );
  }
}

export const fcmAudio = (() => {
  let instance: FCMAudio;
  return (options?: Partial<Options>) => {
    if (instance) {
      return instance;
    }
    instance = new FCMAudio(options);
    return instance;
  };
})();

// todo 播放模式
enum Mode {
  // 顺序播放
  order = 'order',
  // 循环播放
  loop = 'loop',
  // 随机播放
  shuffle = 'shuffle',
}
type ModeKey = keyof typeof Mode;
class PlayMode {
  private value: keyof typeof Mode;
  constructor(value = Mode.order) {
    this.value = value;
  }
  set mode(value: ModeKey) {
    this.value = value;
  }
  get mode(): ModeKey {
    return this.value;
  }
}
