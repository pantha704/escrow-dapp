import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import idl from "../idl.json";
import type { EscrowProgram } from "../types/program";

/**
 * Hook to get the Escrow program instance with proper provider setup
 * @returns Program instance or null if wallet not connected
 */
export const useEscrowProgram = (): EscrowProgram | null => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    const provider = new AnchorProvider(connection, wallet as any, {
      preflightCommitment: "confirmed",
    });
    setProvider(provider);

    return new Program(idl as any, provider) as EscrowProgram;
  }, [connection, wallet.publicKey]);

  return program;
};
