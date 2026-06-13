import { Layout } from "@/components/layout";
import { useGetWallet, useGetTransactions, useGetWalletSummary } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon, History, Clock, CheckCircle, XCircle, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PAYMENT_METHODS = [
  { id: "bkash",  label: "bKash",  emoji: "🔴", color: "border-pink-500/50 bg-pink-500/10",  active: "border-pink-500 bg-pink-500/20 shadow-[0_0_15px_#ec489950]", manual: true },
  { id: "nagad",  label: "Nagad",  emoji: "🟠", color: "border-orange-500/50 bg-orange-500/10", active: "border-orange-500 bg-orange-500/20 shadow-[0_0_15px_#f9731660]", manual: true },
  { id: "rocket", label: "Rocket", emoji: "🟣", color: "border-purple-500/50 bg-purple-500/10", active: "border-purple-500 bg-purple-500/20 shadow-[0_0_15px_#a855f760]", manual: true },
  { id: "bank",   label: "Bank",   emoji: "🏦", color: "border-blue-500/50 bg-blue-500/10",  active: "border-blue-500 bg-blue-500/20", manual: false },
  { id: "card",   label: "Card",   emoji: "💳", color: "border-white/20 bg-white/5",         active: "border-white/50 bg-white/10",   manual: false },
  { id: "crypto", label: "Crypto", emoji: "₿",  color: "border-yellow-500/50 bg-yellow-500/10", active: "border-yellow-500 bg-yellow-500/20", manual: false },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

const MERCHANT: Record<string, string> = {
  bkash: "+8801944265045",
  nagad: "+8801944265045",
  rocket: "+8801944265045",
};

const METHOD_INSTRUCTIONS: Record<string, string> = {
  bkash:  "bKash অ্যাপ খুলুন → Send Money → এই নম্বরে পাঠান",
  nagad:  "Nagad অ্যাপ → Send Money → এই নম্বরে পাঠান",
  rocket: "Rocket অ্যাপ → Send Money → এই নম্বরে পাঠান",
};

const TX_ICONS: Record<string, string> = {
  deposit: "⬇️", withdrawal: "⬆️", bet: "🎲", win: "🏆", bonus: "🎁", referral: "👥",
};

interface PendingDeposit {
  id: number;
  amount: number;
  method: string;
  txId: string;
  status: string;
  createdAt: string;
}

export default function Wallet() {
  const queryClient = useQueryClient();
  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const { data: summary } = useGetWalletSummary();
  const { data: transactions, refetch: refetchTx } = useGetTransactions({ limit: 30 });
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [txId, setTxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bkash");
  const [loading, setLoading] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem("token");
  const selectedPayment = PAYMENT_METHODS.find(m => m.id === selectedMethod)!;

  const fetchPending = () => {
    if (!token) return;
    fetch(`${BASE}/api/wallet/pending-deposits`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPendingDeposits(d); })
      .catch(() => {});
  };

  useEffect(() => { fetchPending(); }, []);

  const copyNumber = () => {
    const num = MERCHANT[selectedMethod];
    if (num) {
      navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "✅ কপি হয়েছে!", description: num });
    }
  };

  const handleDeposit = async () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num < 100) {
      toast({ title: "সর্বনিম্ন ডিপোজিট ৳100", variant: "destructive" });
      return;
    }

    if (selectedPayment.manual) {
      if (!txId.trim()) {
        toast({ title: "Transaction ID দিন", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      const body: any = { amount: num, method: selectedMethod, currency: "BDT" };
      if (selectedPayment.manual) {
        body.txId = txId.trim();
        body.senderNumber = senderNumber;
      }

      const res = await fetch(`${BASE}/api/wallet/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ব্যর্থ হয়েছে");

      if (data.pending) {
        toast({
          title: "⏳ ডিপোজিট প্রেরণ হয়েছে!",
          description: `৳${num} রিভিউতে আছে। Admin অনুমোদন করলে ব্যালেন্সে যোগ হবে।`,
        });
        fetchPending();
      } else {
        toast({ title: "✅ ডিপোজিট সফল!", description: `${formatCurrency(num)} আপনার ওয়ালেটে যোগ হয়েছে।` });
        queryClient.invalidateQueries();
        refetchWallet();
        refetchTx();
      }
      setAmount(""); setTxId(""); setSenderNumber("");
    } catch (err: any) {
      toast({ title: "ডিপোজিট ব্যর্থ", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num < 200) {
      toast({ title: "সর্বনিম্ন উইথড্র ৳200", variant: "destructive" });
      return;
    }
    if (!address) {
      toast({ title: "আপনার মোবাইল/একাউন্ট নম্বর দিন", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/wallet/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: num, method: selectedMethod, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ব্যর্থ হয়েছে");
      toast({ title: "✅ উইথড্র অনুরোধ পাঠানো হয়েছে!", description: `${formatCurrency(num)} প্রসেস হচ্ছে। ৩০ মিনিট অপেক্ষা করুন।` });
      setAmount(""); setAddress("");
      queryClient.invalidateQueries();
      refetchWallet(); refetchTx();
    } catch (err: any) {
      toast({ title: "উইথড্র ব্যর্থ", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const txData = (transactions as any)?.data ?? (Array.isArray(transactions) ? transactions : []);

  return (
    <Layout>
      <div className="p-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Balance Card */}
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 p-6"
          style={{ background: "linear-gradient(135deg, #1a1a00 0%, #0d0d00 50%, #1a1200 100%)" }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #E0AA3E 0, #E0AA3E 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <WalletIcon className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">মোট ব্যালেন্স</span>
            </div>
            <p className="text-4xl font-bold font-mono gold-gradient-text">
              {wallet ? formatCurrency(wallet.balance) : "৳0.00"}
            </p>
            {wallet && wallet.bonusBalance > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                + {formatCurrency(wallet.bonusBalance)} বোনাস ব্যালেন্স
              </p>
            )}
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "মোট জমা", value: summary?.totalDeposited ?? 0, icon: "⬇️" },
              { label: "মোট উত্তোলন", value: summary?.totalWithdrawn ?? 0, icon: "⬆️" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-muted-foreground">{s.icon} {s.label}</p>
                <p className="font-mono font-bold text-sm mt-0.5">{formatCurrency(s.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="deposit">
          <TabsList className="w-full grid grid-cols-3 bg-white/5 rounded-xl p-1">
            <TabsTrigger value="deposit" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold">
              <ArrowDownLeft className="w-4 h-4 mr-1" /> ডিপোজিট
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold">
              <ArrowUpRight className="w-4 h-4 mr-1" /> উইথড্র
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold">
              <History className="w-4 h-4 mr-1" /> ইতিহাস
            </TabsTrigger>
          </TabsList>

          {/* DEPOSIT TAB */}
          <TabsContent value="deposit" className="mt-4 space-y-4">
            {/* Payment Method Selection */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">পেমেন্ট পদ্ধতি</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMethod(m.id); setTxId(""); setSenderNumber(""); setAmount(""); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all font-semibold text-sm ${
                      selectedMethod === m.id ? m.active : m.color
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Banking Instructions */}
            <AnimatePresence mode="wait">
              {selectedPayment.manual && (
                <motion.div
                  key={selectedMethod}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{selectedPayment.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm mb-1">{selectedPayment.label} এ পাঠান</p>
                      <p className="text-xs text-muted-foreground mb-3">{METHOD_INSTRUCTIONS[selectedMethod]}</p>
                      <div className="bg-black/40 rounded-xl p-3 flex items-center justify-between border border-white/10">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">মার্চেন্ট নম্বর</p>
                          <p className="font-mono font-bold text-lg text-primary">{MERCHANT[selectedMethod]}</p>
                          <p className="text-[10px] text-muted-foreground">Personal {selectedPayment.label}</p>
                        </div>
                        <button onClick={copyNumber}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold transition-all">
                          <Copy className="w-3 h-3" />
                          {copied ? "কপি!" : "কপি"}
                        </button>
                      </div>
                      <div className="flex gap-1 flex-wrap mt-2">
                        {["⚠️ Reference", "ফোন নম্বর"].map(t => (
                          <span key={t} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Amount */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">পরিমাণ (৳)</label>
              <Input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                placeholder="সর্বনিম্ন ৳100"
                className="bg-black/40 border-white/10 font-mono text-lg h-12"
                disabled={loading}
              />
              <div className="grid grid-cols-6 gap-1 mt-2">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} disabled={loading}
                    className="text-xs bg-white/5 hover:bg-white/10 rounded-lg py-1.5 font-mono transition-colors disabled:opacity-40">
                    {a >= 1000 ? `${a/1000}K` : a}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction ID (for mobile banking) */}
            <AnimatePresence>
              {selectedPayment.manual && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">
                      Transaction ID <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={txId}
                      onChange={e => setTxId(e.target.value)}
                      placeholder="8N7A9B2C1D... (TxID)"
                      className="bg-black/40 border-white/10 font-mono"
                      disabled={loading}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {selectedPayment.label} অ্যাপে যে Transaction ID পাবেন সেটি দিন
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">
                      আপনার {selectedPayment.label} নম্বর (ঐচ্ছিক)
                    </label>
                    <Input
                      value={senderNumber}
                      onChange={e => setSenderNumber(e.target.value)}
                      placeholder="+880XXXXXXXXXX"
                      className="bg-black/40 border-white/10 font-mono"
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleDeposit}
              disabled={loading}
              className="w-full h-12 font-bold text-base rounded-xl bg-primary text-black hover:opacity-90 shadow-[0_0_20px_rgba(224,170,62,0.3)]"
            >
              {loading ? "⏳ প্রসেস হচ্ছে..." : selectedPayment.manual ? `📤 ${selectedPayment.label} ডিপোজিট পাঠান` : `💳 ডিপোজিট করুন`}
            </Button>

            {selectedPayment.manual && (
              <p className="text-center text-xs text-muted-foreground">
                Admin অনুমোদন করলে ব্যালেন্সে যোগ হবে (সাধারণত ৫-৩০ মিনিট)
              </p>
            )}

            {/* Pending Deposits */}
            {pendingDeposits.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">পেন্ডিং ডিপোজিট</p>
                <div className="space-y-2">
                  {pendingDeposits.map(pd => (
                    <div key={pd.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                      pd.status === "approved" ? "border-green-500/30 bg-green-500/5" :
                      pd.status === "rejected" ? "border-red-500/30 bg-red-500/5" :
                      "border-yellow-500/30 bg-yellow-500/5"
                    }`}>
                      {pd.status === "approved" ? <CheckCircle className="w-4 h-4 text-green-400" /> :
                       pd.status === "rejected" ? <XCircle className="w-4 h-4 text-red-400" /> :
                       <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />}
                      <div className="flex-1">
                        <p className="font-mono font-bold">{formatCurrency(pd.amount)}</p>
                        <p className="text-xs text-muted-foreground">{pd.method.toUpperCase()} • TxID: {pd.txId}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        pd.status === "approved" ? "bg-green-500/20 text-green-400" :
                        pd.status === "rejected" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {pd.status === "approved" ? "অনুমোদিত" : pd.status === "rejected" ? "বাতিল" : "রিভিউতে"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* WITHDRAW TAB */}
          <TabsContent value="withdraw" className="mt-4 space-y-4">
            <div className="bg-white/3 rounded-xl p-4 border border-white/5 text-sm text-muted-foreground">
              <p className="font-bold text-white mb-1">উইথড্র নির্দেশনা</p>
              <ul className="space-y-1 text-xs">
                <li>• সর্বনিম্ন উইথড্র: ৳200</li>
                <li>• সাধারণত ৩০ মিনিট - ২ ঘন্টার মধ্যে প্রসেস হয়</li>
                <li>• সঠিক নম্বর দিন, ভুল নম্বরে পাঠানো হলে ফেরত পাওয়া যাবে না</li>
              </ul>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">পেমেন্ট পদ্ধতি</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.slice(0, 3).map(m => (
                  <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm ${selectedMethod === m.id ? m.active : m.color}`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">উইথড্র পরিমাণ (৳)</label>
              <Input value={amount} onChange={e => setAmount(e.target.value)} type="number"
                placeholder="সর্বনিম্ন ৳200" className="bg-black/40 border-white/10 font-mono text-lg h-12" disabled={loading} />
              <div className="grid grid-cols-4 gap-1 mt-2">
                {[200, 500, 1000, 5000].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} disabled={loading}
                    className="text-xs bg-white/5 hover:bg-white/10 rounded-lg py-1.5 font-mono transition-colors disabled:opacity-40">৳{a}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">
                আপনার {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label ?? ""} নম্বর
              </label>
              <Input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="+880XXXXXXXXXX" className="bg-black/40 border-white/10 font-mono h-12" disabled={loading} />
            </div>

            <Button onClick={handleWithdraw} disabled={loading}
              className="w-full h-12 font-bold text-base rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              {loading ? "⏳ প্রসেস হচ্ছে..." : "💸 উইথড্র করুন"}
            </Button>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-4">
            <div className="space-y-2">
              {(!txData || txData.length === 0) ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>কোনো লেনদেন নেই</p>
                </div>
              ) : (
                txData.map((tx: any, i: number) => (
                  <motion.div
                    key={tx.id}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                      tx.type === "deposit" || tx.type === "win" || tx.type === "bonus" ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {TX_ICONS[tx.type] ?? "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.method ?? ""} • {formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-mono font-bold text-sm ${
                        tx.type === "deposit" || tx.type === "win" || tx.type === "bonus" || tx.type === "referral" ? "text-green-400" : "text-red-400"
                      }`}>
                        {tx.type === "deposit" || tx.type === "win" || tx.type === "bonus" || tx.type === "referral" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        tx.status === "completed" ? "bg-green-500/10 text-green-400" :
                        tx.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>{tx.status}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
