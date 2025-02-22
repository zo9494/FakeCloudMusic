import { throttle, round, ceil } from 'lodash';
import { parseBuffer } from 'music-metadata';
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

export class FCMAudio {
  private callbackMaps: Partial<Record<EVENTS, cb>> = {};
  public canPlay = false;
  private mediaSource?: MediaSource;
  private _src: string;
  private audio = new Audio();
  private _duration: number = 0;
  constructor(options?: Partial<Options>) {
    this._src = options?.src || '';
    this.loadAudio();
    this.audio.volume = options?.volume || 0.5;
    this.listener();
  }

  public get volume() {
    return this.audio.volume;
  }

  public set volume(v: number) {
    this.audio.volume = v;
  }

  public get src(): string {
    return this._src;
  }
  public set src(value: string) {
    if (this._src !== value) {
      this._src = value;
      this.audio.src = '';
      this.mediaSource = undefined;
      URL.revokeObjectURL(this.audio.src);
      this.loadAudio();
    }
  }
  get currentTime() {
    return round(this.audio.currentTime, 3);
  }
  set currentTime(val: number) {
    this.audio.currentTime = val;
  }

  public set duration(v: number) {
    this._duration = v;
  }

  get duration() {
    return round(this._duration, 3);
  }
  private listener() {
    const self = this;
    const { audio, mediaSource } = this;
    const map: { [propName: string]: any } = {
      progress: () => {
        if (audio.buffered.length > 0) {
          const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
          const progress = (bufferedEnd / self.duration) * 100;
          console.log(self.duration, mediaSource?.duration);
          console.log(`缓冲进度: ${progress}%`);

          this.callbackMaps.progress?.(ceil(progress, 2));
        }
      },
      timeupdate: throttle(() => {
        this.callbackMaps.timeupdate?.(round(audio.currentTime, 3));
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
        audio.addEventListener(key, map[key]);
      }
    }
  }
  on(e: event, cb: cb) {
    this.callbackMaps[e] = cb;
  }

  play() {
    this.callbackMaps.paused?.(false);
    return this.audio.play();
  }
  pause() {
    this.audio.pause();
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

  async loadAudio() {
    if (!this._src) {
      return;
    }

    this.mediaSource = new MediaSource();
    this.audio.src = URL.createObjectURL(this.mediaSource);
    this.mediaSource.addEventListener('sourceopen', () => {
      const sourceBuffer = this.mediaSource?.addSourceBuffer('audio/mpeg');
      if (!sourceBuffer) return;
      this.fetchAudioDataInChunks(sourceBuffer);
    });
  }
  async fetchAudioDataInChunks(sourceBuffer: SourceBuffer) {
    let offset = 0;
    const chunkSize = 1024 * 500; // 500KB/次
    while (true) {
      if (!this.mediaSource) {
        break;
      }
      const response = await fetch(this._src, {
        headers: {
          Range: `bytes=${offset}-${offset + chunkSize - 1}`,
        },
      });
      const arrayBuffer = await response.arrayBuffer();
      if (!response.ok) {
        console.log('终止：数据已加载完毕');
        this.endOfStream();
      }

      if (response.status !== 206 && response.status !== 200) {
        console.log('服务器不支持 Range 请求或文件已结束');
        this.endOfStream();
        break;
      }

      if (arrayBuffer.byteLength === 0) {
        console.log('数据已加载完毕');
        this.endOfStream();
        break;
      }

      // 获取id3标签数据
      if (offset === 0) {
        const metadata = await parseBuffer(new Uint8Array(arrayBuffer));
        console.log('metadata', metadata);
        this._duration = metadata.format.duration ?? 0;
        if (this.mediaSource) {
          this.mediaSource.duration = this._duration;
        }
      }

      sourceBuffer.appendBuffer(arrayBuffer);
      console.log(arrayBuffer);
      offset += arrayBuffer.byteLength;
    }
  }

  private endOfStream() {
    try {
      this.mediaSource?.endOfStream();
    } catch (error) {
      console.log(error);
    }
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
