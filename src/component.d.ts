import SvgIcon from "./components/SvgIcon.vue";
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    SvgIcon: typeof SvgIcon
  }
}

export { }