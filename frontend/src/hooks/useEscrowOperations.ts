import { useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useTransaction } from "./useTransaction";
import { useEscrowProgram } from "./useEscrowProgram";
import { useTokenValidation } from "./useTokenValidation";
import { 
  deriveEscrowPda, 
  deriveBaseTokenAccounts,
  deriveTakeTokenAccounts,
  validateEscrowParams,
} from "../utils/escrow";
import type { EscrowProgram, EscrowAccountData } from "../types/program";

interface CreateEscrowParams {
  seed: number;
  mintA: PublicKey;
  mintB: PublicKey;
  depositAmount: number;
  receiveAmount: number;
}

interface TakeEscrowParams {
  escrowPda: PublicKey;
}

interface RefundEscrowParams {
  escrowPda: PublicKey;
}

export const useEscrowOperations = () => {
  const wallet = useWallet();
  const program = useEscrowProgram() as EscrowProgram | null;
  const { validateTokenBalance } = useTokenValidation();
  const { executeTransaction, ...transactionState } = useTransaction({
    timeout: 90000, // 90 seconds for escrow operations
    maxRetries: 2,
  });

  // Helper function to validate prerequisites
  const validatePrerequisites = useCallback(() => {
    if (!program) {
      throw new Error("Program not available. Please check your connection.");
    }
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected. Please connect your wallet.");
    }
    return { program, publicKey: wallet.publicKey };
  }, [program, wallet.publicKey]);

  const createEscrow = useCallback(
    async (params: CreateEscrowParams) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected or program not available");
      }

      const { seed, mintA, mintB, depositAmount, receiveAmount } = params;
      
      // Validate parameters
      validateEscrowParams({ seed, depositAmount, receiveAmount });
      
      const seedBN = new BN(seed);
      const depositBN = new BN(depositAmount);
      const receiveBN = new BN(receiveAmount);

      return executeTransaction(async () => {
        // Derive escrow PDA
        const [escrowPda] = deriveEscrowPda(wallet.publicKey!, seed, program.programId);

        // Get token accounts
        const { vault, makerAtaA } = await deriveBaseTokenAccounts(
          escrowPda,
          wallet.publicKey!,
          mintA,
          mintB
        );

        // Verify token account exists and has sufficient balance
        await validateTokenBalance(makerAtaA, BigInt(depositAmount), mintA);

        // Execute transaction
        return await program.methods
          .make(seedBN, receiveBN, depositBN)
          .accounts({
            maker: wallet.publicKey!,
            escrow: escrowPda,
            mintA,
            mintB,
            makerAtaA,
            vault,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      });
    },
    [program, wallet.publicKey, validateTokenBalance, executeTransaction]
  );

  const takeEscrow = useCallback(
    async (params: TakeEscrowParams) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected or program not available");
      }

      const { escrowPda } = params;

      return executeTransaction(async () => {
        // Fetch escrow account
        const escrowAccount: EscrowAccountData = await program.account.escrow.fetch(escrowPda);

        // Derive token accounts
        const { vault, takerAtaA, takerAtaB, makerAtaB } = await deriveTakeTokenAccounts(
          escrowPda,
          escrowAccount.maker,
          wallet.publicKey!,
          escrowAccount.mintA,
          escrowAccount.mintB
        );

        // Verify taker has sufficient tokens
        await validateTokenBalance(
          takerAtaB!, 
          BigInt(escrowAccount.receive), 
          escrowAccount.mintB
        );

        // Execute transaction
        return await program.methods
          .take()
          .accounts({
            taker: wallet.publicKey!,
            maker: escrowAccount.maker,
            escrow: escrowPda,
            mintA: escrowAccount.mintA,
            mintB: escrowAccount.mintB,
            vault,
            takerAtaA: takerAtaA!,
            takerAtaB: takerAtaB!,
            makerAtaB,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      });
    },
    [program, wallet.publicKey, validateTokenBalance, executeTransaction]
  );

  const refundEscrow = useCallback(
    async (params: RefundEscrowParams) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected or program not available");
      }

      const { escrowPda } = params;

      return executeTransaction(async () => {
        // Fetch escrow account
        const escrowAccount: EscrowAccountData = await program.account.escrow.fetch(escrowPda);

        // Verify caller is the maker
        if (!escrowAccount.maker.equals(wallet.publicKey!)) {
          throw new Error("Only the escrow maker can refund");
        }

        // Derive token accounts
        const { vault, makerAtaA } = await deriveBaseTokenAccounts(
          escrowPda,
          wallet.publicKey!,
          escrowAccount.mintA,
          escrowAccount.mintB
        );

        // Execute transaction
        return await program.methods
          .refund()
          .accounts({
            maker: wallet.publicKey!,
            escrow: escrowPda,
            mintA: escrowAccount.mintA,
            vault,
            makerAtaA,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      });
    },
    [program, wallet.publicKey, executeTransaction]
  );

  return {
    createEscrow,
    takeEscrow,
    refundEscrow,
    ...transactionState,
  };
};
