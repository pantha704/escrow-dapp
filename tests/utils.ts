import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { ESCROW_SEEDS } from "./constants";

export const deriveEscrowPda = (
  maker: PublicKey,
  seed: BN,
  programId: PublicKey
): PublicKey => {
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(ESCROW_SEEDS.ESCROW),
      maker.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
  return escrowPda;
};

export const deriveTokenAccounts = async (
  escrowPda: PublicKey,
  maker: PublicKey,
  taker: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey
) => {
  return {
    vault: await getAssociatedTokenAddress(mintA, escrowPda, true),
    makerAtaA: await getAssociatedTokenAddress(mintA, maker),
    makerAtaB: await getAssociatedTokenAddress(mintB, maker),
    takerAtaA: await getAssociatedTokenAddress(mintA, taker),
    takerAtaB: await getAssociatedTokenAddress(mintB, taker),
  };
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Type-safe account derivation helper
export interface TokenAccountSet {
  vault: PublicKey;
  makerAtaA: PublicKey;
  makerAtaB: PublicKey;
  takerAtaA: PublicKey;
  takerAtaB: PublicKey;
}

export const createTokenAccountSet = async (
  escrowPda: PublicKey,
  maker: PublicKey,
  taker: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey
): Promise<TokenAccountSet> => {
  return deriveTokenAccounts(escrowPda, maker, taker, mintA, mintB);
};
