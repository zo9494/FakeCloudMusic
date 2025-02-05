import { BrowserWindow, app, ipcMain, nativeTheme } from 'electron';
import { EVENT } from '../utils/eventTypes';
import { API } from '../utils/service';
import { createLogin } from './login';
import { application } from './application';
function getWinFormWebContents(sender: Electron.WebContents) {
  return BrowserWindow.fromWebContents(sender);
}

ipcMain.handle(EVENT.APP_CLOSE, () => {
  app.exit();
});

//#region window平台
ipcMain.handle(EVENT.WINDOW_RESIZ, e => {
  const win = getWinFormWebContents(e.sender);
  if (win.isMaximized()) {
    win.restore();
  } else {
    win.maximize();
  }
});

ipcMain.handle(EVENT.WINDOW_MIN, e => {
  // const win = getWinFormWebContents(e.sender);
  // win.minimize();

  getWinFormWebContents(e.sender).minimize();
});

ipcMain.handle(EVENT.MINIMIZE_TO_TRAY, e => {
  // const win = getWinFormWebContents(e.sender);
  // win.hide();

  getWinFormWebContents(e.sender).hide();
});
//#endregion

ipcMain.handle(EVENT.LOGIN, () => {
  createLogin({ parent: application.win });
});
ipcMain.handle(EVENT.RELOAD_USER, () => {
  return application.win.webContents.executeJavaScript('window.loadUser()');
});

ipcMain.handle(EVENT.WINDOW_SHOW, e => {
  // const win = getWinFormWebContents(e.sender);
  getWinFormWebContents(e.sender).show();
});

ipcMain.handle(EVENT.WINDOW_CLOSE, e => {
  getWinFormWebContents(e.sender).close();
});

ipcMain.handle(EVENT.HTTP, async (_, { url, params }) => {
  try {
    return await API(url, params);
  } catch (error) {
    application.win.webContents.send(EVENT.SEND_MESSAGE, {
      type: 'error',
      text: `api错误:${url}`,
    });
    console.error({
      url,
      params,
      error,
    });

    return { error };
  }
});

ipcMain.handle(EVENT.SAVE_SONG, async (e, song, cookie) => {
  try {
    const win = application.win;
    const res = await API('song_download_url', {
      id: song.id,
      timestamp: Date.now(),
      cookie,
    });
    const url = res.body.data[0].url;
    const artists = song.artists || song.ar;
    const artist = artists.map(it => it.name).join(',');
    application.downloadFileName = `${song.name}-${
      artist + url.substring(url.lastIndexOf('.'))
    }`;
    win.webContents.downloadURL(url);
  } catch (error) {
    return { error };
  }
  // console.log('download:  ', song);

  // downloadMusic('./', song);
});
ipcMain.handle(EVENT.DARK_MODE_TOGGLE, e => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }
  return nativeTheme.shouldUseDarkColors;
});
ipcMain.handle(EVENT.DARK_MODE_SYSTEM, () => {
  nativeTheme.themeSource = 'system';
});

ipcMain.handle(EVENT.APP_IS_DARK, () => {
  return nativeTheme.shouldUseDarkColors;
});
// 修改title
ipcMain.handle(EVENT.SET_TITLE, (e, title?: string) => {
  if (title) {
    application.tray.setToolTip(title);
    application.win.setTitle(title);
  }
});

ipcMain.handle(EVENT.WEB_AUDIO_TOGGLE_PLAY, (e, play: boolean) => {
  application.thumbar.togglePlay(play);
});
