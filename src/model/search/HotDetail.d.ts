namespace HotDetail {
  interface RootObject {
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
}
