// @ts-nocheck
import axios from 'axios';
import { API } from './service';
import fs from 'node:fs';
import path from 'node:path';

async function getFileSize(url) {
  return axios
    .head(url)
    .then(res => {
      return res.headers['content-length'];
    })
    .catch(err => {
      console.log(err);
    });
}

async function downloadFile(total_bytes, path, url) {
  const FCM = '.FCM';

  let received_bytes = 0;
  try {
    // 获取已下载文件大小
    let stats = fs.statSync(path + FCM);
    if (total_bytes == stats.size) {
      return;
    }
    received_bytes = stats.size;
  } catch (err) {}
  let params = {
    url,
    headers: {},
    responseType: 'stream',
  };
  if (received_bytes > 0) {
    params.headers['Range'] = 'bytes=' + `${received_bytes}-${total_bytes}`;
  }

  const stream = fs.createWriteStream(path + FCM, { flags: 'a' });
  axios(params).then(res => {
    res.data.pipe(stream);
  });

  stream.on('finish', () => {
    console.log('Finished');
    fs.rename(path + FCM, path);
  });
  stream.on('error', () => console.error('Error while dowloading'));
}

export async function downloadMusic(savePath, songInfo) {
  const res = await API('song_url', {
    id: songInfo.id,
  });
  const url = res.body.data[0].url;
  console.log('歌曲url:   ', url);
  if (!url) {
    return;
  }
  const suffix = url.substring(url.lastIndexOf('.'));
  const fileName = songInfo.name;
  try {
    const total_bytes = await getFileSize(res.body.data[0].url);
    console.log('文件大小：', total_bytes);

    downloadFile(
      total_bytes,
      path.join(savePath, fileName + suffix),
      res.body.data[0].url
    );
  } catch (error) {}
}
