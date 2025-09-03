/**
 * Environment configuration with validation and type safety
 */

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

// Environment variable validation
const validateEnvVar = (
  key: string,
  value: string | undefined,
  required = false
): string | undefined => {
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

// Environment configuration
export const ENV = {
  // Program configuration
  PROGRAM_ID: validateEnvVar(
    "VITE_PROGRAM_ID",
    import.meta.env.VITE_PROGRAM_ID
  ),

  // Network configuration
  SOLANA_NETWORK:
    validateEnvVar(
      "VITE_SOLANA_NETWORK",
      import.meta.env.VITE_SOLANA_NETWORK
    ) || "devnet",
  SOLANA_RPC_URL: validateEnvVar(
    "VITE_SOLANA_RPC_URL",
    import.meta.env.VITE_SOLANA_RPC_URL
  ),

  // UI configuration
  APP_TITLE:
    validateEnvVar("VITE_APP_TITLE", import.meta.env.VITE_APP_TITLE) ||
    "Escrow dApp",
  REFRESH_INTERVAL:
    Number(
      validateEnvVar(
        "VITE_REFRESH_INTERVAL",
        import.meta.env.VITE_REFRESH_INTERVAL
      )
    ) || 30_000,

  // Development flags
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// Derived configuration
export const NETWORK_CONFIG = {
  network: ENV.SOLANA_NETWORK as WalletAdapterNetwork,
  endpoint:
    ENV.SOLANA_RPC_URL ||
    clusterApiUrl(ENV.SOLANA_NETWORK as WalletAdapterNetwork),
} as const;

// Type exports
export type NetworkType = typeof ENV.SOLANA_NETWORK;
export type EnvironmentType = typeof ENV;
