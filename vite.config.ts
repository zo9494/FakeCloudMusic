import { rmSync } from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import pkg from './package.json';
import path from 'path';
import svgLoader from 'vite-svg-loader';

import dayjs from 'dayjs';
import type { ResolvedConfig } from 'vite';
import type { NormalizedOutputOptions, OutputBundle } from 'rollup';
import { PAGE_LOGIN, PAGE_TRAY } from './const';

let viteConfig: ResolvedConfig;
// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true });

  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    // root: __dirname + '/pages/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.platform': `'${process.platform}'`,
    },
    plugins: [
      vue(),
      // {
      //   name: 'myPlugin',
      //   configResolved(resolvedConfig: ResolvedConfig) {
      //     viteConfig = resolvedConfig;
      //   },
      //   transformIndexHtml(html: string) {
      //     return (
      //       `<!--\n  Version:  ${pkg.version}\n  Build:  ${dayjs().format(
      //         'YYYY/MM/DD  HH:mm:ss'
      //       )}\n  Env:  ${process.env.NODE_ENV}\n-->\n` + html
      //     );
      //   },
      //   async writeBundle(
      //     options: NormalizedOutputOptions,
      //     bundle: OutputBundle
      //   ) {
      //     for (const file of Object.entries(bundle)) {
      //       const fileName: string = file[0];
      //     }
      //   },
      // },
      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: 'electron/main/index.ts',
          onstart(options) {
            if (process.env.VSCODE_DEBUG) {
              console.log(
                /* For `.vscode/.debug.script.mjs` */ '[startup] Electron App'
              );
            } else {
              options.startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: Object.keys(
                  'dependencies' in pkg ? pkg.dependencies : {}
                ),
              },
            },
          },
        },
        {
          entry: 'electron/preload/index.ts',
          onstart(options) {
            // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
            // instead of restarting the entire Electron App.
            options.reload();
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys(
                  'dependencies' in pkg ? pkg.dependencies : {}
                ),
              },
            },
          },
        },
        {
          entry: 'electron/preload/index.ts',
          onstart(options) {
            options.reload();
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys(
                  'dependencies' in pkg ? pkg.dependencies : {}
                ),
              },
            },
          },
        },
      ]),
      // Use Node.js API in the Renderer-process
      // renderer({
      //   nodeIntegration: true,
      // }),
      svgLoader(),
    ],
    build: {
      rollupOptions: {
        input: {
          main: path.join(__dirname, '/index.html'),
          login: path.join(__dirname, PAGE_LOGIN),
        },
      },
    },
    esbuild: {
      // drop: isBuild ? ['console', 'debugger'] : undefined,
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "./src/assets/style/variables.scss";',
        },
      },
    },
    server:
      process.env.VSCODE_DEBUG &&
      (() => {
        const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
        return {
          host: url.hostname,
          port: +url.port,
        };
      })(),
    clearScreen: false,
  };
});
