import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceBet } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";

const SYMBOLS = [
  { sym: "🍒", name: "Cherry",  mult: 1.5,  color: "#ef4444" },
  { sym: "🍋", name: "Lemon",   mult: 2,    color: "#eab308" },
  { sym: "🍇", name: "Grape",   mult: 2.5,  color: "#a855f7" },
  { sym: "⭐", name: "Star",    mult: 5,    color: "#f59e0b" },
  { sym: "🔔", name: "Bell",    mult: 3,    color: "#f97316" },
  { sym: "🍀", name: "Clover",  mult: 4,    color: "#22c55e" },
  { sym: "💎", name: "Diamond", mult: 10,   color: "#06b6d4" },
  { sym: "7️⃣", name: "Seven",   mult: 20,   color: "#E0AA3E" },
];

const QUICK_AMOUNTS = ["10", "50", "100", "500"];

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function Reel({ symbol, spinning, delay, won }: { symbol: typeof SYMBOLS[0]; spinning: boolean; delay: number; won: boolean }) {
  return (
    <div className="relative overflow-hidden" style={{ width: 96, height: 104, perspective: "300px" }}>
      {/* 3D reel container */}
      <div className={`relative w-full h-full rounded-2xl border-2 transition-all duration-300 ${
        won ? "border-primary shadow-[0_0_25px_rgba(224,170,62,0.6)]" : "border-white/10"
      }`}
        style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)" }}>

        {/* Top shading */}
        <div className="absolute top-0 left-0 right-0 h-6 z-10 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)" }} />
        {/* Bottom shading */}
        <div className="absolute bottom-0 left-0 right-0 h-6 z-10 pointer-events-none"
          style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)" }} />

        {/* Spinning animation */}
        <motion.div
          className="w-full h-full flex items-center justify-center"
          animate={spinning ? {
            y: [0, -20, 0, -15, 0, -8, 0],
            filter: spinning ? ["blur(0px)", "blur(3px)", "blur(0px)"] : ["blur(0px)"],
          } : { y: 0 }}
          transition={{ duration: 1.8, delay, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center">
            <span className="text-5xl" style={{ filter: won ? `drop-shadow(0 0 12px ${symbol.color})` : "none" }}>
              {symbol.sym}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Win glow overlay */}
      {won && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
          style={{ background: `radial-gradient(circle, ${symbol.color}30 0%, transparent 70%)` }}
        />
      )}
    </div>
  );
}

export default function SlotsGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("50");
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<typeof SYMBOLS>([SYMBOLS[0], SYMBOLS[2], SYMBOLS[4]]);
  const [result, setResult] = useState<{ symbols: typeof SYMBOLS; won: boolean; payout: number; multiplier: number } | null>(null);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const spin = async () => {
    if (!user) { toast({ title: "লগইন করুন", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 10) { toast({ title: "সর্বনিম্ন ৳10", variant: "destructive" }); return; }
    setSpinning(true);
    setResult(null);

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "slots" } }
      });
      const won = res.payout > 0;
      const mult = res.multiplier ?? (won ? res.payout / amount : 0);
      let finalSymbols: typeof SYMBOLS;
      if (won) {
        const winSym = SYMBOLS.find(s => Math.abs(s.mult - mult) < 2) ?? SYMBOLS[Math.floor(Math.random() * 4)];
        finalSymbols = [winSym, winSym, winSym];
      } else {
        do { finalSymbols = Array.from({ length: 3 }, randomSymbol); }
        while (finalSymbols[0].sym === finalSymbols[1].sym && finalSymbols[1].sym === finalSymbols[2].sym);
      }
      setTimeout(() => {
        setReels(finalSymbols);
        setResult({ symbols: finalSymbols, won, payout: res.payout, multiplier: mult });
        setSpinning(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, 2000);
    } catch (err: any) {
      setSpinning(false);
      toast({ title: "ব্যর্থ হয়েছে", description: err.message, variant: "destructive" });
    }
  };

  const isWin = result?.won ?? false;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Slot Machine */}
      <div className="w-full relative rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(180deg, #1a0a00 0%, #0d0600 100%)",
        border: "1px solid rgba(224,170,62,0.2)",
        padding: "1.5rem",
      }}>
        {/* Top display */}
        <div className="text-center mb-5">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">BetRoyal Slots</div>
          <div className="flex justify-center gap-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40"
                style={{ animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>

        {/* Reels Container with 3D perspective */}
        <div className="flex justify-center gap-2 mb-4"
          style={{ perspective: "600px", perspectiveOrigin: "50% 50%" }}>
          <motion.div className="flex gap-2"
            style={{ transformStyle: "preserve-3d" }}
            animate={isWin ? { rotateX: [0, -5, 0] } : {}}
            transition={{ duration: 0.5 }}>
            {reels.map((sym, i) => (
              <Reel key={i} symbol={sym} spinning={spinning} delay={i * 0.2} won={isWin} />
            ))}
          </motion.div>
        </div>

        {/* Win Lines */}
        {isWin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 text-center"
          >
            <div className="inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(224,170,62,0.2), rgba(224,170,62,0.05))", border: "1px solid rgba(224,170,62,0.4)" }}>
              <p className="text-2xl font-bold gold-gradient-text">🎉 JACKPOT!</p>
              <p className="text-lg font-mono font-bold text-primary">+{formatCurrency(result?.payout ?? 0)}</p>
              <p className="text-xs text-muted-foreground">{(result?.multiplier ?? 0).toFixed(1)}x মাল্টিপ্লায়ার</p>
            </div>
          </motion.div>
        )}

        {!isWin && result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 text-center">
            <p className="text-red-400 font-bold">❌ আবার চেষ্টা করুন</p>
          </motion.div>
        )}

        {/* Paytable */}
        <div className="grid grid-cols-4 gap-1">
          {SYMBOLS.map(s => (
            <div key={s.sym} className="flex items-center gap-1 bg-white/3 rounded-lg px-2 py-1 text-center">
              <span className="text-sm">{s.sym}</span>
              <span className="text-[10px] text-primary font-bold">{s.mult}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="w-full">
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">বেট পরিমাণ</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number"
          className="bg-black/60 border-white/10 font-mono text-lg" disabled={spinning} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={spinning}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1.5 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={spinning}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1.5 font-mono transition-colors disabled:opacity-40">2x</button>
        </div>
      </div>

      <Button onClick={spin} disabled={spinning}
        className="w-full h-14 text-xl font-bold rounded-xl text-black shadow-[0_0_20px_rgba(224,170,62,0.4)] hover:scale-[1.02] transition-transform"
        style={{ background: spinning ? "#666" : "linear-gradient(135deg, #E0AA3E, #ffd700, #E0AA3E)" }}>
        {spinning ? "🎰 স্পিন হচ্ছে..." : "🎰 স্পিন করুন"}
      </Button>
    </div>
  );
}
