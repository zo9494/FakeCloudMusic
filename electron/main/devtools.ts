import { App, BrowserWindow, globalShortcut, session } from 'electron';
import { join } from 'node:path';
export async function setupDevTools(app: App) {
  // if (app.isPackaged) return;

  const vue_dev = join(process.cwd(), '/vue_devtools/');

  globalShortcut.register('F10', () => {
    const win = BrowserWindow.getAllWindows();
    win.forEach(win => {
      win.webContents.openDevTools();
    });
  });

  console.log('F10', globalShortcut.isRegistered('F10'));
  try {
    await session.defaultSession.loadExtension(vue_dev, {
      allowFileAccess: true,
    });
  } catch (e) {
    console.error('Vue Devtools failed to install:', e.toString());
  }
}
