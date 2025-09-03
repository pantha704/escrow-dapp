import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { BlueshiftAnchorEscrow } from "./idl";

export type EscrowProgram = Program<BlueshiftAnchorEscrow>;

export interface EscrowAccountData {
  seed: BN;
  maker: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  receive: BN;
  bump: number;
}