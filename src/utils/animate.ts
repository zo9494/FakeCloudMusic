/**
 * 扩散动画
 */
export function diffusionAnimation(
  e: MouseEvent,
  updateCallback: () => Promise<void> | void
) {
  // 传入点击事件，从点击处开始扩散。否则，从右上角开始扩散
  const x = e?.clientX ?? window.innerWidth;
  const y = e?.clientY ?? 0;

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(updateCallback);

  void transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];
    document.documentElement.animate(
      {
        clipPath: isDark() ? clipPath : [...clipPath].reverse(),
      },
      {
        duration: 500,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
        pseudoElement: isDark()
          ? '::view-transition-new(root)'
          : '::view-transition-old(root)',
      }
    );
  });
}

/**
 * 检测用户的系统是否被开启了动画减弱功能
 * @link https://developer.mozilla.org/zh-CN/docs/Web/CSS/@media/prefers-reduced-motion
 */
function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * 当前主题色是否是暗色
 */
function isDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches === true;
}
