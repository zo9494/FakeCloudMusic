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

// 播放模式管理器
class PlayModeManager {
  mode: PlayMode = PlayMode.order;
  private playedShuffleList: number[] = [];
  private shuffleListIndex = 0;
  private list: Track[] = [];

  constructor(list: Track[]) {
    this.list = list;
  }

  setMode(mode: PlayMode) {
    this.mode = mode;
    if (mode === PlayMode.shuffle) {
      this.generateShuffleList();
    }
  }

  private generateShuffleList() {
    const arr: number[] = [];
    while (arr.length < this.list.length) {
      const r = random(0, this.list.length - 1);
      if (!arr.includes(r)) arr.push(r);
    }
    this.playedShuffleList = arr;
    this.shuffleListIndex = 0;
  }

  getNextIndex(currentIndex: number): number | null {
    if (this.list.length === 0) return null;

    switch (this.mode) {
      case PlayMode.order:
        return currentIndex < this.list.length - 1 ? currentIndex + 1 : null;
      case PlayMode.loop:
        return (currentIndex + 1) % this.list.length;
      case PlayMode.repeat:
        return currentIndex;
      case PlayMode.shuffle:
        this.shuffleListIndex =
          (this.shuffleListIndex + 1) % this.playedShuffleList.length;
        return this.playedShuffleList[this.shuffleListIndex];
      default:
        return currentIndex < this.list.length - 1 ? currentIndex + 1 : null;
    }
  }

  getPrevIndex(currentIndex: number): number | null {
    if (this.list.length === 0) return null;

    switch (this.mode) {
      case PlayMode.order:
        return Math.max(currentIndex - 1, 0);
      case PlayMode.loop:
        return (currentIndex - 1 + this.list.length) % this.list.length;
      case PlayMode.repeat:
        return currentIndex;
      case PlayMode.shuffle:
        this.shuffleListIndex =
          (this.shuffleListIndex - 1 + this.playedShuffleList.length) %
          this.playedShuffleList.length;
        return this.playedShuffleList[this.shuffleListIndex];
      default:
        return Math.max(currentIndex - 1, 0);
    }
  }

  resetShuffle() {
    this.playedShuffleList = [];
    this.shuffleListIndex = 0;
    if (this.mode === PlayMode.shuffle) {
      this.generateShuffleList();
    }
  }
}

// 媒体源解析器
class MediaSourceResolver {
  async resolve(track: Track): Promise<string | null> {
    try {
      return (
        (await this.fromCache(track)) ||
        (await this.fromNetEase(track)) ||
        (await this.fromUnblock(track)) ||
        null
      );
    } catch (error) {
      console.error('获取播放源失败:', error);
      return null;
    }
  }

  private async fromCache(track: Track): Promise<string | null> {
    // TODO: 实现缓存逻辑
    return null;
  }

  private async fromNetEase(track: Track): Promise<string | null> {
    try {
      const result = await getSongUrl(track.id);
      if (result.freeTrialInfo) {
        console.warn(`歌曲 ${track.name} 为试听版本`);
        return null;
      }
      console.log('netease result:', result);
      return result.url || null;
    } catch (error) {
      console.error('fromNetEase Error:', error);
      return null;
    }
  }

  private async fromUnblock(track: Track): Promise<string | null> {
    try {
      const result = await getUnblockSong({
        id: track.id,
        params: ['pyncmd'],
      });
      console.info('unblock result:', result);
      return result?.url || null;
    } catch (error) {
      console.error('fromUnblock Error:', error);
      return null;
    }
  }
}

export class FCMAudioPlayer {
  private audio: HTMLAudioElement;
  // 播放列表
  list: Track[] = [];
  private eventListeners: { [key: string]: Callback[] } = {};
  // 当前播放索引
  private _currentIndex: number | null = 0;
  // 播放模式管理器
  private playModeManager: PlayModeManager;

  // 播放模式
  private mode: number = 0;
  constructor(options?: Partial<Options>) {
    this.audio = new Audio();
    this.audio.volume = options?.volume || 0.5;
    this.audio.src = options?.src || '';
    this.audio.preload = 'auto';
    this.audio.autoplay = true;
    this.playModeManager = new PlayModeManager(this.list);
    this.bindEvents();
    this.bindMediaActionHandler();
  }
  get duration() {
    return this.audio.duration || 0;
  }
  set currentTime(v: number) {
    this.audio.currentTime = v;
  }
  get currentTime() {
    return this.audio.currentTime || 0;
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
    const volume = Math.max(0, Math.min(1, v));
    this.audio.volume = volume;
  }

