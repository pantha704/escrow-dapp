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
 * Derives all required token accounts for escrow operations
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
 * Validates escrow parameters
 */
export const validateEscrowParams = (params: {
  seed: number;
  depositAmount: number;
  receiveAmount: number;
}) => {
  const { seed, depositAmount, receiveAmount } = params;
  
  if (seed < 0 || seed > Number.MAX_SAFE_INTEGER) {
    throw new Error("Seed must be a valid positive number");
  }
  
  if (depositAmount <= 0) {
    throw new Error("Deposit amount must be greater than 0");
  }
  
  if (receiveAmount <= 0) {
    throw new Error("Receive amount must be greater than 0");
  }
};