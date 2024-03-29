import { InjectionKey, Ref } from 'vue';
export enum themes {
  dark = 'dark',
  light = 'light',
}

export type theme = 'dark' | 'light';
export const toggleThemeKey: InjectionKey<() => Promise<void>> =
  Symbol('toggleTheme');
export const themeKey: InjectionKey<Readonly<Ref<theme>>> = Symbol('theme');
