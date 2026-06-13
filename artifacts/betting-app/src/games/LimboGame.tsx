import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceBet } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";

const QUICK_AMOUNTS = ["50", "100", "500", "1000"];
const QUICK_TARGETS = ["1.5", "2", "3", "5", "10", "100"];

// Star particles for background
const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  duration: 1.5 + Math.random() * 3,
  delay: Math.random() * 3,
}));

export default function LimboGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("100");
  const [target, setTarget] = useState("2.00");
  const [spinning, setSpinning] = useState(false);
  const [displayValue, setDisplayValue] = useState<string | null>(null);
  const [result, setResult] = useState<{ value: number; won: boolean; payout: number } | null>(null);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const play = async () => {
    if (!user) { toast({ title: "লগইন করুন", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    const targetVal = parseFloat(target);
    if (isNaN(amount) || amount < 50) { toast({ title: "সর্বনিম্ন ৳50", variant: "destructive" }); return; }
    if (isNaN(targetVal) || targetVal < 1.01) { toast({ title: "Target অবশ্যই ≥ 1.01x", variant: "destructive" }); return; }

    setSpinning(true);
    setResult(null);
    setDisplayValue("?");

    let ticks = 0;
    const interval = setInterval(() => {
      setDisplayValue((Math.random() * 50 + 1).toFixed(2) + "x");
      ticks++;
      if (ticks > 15) clearInterval(interval);
    }, 80);

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "limbo", target: targetVal } }
      });
      const finalValue = (res.gameData as any)?.result ?? (res.payout > 0 ? targetVal * 1.1 : targetVal * 0.5);
      clearInterval(interval);
      setTimeout(() => {
        setDisplayValue(finalValue.toFixed(2) + "x");
        setResult({ value: finalValue, won: res.payout > 0, payout: res.payout });
        setSpinning(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, 200);
    } catch (err: any) {
      clearInterval(interval);
      setSpinning(false);
      toast({ title: "ব্যর্থ হয়েছে", description: err.message, variant: "destructive" });
    }
  };

  const winChance = Math.min(99, (99 / parseFloat(target || "2")) * 100).toFixed(2);
  const mult = parseFloat(target || "2");

  const isWon = result?.won;
  const glowColor = isWon ? "#22c55e" : result ? "#ef4444" : "#8b5cf6";

  return (
    <div className="flex flex-col gap-5">
      {/* Main Display — Space themed */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10"
        style={{ background: "radial-gradient(ellipse at 50% 100%, #1a0533 0%, #050016 60%, #000 100%)", minHeight: 240 }}>

        {/* Stars */}
        <div className="absolute inset-0">
          {STARS.map(s => (
            <motion.div key={s.id}
              className="absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: s.duration, delay: s.delay }}
            />
          ))}
        </div>

        {/* Nebula glow */}
        <div className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(ellipse at 50% 80%, ${glowColor}66 0%, transparent 60%)` }} />

        {/* Moon/Planet graphic */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 rounded-t-full opacity-10"
          style={{ background: `radial-gradient(circle, ${glowColor}88 0%, transparent 70%)` }} />

        {/* Main multiplier display */}
        <div className="relative z-10 flex flex-col items-center justify-center py-10 gap-3">
          <AnimatePresence mode="wait">
            <motion.div key={displayValue}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-center"
            >
              <p className="text-6xl font-black font-mono tabular-nums"
                style={{
                  color: isWon ? "#22c55e" : result && !isWon ? "#ef4444" : "#E0AA3E",
                  textShadow: `0 0 40px ${isWon ? "#22c55e" : result && !isWon ? "#ef4444" : "#E0AA3E"}, 0 0 80px ${isWon ? "#22c55e40" : result && !isWon ? "#ef444440" : "#E0AA3E30"}`,
                  filter: spinning ? "blur(1px)" : "none",
                }}>
                {displayValue ?? "🌙"}
              </p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p className={`font-bold text-lg ${result.won ? "text-green-400" : "text-red-400"}`}>
                  {result.won ? `✅ +${formatCurrency(result.payout)}` : `❌ -${formatCurrency(parseFloat(betAmount))}`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-xs text-white/50 font-mono">Target: {target}x</p>
        </div>
      </div>

      {/* Target Input */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Target Multiplier</label>
        <Input value={target} onChange={e => setTarget(e.target.value)} type="number" step="0.01"
          placeholder="2.00" className="bg-black/60 border-white/10 font-mono text-lg text-primary" disabled={spinning} />
        <div className="flex gap-1 mt-1">
          {QUICK_TARGETS.map(t => <button key={t} onClick={() => setTarget(t)} disabled={spinning}
            className="flex-1 text-xs bg-white/5 hover:bg-primary/20 hover:text-primary rounded px-1 py-1.5 font-mono transition-colors disabled:opacity-40">{t}x</button>)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "জয়ের সম্ভাবনা", value: `${winChance}%` },
          { label: "মাল্টিপ্লায়ার", value: `${mult.toFixed(2)}x` },
          { label: "পেআউট", value: formatCurrency(parseFloat(betAmount || "0") * mult) },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-mono font-bold text-sm text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bet Amount */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">বেট পরিমাণ</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number"
          className="bg-black/60 border-white/10 font-mono text-lg" disabled={spinning} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={spinning}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1.5 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) / 2))} disabled={spinning}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1.5 font-mono transition-colors disabled:opacity-40">½</button>
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={spinning}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1.5 font-mono transition-colors disabled:opacity-40">2x</button>
        </div>
      </div>

      <Button onClick={play} disabled={spinning}
        className="h-14 text-xl font-bold rounded-xl text-black shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] transition-transform"
        style={{ background: spinning ? "#555" : "linear-gradient(135deg, #8b5cf6, #E0AA3E)" }}>
        {spinning ? "🌙 গেমিং..." : "🌙 খেলুন"}
      </Button>
    </div>
  );
}
