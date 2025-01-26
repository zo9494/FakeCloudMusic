import { Ref, ref } from 'vue';
import { diffusionAnimation } from './animate';
export enum themes {
  dark = 'dark',
  light = 'light',
}

export function useDarkMode() {
  const value = localStorage.theme === themes.dark ? true : false;
  let isDark = ref(value);
  window.electron.ipcRenderer.invoke<boolean>('APP:IS_DARK').then(val => {
    isDark.value = val;
  });
  async function toggleTheme(e: MouseEvent) {
    diffusionAnimation(e, async () => {
      isDark.value = await window.electron.ipcRenderer.invoke<boolean>(
        'APP:DARK_MODE_TOGGLE'
      );

      isDark.value
        ? (localStorage.theme = themes.dark)
        : (localStorage.theme = themes.light);
    });
  }

  return { value: isDark, toggleTheme };
}

export const darkMode = useDarkMode();
