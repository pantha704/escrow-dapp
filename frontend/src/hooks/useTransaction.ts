import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import type { TransactionState } from "../types";

// Constants for better maintainability
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const DEFAULT_MAX_RETRIES = 2;
const MAX_BACKOFF_DELAY = 10000; // 10 seconds
const BACKOFF_BASE = 2;

// Error codes that should not be retried
const NON_RETRYABLE_ERROR_CODES = [4001, 4100] as const;
const NON_RETRYABLE_ERROR_KEYWORDS = [
  "insufficient",
  "invalid",
  "unauthorized",
  "rejected"
] as const;

interface UseTransactionOptions {
  timeout?: number;
  maxRetries?: number;
}

type TransactionFunction = () => Promise<string>;

export const useTransaction = (options: UseTransactionOptions = {}) => {
  const { connection } = useConnection();
  const [state, setState] = useState<TransactionState>({ status: "idle" });
  const { 
    timeout = DEFAULT_TIMEOUT, 
    maxRetries = DEFAULT_MAX_RETRIES 
  } = options;

  const formatError = useCallback((error: any): string => {
    // Handle Solana program errors
    if (error?.logs) {
      const programError = error.logs.find(
        (log: string) => log.includes("Program log:") || log.includes("Error:")
      );
      if (programError) {
        return `Program error: ${programError.replace(/^Program log: /, "")}`;
      }
    }

    // Handle specific error codes
    const errorCode = error?.code;
    switch (errorCode) {
      case 4001:
        return "Transaction rejected by user";
      case 4100:
        return "Wallet not connected";
      case -32603:
        return "Network error. Please check your connection.";
      default:
        break;
    }

    // Handle message-based errors with better categorization
    const message = error?.message?.toLowerCase() || "";
    
    if (message.includes("blockhash") || message.includes("expired")) {
      return "Transaction expired. Please try again.";
    }
    
    if (message.includes("insufficient")) {
      return "Insufficient funds for transaction";
    }
    
    if (message.includes("timeout")) {
      return "Transaction timed out. Please try again.";
    }
    
    if (message.includes("simulation failed")) {
      return "Transaction simulation failed. Please check your inputs.";
    }
    
    if (message.includes("account not found")) {
      return "Required account not found. Please ensure all tokens are properly initialized.";
    }

    // Return original message or generic fallback
    return error?.message || "Transaction failed unexpectedly";
  }, []);

  const executeWithTimeout = useCallback(
    async (transactionFn: () => Promise<string>): Promise<string> => {
      return Promise.race([
        transactionFn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Transaction timeout")), timeout)
        ),
      ]);
    },
    [timeout]
  );

  const confirmTransaction = useCallback(
    async (signature: string): Promise<void> => {
      setState({ status: "confirming" });
      
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
    },
    [connection]
  );

  const shouldRetry = useCallback((error: any, attempt: number): boolean => {
    // Don't retry if max attempts reached
    if (attempt >= maxRetries) return false;
    
    // Don't retry on specific error codes
    if (NON_RETRYABLE_ERROR_CODES.includes(error?.code)) return false;
    
    // Don't retry on certain permanent errors
    const errorMessage = error?.message?.toLowerCase() || "";
    if (NON_RETRYABLE_ERROR_KEYWORDS.some(keyword => errorMessage.includes(keyword))) {
      return false;
    }
    
    return true;
  }, [maxRetries]);

  const executeTransaction = useCallback(
    async (transactionFn: () => Promise<string>): Promise<string | null> => {
      let lastError: any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setState({ 
            status: "pending",
            progress: {
              step: "Executing transaction",
              currentAttempt: attempt + 1,
              maxAttempts: maxRetries + 1
            }
          });

          const signature = await executeWithTimeout(transactionFn);
          await confirmTransaction(signature);

          setState({ status: "success", signature });
          return signature;
        } catch (error: any) {
          lastError = error;

          if (!shouldRetry(error, attempt)) {
            break;
          }

          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          const jitter = Math.random() * 0.1 * delay;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
      }

      const errorMessage = formatError(lastError);
      setState({
        status: "error",
        error: errorMessage,
      });
      throw lastError;
    },
    [executeWithTimeout, confirmTransaction, shouldRetry, formatError, maxRetries]
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
