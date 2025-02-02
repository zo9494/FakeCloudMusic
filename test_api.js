const api = require('NeteaseCloudMusicApi');
// api.song_url({ id: 123456 }).then(async res => {
//   console.log(res.body.data[0].url);

//   const response = await fetch(res.body.data[0].url, {
//     headers: {
//       Range: 'bytes=0-102400',
//     },
//   });
//   const arrayBuffer = await response.arrayBuffer();
//   console.log(arrayBuffer);
// });

api.login_qr_key().then(async res => {
  console.log(res);
});
api.login_refresh().then(async res => {
  console.log(res);
});
