import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { driverApi } from "@/features/driver/api/driverApi";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatKES } from "@/utils/currency";

const TX_ICONS = {
  payout: <ArrowDownLeft className="w-4 h-4 text-teal-500" />,
  escrow_hold: <ArrowUpRight className="w-4 h-4 text-red-400" />,
  default: <ArrowDownLeft className="w-4 h-4 text-slate-400" />,
};

export default function EarningsWalletPage() {
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["driver-wallet"],
    queryFn: driverApi.getWallet,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["driver-transactions"],
    queryFn: () => driverApi.getTransactions({ page: 1, page_size: 20 }),
  });

  if (walletLoading || txLoading) return <PageSpinner />;

  const transactions = txData?.items || [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">
        Earnings & Wallet
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-accent p-6">
          <div className="text-sm text-slate-500 mb-1">Available Balance</div>
          <div className="text-3xl font-heading font-bold text-slate-900">
            {formatKES(wallet?.balance_kes || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">KES</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-slate-500 mb-1">In Escrow</div>
          <div className="text-3xl font-heading font-bold text-amber-600">
            {formatKES(wallet?.escrow_kes || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending release</div>
        </div>
      </div>

      <h2 className="text-lg font-heading font-semibold mb-4">
        Transaction History
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
                {TX_ICONS[tx.transaction_type] || TX_ICONS.default}
                <div>
                  <div className="text-sm font-medium text-slate-900 capitalize">
                    {tx.transaction_type.replace(/_/g, " ")}
                  </div>
                  {tx.description && (
                    <div className="text-xs text-slate-500">{tx.description}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-data-mono font-semibold text-slate-900">
                  {formatKES(tx.amount_kes)}
                </div>
                <div className="text-xs text-slate-400 capitalize">{tx.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
