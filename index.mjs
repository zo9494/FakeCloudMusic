import request from 'request';
import axios from 'axios';
import API from 'NeteaseCloudMusicApi';
import fs from 'node:fs';
async function getFileSize(url) {
  axios
    .head(url)
    .then(res => {
      return res.headers['content-length'];
    })
    .catch(err => {
      console.log(err);
    });
}

async function downloadFile(total_bytes, path, url, id) {
  let stream, requestItem;
  let received_bytes = 0;
  try {
    // 获取已下载文件大小
    let stats = fs.statSync(path);
    if (total_bytes == stats.size) {
      return;
    }
    received_bytes = stats.size;
  } catch (err) {}
  let params = {
    url,
    headers: {},
  };
  if (received_bytes > 0) {
    params.headers['Range'] = 'bytes=' + `${received_bytes}-${total_bytes}`;
  }

  stream = fs.createWriteStream(path, { flags: 'a' });
  requestItem = request(params);
  requestItem.pipe(stream);
  stream.on('finish', () => console.log('Finished'));
  stream.on('error', () => console.error('Error while dowloading'));
}

async function main() {
  const res = await API.song_url({ id: 66476, realIP: '116.25.146.177' });
  const total_bytes = await getFileSize(res.body.data[0].url);
  downloadFile(total_bytes, './1', res.body.data[0].url);
}

main();
