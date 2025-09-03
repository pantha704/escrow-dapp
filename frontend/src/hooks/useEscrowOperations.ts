import { useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { useTransaction } from "./useTransaction";
import { useEscrowProgram } from "./useEscrowProgram";

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
  const { connection } = useConnection();
  const program = useEscrowProgram();
  const { executeTransaction, ...transactionState } = useTransaction({
    timeout: 90000, // 90 seconds for escrow operations
    maxRetries: 2,
  });

  const createEscrow = useCallback(
    async (params: CreateEscrowParams) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected or program not available");
      }

      const { seed, mintA, mintB, depositAmount, receiveAmount } = params;
      const seedBN = new BN(seed);
      const depositBN = new BN(depositAmount);
      const receiveBN = new BN(receiveAmount);

      return executeTransaction(async () => {
        // Derive escrow PDA
        const [escrowPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("escrow"),
            wallet.publicKey!.toBuffer(),
            seedBN.toArrayLike(Buffer, "le", 8),
          ],
          program.programId
        );

        // Get token accounts
        const vaultPda = await getAssociatedTokenAddress(
          mintA,
          escrowPda,
          true
        );
        const makerAtaA = await getAssociatedTokenAddress(
          mintA,
          wallet.publicKey!
        );

        // Verify token account exists and has sufficient balance
        try {
          const tokenAccount = await getAccount(connection, makerAtaA);
          if (tokenAccount.amount < BigInt(depositAmount)) {
            throw new Error(
              `Insufficient token balance. Required: ${depositAmount}, Available: ${tokenAccount.amount}`
            );
          }
        } catch (error: any) {
          if (error.message.includes("Insufficient")) {
            throw error;
          }
          throw new Error(
            `Token account for ${mintA.toString()} not found. Please create it first in your wallet.`
          );
        }

        // Execute transaction
        return await program.methods
          .make(seedBN, receiveBN, depositBN)
          .accounts({
            maker: wallet.publicKey!,
            escrow: escrowPda,
            mintA,
            mintB,
            makerAtaA,
            vault: vaultPda,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      });
    },
    [program, wallet.publicKey, connection, executeTransaction]
  );

  const takeEscrow = useCallback(
    async (params: TakeEscrowParams) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected or program not available");
      }

      const { escrowPda } = params;

      return executeTransaction(async () => {
        // Fetch escrow account
        const escrowAccount = await program.account.escrow.fetch(escrowPda);

        // Derive token accounts
        const vault = await getAssociatedTokenAddress(
          escrowAccount.mintA,
          escrowPda,
          true
        );
        const takerAtaA = await getAssociatedTokenAddress(
          escrowAccount.mintA,
          wallet.publicKey!
        );
        const takerAtaB = await getAssociatedTokenAddress(
          escrowAccount.mintB,
          wallet.publicKey!
        );
        const makerAtaB = await getAssociatedTokenAddress(
          escrowAccount.mintB,
          escrowAccount.maker
        );

        // Verify taker has sufficient tokens
        try {
          const takerTokenAccount = await getAccount(connection, takerAtaB);
          if (
            takerTokenAccount.amount < BigInt(escrowAccount.receive.toString())
          ) {
            throw new Error(
              `Insufficient token balance. Required: ${escrowAccount.receive}, Available: ${takerTokenAccount.amount}`
            );
          }
        } catch (error: any) {
          if (error.message.includes("Insufficient")) {
            throw error;
          }
          throw new Error(
            `Token account for ${escrowAccount.mintB.toString()} not found. Please create it first in your wallet.`
          );
        }

        // Execute transaction
        return await program.methods
          .take()
          .accounts({
            taker: wallet.publicKey!,
            escrow: escrowPda,
            mintA: escrowAccount.mintA,
            mintB: escrowAccount.mintB,
            vault,
            takerAtaA,
            takerAtaB,
            makerAtaB,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      });
    },
    [program, wallet.publicKey, connection, executeTransaction]
  );

  const refundEscrow = useCallback(
    async (params: RefundEscrowParams) => {
      if (!program || !wallet.publicKey) {
        throw new Error("Wallet not connected or program not available");
      }

      const { escrowPda } = params;

      return executeTransaction(async () => {
        // Fetch escrow account
        const escrowAccount = await program.account.escrow.fetch(escrowPda);

        // Verify caller is the maker
        if (!escrowAccount.maker.equals(wallet.publicKey!)) {
          throw new Error("Only the escrow maker can refund");
        }

        // Derive token accounts
        const vault = await getAssociatedTokenAddress(
          escrowAccount.mintA,
          escrowPda,
          true
        );
        const makerAtaA = await getAssociatedTokenAddress(
          escrowAccount.mintA,
          wallet.publicKey!
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
