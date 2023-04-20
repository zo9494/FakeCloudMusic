function domReady(
  condition: DocumentReadyState[] = ['complete', 'interactive']
) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child);
    }
  },
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const theme = localStorage.theme;
  let color = '#fafafa';
  let spinColor = 'rgba(0, 0, 0, 0.8)';
  if (theme === 'dark') {
    spinColor = 'rgba(255, 255, 255, 0.8)';
    color = '#191919';
  }
  const styleContent = `
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color:${color};
  z-index: 9;
}
.loading {
  position: relative;
  width: 30px;
  height: 30px;
  border-style:solid;
  border-width:4px;
  border-top-color: transparent;
  border-bottom-color: transparent;
  border-right-color: ${spinColor};
  border-left-color: ${spinColor};
  border-radius: 100%;

  animation: circle infinite 0.75s linear;
}

@keyframes circle {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

    `;
  const oStyle = document.createElement('style');
  const style = document.createElement('style');
  const oDiv = document.createElement('div');

  style.innerHTML = `body{background-color: ${color}}`;
  oStyle.id = 'app-loading-style';
  oStyle.innerHTML = styleContent;
  oDiv.className = 'app-loading-wrap';
  oDiv.innerHTML = `
  <div class="loading"></div>
  `;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.head, style);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      setTimeout(() => {
        safeDOM.remove(document.head, style);
      }, 5000);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = ev => {
  ev.data.payload === 'removeLoading' && removeLoading();
};

setTimeout(removeLoading, 9000);
