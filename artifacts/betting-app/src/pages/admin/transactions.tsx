import { useState } from "react";
import { useGetAdminTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminTransactions() {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: transactionsData } = useGetAdminTransactions({
    // @ts-ignore
    query: {
      type: type === 'all' ? undefined : type,
      status: status === 'all' ? undefined : status,
      limit: 50
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Transaction Log</h1>
          <p className="text-muted-foreground text-sm">Monitor all platform financial activity</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[150px] bg-black/40 border-white/10">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="bet">Bets</SelectItem>
              <SelectItem value="win">Wins</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px] bg-black/40 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/40 text-muted-foreground text-xs uppercase border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">ID / Time</th>
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactionsData?.data.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-muted-foreground mb-1">#{tx.id}</div>
                    <div className="text-white">{formatDate(tx.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    User #{tx.userId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 uppercase tracking-wider text-xs font-bold">
                      {['deposit', 'win', 'bonus', 'referral'].includes(tx.type) ? 
                        <ArrowDownLeft className="w-4 h-4 text-green-500" /> : 
                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                      }
                      {tx.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground uppercase text-xs tracking-wider">
                    {tx.method || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold">
                    <span className={['deposit', 'win', 'bonus', 'referral'].includes(tx.type) ? 'text-green-500' : ''}>
                      {['deposit', 'win', 'bonus', 'referral'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      tx.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                      tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
