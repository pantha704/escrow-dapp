import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { useEscrowProgram } from "./hooks/useEscrowProgram";
import { EscrowForm } from "./components/EscrowForm";
import { EscrowList } from "./components/EscrowList";

interface Escrow {
  publicKey: string;
  seed: string;
  maker: string;
  mintA: string;
  mintB: string;
  receive: string;
  vaultBalance: string;
}

function App() {
  const wallet = useWallet();
  const program = useEscrowProgram();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEscrows = useCallback(async () => {
    if (!program || !wallet.publicKey) return;

    try {
      setLoading(true);
      const accounts = await (program.account as any).escrow.all();

      const escrowData = await Promise.all(
        accounts.map(async (account: any) => {
          const escrowPda = account.publicKey;
          const vaultPda = await getAssociatedTokenAddress(
            new PublicKey(account.account.mintA),
            escrowPda,
            true
          );

          let vaultBalance = "0";
          try {
            const vaultAccount = await getAccount(
              program.provider.connection,
              vaultPda
            );
            vaultBalance = vaultAccount.amount.toString();
          } catch (e) {
            console.log("Vault not found or empty");
          }

          return {
            publicKey: escrowPda.toString(),
            seed: account.account.seed.toString(),
            maker: account.account.maker.toString(),
            mintA: account.account.mintA.toString(),
            mintB: account.account.mintB.toString(),
            receive: account.account.receive.toString(),
            vaultBalance,
          };
        })
      );

      setEscrows(escrowData);
    } catch (error) {
      console.error("Failed to fetch escrows:", error);
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey]);

  useEffect(() => {
    if (wallet.publicKey) {
      fetchEscrows();
    }
  }, [wallet.publicKey, fetchEscrows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Escrow
        </h1>

        <div className="flex justify-center mb-8">
          <WalletMultiButton />
        </div>

        {wallet.publicKey && (
          <>
            {/* <div className="mb-8 text-center">
              <p className="text-sm opacity-75">Connected Wallet</p>
              <p className="font-mono text-purple-300">
                {wallet.publicKey.toString()}
              </p>
            </div> */}

            <div className="grid lg:grid-cols-2 gap-8">
              <EscrowForm
                program={program}
                onSuccess={fetchEscrows}
                loading={loading}
                setLoading={setLoading}
              />
              <EscrowList
                escrows={escrows}
                program={program}
                loading={loading}
                setLoading={setLoading}
                onRefresh={fetchEscrows}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
