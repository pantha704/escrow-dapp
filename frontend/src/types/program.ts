import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface EscrowProgram extends Program {
  account: {
    escrow: {
      fetch: (address: PublicKey) => Promise<EscrowAccountData>;
      all: () => Promise<Array<{ publicKey: PublicKey; account: EscrowAccountData }>>;
    };
  };
}

export interface EscrowAccountData {
  seed: number;
  maker: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  receive: number;
  bump: number;
}