import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { formatTokenAmount, truncateAddress } from "../utils/tokenFormat";
import { useEscrowOperations } from "../hooks/useEscrowOperations";

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
  onRefresh: () => void;
}

export const EscrowList: React.FC<EscrowListProps> = ({
  escrows,
  onRefresh,
}) => {
  const wallet = useWallet();
  const { takeEscrow, refundEscrow, isLoading } = useEscrowOperations();

  const handleTakeEscrow = async (escrow: Escrow) => {
    if (!wallet.publicKey) return;

    try {
      const escrowPubkey = new PublicKey(escrow.publicKey);
      await takeEscrow({ escrowPda: escrowPubkey });
      onRefresh();
    } catch (error: any) {
      console.error("Failed to take escrow:", error);
      alert("Failed to take escrow: " + error.message);
    }
  };

  const handleRefundEscrow = async (escrow: Escrow) => {
    if (!wallet.publicKey) return;

    try {
      const escrowPubkey = new PublicKey(escrow.publicKey);
      await refundEscrow({ escrowPda: escrowPubkey });
      onRefresh();
    } catch (error: any) {
      console.error("Failed to refund escrow:", error);
      alert("Failed to refund escrow: " + error.message);
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
                    {formatTokenAmount(escrow.vaultBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    Expected Token B:
                  </span>
                  <span className="font-mono text-purple-300">
                    {formatTokenAmount(escrow.receive)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Maker:</span>
                  <span className="font-mono text-purple-300 text-xs">
                    {truncateAddress(escrow.maker)}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  {escrow.maker === wallet.publicKey?.toString() ? (
                    <button
                      onClick={() => handleRefundEscrow(escrow)}
                      disabled={isLoading}
                      className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      Refund
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTakeEscrow(escrow)}
                      disabled={isLoading}
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
        disabled={isLoading}
        className="w-full mt-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-all disabled:opacity-50"
      >
        Refresh
      </button>
    </div>
  );
};
