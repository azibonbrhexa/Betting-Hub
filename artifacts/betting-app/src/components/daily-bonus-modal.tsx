import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, Flame, Star, Gift } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STREAK_BONUSES = [50, 75, 100, 150, 200, 300, 500];
const STREAK_LABELS = ["দিন ১", "দিন ২", "দিন ৩", "দিন ৪", "দিন ৫", "দিন ৬", "দিন ৭"];

interface DailyStatus {
  canClaim: boolean;
  streakDay: number;
  bonusAmount: number;
  streakBonuses: number[];
}

export function DailyBonusModal() {
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    const lastCheck = localStorage.getItem("dailyBonusLastCheck");
    const today = new Date().toDateString();
    if (lastCheck === today) return;

    fetch(`${BASE}/api/daily-bonus/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.canClaim) {
          setStatus(d);
          setOpen(true);
          localStorage.setItem("dailyBonusLastCheck", today);
        }
      })
      .catch(() => {});
  }, [token]);

  const claim = async () => {
    if (!token || !status) return;
    setClaiming(true);
    try {
      const r = await fetch(`${BASE}/api/daily-bonus/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setClaimed(true);
      queryClient.invalidateQueries();
      toast({
        title: "🎁 ডেইলি বোনাস পেয়েছেন!",
        description: `${formatCurrency(status.bonusAmount)} বোনাস ব্যালেন্সে যোগ হয়েছে!`,
      });
      setTimeout(() => setOpen(false), 2500);
    } catch (err: any) {
      toast({ title: "ব্যর্থ হয়েছে", description: err.message, variant: "destructive" });
    }
    setClaiming(false);
  };

  if (!status) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !claiming && setOpen(false)}
          />
          <motion.div
            className="relative w-full max-w-sm glass-panel rounded-3xl border border-primary/30 overflow-hidden shadow-2xl z-10"
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

            {/* Close */}
            <button onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 text-center relative z-10">
              {/* Animated coins */}
              <div className="relative h-24 flex items-center justify-center mb-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl"
                >
                  {claimed ? "✅" : "🎁"}
                </motion.div>
                {/* Particles */}
                {claimed && [...Array(6)].map((_, i) => (
                  <motion.div key={i}
                    className="absolute text-xl"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: (i % 2 === 0 ? 1 : -1) * (30 + i * 15), y: -50 - i * 10, opacity: 0 }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

              <h2 className="text-2xl font-serif font-bold gold-gradient-text mb-1">
                {claimed ? "বোনাস পেয়েছেন!" : "ডেইলি বোনাস!"}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {status.streakDay} দিনের streak — {formatCurrency(status.bonusAmount)} বোনাস
              </p>

              {/* Streak Calendar */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {STREAK_BONUSES.map((bonus, i) => {
                  const isDone = i < status.streakDay - 1;
                  const isToday = i === status.streakDay - 1;
                  return (
                    <div key={i}
                      className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
                        isToday ? "border-primary bg-primary/20 scale-110 shadow-[0_0_10px_rgba(224,170,62,0.4)]" :
                        isDone ? "border-green-500/30 bg-green-500/10" :
                        "border-white/5 bg-white/3 opacity-50"
                      }`}
                    >
                      <span className="text-[10px] text-muted-foreground">D{i + 1}</span>
                      <span className="text-xs font-bold">{isDone ? "✅" : isToday ? "🎁" : "🔒"}</span>
                      <span className="text-[9px] text-primary font-mono">{bonus >= 1000 ? `${bonus/1000}K` : bonus}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bonus Amount */}
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-1">আজকের বোনাস</p>
                <p className="text-4xl font-bold font-mono gold-gradient-text">{formatCurrency(status.bonusAmount)}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-orange-400 font-bold">{status.streakDay} দিনের Streak!</span>
                </div>
              </div>

              {!claimed ? (
                <Button
                  onClick={claim}
                  disabled={claiming}
                  className="w-full h-12 text-lg font-bold bg-primary text-black rounded-xl shadow-[0_0_20px_rgba(224,170,62,0.4)] hover:scale-[1.02] transition-transform"
                >
                  {claiming ? "⏳..." : "🎁 বোনাস নিন!"}
                </Button>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 text-green-400 font-bold"
                >
                  ✅ বোনাস পেয়েছেন!
                </motion.div>
              )}

              <p className="text-xs text-muted-foreground mt-3">প্রতিদিন লগইন করুন streak বজায় রাখুন</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
