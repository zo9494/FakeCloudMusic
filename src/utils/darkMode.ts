import { Ref, ref } from 'vue';
import { diffusionAnimation } from './animate';
export enum themes {
  dark = 'dark',
  light = 'light',
}
function setThemeStorage(isDark: boolean) {
  console.log('isDark', isDark);

  isDark
    ? (localStorage.theme = themes.dark)
    : (localStorage.theme = themes.light);
}
export function useDarkMode() {
  const value = localStorage.theme === themes.dark ? true : false;
  const isDark = ref(value);

  window.electron.ipcRenderer.invoke<boolean>('APP:IS_DARK').then(val => {
    if (val !== value) {
      window.electron.ipcRenderer.invoke<boolean>('APP:DARK_MODE_TOGGLE');
    }
    isDark.value = val;
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
