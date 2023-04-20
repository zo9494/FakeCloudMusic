export function useTextScroll(selector: string) {
  const el = document.querySelector<HTMLElement>(selector);

  if (!el) {
    console.error(selector + ' can not find');
    return;
  }
  let flag = false;
  const className = 'text-scroll';
  const speed = 40;

  const scroll = () => {
    if (el) {
      el.classList.add(className);
      (el.firstElementChild as HTMLElement).addEventListener(
        'animationend',
        () => {
          el.classList.remove(className);
        },
        { once: true }
      );
    }
  };
  const observerCallback: MutationCallback = () => {
    el.classList.remove(className);
    flag = false;
  };
  const observer = new MutationObserver(observerCallback);
  el.addEventListener('mouseenter', () => {
    if (!el.firstElementChild) {
      return;
    }

    if (el.clientWidth > el.firstElementChild.scrollWidth) {
      return;
    }

    if (!flag) {
      flag = true;
      const cloneNode = el.firstElementChild.cloneNode(true) as HTMLElement;
      cloneNode.style.marginLeft = 'var(--text-gap,10px)';
      observer.disconnect();
      el.appendChild(cloneNode);
      observer.observe(el, { childList: true });
    }
    el.style.setProperty(
      '--words-roll-time',
      el.firstElementChild.scrollWidth / speed + 's'
    );

    scroll();
  });
}
