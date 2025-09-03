import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { ErrorDisplay } from "./ErrorDisplay";
import { useErrorHandler } from "../hooks/useErrorHandler";
import type { ErrorState } from "../hooks/useErrorHandler";

interface EscrowFormProps {
  program: any;
  onSuccess: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const EscrowForm: React.FC<EscrowFormProps> = ({
  program,
  onSuccess,
  loading,
  setLoading,
}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [seed, setSeed] = useState("");
  const [mintA, setMintA] = useState("");
  const [mintB, setMintB] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [error, setError] = useState<ErrorState | null>(null);
  const { handleError, clearError } = useErrorHandler(setError);

  // Form validation helper
  const validateForm = () => {
    const errors: string[] = [];

    if (!seed || isNaN(Number(seed))) {
      errors.push("Seed must be a valid number");
    }

    try {
      new PublicKey(mintA);
    } catch {
      errors.push("Token A mint address is invalid");
    }

    try {
      new PublicKey(mintB);
    } catch {
      errors.push("Token B mint address is invalid");
    }

    if (
      !depositAmount ||
      isNaN(Number(depositAmount)) ||
      Number(depositAmount) <= 0
    ) {
      errors.push("Deposit amount must be a positive number");
    }

    if (
      !receiveAmount ||
      isNaN(Number(receiveAmount)) ||
      Number(receiveAmount) <= 0
    ) {
      errors.push("Receive amount must be a positive number");
    }

    return errors;
  };

  const createEscrow = async () => {
    if (!program || !wallet.publicKey || !wallet.sendTransaction) {
      handleError(new Error("Wallet not connected"), "create escrow");
      return;
    }

    // Validate form before proceeding
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      handleError(new Error(validationErrors.join(", ")), "validate form");
      return;
    }

    try {
      setLoading(true);
      clearError();

      const seedBN = new BN(seed);
      const depositBN = new BN(depositAmount);
      const receiveBN = new BN(receiveAmount);
      const mintAPubkey = new PublicKey(mintA);
      const mintBPubkey = new PublicKey(mintB);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          wallet.publicKey.toBuffer(),
          seedBN.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const vaultPda = await getAssociatedTokenAddress(
        mintAPubkey,
        escrowPda,
        true
      );
      const makerAtaA = await getAssociatedTokenAddress(
        mintAPubkey,
        wallet.publicKey
      );

      // Verify token account exists and has sufficient balance
      try {
        const tokenAccount = await getAccount(connection, makerAtaA);
        console.log("Token account verified:", makerAtaA.toString());

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
          `Token account for ${mintAPubkey.toString()} not found. Please create it first in your wallet.`
        );
      }

      const tx = await program.methods
        .make(seedBN, receiveBN, depositBN)
        .accounts({
          maker: wallet.publicKey,
          escrow: escrowPda,
          mintA: mintAPubkey,
          mintB: mintBPubkey,
          makerAtaA: makerAtaA,
          vault: vaultPda,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Escrow created:", tx);
      onSuccess();

      // Reset form
      resetForm();
    } catch (error: any) {
      handleError(error, "create escrow");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSeed("");
    setMintA("");
    setMintB("");
    setDepositAmount("");
    setReceiveAmount("");
  };

  const isFormValid = () => {
    return (
      validateForm().length === 0 &&
      seed &&
      mintA &&
      mintB &&
      depositAmount &&
      receiveAmount
    );
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
      <h2 className="text-2xl font-bold mb-6 text-purple-300">Create Escrow</h2>
      <ErrorDisplay error={error} onClose={clearError} />
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Seed (number)"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700/50 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white"
        />
        <input
          type="text"
          placeholder="Token A Mint Address"
          value={mintA}
          onChange={(e) => setMintA(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700/50 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white"
        />
        <input
          type="text"
          placeholder="Token B Mint Address"
          value={mintB}
          onChange={(e) => setMintB(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700/50 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white"
        />
        <input
          type="text"
          placeholder="Deposit Amount (Token A)"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700/50 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white"
        />
        <input
          type="text"
          placeholder="Receive Amount (Token B)"
          value={receiveAmount}
          onChange={(e) => setReceiveAmount(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700/50 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white"
        />
        <button
          onClick={createEscrow}
          disabled={loading || !isFormValid()}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Create Escrow"}
        </button>
      </div>
    </div>
  );
};
