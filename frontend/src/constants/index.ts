import { PublicKey } from "@solana/web3.js";

// Environment configuration with type safety
const ENV_CONFIG = {
  PROGRAM_ID: import.meta.env.VITE_PROGRAM_ID,
  REFRESH_INTERVAL: import.meta.env.VITE_REFRESH_INTERVAL,
  APP_TITLE: import.meta.env.VITE_APP_TITLE,
} as const;

// Program constants
export const PROGRAM_ID = new PublicKey(
  ENV_CONFIG.PROGRAM_ID || "8hMrECVej1KoLvygnfLytvGEuvQwGMT5jobXHkjjWpyS"
);

// Program seeds - centralized for consistency
export const PROGRAM_SEEDS = {
  ESCROW: "escrow",
} as const;

// Legacy export for backward compatibility
export const ESCROW_SEED = PROGRAM_SEEDS.ESCROW;

// Network-specific token addresses
export const TOKEN_ADDRESSES = {
  DEVNET: {
    USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  },
  MAINNET: {
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
} as const;

// Legacy export for backward compatibility
export const COMMON_TOKENS = TOKEN_ADDRESSES.DEVNET;

// UI configuration with better organization
export const UI_CONFIG = {
  REFRESH_INTERVAL: Number(ENV_CONFIG.REFRESH_INTERVAL) || 30_000, // 30 seconds
  TRANSACTION_TIMEOUT: 60_000, // 60 seconds
  APP_TITLE: ENV_CONFIG.APP_TITLE || "Escrow dApp",
  MAX_RETRIES: 3,
  DEBOUNCE_DELAY: 300, // ms
} as const;

// Legacy exports for backward compatibility
export const REFRESH_INTERVAL = UI_CONFIG.REFRESH_INTERVAL;
export const TRANSACTION_TIMEOUT = UI_CONFIG.TRANSACTION_TIMEOUT;
export const APP_TITLE = UI_CONFIG.APP_TITLE;

// User-facing error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet first",
  INSUFFICIENT_FUNDS: "Insufficient funds for this transaction",
  INVALID_AMOUNT: "Amount must be greater than 0",
  INVALID_ADDRESS: "Invalid token address",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  TIMEOUT_ERROR: "Transaction timed out. Please try again.",
} as const;

// Type exports for better type safety
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type NetworkType = keyof typeof TOKEN_ADDRESSES;
export type TokenSymbol = keyof typeof TOKEN_ADDRESSES.DEVNET;
