import { Layout } from "@/components/layout";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Lock, CheckCircle2, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/format";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: number;
  xpReward: number;
  bonusReward: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  betting: "বেটিং",
  winning: "জয়",
  deposit: "ডিপোজিট",
  special: "বিশেষ",
  general: "সাধারণ",
};

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/api/achievements`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setAchievements(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const categories = ["all", ...Object.keys(CATEGORY_LABELS)];
  const filtered = activeCategory === "all" ? achievements : achievements.filter(a => a.category === activeCategory);
  const completed = achievements.filter(a => a.completed).length;
  const total = achievements.length;
  const xpTotal = achievements.filter(a => a.completed).reduce((s, a) => s + a.xpReward, 0);

  return (
    <Layout>
      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold gold-gradient-text">অ্যাচিভমেন্ট</h1>
            <p className="text-sm text-muted-foreground">আপনার পুরস্কার ও অর্জন</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-2xl font-bold text-primary">{completed}</p>
            <p className="text-xs text-muted-foreground mt-0.5">সম্পন্ন</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-2xl font-bold text-yellow-400">{total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">মোট</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-2xl font-bold text-blue-400">{xpTotal}</p>
            <p className="text-xs text-muted-foreground mt-0.5">মোট XP</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>মোট প্রগ্রেস</span>
            <span>{completed}/{total}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeCategory === cat
                  ? "bg-primary text-black border-primary"
                  : "border-white/10 text-muted-foreground hover:text-white hover:border-white/30"
              }`}
            >
              {cat === "all" ? "সব" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Achievement Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`relative p-4 rounded-xl border transition-all ${
                  a.completed
                    ? "border-primary/40 bg-primary/10"
                    : "border-white/5 bg-white/3 opacity-70"
                }`}
              >
                {a.completed && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                )}
                {!a.completed && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <div className="text-3xl mb-2">{a.icon}</div>
                <h3 className="font-bold text-sm mb-0.5">{a.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{a.description}</p>
                {/* Progress */}
                {!a.completed && a.progress > 0 && (
                  <div className="mb-2">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((a.progress / a.requirement) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.progress}/{a.requirement}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-400 flex items-center gap-0.5">
                    <Star className="w-3 h-3" />{a.xpReward} XP
                  </span>
                  {parseFloat(a.bonusReward) > 0 && (
                    <span className="text-primary">+{formatCurrency(parseFloat(a.bonusReward))}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
