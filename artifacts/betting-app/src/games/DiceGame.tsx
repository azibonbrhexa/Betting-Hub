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

function calcMultiplier(target: number, over: boolean): number {
  const winChance = over ? (100 - target) / 100 : target / 100;
  return parseFloat((0.99 / winChance).toFixed(4));
}

export default function DiceGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [target, setTarget] = useState(50);
  const [over, setOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ roll: number; won: boolean; payout: number } | null>(null);
  const [displayRoll, setDisplayRoll] = useState<number | null>(null);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const roll = async () => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 0.1) { toast({ title: "Invalid bet", variant: "destructive" }); return; }

    setRolling(true);
    setResult(null);

    let count = 0;
    const interval = setInterval(() => {
      setDisplayRoll(Math.floor(Math.random() * 100) + 1);
      count++;
      if (count > 12) clearInterval(interval);
    }, 60);

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "dice", target, over } }
      });
      const finalRoll = (res.gameData as any)?.roll ?? Math.floor(Math.random() * 100) + 1;
      clearInterval(interval);
      setTimeout(() => {
        setDisplayRoll(finalRoll);
        const won = res.payout > 0;
        setResult({ roll: finalRoll, won, payout: res.payout });
        setRolling(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, 200);
    } catch (err: any) {
      clearInterval(interval);
      setRolling(false);
      toast({ title: "Bet failed", description: err.message, variant: "destructive" });
    }
  };

  const mult = calcMultiplier(target, over);
  const winChance = over ? 100 - target : target;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-black/60 rounded-2xl border border-white/10 p-6">
        <div className="flex flex-col items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div key={displayRoll ?? "empty"}
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`text-7xl font-black font-mono tabular-nums transition-colors ${
                result ? (result.won ? "text-green-400" : "text-red-400") : "text-primary"
              }`}
              style={{ textShadow: result ? (result.won ? "0 0 40px #22c55e60" : "0 0 40px #ef444460") : "0 0 30px #D4AF3760" }}>
              {displayRoll ?? "?"}
            </motion.div>
          </AnimatePresence>

          {result && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={`font-bold text-lg ${result.won ? "text-green-400" : "text-red-400"}`}>
              {result.won ? `✅ +${formatCurrency(result.payout)}` : `❌ Lost ${formatCurrency(parseFloat(betAmount))}`}
            </motion.p>
          )}

          <div className="w-full">
            <div className="relative w-full h-8 rounded-full overflow-hidden bg-white/5 border border-white/10">
              <div
                className={`h-full transition-all ${over ? "bg-gradient-to-r from-red-500/80 to-transparent" : "bg-gradient-to-l from-blue-500/80 to-transparent"}`}
                style={{ width: `${target}%` }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 bg-primary h-full" style={{ marginLeft: `${target}%` }} />
              </div>
            </div>
            <input type="range" min={2} max={98} value={target} onChange={e => setTarget(Number(e.target.value))}
              className="w-full mt-2 accent-yellow-400" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span><span className="text-primary font-bold">{target}</span><span>100</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full text-center">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Win Chance</p>
              <p className="font-mono font-bold text-lg text-primary">{winChance}%</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Multiplier</p>
              <p className="font-mono font-bold text-lg text-primary">{mult}x</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Payout</p>
              <p className="font-mono font-bold text-lg text-primary">{formatCurrency(parseFloat(betAmount) * mult)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setOver(true)}
          className={`flex-1 h-12 font-bold transition-all ${over ? "bg-blue-500 text-white shadow-[0_0_15px_#3b82f660]" : "bg-white/5 hover:bg-white/10 text-muted-foreground"}`}>
          Over {target}
        </Button>
        <Button onClick={() => setOver(false)}
          className={`flex-1 h-12 font-bold transition-all ${!over ? "bg-red-500 text-white shadow-[0_0_15px_#ef444460]" : "bg-white/5 hover:bg-white/10 text-muted-foreground"}`}>
          Under {target}
        </Button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Bet Amount</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" className="bg-black/60 border-white/10 font-mono text-lg" disabled={rolling} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={rolling} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) / 2))} disabled={rolling} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1 font-mono transition-colors disabled:opacity-40">½</button>
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={rolling} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1 font-mono transition-colors disabled:opacity-40">2x</button>
        </div>
      </div>

      <Button onClick={roll} disabled={rolling}
        className="h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
        {rolling ? "🎲 Rolling..." : "🎲 Roll"}
      </Button>
    </div>
  );
}
