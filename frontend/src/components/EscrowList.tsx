import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

interface Escrow {
  publicKey: string;
  seed: string;
  maker: string;
  mintA: string;
  mintB: string;
  receive: string;
  vaultBalance: string;
}

interface EscrowListProps {
  escrows: Escrow[];
  program: any;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onRefresh: () => void;
}

export const EscrowList: React.FC<EscrowListProps> = ({
  escrows,
  program,
  loading,
  setLoading,
  onRefresh,
}) => {
  const wallet = useWallet();

  const takeEscrow = async (escrow: Escrow) => {
    if (!program || !wallet.publicKey) return;

    try {
      setLoading(true);

      const escrowPubkey = new PublicKey(escrow.publicKey);
      const makerPubkey = new PublicKey(escrow.maker);
      const mintAPubkey = new PublicKey(escrow.mintA);
      const mintBPubkey = new PublicKey(escrow.mintB);

      const vaultPda = await getAssociatedTokenAddress(
        mintAPubkey,
        escrowPubkey,
        true
      );
      const takerAtaA = await getAssociatedTokenAddress(
        mintAPubkey,
        wallet.publicKey
      );
      const takerAtaB = await getAssociatedTokenAddress(
        mintBPubkey,
        wallet.publicKey
      );
      const makerAtaB = await getAssociatedTokenAddress(
        mintBPubkey,
        makerPubkey
      );

      const tx = await program.methods
        .take()
        .accounts({
          taker: wallet.publicKey,
          maker: makerPubkey,
          escrow: escrowPubkey,
          mintA: mintAPubkey,
          mintB: mintBPubkey,
          vault: vaultPda,
          takerAtaA: takerAtaA,
          takerAtaB: takerAtaB,
          makerAtaB: makerAtaB,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction signature:", tx);
      onRefresh();
    } catch (error: any) {
      console.error("Failed to take escrow:", error);
      alert("Failed to take escrow: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refundEscrow = async (escrow: Escrow) => {
    if (!program || !wallet.publicKey) return;

    try {
      setLoading(true);

      const escrowPubkey = new PublicKey(escrow.publicKey);
      const mintAPubkey = new PublicKey(escrow.mintA);

      const vaultPda = await getAssociatedTokenAddress(
        mintAPubkey,
        escrowPubkey,
        true
      );
      const makerAtaA = await getAssociatedTokenAddress(
        mintAPubkey,
        wallet.publicKey
      );

      const tx = await program.methods
        .refund()
        .accounts({
          maker: wallet.publicKey,
          escrow: escrowPubkey,
          mintA: mintAPubkey,
          vault: vaultPda,
          makerAtaA: makerAtaA,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction signature:", tx);
      onRefresh();
    } catch (error: any) {
      console.error("Failed to refund escrow:", error);
      alert("Failed to refund escrow: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
      <h2 className="text-2xl font-bold mb-6 text-purple-300">
        Active Escrows
      </h2>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {escrows.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No active escrows found
          </p>
        ) : (
          escrows.map((escrow) => (
            <div
              key={escrow.publicKey}
              className="bg-gray-700/50 rounded-lg p-4 border border-purple-500/20"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Seed:</span>
                  <span className="font-mono text-purple-300">
                    {escrow.seed}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Vault Balance:</span>
                  <span className="font-mono text-purple-300">
                    {escrow.vaultBalance}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    Expected Token B:
                  </span>
                  <span className="font-mono text-purple-300">
                    {escrow.receive}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  {escrow.maker === wallet.publicKey?.toString() ? (
                    <button
                      onClick={() => refundEscrow(escrow)}
                      disabled={loading}
                      className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      Refund
                    </button>
                  ) : (
                    <button
                      onClick={() => takeEscrow(escrow)}
                      disabled={loading}
                      className="flex-1 py-2 bg-green-600 rounded-lg text-sm font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                    >
                      Take Escrow
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="w-full mt-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-all disabled:opacity-50"
      >
        Refresh
      </button>
    </div>
  );
};
