import { useMemo } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";

interface AppConfig {
  network: WalletAdapterNetwork;
  rpcEndpoint: string;
  programId: PublicKey;
  appTitle: string;
  refreshInterval: number;
  transactionTimeout: number;
  isDevelopment: boolean;
}

export const useAppConfig = (): AppConfig => {
  return useMemo(() => {
    const network = (import.meta.env.VITE_SOLANA_NETWORK ||
      "devnet") as WalletAdapterNetwork;
    const customRpc = import.meta.env.VITE_SOLANA_RPC_URL;

    return {
      network,
      rpcEndpoint: customRpc || clusterApiUrl(network),
      programId: new PublicKey(
        import.meta.env.VITE_PROGRAM_ID ||
          "8hMrECVej1KoLvygnfLytvGEuvQwGMT5jobXHkjjWpyS"
      ),
      appTitle: import.meta.env.VITE_APP_TITLE || "Escrow dApp",
      refreshInterval: Number(import.meta.env.VITE_REFRESH_INTERVAL) || 30_000,
      transactionTimeout: 90_000, // 90 seconds
      isDevelopment: import.meta.env.DEV,
    };
  }, []);
};
