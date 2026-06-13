import { Layout } from "@/components/layout";
import { useGetWallet, useGetTransactions, useGetWalletSummary, useCreateDeposit, useCreateWithdrawal } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Coins, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Wallet() {
  const { data: wallet } = useGetWallet();
  const { data: summary } = useGetWalletSummary();
  const { data: transactions } = useGetTransactions({ query: { limit: 20 } });
  const depositMutation = useCreateDeposit();
  const withdrawMutation = useCreateWithdrawal();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    try {
      await depositMutation.mutateAsync({ data: { amount: Number(amount), method: "crypto", currency: "USDT" } });
      toast({ title: "Deposit Initiated", description: "Your deposit is processing." });
      setAmount("");
    } catch (err: any) {
      toast({ title: "Deposit Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 10) {
      toast({ title: "Invalid amount", description: "Minimum withdrawal is $10", variant: "destructive" });
      return;
    }
    if (!address) {
      toast({ title: "Address required", description: "Please provide a withdrawal address", variant: "destructive" });
      return;
    }
    try {
      await withdrawMutation.mutateAsync({ data: { amount: Number(amount), method: "crypto", address } });
      toast({ title: "Withdrawal Initiated", description: "Your withdrawal is processing." });
      setAmount("");
      setAddress("");
    } catch (err: any) {
      toast({ title: "Withdrawal Failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        <h1 className="text-3xl font-serif font-bold gold-gradient-text">Cashier</h1>

        {/* Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <WalletIcon className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Main Balance</h3>
            <p className="text-4xl font-mono font-bold text-white mb-1">
              {formatCurrency(wallet?.balance)}
            </p>
            <p className="text-xs text-muted-foreground">Available to withdraw</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Coins className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Bonus Balance</h3>
            <p className="text-4xl font-mono font-bold text-white mb-1">
              {formatCurrency(wallet?.bonusBalance)}
            </p>
            <p className="text-xs text-muted-foreground">Subject to wager requirements</p>
          </div>
        </div>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/5">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit" className="mt-4">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    className="bg-black/50 border-white/10 text-xl font-mono"
                  />
                  <Button onClick={() => setAmount("100")} variant="outline" className="border-white/10">100</Button>
                  <Button onClick={() => setAmount("500")} variant="outline" className="border-white/10">500</Button>
                </div>
              </div>
              <Button onClick={handleDeposit} disabled={depositMutation.isPending} className="w-full h-12 text-lg font-bold">
                {depositMutation.isPending ? "Processing..." : "Deposit Funds"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="mt-4">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    className="bg-black/50 border-white/10 text-xl font-mono"
                  />
                  <Button onClick={() => setAmount(wallet?.balance?.toString() || "0")} variant="outline" className="border-white/10">Max</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Crypto Address</Label>
                <Input 
                  placeholder="0x..." 
                  value={address} 
                  onChange={e => setAddress(e.target.value)}
                  className="bg-black/50 border-white/10 font-mono"
                />
              </div>
              <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending} className="w-full h-12 text-lg font-bold">
                {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Transactions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <History className="w-5 h-5" /> Recent Transactions
          </h2>
          <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
            {transactions?.data.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No transactions yet</div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions?.data.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        ['deposit', 'win', 'bonus', 'referral'].includes(tx.type) ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {['deposit', 'win', 'bonus', 'referral'].includes(tx.type) ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-wide">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${
                        ['deposit', 'win', 'bonus', 'referral'].includes(tx.type) ? 'text-green-500' : 'text-foreground'
                      }`}>
                        {['deposit', 'win', 'bonus', 'referral'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
