import { PublicKey } from "@solana/web3.js";

export interface Escrow {
  publicKey: string;
  seed: string;
  maker: string;
  mintA: string;
  mintB: string;
  receive: string;
  vaultBalance: string;
}

export interface EscrowAccount {
  seed: number;
  maker: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  receive: number;
  bump: number;
}

export interface TokenAccountInfo {
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
  delegate?: PublicKey;
  state: number;
  isNative?: boolean;
  delegatedAmount: bigint;
  closeAuthority?: PublicKey;
}

export type TransactionStatus =
  | "idle"
  | "pending"
  | "confirming"
  | "success"
  | "error";

export interface TransactionState {
  status: TransactionStatus;
  signature?: string;
  error?: string;
  progress?: {
    step: string;
    currentAttempt?: number;
    maxAttempts?: number;
  };
}
