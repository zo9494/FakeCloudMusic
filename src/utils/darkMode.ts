import { Ref, ref } from 'vue';
import { diffusionAnimation } from './animate';
export enum themes {
  dark = 'dark',
  light = 'light',
}
function setThemeStorage(isDark: boolean) {
  isDark
    ? (localStorage.theme = themes.dark)
    : (localStorage.theme = themes.light);
}
export function useDarkMode() {
  const value = localStorage.theme === themes.dark ? true : false;
  console.log('isDark:  localStorage %s', value);

  const isDark = ref(value);

  window.electron.ipcRenderer.invoke<boolean>('APP:IS_DARK').then(val => {
    console.log('isDark:主线程 %s,localStorage %s', val, value);

    if (val !== value) {
      window.electron.ipcRenderer.invoke<boolean>('APP:DARK_MODE_TOGGLE');
    }
    setThemeStorage(isDark.value);
  });

  async function toggleTheme(e: MouseEvent) {
    diffusionAnimation(e, async () => {
      isDark.value = await window.electron.ipcRenderer.invoke<boolean>(
        'APP:DARK_MODE_TOGGLE'
      );

      setThemeStorage(isDark.value);
    });
  }
  return { value: isDark, toggleTheme };
}

export const darkMode = useDarkMode();
