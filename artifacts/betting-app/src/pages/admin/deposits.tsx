import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface PendingDeposit {
  id: number;
  userId: number;
  username: string;
  email: string;
  amount: number;
  method: string;
  txId: string;
  senderNumber: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { toast } = useToast();
  const token = localStorage.getItem("token");

  const fetchDeposits = () => {
    setLoading(true);
    fetch(`${BASE}/api/admin/pending-deposits?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setDeposits(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchDeposits(); }, [filter]);

  const approve = async (id: number) => {
    setActionLoading(id);
    try {
      const r = await fetch(`${BASE}/api/admin/pending-deposits/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: "অনুমোদিত" }),
      });
      if (!r.ok) throw new Error("Failed");
      toast({ title: "✅ ডিপোজিট অনুমোদিত!", description: "ব্যালেন্সে যোগ হয়েছে" });
      fetchDeposits();
    } catch {
      toast({ title: "ব্যর্থ হয়েছে", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const reject = async (id: number) => {
    const reason = prompt("বাতিলের কারণ:");
    if (!reason) return;
    setActionLoading(id);
    try {
      const r = await fetch(`${BASE}/api/admin/pending-deposits/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: reason }),
      });
      if (!r.ok) throw new Error("Failed");
      toast({ title: "❌ ডিপোজিট বাতিল হয়েছে" });
      fetchDeposits();
    } catch {
      toast({ title: "ব্যর্থ হয়েছে", variant: "destructive" });
    }
    setActionLoading(null);
  };

  const METHOD_ICONS: Record<string, string> = { bkash: "🔴", nagad: "🟠", rocket: "🟣", bank: "🏦", card: "💳", crypto: "₿" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">Pending Deposits</h2>
        <Button size="sm" variant="ghost" onClick={fetchDeposits}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {["pending", "approved", "rejected", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === s ? "bg-primary text-black" : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}>{s}</button>
        ))}
      </div>

      {/* Pending count badge */}
      {filter === "pending" && deposits.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span className="text-sm text-yellow-400 font-bold">{deposits.length}টি ডিপোজিট অনুমোদনের অপেক্ষায়</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>কোনো ডিপোজিট নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map((dep, i) => (
            <motion.div
              key={dep.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`p-4 rounded-xl border ${
                dep.status === "pending" ? "border-yellow-500/30 bg-yellow-500/5" :
                dep.status === "approved" ? "border-green-500/20 bg-green-500/5" :
                "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-3xl">{METHOD_ICONS[dep.method] ?? "💰"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold font-mono text-lg text-primary">{formatCurrency(dep.amount)}</span>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{dep.method.toUpperCase()}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        dep.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        dep.status === "approved" ? "bg-green-500/20 text-green-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>{dep.status}</span>
                    </div>
                    <p className="text-sm font-semibold">{dep.username} <span className="text-muted-foreground text-xs">({dep.email})</span></p>
                    <p className="text-xs text-muted-foreground">TxID: <span className="font-mono text-white">{dep.txId}</span></p>
                    {dep.senderNumber && <p className="text-xs text-muted-foreground">Number: {dep.senderNumber}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(dep.createdAt)}</p>
                    {dep.adminNote && <p className="text-xs text-yellow-400 mt-0.5">Note: {dep.adminNote}</p>}
                  </div>
                </div>

                {dep.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => approve(dep.id)}
                      disabled={actionLoading === dep.id}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {actionLoading === dep.id ? "..." : "অনুমোদন"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => reject(dep.id)}
                      disabled={actionLoading === dep.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      বাতিল
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
