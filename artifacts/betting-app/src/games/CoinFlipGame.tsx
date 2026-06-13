import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceBet } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";

const QUICK_AMOUNTS = ["1", "5", "10", "50"];

export default function CoinFlipGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<{ side: "heads" | "tails"; won: boolean; payout: number } | null>(null);
  const [rotations, setRotations] = useState(0);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const flip = async () => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    setFlipping(true);
    setResult(null);
    setRotations(r => r + 1440);

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "coin_flip", choice } }
      });
      const side: "heads" | "tails" = res.gameData?.result ?? (Math.random() < 0.5 ? "heads" : "tails");
      const won = res.payout > 0;

      setTimeout(() => {
        setResult({ side, won, payout: res.payout });
        setFlipping(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
        if (!won) toast({ title: `${side === "heads" ? "👑" : "🔶"} It's ${side}!`, description: `You chose ${choice}. Lost ${formatCurrency(amount)}`, variant: "destructive" });
        else toast({ title: `${side === "heads" ? "👑" : "🔶"} It's ${side}!`, description: `+${formatCurrency(res.payout)}`, className: "border-green-500/50" });
      }, 1600);
    } catch (err: any) {
      setFlipping(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const coinFace = result ? result.side : choice;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center" style={{ height: 200 }}>
        <motion.div
          animate={{ rotateY: rotations }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d", perspective: 1000 }}
          className="relative w-36 h-36">
          <div className={`absolute inset-0 rounded-full flex items-center justify-center text-6xl shadow-2xl border-4
            ${coinFace === "heads"
              ? "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 border-yellow-600"
              : "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 border-gray-500"
            }`}
            style={{ backfaceVisibility: "hidden" }}>
            {coinFace === "heads" ? "👑" : "🔶"}
          </div>
        </motion.div>

        {flipping && (
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.5 }}
            className="absolute -bottom-8 text-primary font-bold text-sm">Flipping...</motion.div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`text-center px-8 py-4 rounded-2xl font-bold text-xl ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
            {result.won ? `✅ ${formatCurrency(result.payout)} won!` : `❌ Lost ${formatCurrency(parseFloat(betAmount))}`}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 w-full">
        <button onClick={() => { setChoice("heads"); setResult(null); }}
          className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-2 text-2xl font-bold transition-all border-2
            ${choice === "heads" ? "bg-yellow-500/20 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
          👑 <span className="text-sm">HEADS</span>
        </button>
        <button onClick={() => { setChoice("tails"); setResult(null); }}
          className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-2 text-2xl font-bold transition-all border-2
            ${choice === "tails" ? "bg-gray-500/20 border-gray-400 shadow-[0_0_20px_rgba(156,163,175,0.3)]" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
          🔶 <span className="text-sm">TAILS</span>
        </button>
      </div>

      <div className="w-full">
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Bet Amount</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" className="bg-black/60 border-white/10 font-mono text-lg" disabled={flipping} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={flipping} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1 font-mono transition-colors disabled:opacity-40">${a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={flipping} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1 font-mono transition-colors disabled:opacity-40">2x</button>
        </div>
      </div>

      <div className="w-full grid grid-cols-3 gap-3 text-center">
        <div className="bg-white/5 rounded-xl p-3"><p className="text-xs text-muted-foreground mb-1">Win Chance</p><p className="font-mono font-bold text-primary">50%</p></div>
        <div className="bg-white/5 rounded-xl p-3"><p className="text-xs text-muted-foreground mb-1">Multiplier</p><p className="font-mono font-bold text-primary">1.98x</p></div>
        <div className="bg-white/5 rounded-xl p-3"><p className="text-xs text-muted-foreground mb-1">Payout</p><p className="font-mono font-bold text-primary">{formatCurrency(parseFloat(betAmount) * 1.98)}</p></div>
      </div>

      <Button onClick={flip} disabled={flipping} className="w-full h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
        {flipping ? "🪙 Flipping..." : "🪙 Flip Coin"}
      </Button>
    </div>
  );
}
