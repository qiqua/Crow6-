/// <reference types="vite/client" />

import type { Crow6Api } from '../electron/preload';

declare global {
  interface Window {
    crow6?: Crow6Api;
  }
}
