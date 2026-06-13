import { Layout } from "@/components/layout";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/format";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Flame, TrendingUp, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface LeaderEntry {
  rank: number;
  userId: number;
  username: string;
  avatar: string | null;
  vipLevel: number;
  totalWon: number;
  totalBets: number;
  biggestWin: number;
}

const VIP_NAMES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Royal"];
const VIP_COLORS = ["#cd7f32","#c0c0c0","#ffd700","#e5e4e2","#b9f2ff","#ff6b6b","#E0AA3E"];

const periods = [
  { id: "daily", label: "আজকের" },
  { id: "weekly", label: "সাপ্তাহিক" },
  { id: "monthly", label: "মাসিক" },
  { id: "all", label: "সর্বকালীন" },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("weekly");
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/api/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <Layout>
      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold gold-gradient-text">লিডারবোর্ড</h1>
            <p className="text-sm text-muted-foreground">সেরা খেলোয়াড়দের র‍্যাংকিং</p>
          </div>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                period === p.id ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>এখনো কোনো ডেটা নেই</p>
            <p className="text-sm mt-1">গেম খেলুন এবং লিডারবোর্ডে উঠুন!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 2 && (
              <div className="flex items-end justify-center gap-3 mb-8 pt-4">
                {/* 2nd */}
                {top3[1] && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        {top3[1].username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-black">2</div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-bold truncate max-w-[80px]">{top3[1].username}</p>
                      <p className="text-xs text-primary font-mono">{formatCurrency(top3[1].totalWon)}</p>
                    </div>
                    <div className="w-full h-20 bg-gradient-to-t from-gray-500/30 to-transparent rounded-t-lg mt-2" />
                  </motion.div>
                )}
                {/* 1st */}
                {top3[0] && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-center flex-1">
                    <Crown className="w-6 h-6 text-yellow-400 mb-1 animate-bounce" />
                    <div className="relative">
                      <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-bold text-black shadow-xl shadow-yellow-500/30">
                        {top3[0].username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-black">1</div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-bold truncate max-w-[80px]">{top3[0].username}</p>
                      <p className="text-xs text-primary font-mono font-bold">{formatCurrency(top3[0].totalWon)}</p>
                    </div>
                    <div className="w-full h-28 bg-gradient-to-t from-yellow-500/30 to-transparent rounded-t-lg mt-2" />
                  </motion.div>
                )}
                {/* 3rd */}
                {top3[2] && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="flex flex-col items-center flex-1">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        {top3[2].username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-black">3</div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-bold truncate max-w-[80px]">{top3[2].username}</p>
                      <p className="text-xs text-primary font-mono">{formatCurrency(top3[2].totalWon)}</p>
                    </div>
                    <div className="w-full h-14 bg-gradient-to-t from-amber-600/30 to-transparent rounded-t-lg mt-2" />
                  </motion.div>
                )}
              </div>
            )}

            {/* Full List */}
            <div className="space-y-2">
              {data.map((entry, i) => {
                const isMe = user?.id === entry.userId;
                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isMe ? "border-primary/50 bg-primary/10" : "border-white/5 bg-white/3 hover:bg-white/5"
                    }`}
                  >
                    <div className={`w-8 text-center font-bold text-sm ${
                      i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${VIP_COLORS[Math.min(entry.vipLevel, 6)]}, #1a1a2e)` }}>
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm truncate">{entry.username}</span>
                        {isMe && <span className="text-xs text-primary">(আপনি)</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{entry.totalBets} বেট</span>
                        <span>•</span>
                        <span>সর্বোচ্চ: {formatCurrency(entry.biggestWin)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary font-mono">{formatCurrency(entry.totalWon)}</p>
                      <p className="text-xs text-muted-foreground">মোট জয়</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
