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

export default function LimboGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [target, setTarget] = useState("2.00");
  const [spinning, setSpinning] = useState(false);
  const [displayValue, setDisplayValue] = useState<string | null>(null);
  const [result, setResult] = useState<{ value: number; won: boolean; payout: number } | null>(null);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const play = async () => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    const targetVal = parseFloat(target);
    if (isNaN(amount) || amount < 0.1) return;
    if (isNaN(targetVal) || targetVal < 1.01) { toast({ title: "Target must be ≥ 1.01x", variant: "destructive" }); return; }

    setSpinning(true);
    setResult(null);
    setDisplayValue("?");

    let ticks = 0;
    const interval = setInterval(() => {
      const v = (Math.random() * 50 + 1);
      setDisplayValue(v.toFixed(2) + "x");
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
        const won = res.payout > 0;
        setResult({ value: finalValue, won, payout: res.payout });
        setSpinning(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      setSpinning(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const winChance = Math.min(99, (1 / parseFloat(target || "2")) * 99);
  const mult = parseFloat(target || "2");

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-black/60 rounded-2xl border border-white/10 p-8 flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Result</p>
        <AnimatePresence mode="wait">
          <motion.div key={displayValue}
            initial={{ scale: 0.8, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
            className={`text-7xl font-black font-mono tabular-nums transition-colors ${
              result ? (result.won ? "text-green-400" : "text-red-400") : "text-primary"
            }`}
            style={{ textShadow: result ? (result.won ? "0 0 50px #22c55e60" : "0 0 50px #ef444460") : "0 0 40px #D4AF3760", minWidth: "8ch", textAlign: "center" }}>
            {displayValue ?? "—"}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-4 mt-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="font-mono font-bold text-primary text-xl">≥ {target}x</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Win Chance</p>
            <p className="font-mono font-bold text-xl">{winChance.toFixed(2)}%</p>
          </div>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`font-bold text-lg ${result.won ? "text-green-400" : "text-red-400"}`}>
            {result.won ? `✅ Won ${formatCurrency(result.payout)}` : `❌ Lost ${formatCurrency(parseFloat(betAmount))}`}
          </motion.div>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Target Multiplier</label>
        <Input value={target} onChange={e => setTarget(e.target.value)} type="number" step="0.01" min="1.01"
          className="bg-black/60 border-white/10 font-mono text-2xl text-center h-14" disabled={spinning} />
        <div className="flex gap-1 mt-1">
          {QUICK_TARGETS.map(t => <button key={t} onClick={() => setTarget(t)} disabled={spinning}
            className={`flex-1 text-xs rounded px-1 py-1 font-mono transition-colors disabled:opacity-40 ${target === t ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 hover:bg-white/10"}`}>{t}x</button>)}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Bet Amount</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number"
          className="bg-black/60 border-white/10 font-mono text-lg" disabled={spinning} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={spinning} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) / 2))} disabled={spinning} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1 font-mono disabled:opacity-40">½</button>
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={spinning} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1 font-mono disabled:opacity-40">2x</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white/5 rounded-xl p-3"><p className="text-xs text-muted-foreground mb-1">Multiplier</p><p className="font-mono font-bold text-primary">{mult}x</p></div>
        <div className="bg-white/5 rounded-xl p-3"><p className="text-xs text-muted-foreground mb-1">Win Chance</p><p className="font-mono font-bold text-primary">{winChance.toFixed(1)}%</p></div>
        <div className="bg-white/5 rounded-xl p-3"><p className="text-xs text-muted-foreground mb-1">Payout</p><p className="font-mono font-bold text-primary">{formatCurrency(parseFloat(betAmount) * mult)}</p></div>
      </div>

      <Button onClick={play} disabled={spinning}
        className="h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
        {spinning ? "🎯 Rolling..." : "🎯 Play"}
      </Button>
    </div>
  );
}
