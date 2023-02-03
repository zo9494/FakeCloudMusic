interface Order {
  userId: number;
  name: string;
  id: number;
  coverImgUrl: string;
}

interface Base {
  id: number;
  name: string;
  origin_name?: string;
}
interface Track {
  id: number;
  name: string;
  origin_name?: string;
  ar: Base[];
  al: Base & { picUrl: string };
  dt: number;
  arName: string;
}

interface TrackId {
  id: number;
}
interface Creator {
  avatarUrl: string;
  nickname: string;
}

interface Playlist {
  userId: number;
  tags: string[];
  algTags: string[];
  coverImgUrl: string;
  createTime: number;
  description: string;
  name: string;
  id: number;
  tracks: Track[];
  trackIds: TrackId[];
  creator: Creator;
  trackCount: number;
  playCount: number;
  shareCount: number;
  subscribedCount: number;
  subscribed: boolean;
}

interface PlaylistDetail {
  playlist: Playlist;
}

interface SongDetail {
  songs: Track[];
}
interface SongUrl {
  url: string;
  time: number;
  id: number;
  size: number;
  level: 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires';
}
interface SongUrls {}
interface Lyric {
  time: number;
  lyric: string;
}
