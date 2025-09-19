import { getSongUrl, getUnblockSong } from '@/api/song';
import { throttle, round, random, isNumber } from 'lodash';
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

export enum PlayMode {
  // 顺序播放
  order,
  // 循环播放
  loop,
  /* 单曲循环 */
  repeat,
  // 随机播放
  shuffle,
}

// todo:重构，添加播放模式，添加播放列表
export class FCMAudioPlayer {
  private audio: HTMLAudioElement;
  // 播放列表
  list: Track[] = [];
  private eventListeners: { [key: string]: Callback[] } = {};
  // 当前播放索引
  private _currentIndex: number | null = 0;
  // 已经随机播放过的
  private playedShuffleList: number[] = [];
  private shuffleListIndex = 0;
  // 等待生成随机index
  private wait = false;
  // 播放模式
  mode: number = 0;
  constructor(options?: Partial<Options>) {
    this.audio = new Audio();
    this.audio.volume = options?.volume || 0.5;
    this.audio.src = options?.src || '';
    this.audio.preload = 'auto';
    this.audio.autoplay = true;
    this.audio.loop = this.mode === PlayMode.repeat;
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

  set currentIndex(v: number | null) {
    this._currentIndex = v;
    this.songChangeEvent();
  }

  get currentIndex(): number | null {
    return this._currentIndex;
  }

  get currentTrack(): Track | null {
    if (this.currentIndex !== null) {
      return this.list[this.currentIndex];
    }
    return null;
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
  async next() {
    if (!this.list.length) {
      return;
    }
    // switch (this.mode) {
    //   case PlayMode.order:
    //     // 如果是顺序播放
    //     const min = Math.min(this.currentIndex + 1, this.list.length);
    //     debugger;
    //     break;
    //   default:
    //     break;
    // }
    // const maxIndex = Math.max(0, this.list.length - 1);
    // const nextIndex = Math.min(this.currentIndex + 1, maxIndex);
    // console.log(nextIndex);
    // this.currentIndex = nextIndex;

    switch (this.mode) {
      case PlayMode.shuffle:
        if (!this.wait) {
          this.wait = true;
          this.currentIndex = await this.getNextShuffleIndex();
          this.wait = false;
        }
        break;

      default:
        this.currentIndex = this.getNextIndex();
        break;
    }
    console.log(
      'next currentIndex: %d\nshuffleIndex: %d',
      this.currentIndex,
      this.shuffleListIndex
    );

    // this.playMediaSource();
  }
  async prev() {
    switch (this.mode) {
      case PlayMode.shuffle:
        if (!this.wait) {
          this.wait = true;
          this.currentIndex = await this.getPrevShuffleIndex();
          this.wait = false;
        }
        break;

      default:
        this.currentIndex = this.getPrevIndex();
        break;
    }
    console.log(
      'prev currentIndex: %d\nshuffleIndex: %d',
      this.currentIndex,
      this.shuffleListIndex
    );
    // this.playMediaSource();
  }

  private getPrevIndex() {
    if (this.currentIndex === null) {
      return null;
    }
    const i = this.currentIndex - 1;
    if (i < 0) {
      return Math.max(0, this.list.length - 1);
    }
    return i;
  }
  private getNextIndex() {
    if (this.currentIndex === null) {
      return null;
    }
    let i = this.currentIndex + 1;
    if (this.mode === PlayMode.loop && i >= this.list.length) {
      return 0;
    }
    const maxIndex = Math.max(0, this.list.length - 1);
    return Math.min(i, maxIndex);
  }
  private async generateShuffleList() {
    if (!this.list.length) {
      return;
    }
    const arr: number[] = [];
    const fn = () => {
      const r = random(0, Math.max(0, this.list.length - 1));
      const result = arr.find(item => item === r);
      if (result === undefined) {
        arr.push(r);
      }

      if (this.list.length === arr.length) {
        return;
      }
      fn();
    };
    fn();
    console.log('generateShuffleList: %o', arr);
    this.playedShuffleList = arr;
  }

  private async getPrevShuffleIndex() {
    this.shuffleListIndex--;
    if (this.shuffleListIndex < 0) {
      await this.generateShuffleList();
      this.shuffleListIndex = Math.max(0, this.playedShuffleList.length - 1);
    }
    return this.playedShuffleList[this.shuffleListIndex];
  }
  private async getNextShuffleIndex() {
    this.shuffleListIndex++;
    if (this.shuffleListIndex >= this.playedShuffleList.length) {
      await this.generateShuffleList();
      this.shuffleListIndex = 0;
    }
    return this.playedShuffleList[this.shuffleListIndex];
  }
  private setLoop(loop = false) {
    this.audio.loop = loop;
  }
  private whenEnded() {
    if (!this.currentIndex) {
      return;
    }
    switch (this.mode) {
      case PlayMode.repeat:
        break;
      case PlayMode.order:
        // 顺序播放结束
        if (this.currentIndex + 1 < this.list.length) {
          this.next();
        } else {
          this.currentIndex = null;
        }
        break;
      default:
        this.next();
        break;
    }
  }
  togglePlayMode(mode?: number) {
    mode = mode ?? this.mode + 1;
    if (mode > PlayMode.shuffle) {
      mode = PlayMode.order;
    }
    this.mode = mode;
    switch (mode) {
      case PlayMode.shuffle:
        this.playedShuffleList = [];
        this.shuffleListIndex = 0;
        this.generateShuffleList();
        break;
      case PlayMode.repeat:
        this.setLoop(true);
        break;
      default:
        this.setLoop(false);
        break;
    }
    console.log('mode:  %d', this.mode);
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
      console.log('ended');

      self.triggerEvent('ended');
      // 播放结束
      this.whenEnded();
    });
    self.audio.addEventListener('error', err => {
      self.triggerEvent('error');
      console.dir(err);
      console.dir(self.audio);

      if (self.audio.error?.code === 2) {
        console.log('网络问题');

        // 地址过期，重新获取
        // self.playMediaSource();
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
    if (this.mode === PlayMode.shuffle) {
      this.generateShuffleList();
    }
  }
  //
  appendTrack(track: any) {
    let startIndex = 0;
    if (this.currentIndex !== null) {
      startIndex = this.currentIndex + 1;
    }

    this.list.splice(startIndex, 0, track);
    const maxIndex = Math.max(0, this.list.length - 1);
    this.replacePlaylist(Math.min(startIndex, maxIndex));
  }
  async playMediaSource() {
    this.pause();
    if (this.currentTrack) {
      const src = await this.getMediaSource(this.currentTrack);
      this.audio.src = src || '';
    } else {
      //
    }
  }

  async getMediaSource(track: Track) {
    try {
      const source =
        (await this.getMediaSourceFromCache(track)) ||
        (await this.getMediaSourceFromNetEase(track)) ||
        (await this.getMediaSourceFromUnblock(track));

      if (!source) {
        console.log('No media source found for track: %o', track);
        this.next();
      }
      return source;
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
    if (!result.url) {
      return null;
    }
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
    let songInfo = null;

    if (this.currentTrack) {
      songInfo = {
        id: this.currentTrack.id,
        name: this.currentTrack.name,
        ar: getArName(this.currentTrack.ar),
        pic: this.currentTrack.al.picUrl,
      };
    }
    this.playMediaSource();
    this.triggerEvent('songchange', songInfo);

    this.setTitle(songInfo ? `${songInfo.name} - ${songInfo.ar}` : '');

    this.setMediaMetadata(
      songInfo
        ? {
            title: songInfo.name,
            artist: songInfo.ar,
            album: songInfo.name,
            alPicUrl: songInfo.pic,
          }
        : {}
    );
  }
  setTitle(title: string) {
    document.title = title;
  }
}

export const fcmAudioPlayer = new FCMAudioPlayer();
