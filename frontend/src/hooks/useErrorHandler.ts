import { useCallback } from "react";

export interface ErrorState {
  message: string;
  type: "error" | "warning" | "info";
}

export const useErrorHandler = (
  setError: (error: ErrorState | null) => void
) => {
  const handleError = useCallback(
    (error: any, context?: string) => {
      console.error(`Error in ${context}:`, error);

      let message = "An unexpected error occurred";

      if (error?.message) {
        // Parse common Solana/Anchor errors
        if (error.message.includes("insufficient funds")) {
          message = "Insufficient funds for this transaction";
        } else if (error.message.includes("InvalidAmount")) {
          message = "Invalid amount - must be greater than 0";
        } else if (error.message.includes("Account does not exist")) {
          message = "Escrow not found - it may have been completed or refunded";
        } else if (error.message.includes("User rejected")) {
          message = "Transaction was cancelled";
        } else {
          message = error.message;
        }
      }

      setError({ message, type: "error" });
    },
    [setError]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return { handleError, clearError };
};
