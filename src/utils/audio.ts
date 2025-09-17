import { getSongUrl, getUnblockSong } from '@/api/song';
import { throttle, round, random } from 'lodash';
import { getArName } from './utils';
interface Options {
  src: string;
  volume: number;
}

interface mediaDataType {
  title: string;
  artist: string;
  album: string;
  alPicUrl: string;
}

interface FCMAudioPlayerEventMap extends HTMLMediaElementEventMap {
  songchange: any;
}

type Callback = (...args: any[]) => void;

enum PlayMode {
  // 顺序播放
  order = 0,
  // 循环播放
  loop,
  // 随机播放
  shuffle,
  // 单曲循环
  repeat,
}

// todo:重构，添加播放模式，添加播放列表
export class FCMAudioPlayer {
  private audio: HTMLAudioElement;
  // 播放列表
  list: Track[] = [];
  private eventListeners: { [key: string]: Callback[] } = {};
  // 当前播放索引
  private _currentIndex: number = 0;
  // 已经播放过的
  private playedIndex: number[] = [];
  // 播放模式
  mode: number = 0;
  constructor(options?: Partial<Options>) {
    this.audio = new Audio();
    this.audio.volume = options?.volume || 0.5;
    this.audio.src = options?.src || '';
    this.audio.preload = 'auto';
    this.audio.autoplay = true;
    this.bindEvents();
    this.bindMediaActionHandler();
  }
  get duration() {
    return this.audio.duration;
  }
  set currentTime(v: number) {
    this.audio.currentTime = v;
  }
  get currentTime() {
    return this.audio.currentTime;
  }

  set currentIndex(v: number) {
    this._currentIndex = v;
    this.songChangeEvent();
  }

  get currentIndex() {
    return this._currentIndex;
  }

  get currentTrack() {
    return this.list[this.currentIndex];
  }

  public get volume() {
    return this.audio.volume;
  }

  public set volume(v: number) {
    this.audio.volume = v;
  }

  play() {
    this.audio.play();
    console.log(this.audio);
  }
  pause() {
    this.audio.pause();
  }
  next() {
    if (this.currentIndex < this.list.length - 1) {
      this.currentIndex++;
    }
    this.playMediaSource();
  }
  prev() {
    if (this.currentIndex != 0) {
      this.currentIndex--;
    }
    this.playMediaSource();
  }
  bindEvents() {
    const self = this;
    self.audio.addEventListener('play', () => {
      self.triggerEvent('play');
    });
    self.audio.addEventListener('pause', () => {
      self.triggerEvent('pause');
    });
    self.audio.addEventListener('ended', () => {
      self.triggerEvent('ended');
      self.next();
    });
    self.audio.addEventListener('error', err => {
      self.triggerEvent('error');
      console.dir(err);
      console.dir(self.audio);

      if (self.audio.error?.code === 2) {
        // 地址过期，重新获取
        self.playMediaSource();
      }
    });
    self.audio.addEventListener(
      'timeupdate',
      throttle(() => {
        self.triggerEvent('timeupdate', round(self.currentTime, 3));
      }, 800)
    );
    self.audio.addEventListener('loadedmetadata', () => {
      self.triggerEvent('loadedmetadata', round(self.duration, 3));
    });
  }
  on(event: keyof FCMAudioPlayerEventMap, callback: Callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  off(event: keyof FCMAudioPlayerEventMap, callback: Callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        cb => cb !== callback
      );
    }
  }

  // 触发事件
  triggerEvent(event: keyof FCMAudioPlayerEventMap, ...args: any[]) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(...args));
    }
  }

  bindMediaActionHandler() {
    const mediaActionMap: { [key: string]: () => void } = {
      pause: this.pause.bind(this),
      play: this.play.bind(this),
      nexttrack: this.next.bind(this),
      previoustrack: this.prev.bind(this),
    };

    for (const key in mediaActionMap) {
      navigator.mediaSession.setActionHandler(
        key as MediaSessionAction,
        mediaActionMap[key]
      );
    }
  }

  // 替换播放列表
  replacePlaylist(index = 0, list?: Track[]) {
    if (list) {
      this.list = list;
    }
    this.currentIndex = index;
    this.playMediaSource();
  }
  async playMediaSource() {
    this.pause();
    const src = await this.getMediaSource(this.currentTrack);
    this.audio.src = src || '';
  }

  async getMediaSource(track: Track) {
    try {
      return (
        (await this.getMediaSourceFromCache(track)) ||
        (await this.getMediaSourceFromNetEase(track)) ||
        (await this.getMediaSourceFromUnblock(track))
      );
    } catch (error) {
      console.log(error);

      return '';
    }
  }
  async getMediaSourceFromUnblock(track: Track) {
    const result = await getUnblockSong({
      id: track.id,
      params: ['pyncmd'],
    });

    console.log('UnblockResult: %o', result);
    return result.url;
  }
  /* 从indexdb获取 */
  async getMediaSourceFromCache(track: Track) {
    console.log('CacheResult: %o');

    return null;
  }

  /* 从网易云获取url */
  async getMediaSourceFromNetEase(track: Track) {
    const realSongUrl = await getSongUrl(track.id);
    console.log('NetEaseResult: %o', realSongUrl);
    if (realSongUrl.freeTrialInfo) {
      // 试听
      return null;
    }
    if (realSongUrl.url) {
      return realSongUrl.url;
    }
    return null;
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

  songChangeEvent() {
    const songInfo = {
      id: this.currentTrack.id,
      name: this.currentTrack.name || '',
      ar: getArName(this.currentTrack.ar),
      pic: this.currentTrack.al.picUrl,
    };

    this.triggerEvent('songchange', songInfo);

    this.setTitle(`${songInfo.name} - ${songInfo.ar}`);
    this.setMediaMetadata({
      title: songInfo.name,
      artist: songInfo.ar,
      album: songInfo.name,
      alPicUrl: songInfo.pic,
    });
  }
  setTitle(title: string) {
    document.title = title;
  }
}

export const fcmAudioPlayer = new FCMAudioPlayer();
