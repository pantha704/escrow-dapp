// Polyfills for Node.js modules in the browser
import { Buffer } from "buffer";

// Make Buffer available globally
(globalThis as any).Buffer = Buffer;
(globalThis as any).global = globalThis;

// Export for explicit imports
export { Buffer };
