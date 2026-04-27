import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Lock } from "lucide-react";
import apiClient from "@/services/apiClient";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";

const TX_TYPE_ICON = {
  escrow_hold: <ArrowUpRight className="w-4 h-4 text-amber-500" />,
  escrow_release: <ArrowDownLeft className="w-4 h-4 text-teal-500" />,
  escrow_refund: <ArrowDownLeft className="w-4 h-4 text-blue-500" />,
  payout: <ArrowDownLeft className="w-4 h-4 text-teal-500" />,
  top_up: <ArrowDownLeft className="w-4 h-4 text-green-500" />,
  platform_fee: <ArrowUpRight className="w-4 h-4 text-red-400" />,
  dispute_hold: <Lock className="w-4 h-4 text-red-500" />,
};

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiClient.get("/payments/wallet").then((r) => r.data),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () =>
      apiClient.get("/payments/transactions", { params: { page: 1, page_size: 20 } }).then((r) => r.data),
  });

  if (walletLoading || txLoading) return <PageSpinner />;

  const transactions = txData?.items || [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">
        Wallet
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-accent p-6">
          <div className="text-sm text-slate-500 mb-1">Available Balance</div>
          <div className="text-3xl font-heading font-bold text-slate-900">
            {formatKES(wallet?.balance_kes || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{wallet?.currency || "KES"}</div>
        </div>
        <div className="card p-6 border-t-2 border-t-amber-400">
          <div className="text-sm text-slate-500 mb-1">In Escrow</div>
          <div className="text-3xl font-heading font-bold text-amber-600">
            {formatKES(wallet?.escrow_kes || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Held pending delivery</div>
        </div>
      </div>

      <h2 className="text-lg font-heading font-semibold mb-4">
        Transactions
        <span className="text-sm font-normal text-slate-400 ml-2">
          ({txData?.total || 0} total)
        </span>
      </h2>

      {transactions.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          No transactions yet
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {TX_TYPE_ICON[tx.transaction_type] || TX_TYPE_ICON.payout}
                <div>
                  <div className="text-sm font-medium text-slate-900 capitalize">
                    {tx.transaction_type.replace(/_/g, " ")}
                  </div>
                  {tx.description && (
                    <div className="text-xs text-slate-500 max-w-xs truncate">
                      {tx.description}
                    </div>
                  )}
                  {tx.reference && (
                    <div className="data-id">{tx.reference}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-data-mono font-semibold text-slate-900">
                  {formatKES(tx.amount_kes)}
                </div>
                <div className={`text-xs capitalize mt-0.5 ${
                  tx.status === "completed" ? "text-teal-600" :
                  tx.status === "failed" ? "text-red-600" : "text-slate-400"
                }`}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
