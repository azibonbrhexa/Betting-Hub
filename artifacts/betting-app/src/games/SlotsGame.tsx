import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceBet } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";

const SYMBOLS = ["🍒", "🍋", "🍇", "⭐", "💎", "7️⃣", "🔔", "🍀"];
const PAYOUTS: Record<string, number> = {
  "🍒": 1.5, "🍋": 2, "🍇": 2.5, "⭐": 5, "💎": 10, "7️⃣": 20, "🔔": 3, "🍀": 4
};
const QUICK_AMOUNTS = ["10", "50", "100", "500"];
const REELS = 3;

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

export default function SlotsGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>([SYMBOLS[0], SYMBOLS[2], SYMBOLS[4]]);
  const [result, setResult] = useState<{ symbols: string[]; won: boolean; payout: number; multiplier: number } | null>(null);
  const [spinCounts, setSpinCounts] = useState([0, 0, 0]);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const spin = async () => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 0.1) return;
    setSpinning(true);
    setResult(null);
    setSpinCounts(c => c.map(n => n + 15));

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "slots" } }
      });
      const won = res.payout > 0;
      const mult = res.multiplier ?? (won ? res.payout / amount : 0);
      let finalSymbols: string[];
      if (won) {
        const winSym = SYMBOLS.find(s => PAYOUTS[s] <= mult + 0.5 && PAYOUTS[s] >= mult - 0.5) ?? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        finalSymbols = [winSym, winSym, winSym];
      } else {
        do { finalSymbols = Array.from({ length: REELS }, randomSymbol); }
        while (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2]);
      }
      setTimeout(() => {
        setReels(finalSymbols);
        setResult({ symbols: finalSymbols, won, payout: res.payout, multiplier: mult });
        setSpinning(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, 1800);
    } catch (err: any) {
      setSpinning(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="bg-black rounded-2xl border border-white/10 p-6 w-full">
        <div className="flex justify-center gap-3 mb-4">
          {reels.map((sym, i) => (
            <motion.div key={i}
              animate={spinning ? { y: [0, -20, 0, -15, 0, -5, 0] } : {}}
              transition={{ duration: 1.8, delay: i * 0.15, ease: "easeOut" }}
              className={`w-24 h-24 rounded-2xl bg-white/5 border-2 flex items-center justify-center text-5xl
                ${result?.won ? "border-primary shadow-[0_0_20px_rgba(212,175,55,0.4)]" : "border-white/10"}`}>
              {sym}
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-24 text-center">
              {Object.entries(PAYOUTS).map(([s, p]) => (
                <div key={s} className="flex justify-between px-2 py-0.5 text-xs text-muted-foreground">
                  <span>{s}{s}{s}</span><span className="text-primary">{p}x</span>
                </div>
              )).filter((_, j) => j < 3)}
            </div>
          ))}
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`w-full py-4 px-6 rounded-2xl text-center font-bold text-xl ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🎰 ${result.multiplier.toFixed(2)}x — Won ${formatCurrency(result.payout)}!` : `🎰 No match — Lost ${formatCurrency(parseFloat(betAmount))}`}
        </motion.div>
      )}

      <div className="w-full">
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Bet Amount</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" className="bg-black/60 border-white/10 font-mono text-lg" disabled={spinning} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={spinning} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={spinning} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1 font-mono disabled:opacity-40">2x</button>
        </div>
      </div>

      <Button onClick={spin} disabled={spinning} className="w-full h-16 text-2xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(212,175,55,0.4)]">
        {spinning ? "🎰 Spinning..." : "🎰 SPIN"}
      </Button>
    </div>
  );
}
