import { PublicKey } from "@solana/web3.js";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validatePublicKey = (address: string): ValidationResult => {
  if (!address.trim()) {
    return { isValid: false, error: "Address is required" };
  }

  try {
    new PublicKey(address);
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid public key format" };
  }
};

export const validateAmount = (amount: string): ValidationResult => {
  if (!amount.trim()) {
    return { isValid: false, error: "Amount is required" };
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: "Amount must be a positive number" };
  }

  if (!Number.isInteger(numAmount)) {
    return { isValid: false, error: "Amount must be a whole number" };
  }

  return { isValid: true };
};

export const validateSeed = (seed: string): ValidationResult => {
  if (!seed.trim()) {
    return { isValid: false, error: "Seed is required" };
  }

  const numSeed = Number(seed);
  if (isNaN(numSeed) || numSeed < 0 || !Number.isInteger(numSeed)) {
    return { isValid: false, error: "Seed must be a non-negative integer" };
  }

  return { isValid: true };
};
