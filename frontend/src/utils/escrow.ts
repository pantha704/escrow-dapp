import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";

/**
 * Derives the escrow PDA for a given maker and seed
 */
export const deriveEscrowPda = (
  maker: PublicKey,
  seed: number,
  programId: PublicKey
): [PublicKey, number] => {
  const seedBN = new BN(seed);
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      maker.toBuffer(),
      seedBN.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
};

/**
 * Derives base token accounts for escrow operations (maker-only)
 */
export const deriveBaseTokenAccounts = async (
  escrowPda: PublicKey,
  maker: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey
) => {
  const vault = await getAssociatedTokenAddress(mintA, escrowPda, true);
  const makerAtaA = await getAssociatedTokenAddress(mintA, maker);
  const makerAtaB = await getAssociatedTokenAddress(mintB, maker);
  
  return {
    vault,
    makerAtaA,
    makerAtaB,
  };
};

/**
 * Derives token accounts for take operations (includes taker accounts)
 */
export const deriveTakeTokenAccounts = async (
  escrowPda: PublicKey,
  maker: PublicKey,
  taker: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey
) => {
  const vault = await getAssociatedTokenAddress(mintA, escrowPda, true);
  const makerAtaB = await getAssociatedTokenAddress(mintB, maker);
  const takerAtaA = await getAssociatedTokenAddress(mintA, taker);
  const takerAtaB = await getAssociatedTokenAddress(mintB, taker);
  
  return {
    vault,
    makerAtaB,
    takerAtaA,
    takerAtaB,
  };
};

/**
 * Derives all required token accounts for escrow operations (legacy - kept for compatibility)
 * @deprecated Use deriveBaseTokenAccounts or deriveTakeTokenAccounts instead
 */
export const deriveEscrowTokenAccounts = async (
  escrowPda: PublicKey,
  maker: PublicKey,
  taker: PublicKey | null,
  mintA: PublicKey,
  mintB: PublicKey
) => {
  const vault = await getAssociatedTokenAddress(mintA, escrowPda, true);
  const makerAtaA = await getAssociatedTokenAddress(mintA, maker);
  const makerAtaB = await getAssociatedTokenAddress(mintB, maker);
  
  const accounts = {
    vault,
    makerAtaA,
    makerAtaB,
  };

  if (taker) {
    return {
      ...accounts,
      takerAtaA: await getAssociatedTokenAddress(mintA, taker),
      takerAtaB: await getAssociatedTokenAddress(mintB, taker),
    };
  }

  return accounts;
};

/**
 * Validates escrow parameters with comprehensive checks
 */
export const validateEscrowParams = (params: {
  seed: number;
  depositAmount: number;
  receiveAmount: number;
}) => {
  const { seed, depositAmount, receiveAmount } = params;
  
  // Validate seed
  if (!Number.isInteger(seed) || seed < 0 || seed > Number.MAX_SAFE_INTEGER) {
    throw new Error("Seed must be a valid non-negative integer");
  }
  
  // Validate deposit amount
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    throw new Error("Deposit amount must be a positive number greater than 0");
  }
  
  // Validate receive amount
  if (!Number.isFinite(receiveAmount) || receiveAmount <= 0) {
    throw new Error("Receive amount must be a positive number greater than 0");
  }
  
  // Check for reasonable limits (prevent overflow)
  const MAX_AMOUNT = Number.MAX_SAFE_INTEGER;
  if (depositAmount > MAX_AMOUNT || receiveAmount > MAX_AMOUNT) {
    throw new Error("Amount exceeds maximum allowed value");
  }
};

/**
 * Validates that required PublicKeys are valid
 */
export const validatePublicKeys = (keys: Record<string, PublicKey | null | undefined>) => {
  for (const [name, key] of Object.entries(keys)) {
    if (!key) {
      throw new Error(`${name} is required`);
    }
    try {
      // Validate it's a proper PublicKey
      new PublicKey(key.toString());
    } catch {
      throw new Error(`${name} is not a valid PublicKey`);
    }
  }
};