  play() {
    if (this.audio.src) {
      this.audio.play().catch(error => {
        console.error('播放失败:', error);
        this.triggerEvent('error', error);
      });
    }
  }
  pause() {
    this.audio.pause();
  }
  async next() {
    if (!this.list.length || this.currentIndex === null) return;

    const nextIndex = this.playModeManager.getNextIndex(this.currentIndex);
    if (nextIndex !== null) {
      this.currentIndex = nextIndex;
    } else {
      // 顺序播放结束
      this.currentIndex = null;
      this.pause();
      this.triggerEvent('ended');
    }
  }
  async prev() {
    if (!this.list.length || this.currentIndex === null) return;

    const prevIndex = this.playModeManager.getPrevIndex(this.currentIndex);
    if (prevIndex !== null) {
      this.currentIndex = prevIndex;
    }
  }

  private async playMediaSource() {
    this.pause();

    if (!this.currentTrack) {
      this.triggerEvent('songchange', null);
      return;
    }

    this.audio.src = `fcm-app://media?id=${
      this.currentTrack.id
    }&cookie=${localStorage.getItem('cookie')}`;
    console.log('src:', this.audio.src);

    // try {
    //   const src = await this.mediaSourceResolver.resolve(this.currentTrack);
    //   if (src !== null) {
    //     this.audio.src = src;
    //     if (this.isPlaying) {
    //       this.play();
    //     }
    //   } else {
    //     console.warn('无法获取播放源，尝试下一首');
    //     this.next();
    //   }
    // } catch (error) {
    //   console.error('播放媒体源时出错:', error);
    //   this.next();
    // }
  }

  private whenEnded() {
    switch (this.mode) {
      // case PlayMode.repeat:
      //   // 单曲循环，重新播放当前歌曲
      //   this.audio.currentTime = 0;
      //   this.play();
      //   break;
      case PlayMode.order:
        // 顺序播放结束
        if (
          this.currentIndex !== null &&
          this.currentIndex + 1 < this.list.length
        ) {
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
    const newMode = mode ?? (this.mode + 1) % (PlayMode.shuffle + 1);
    this.mode = newMode;
    this.playModeManager.setMode(newMode);
    // 设置单曲循环
    this.audio.loop = newMode === PlayMode.repeat;

    if (newMode === PlayMode.shuffle) {
      this.playModeManager.resetShuffle();
    }

    console.log('播放模式切换为:', PlayMode[newMode as PlayMode]);
  }
  private bindEvents() {
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
      switch (self.audio.error?.code) {
        case 1:
          console.log('用户取消了播放');
          break;
        case 2:
          console.log('网络问题');
          break;
        case 3:
          console.log('解码失败');
          break;
        case 4:
          console.log('播放格式不支持');
          break;
        default:
          console.log('未知错误');
      }
    });
    self.audio.addEventListener(
      'timeupdate',
      throttle(() => {
        self.triggerEvent('timeupdate', round(self.currentTime, 3));
      }, 500)
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
  private triggerEvent(event: keyof FCMAudioPlayerEventMap, ...args: any[]) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`事件 ${event} 的回调执行出错:`, error);
        }
      });
    }
  }

  private bindMediaActionHandler() {
    if (!('mediaSession' in navigator)) return;

    const mediaActionMap: { [key: string]: () => void } = {
      pause: this.pause.bind(this),
      play: this.play.bind(this),
      nexttrack: this.next.bind(this),
      previoustrack: this.prev.bind(this),
    };

    Object.keys(mediaActionMap).forEach(key => {
      navigator.mediaSession.setActionHandler(
        key as MediaSessionAction,
        mediaActionMap[key]
      );
    });
  }

  // 替换播放列表
  replacePlaylist(index = 0, list?: Track[]) {
    if (list) {
      this.list = list;
    }

    this.playModeManager = new PlayModeManager(this.list);

    if (this.list.length > 0) {
      this.currentIndex = Math.max(0, Math.min(index, this.list.length - 1));
    } else {
      this.currentIndex = null;
    }

    if (this.mode === PlayMode.shuffle) {
      this.playModeManager.resetShuffle();
    }
  }

  private getInsertIndex() {
    let startIndex = 0;
    if (this.currentIndex !== null) {
      startIndex = this.currentIndex + 1;
    }
    return startIndex;
  }

  private findIndex(track: Track) {
    return this.list.findIndex(item => item.id === track.id);
  }

  //
  insertTrack(track: Track) {
    const index = this.findIndex(track);
    if (index !== -1) {
      this.list.splice(index, 1);
    }

    const startIndex = this.getInsertIndex();
    this.list.splice(startIndex, 0, track);
    const maxIndex = Math.max(0, this.list.length - 1);
    this.replacePlaylist(Math.min(startIndex, maxIndex));
    console.log(this.list);
  }

  // 添加到下一首播放
  appendNextTrack(track: Track) {
    const startIndex = this.getInsertIndex();
    this.list.splice(startIndex, 0, track);
    console.log(this.list);
  }

  private setMediaMetadata(params: Partial<mediaDataType>) {
    if (!('mediaSession' in navigator)) return;

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

  private songChangeEvent() {
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
  private setTitle(title: string) {
    document.title = title;
  }
}

export const fcmAudioPlayer = new FCMAudioPlayer();
