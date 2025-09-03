import { useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";

/**
 * Hook for validating token accounts and balances
 */
export const useTokenValidation = () => {
  const { connection } = useConnection();

  const validateTokenBalance = useCallback(
    async (tokenAccount: PublicKey, requiredAmount: bigint, mintAddress: PublicKey) => {
      try {
        const account = await getAccount(connection, tokenAccount);
        
        if (account.amount < requiredAmount) {
          throw new Error(
            `Insufficient token balance. Required: ${requiredAmount}, Available: ${account.amount}`
          );
        }
        
        return account;
      } catch (error: any) {
        if (error.message.includes("Insufficient")) {
          throw error;
        }
        throw new Error(
          `Token account for ${mintAddress.toString()} not found. Please create it first in your wallet.`
        );
      }
    },
    [connection]
  );

  return { validateTokenBalance };
};