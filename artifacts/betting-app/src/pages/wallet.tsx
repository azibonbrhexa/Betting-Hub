import { Layout } from "@/components/layout";
import { useGetWallet, useGetTransactions, useGetWalletSummary, useCreateDeposit, useCreateWithdrawal } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, Coins, History, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

const PAYMENT_METHODS = [
  { id: "bkash", label: "bKash", icon: "🔴", color: "border-pink-500/30 hover:border-pink-500" },
  { id: "nagad", label: "Nagad", icon: "🟠", color: "border-orange-500/30 hover:border-orange-500" },
  { id: "rocket", label: "Rocket", icon: "🟣", color: "border-purple-500/30 hover:border-purple-500" },
  { id: "bank", label: "Bank", icon: "🏦", color: "border-blue-500/30 hover:border-blue-500" },
  { id: "card", label: "Card", icon: "💳", color: "border-white/20 hover:border-white/40" },
  { id: "crypto", label: "Crypto", icon: "₿", color: "border-yellow-500/30 hover:border-yellow-500" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

const TX_ICONS: Record<string, string> = {
  deposit: "⬇️", withdrawal: "⬆️", bet: "🎲", win: "🏆", bonus: "🎁", referral: "👥",
};

export default function Wallet() {
  const queryClient = useQueryClient();
  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const { data: summary } = useGetWalletSummary();
  const { data: transactions, refetch: refetchTx } = useGetTransactions({ limit: 30 });
  const depositMutation = useCreateDeposit();
  const withdrawMutation = useCreateWithdrawal();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bkash");

  const handleDeposit = async () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num < 100) {
      toast({ title: "সর্বনিম্ন ডিপোজিট ৳100", variant: "destructive" });
      return;
    }
    try {
      await depositMutation.mutateAsync({ data: { amount: num, method: selectedMethod, currency: "BDT" } });
      toast({ title: "✅ ডিপোজিট সফল!", description: `${formatCurrency(num)} আপনার ওয়ালেটে যোগ হয়েছে।` });
      setAmount("");
      queryClient.invalidateQueries();
      refetchWallet();
      refetchTx();
    } catch (err: any) {
      toast({ title: "ডিপোজিট ব্যর্থ", description: err.message, variant: "destructive" });
    }
  };

  const handleWithdraw = async () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num < 200) {
      toast({ title: "সর্বনিম্ন উইথড্র ৳200", variant: "destructive" });
      return;
    }
    if (!address) {
      toast({ title: "একাউন্ট নম্বর দিন", variant: "destructive" });
      return;
    }
    try {
      await withdrawMutation.mutateAsync({ data: { amount: num, method: selectedMethod, address } });
      toast({ title: "✅ উইথড্র সফল!", description: `${formatCurrency(num)} প্রসেস হচ্ছে।` });
      setAmount("");
      setAddress("");
      queryClient.invalidateQueries();
      refetchWallet();
      refetchTx();
    } catch (err: any) {
      toast({ title: "উইথড্র ব্যর্থ", description: err.message, variant: "destructive" });
    }
  };

  const numAmount = Number(amount) || 0;

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif font-bold gold-gradient-text">ক্যাশিয়ার</h1>
          <Button variant="ghost" size="icon" onClick={() => { refetchWallet(); refetchTx(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-6 rounded-2xl border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <WalletIcon className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">মূল ব্যালেন্স</h3>
            <p className="text-4xl font-mono font-bold text-white mb-1">{formatCurrency(wallet?.balance)}</p>
            <p className="text-xs text-muted-foreground">উইথড্র করা যাবে</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Coins className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">বোনাস ব্যালেন্স</h3>
            <p className="text-4xl font-mono font-bold text-white mb-1">{formatCurrency(wallet?.bonusBalance)}</p>
            <p className="text-xs text-muted-foreground">ওয়েজার শর্ত প্রযোজ্য</p>
          </div>
        </div>

        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "মোট ডিপোজিট", val: summary.totalDeposited, color: "text-green-400" },
              { label: "মোট উইথড্র", val: summary.totalWithdrawn, color: "text-red-400" },
              { label: "মোট বেট", val: summary.totalWagered, color: "text-primary" },
              { label: "মোট জয়", val: summary.totalWon, color: "text-green-400" },
            ].map(s => (
              <div key={s.label} className="glass-panel p-4 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                <p className={`font-mono font-bold text-sm ${s.color}`}>{formatCurrency(s.val)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Deposit / Withdraw Tabs */}
        <Tabs defaultValue="deposit">
          <TabsList className="w-full grid grid-cols-2 bg-black/40 h-12 border border-white/5">
            <TabsTrigger value="deposit" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-black">
              ⬇️ ডিপোজিট
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-black">
              ⬆️ উইথড্র
            </TabsTrigger>
          </TabsList>

          {/* Deposit */}
          <TabsContent value="deposit" className="mt-6 space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">পেমেন্ট মেথড</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedMethod === m.id
                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                        : `bg-white/3 ${m.color}`
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-xs font-bold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-medium">পরিমাণ (BDT)</p>
              <Input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                placeholder="০.০০"
                className="bg-black/60 border-white/10 font-mono text-2xl h-14 text-center"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`py-2 rounded-lg text-sm font-mono font-bold transition-all border cursor-pointer ${
                      Number(amount) === a
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    ৳{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={depositMutation.isPending}
              className="w-full h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              {depositMutation.isPending ? "প্রসেসিং..." : `৳${numAmount.toLocaleString()} ডিপোজিট করুন`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">সর্বনিম্ন ৳100 • সর্বোচ্চ ৳5,00,000 • তাৎক্ষণিক ক্রেডিট</p>
          </TabsContent>

          {/* Withdraw */}
          <TabsContent value="withdraw" className="mt-6 space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider font-medium">পেমেন্ট মেথড</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedMethod === m.id
                        ? "border-primary bg-primary/10"
                        : `bg-white/3 ${m.color}`
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-xs font-bold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-medium">একাউন্ট নম্বর</p>
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="01XXXXXXXXX বা ওয়ালেট ঠিকানা"
                className="bg-black/60 border-white/10 h-12"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-medium">পরিমাণ (BDT)</p>
              <Input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                placeholder="০.০০"
                className="bg-black/60 border-white/10 font-mono text-2xl h-14 text-center"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`py-2 rounded-lg text-sm font-mono font-bold transition-all border cursor-pointer ${
                      Number(amount) === a
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    ৳{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/3 border border-white/10 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
              <p>• সর্বনিম্ন উইথড্র: <span className="text-white font-bold">৳200</span></p>
              <p>• প্রসেসিং সময়: <span className="text-white font-bold">১–২৪ ঘণ্টা</span></p>
              <p>• বর্তমান ব্যালেন্স: <span className="text-primary font-bold">{formatCurrency(wallet?.balance)}</span></p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
              className="w-full h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              {withdrawMutation.isPending ? "প্রসেসিং..." : `৳${numAmount.toLocaleString()} উইথড্র করুন`}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Transaction History */}
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" /> লেনদেনের ইতিহাস
          </h2>
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            {!transactions?.data?.length ? (
              <div className="p-8 text-center text-muted-foreground">কোনো লেনদেন নেই</div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions.data.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        ["deposit", "win", "bonus", "referral"].includes(tx.type)
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {["deposit", "win", "bonus", "referral"].includes(tx.type)
                          ? <ArrowDownLeft className="w-4 h-4" />
                          : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-wide flex items-center gap-1">
                          <span>{TX_ICONS[tx.type] || "💰"}</span>
                          <span>{tx.type}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${
                        ["deposit", "win", "bonus", "referral"].includes(tx.type)
                          ? "text-green-400"
                          : "text-red-400"
                      }`}>
                        {["deposit", "win", "bonus", "referral"].includes(tx.type) ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        tx.status === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : tx.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {tx.status === "completed" ? "সম্পন্ন" : tx.status === "pending" ? "অপেক্ষমাণ" : tx.status}
                      </span>
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
