declare namespace HotSearchSuggest {
  interface RootObject {
    result: Result;
    code: number;
  }

  interface Result {
    albums: Album[];
    artists: Artist[];
    songs: Song[];
    playlists: Playlist[];
    order: string[];
  }

  interface Playlist {
    id: number;
    name: string;
    coverImgUrl: string;
    creator?: any;
    subscribed: boolean;
    trackCount: number;
    userId: number;
    playCount: number;
    bookCount: number;
    specialType: number;
    officialTags?: any;
    action?: any;
    actionType?: any;
    recommendText?: any;
    score?: any;
    description: string;
    highQuality: boolean;
  }

  interface Song {
    id: number;
    name: string;
    artists: Artist2[];
    album: Album2;
    duration: number;
    copyrightId: number;
    status: number;
    alias: string[];
    rtype: number;
    ftype: number;
    mvid: number;
    fee: number;
    rUrl?: any;
    mark: number;
  }

  interface Album2 {
    id: number;
    name: string;
    artist: Artist2;
    publishTime: number;
    size: number;
    copyrightId: number;
    status: number;
    picId: number;
    mark: number;
  }

  interface Artist2 {
    id: number;
    name: string;
    picUrl?: any;
    alias: any[];
    albumSize: number;
    picId: number;
    fansGroup?: any;
    img1v1Url: string;
    img1v1: number;
    trans?: any;
  }

  interface Album {
    id: number;
    name: string;
    artist: Artist;
    publishTime: number;
    size: number;
    copyrightId: number;
    status: number;
    picId: number;
    mark: number;
  }

  interface Artist {
    id: number;
    name: string;
    picUrl: string;
    alias: any[];
    albumSize: number;
    picId: number;
    fansGroup?: any;
    img1v1Url: string;
    img1v1: number;
    trans?: any;
  }
}
