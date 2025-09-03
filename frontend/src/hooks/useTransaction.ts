import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import type { TransactionState } from "../types";

interface UseTransactionOptions {
  timeout?: number;
  maxRetries?: number;
}

export const useTransaction = (options: UseTransactionOptions = {}) => {
  const { connection } = useConnection();
  const [state, setState] = useState<TransactionState>({ status: "idle" });
  const { timeout = 60000, maxRetries = 0 } = options;

  const formatError = useCallback((error: any): string => {
    // Handle Solana-specific errors
    if (error?.logs) {
      const programError = error.logs.find(
        (log: string) => log.includes("Program log:") || log.includes("Error:")
      );
      if (programError) {
        return `Program error: ${programError}`;
      }
    }

    // Handle wallet errors
    if (error?.code === 4001) {
      return "Transaction rejected by user";
    }

    // Handle network errors
    if (error?.message?.includes("blockhash")) {
      return "Transaction expired. Please try again.";
    }

    if (error?.message?.includes("insufficient")) {
      return "Insufficient funds for transaction";
    }

    if (error?.message?.includes("timeout")) {
      return "Transaction timed out. Please try again.";
    }

    return error?.message || "Transaction failed";
  }, []);

  const executeTransaction = useCallback(
    async (transactionFn: () => Promise<string>): Promise<string | null> => {
      let lastError: any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setState({ status: "pending" });

          // Add timeout to transaction execution
          const signature = await Promise.race([
            transactionFn(),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("Transaction timeout")),
                timeout
              )
            ),
          ]);

          // Wait for confirmation using the latest blockhash
          const latestBlockhash = await connection.getLatestBlockhash();
          const confirmation = await connection.confirmTransaction(
            {
              signature,
              blockhash: latestBlockhash.blockhash,
              lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            },
            "confirmed"
          );

          if (confirmation.value.err) {
            throw new Error(
              `Transaction failed: ${confirmation.value.err.toString()}`
            );
          }

          setState({ status: "success", signature });
          return signature;
        } catch (error: any) {
          lastError = error;

          // Don't retry on user rejection or certain errors
          if (error?.code === 4001 || attempt === maxRetries) {
            break;
          }

          // Wait before retry
          if (attempt < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (attempt + 1))
            );
          }
        }
      }

      const errorMessage = formatError(lastError);
      setState({
        status: "error",
        error: errorMessage,
      });
      throw lastError;
    },
    [connection, timeout, maxRetries, formatError]
  );

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return {
    state,
    executeTransaction,
    reset,
    isLoading: state.status === "pending" || state.status === "confirming",
    isPending: state.status === "pending",
    isConfirming: state.status === "confirming",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    isIdle: state.status === "idle",
  };
};
