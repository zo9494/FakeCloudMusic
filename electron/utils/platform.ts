export const isWin = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux';
export const isDevelopment = process.env.NODE_ENV === 'development';
