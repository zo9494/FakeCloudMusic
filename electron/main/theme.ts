import { nativeTheme } from 'electron';

export class Theme {
  private _mode = nativeTheme.themeSource;
  private eventListeners = {};
  get useDark() {
    return nativeTheme.shouldUseDarkColors;
  }

  get mode() {
    return this._mode;
  }
  set mode(val: 'light' | 'dark' | 'system') {
    const oldVal = this._mode;
    this._mode = val;
    nativeTheme.themeSource = val;
    if (oldVal !== val) {
      this.triggerEvent('change', val);
    }
  }

  toggleTheme() {
    if (this.useDark) {
      this.mode = 'light';
    } else {
      this.mode = 'dark';
    }
  }

  useSystemTheme() {
    this.mode = 'system';
  }
  triggerEvent(event: 'change', ...args: any[]) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(...args));
    }
  }

  on(event: 'change', callback: (mode: 'light' | 'dark' | 'system') => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  off(event: 'change', callback: (mode: 'light' | 'dark' | 'system') => void) {
    if (!this.eventListeners[event]) {
      return;
    }
    this.eventListeners[event] = this.eventListeners[event].filter(
      item => item !== callback
    );
  }
}

export const theme = new Theme();
