interface TextItem {
  el: HTMLElement;
  flag: boolean;
  // speed: number;
}
export function useTextScroll(selector: string) {
  const elList = document.querySelectorAll<HTMLElement>(selector);
  if (!elList.length) {
    console.error(selector + ' can not find');
    return;
  }
  const textItems: TextItem[] = [];
  elList.forEach(el => {
    textItems.push({
      el,
      flag: false,
    });
  });

  // let flag = false;
  const className = 'text-scroll';
  const speed = 40;

  const scroll = (el: HTMLElement) => {
    el.classList.add(className);
    (el.firstElementChild as HTMLElement).addEventListener(
      'animationend',
      () => {
        el.classList.remove(className);
      },
      { once: true }
    );
  };
  // const observerCallback: MutationCallback = (mutationsList, observer) => {
  //   // el.classList.remove(className);
  //   // flag = false;
  //   console.log(mutationsList, observer);

  //   debugger;
  // };
  // const observer = new MutationObserver(observerCallback);

  textItems.forEach(item => {
    const { el } = item;
    el.addEventListener('mouseenter', () => {
      if (!el.firstElementChild) {
        return;
      }

      if (el.clientWidth > el.firstElementChild.scrollWidth) {
        return;
      }

      if (!item.flag) {
        item.flag = true;
        const cloneNode = el.firstElementChild.cloneNode(true) as HTMLElement;
        cloneNode.style.marginLeft = 'var(--text-gap,10px)';
        // observer.disconnect();
        el.appendChild(cloneNode);
        // observer.observe(el, { childList: true });
      }
      el.style.setProperty(
        '--words-roll-time',
        el.firstElementChild.scrollWidth / speed + 's'
      );

      scroll(el);
    });
  });
}
