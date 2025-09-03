// Global type declarations for browser polyfills

declare global {
  interface Window {
    Buffer: typeof import("buffer").Buffer;
  }

  var Buffer: typeof import("buffer").Buffer;
  var global: typeof globalThis;
}

export {};
