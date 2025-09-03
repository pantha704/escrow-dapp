/// <reference types="vite/client" />

import { Buffer } from "buffer";

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

interface ImportMetaEnv {
  readonly VITE_SOLANA_NETWORK: string;
  readonly VITE_SOLANA_RPC_URL: string;
  readonly VITE_PROGRAM_ID: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_REFRESH_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
