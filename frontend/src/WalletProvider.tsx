import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: React.ReactNode;
}

export const WalletContextProvider: React.FC<Props> = ({ children }) => {
  const endpoint = useMemo(() => {
    // Check for custom RPC URL first
    const customRpc = import.meta.env.VITE_SOLANA_RPC_URL;
    if (customRpc) {
      return customRpc;
    }

    // Fall back to network-based endpoint
    const networkName = (import.meta.env.VITE_SOLANA_NETWORK ||
      "devnet") as WalletAdapterNetwork;
    return clusterApiUrl(networkName);
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
