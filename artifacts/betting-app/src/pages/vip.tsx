import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Crown, Star, Zap, Shield, Gift, TrendingUp, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGetWallet } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";

const VIP_TIERS = [
  {
    level: 0, name: "Bronze", icon: "🥉", color: "#cd7f32", gradient: "from-amber-800 to-amber-600",
    minDeposit: 0, cashback: "3%", withdrawLimit: 20000, features: ["দৈনিক বোনাস", "Customer Support"],
  },
  {
    level: 1, name: "Silver", icon: "🥈", color: "#c0c0c0", gradient: "from-gray-500 to-gray-300",
    minDeposit: 5000, cashback: "5%", withdrawLimit: 50000, features: ["উন্নত বোনাস", "প্রায়রিটি সাপোর্ট", "সাপ্তাহিক ক্যাশব্যাক"],
  },
  {
    level: 2, name: "Gold", icon: "🥇", color: "#ffd700", gradient: "from-yellow-600 to-yellow-400",
    minDeposit: 20000, cashback: "8%", withdrawLimit: 100000, features: ["Gold বোনাস", "ডেডিকেটেড ম্যানেজার", "ফ্রি স্পিন", "মাসিক ক্যাশব্যাক"],
  },
  {
    level: 3, name: "Platinum", icon: "💎", color: "#e5e4e2", gradient: "from-slate-400 to-slate-200",
    minDeposit: 50000, cashback: "12%", withdrawLimit: 500000, features: ["Platinum সুবিধা", "VIP ইভেন্ট", "জন্মদিনের বোনাস", "বিশেষ অফার"],
  },
  {
    level: 4, name: "Diamond", icon: "💠", color: "#b9f2ff", gradient: "from-cyan-500 to-blue-400",
    minDeposit: 200000, cashback: "15%", withdrawLimit: 2000000, features: ["Diamond সুবিধা", "ব্যক্তিগত ম্যানেজার", "টুর্নামেন্ট অ্যাক্সেস", "এক্সক্লুসিভ বোনাস"],
  },
  {
    level: 5, name: "Elite", icon: "🔥", color: "#ff6b6b", gradient: "from-red-600 to-orange-400",
    minDeposit: 500000, cashback: "20%", withdrawLimit: 5000000, features: ["সব সুবিধা", "24/7 VIP সাপোর্ট", "কাস্টম বোনাস", "এক্সক্লুসিভ গেম"],
  },
  {
    level: 6, name: "Royal", icon: "👑", color: "#E0AA3E", gradient: "from-yellow-400 to-primary",
    minDeposit: 1000000, cashback: "25%", withdrawLimit: 99999999, features: ["সর্বোচ্চ সুবিধা", "Royal ক্লাব", "প্রাইভেট টেবিল", "Unlimited Withdraw"],
  },
];

export default function VIP() {
  const { user } = useAuth();
  // @ts-ignore
  const { data: wallet } = useGetWallet({ query: { enabled: !!user } });
  const currentLevel = user?.vipLevel ?? 0;
  const currentTier = VIP_TIERS[Math.min(currentLevel, VIP_TIERS.length - 1)];
  const nextTier = VIP_TIERS[Math.min(currentLevel + 1, VIP_TIERS.length - 1)];

  return (
    <Layout>
      <div className="p-4 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-pulse">{currentTier.icon}</div>
          <h1 className="text-3xl font-serif font-bold gold-gradient-text">{currentTier.name}</h1>
          <p className="text-muted-foreground mt-1">আপনার VIP স্তর</p>
          <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${currentTier.color}33, transparent)`, border: `1px solid ${currentTier.color}66`, color: currentTier.color }}>
            <Crown className="w-4 h-4" />
            Level {currentLevel} — {currentTier.name}
          </div>
        </div>

        {/* Current Benefits */}
        <div className="glass-panel rounded-2xl p-5 mb-6 border border-primary/20">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> আপনার সুবিধা
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">ক্যাশব্যাক</p>
              <p className="text-xl font-bold text-primary">{currentTier.cashback}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Withdraw সীমা</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(currentTier.withdrawLimit)}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {currentTier.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Next Level Progress */}
        {currentLevel < 6 && (
          <div className="glass-panel rounded-2xl p-5 mb-6 border border-white/10">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              পরবর্তী স্তর: {nextTier.name} {nextTier.icon}
            </h3>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>আপনার জমা: {formatCurrency(wallet?.balance ?? 0)}</span>
              <span>প্রয়োজন: {formatCurrency(nextTier.minDeposit)}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((wallet?.balance ?? 0) / nextTier.minDeposit) * 100, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              আরো {formatCurrency(Math.max(nextTier.minDeposit - (wallet?.balance ?? 0), 0))} জমা করুন {nextTier.name} হতে
            </p>
          </div>
        )}

        {/* All Tiers */}
        <h3 className="font-bold text-lg mb-4">সব VIP স্তর</h3>
        <div className="space-y-3">
          {VIP_TIERS.map((tier, i) => {
            const isActive = i === currentLevel;
            const isLocked = i > currentLevel;
            return (
              <motion.div
                key={tier.name}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                  isActive ? "border-primary/50 bg-primary/10" : isLocked ? "border-white/5 bg-white/2 opacity-60" : "border-white/10 bg-white/3"
                }`}
              >
                <div className="text-3xl">{tier.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: tier.color }}>{tier.name}</span>
                    {isActive && <span className="text-xs bg-primary text-black px-2 py-0.5 rounded-full font-bold">বর্তমান</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">ক্যাশব্যাক: {tier.cashback} • {formatCurrency(tier.minDeposit)} থেকে</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
