import { BrowserWindow, app, ipcMain, nativeTheme } from 'electron';
import { EVENT } from '../utils/eventTypes';
import { API } from '../utils/service';
import { createLogin } from './login';

let fileName = '';
function getWinFormWebContents(sender) {
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
  const win = getWinFormWebContents(e.sender);
  win.minimize();
});

ipcMain.handle(EVENT.MINIMIZE_TO_TRAY, e => {
  const win = getWinFormWebContents(e.sender);
  win.hide();
});
//#endregion

ipcMain.handle(EVENT.LOGIN, e => {
  console.log('login');
  const win = getWinFormWebContents(e.sender);
  createLogin({ parent: win });
});
ipcMain.handle(EVENT.RELOAD_USER, e => {
  const win = getWinFormWebContents(e.sender);
  return win.webContents.executeJavaScript('window.loadUser()');
});

ipcMain.handle(EVENT.WINDOW_SHOW, e => {
  const win = getWinFormWebContents(e.sender);
  win.show();
});

ipcMain.handle(EVENT.WINDOW_CLOSE, e => {
  const win = BrowserWindow.fromWebContents(e.sender);
  win.close();
});

ipcMain.handle(EVENT.HTTP, async (_, { url, params }) => {
  try {
    return await API(url, params);
  } catch (error) {
    console.log(111, error);
    return { error };
  }
});

ipcMain.handle(EVENT.SAVE_SONG, async (e, song) => {
  try {
    const win = getWinFormWebContents(e.sender);
    const res = await API('song_url', { id: song.id });
    const url = res.body.data[0].url;
    const artists = song.artists || song.ar;
    const artist = artists.map(it => it.name).join(',');
    fileName = `${song.name}-${artist + url.substring(url.lastIndexOf('.'))}`;
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
