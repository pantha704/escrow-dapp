import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";

// Default values for test configuration
const DEFAULT_VALUES = {
  SEED: 42,
  DEPOSIT_AMOUNT: 1000,
  RECEIVE_AMOUNT: 500,
  TOKEN_DECIMALS: 6,
  AIRDROP_AMOUNT: 2 * LAMPORTS_PER_SOL,
} as const;

export const TEST_CONFIG = {
  SEED: new BN(process.env.TEST_SEED || DEFAULT_VALUES.SEED),
  DEPOSIT_AMOUNT: new BN(
    process.env.TEST_DEPOSIT_AMOUNT || DEFAULT_VALUES.DEPOSIT_AMOUNT
  ),
  RECEIVE_AMOUNT: new BN(
    process.env.TEST_RECEIVE_AMOUNT || DEFAULT_VALUES.RECEIVE_AMOUNT
  ),
  TOKEN_DECIMALS: parseInt(
    process.env.TEST_TOKEN_DECIMALS || DEFAULT_VALUES.TOKEN_DECIMALS.toString()
  ),
  AIRDROP_AMOUNT: parseInt(
    process.env.TEST_AIRDROP_AMOUNT || DEFAULT_VALUES.AIRDROP_AMOUNT.toString()
  ),
} as const;

export const ESCROW_SEEDS = {
  ESCROW: "escrow",
} as const;

export const TEST_ERRORS = {
  INVALID_AMOUNT: "InvalidAmount",
  INVALID_MAKER: "InvalidMaker",
  ACCOUNT_NOT_FOUND: "Account does not exist",
} as const;

export const TEST_TIMEOUTS = {
  AIRDROP_CONFIRMATION: 1_000,
  TRANSACTION_CONFIRMATION: 5_000,
  DEFAULT_TIMEOUT: 30_000,
} as const;

// Test helper functions
export const createTestBN = (value: number | string) => new BN(value);

export const getTestConfig = (overrides: Partial<typeof TEST_CONFIG> = {}) => ({
  ...TEST_CONFIG,
  ...overrides,
});
