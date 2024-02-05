import { API } from '../utils/service';
import { DownloadItem } from 'electron';
async function getMusicUrl(id: string | number) {
  const res = await API('song_url', { id });
  return res.body.data[0].url;
}

export interface DownloadQueue extends DownloadItem {
  id: string | number;
}

export class FCMDownload {
  downloadQueue: Array<DownloadQueue> = [];
  add(item: DownloadQueue) {
    const res = this.downloadQueue.find(it => it.id === item.id);
    if (res) {
      return;
    } else {
      this.downloadQueue.push(item);
    }
  }

  remove(item: DownloadQueue) {
    const index = this.downloadQueue.findIndex(it => it.id !== item.id);
    this.downloadQueue.splice(index, 1);
  }
  getTotalBytes() {
    return this.downloadQueue.reduce(
      (accumulator, item) => accumulator + item.getTotalBytes(),
      0
    );
  }

  getReceivedBytes() {
    return this.downloadQueue.reduce(
      (accumulator, item) => accumulator + item.getReceivedBytes(),
      0
    );
  }
}
