interface HotSearch {
  code: number;
  result: HotSearchResult;
}

interface HotSearchResult {
  hots: Hot[];
}

interface Hot {
  first: string;
  second: number;
  third?: any;
  iconType: number;
}

interface HotSearchDetail {
  code: number;
  data: Datum[];
  message: string;
}

interface Datum {
  searchWord: string;
  score: number;
  content: string;
  source: number;
  iconType: number;
  iconUrl?: string;
  url: string;
  alg: string;
}

interface SearchSuggest {
  result: SearchSuggestResult;
  code: number;
}

interface SearchSuggestResult {
  albums: Album[];
  artists: Artist2[];
  songs: Song[];
  order: string[];
}

interface Song {
  id: number;
  name: string;
  artists: Artist3[];
  album: Album2;
  duration: number;
  copyrightId: number;
  status: number;
  alias: any[];
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
  artist: Artist3;
  publishTime: number;
  size: number;
  copyrightId: number;
  status: number;
  picId: number;
  alia: string[];
  mark: number;
}

interface Artist3 {
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

interface Artist2 {
  id: number;
  name: string;
  picUrl: string;
  alias: any[];
  albumSize: number;
  picId: number;
  fansGroup?: any;
  img1v1Url: string;
  accountId: number;
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
  transNames?: string[];
  trans?: string;
}
