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
export class FAudio {
  audioNode: HTMLAudioElement;
  callbackMaps: Partial<Record<EVENTS, cb>> = {};
  constructor(options: Partial<Options>) {
    this.audioNode = new Audio(options.src);
    this.audioNode.volume = options.volume || 0.4;
    this.audioNode.style.display = 'none';
    document.body.appendChild(this.audioNode);
    this.listener();
  }
  get volume() {
    return this.audioNode.volume;
  }
  set volume(val: number) {
    this.audioNode.volume = val;
  }
  on(e: event, cb: cb) {
    this.callbackMaps[e] = cb;
  }
  private listener() {
    this.audioNode.addEventListener('progress', () => {
      this.callbackMaps.progress?.(
        (this.audioNode.buffered.end(0) / this.audioNode.duration) * 100
      );
    });
    this.audioNode.addEventListener(
      'timeupdate',
      throttle(() => {
        this.callbackMaps.timeupdate?.(round(this.audioNode.currentTime, 3));
      })
    );
    this.audioNode.addEventListener('ended', () => {
      this.callbackMaps.ended?.();
      this.callbackMaps.paused?.(true);
    });
    this.audioNode.addEventListener('canplay', () => {
      this.callbackMaps.canplay?.();
    });
    this.audioNode.addEventListener('paused', () => {
      this.callbackMaps.paused?.(true);
    });
    this.audioNode.addEventListener('playing', () => {
      this.callbackMaps.playing?.(false);
    });
  }
  get currentTime() {
    return round(this.audioNode.currentTime, 3);
  }
  set currentTime(val: number) {
    this.audioNode.currentTime = val;
  }
  set src(src: string) {
    this.audioNode.src = src;
  }
  get duration() {
    return round(this.audioNode.duration, 3);
  }
  play() {
    this.audioNode.play();
    this.callbackMaps.paused?.(false);
  }
  pause() {
    this.audioNode.pause();
    this.callbackMaps.paused?.(true);
  }
}

export const FA = (() => {
  let instance: FAudio;
  return (options: Partial<Options>) => {
    if (instance) {
      return instance;
    }
    instance = new FAudio(options);
    return instance;
  };
})();
