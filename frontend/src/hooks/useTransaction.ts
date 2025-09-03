import { useState, useCallback, useRef, useEffect } from "react";
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

/**
 * Configuration options for the useTransaction hook
 */
interface UseTransactionOptions {
  /** Timeout in milliseconds for transaction execution (default: 60000) */
  timeout?: number;
  /** Maximum number of retry attempts (default: 2) */
  maxRetries?: number;
}

/**
 * Function that executes a transaction and returns the signature
 */
type TransactionFunction = () => Promise<string>;

/**
 * Hook for managing Solana transaction execution with retry logic, timeout handling,
 * and comprehensive error management.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Transaction timeout handling
 * - Comprehensive error classification
 * - Progress tracking
 * - Cancellation support
 * - Proper cleanup on unmount
 * 
 * @param options Configuration options for transaction behavior
 * @returns Transaction state and control functions
 */
export const useTransaction = (options: UseTransactionOptions = {}) => {
  const { connection } = useConnection();
  const [state, setState] = useState<TransactionState>({ status: "idle" });
  const abortControllerRef = useRef<AbortController | null>(null);
  const { 
    timeout = DEFAULT_TIMEOUT, 
    maxRetries = DEFAULT_MAX_RETRIES 
  } = options;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({ status: "idle" });
  }, []);

  const executeTransaction = useCallback(
    async (transactionFn: TransactionFunction): Promise<string | null> => {
      // Cancel any existing transaction
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      
      let lastError: any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Check if cancelled
          if (abortControllerRef.current.signal.aborted) {
            throw new Error("Transaction cancelled");
          }

          setState({ 
            status: "pending",
            progress: {
              step: "Executing transaction",
              currentAttempt: attempt + 1,
              maxAttempts: maxRetries + 1
            }
          });

          const signature = await executeWithTimeout(transactionFn);
          
          // Check if cancelled before confirmation
          if (abortControllerRef.current.signal.aborted) {
            throw new Error("Transaction cancelled");
          }
          
          await confirmTransaction(signature);

          setState({ status: "success", signature });
          return signature;
        } catch (error: any) {
          lastError = error;

          // Don't retry if cancelled
          if (error.message === "Transaction cancelled") {
            setState({ status: "idle" });
            return null;
          }

          if (!shouldRetry(error, attempt)) {
            break;
          }

          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(BACKOFF_BASE, attempt), MAX_BACKOFF_DELAY);
          const jitter = Math.random() * 0.1 * delay;
          
          // Cancellable delay
          await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(resolve, delay + jitter);
            abortControllerRef.current?.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new Error("Transaction cancelled"));
            });
          });
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
    cancel,
    reset,
    // Computed state helpers
    isLoading: state.status === "pending" || state.status === "confirming",
    isPending: state.status === "pending",
    isConfirming: state.status === "confirming",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    isIdle: state.status === "idle",
    // Progress information
    progress: state.progress,
  };
};
