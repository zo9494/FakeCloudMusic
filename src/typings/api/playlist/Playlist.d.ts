namespace Playlist {
  interface UpdatePlaylist {
    status: number;
    body: UpdatePlaylistBody;
    cookie: any[];
  }

  interface UpdatePlaylistBody {
    trackIds: string;
    code: number;
    count: number;
    cloudCount: number;
  }
}
