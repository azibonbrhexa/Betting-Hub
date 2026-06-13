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

function Coin3D({ side, flipping, won }: { side: "heads" | "tails"; flipping: boolean; won: boolean | null }) {
  return (
    <div className="relative flex items-center justify-center" style={{ perspective: "600px", height: 180 }}>
      {/* Glow ring */}
      <motion.div
        animate={flipping ? { opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] } : { opacity: 0.4 }}
        transition={{ repeat: flipping ? Infinity : 0, duration: 0.5 }}
        className="absolute w-44 h-44 rounded-full"
        style={{
          background: `radial-gradient(circle, ${side === "heads" ? "#ffd70033" : "#94a3b833"} 0%, transparent 70%)`,
          filter: "blur(8px)",
        }}
      />

      <motion.div
        className="relative"
        animate={flipping ? {
          rotateY: [0, 180, 360, 540, 720, 900, 1080, 1260, 1440],
          scale: [1, 0.95, 1.05, 0.95, 1],
        } : {
          rotateY: side === "tails" ? 180 : 0,
          scale: 1,
        }}
        transition={flipping ? { duration: 1.8, ease: "easeOut" } : { duration: 0.4, ease: "easeOut" }}
        style={{ transformStyle: "preserve-3d", width: 140, height: 140 }}
      >
        {/* HEADS face */}
        <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(145deg, #ffd700, #ff9500, #ffd700)",
            boxShadow: won === true ? "0 0 40px #ffd700, 0 0 80px #ffd70040" : "0 8px 32px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3)",
          }}>
          {/* Coin edge rings */}
          <div className="absolute inset-1 rounded-full border-2 border-yellow-300/40" />
          <div className="absolute inset-3 rounded-full border border-yellow-300/20" />
          <span className="text-5xl">👑</span>
          <span className="text-xs font-bold text-yellow-900 mt-1 tracking-widest">HEADS</span>
        </div>

        {/* TAILS face */}
        <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(145deg, #e2e8f0, #94a3b8, #e2e8f0)",
            boxShadow: won === true ? "0 0 40px #94a3b8, 0 0 80px #94a3b840" : "0 8px 32px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.3)",
          }}>
          <div className="absolute inset-1 rounded-full border-2 border-slate-300/40" />
          <div className="absolute inset-3 rounded-full border border-slate-300/20" />
          <span className="text-5xl">🔶</span>
          <span className="text-xs font-bold text-slate-700 mt-1 tracking-widest">TAILS</span>
        </div>
      </motion.div>

      {/* Shadow */}
      <motion.div
        animate={flipping ? { scaleX: [1, 0.3, 1], opacity: [0.3, 0.1, 0.3] } : {}}
        transition={{ repeat: flipping ? Infinity : 0, duration: 0.6 }}
        className="absolute bottom-0 w-28 h-4 rounded-full"
        style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)" }}
      />
    </div>
  );
}

export default function CoinFlipGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("100");
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<{ side: "heads" | "tails"; won: boolean; payout: number } | null>(null);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const flip = async () => {
    if (!user) { toast({ title: "লগইন করুন", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 50) { toast({ title: "সর্বনিম্ন ৳50", variant: "destructive" }); return; }

    setFlipping(true);
    setResult(null);

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "coin_flip", choice } }
      });
      const side: "heads" | "tails" = (res.gameData as any)?.result ?? (Math.random() < 0.5 ? "heads" : "tails");
      const won = res.payout > 0;

      setTimeout(() => {
        setResult({ side, won, payout: res.payout });
        setFlipping(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, 1900);
    } catch (err: any) {
      setFlipping(false);
      toast({ title: "বেট ব্যর্থ", description: err.message, variant: "destructive" });
    }
  };

  const displaySide = result ? result.side : choice;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 3D Coin */}
      <div className="relative w-full bg-gradient-to-b from-slate-900 to-black rounded-2xl border border-white/10 py-6 overflow-hidden">
        {/* Background particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ left: `${10 + i * 6}%`, top: `${20 + (i % 5) * 15}%`,
                background: displaySide === "heads" ? "#ffd70060" : "#94a3b860" }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.15 }}
            />
          ))}
        </div>

        <Coin3D side={displaySide} flipping={flipping} won={result?.won ?? null} />

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`text-center mt-3 font-bold text-xl ${result.won ? "text-green-400" : "text-red-400"}`}>
              {result.won ? `✅ +${formatCurrency(result.payout)}` : `❌ -${formatCurrency(parseFloat(betAmount))}`}
              <p className="text-sm font-normal mt-0.5">{result.side === "heads" ? "👑 Heads!" : "🔶 Tails!"}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Choice Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {(["heads", "tails"] as const).map(side => (
          <button key={side} onClick={() => { setChoice(side); setResult(null); }}
            className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-1 text-sm font-bold transition-all border-2 ${
              choice === side
                ? side === "heads"
                  ? "bg-yellow-500/20 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] text-yellow-400"
                  : "bg-slate-500/20 border-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.4)] text-slate-300"
                : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/30"
            }`}
          >
            <span className="text-3xl">{side === "heads" ? "👑" : "🔶"}</span>
            <span className="uppercase text-xs tracking-wider">{side === "heads" ? "HEADS" : "TAILS"}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase">জয়ের সম্ভাবনা</p>
          <p className="font-mono font-bold text-primary">50%</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase">মাল্টিপ্লায়ার</p>
          <p className="font-mono font-bold text-primary">1.98x</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase">পেআউট</p>
          <p className="font-mono font-bold text-primary">{formatCurrency(parseFloat(betAmount || "0") * 1.98)}</p>
        </div>
      </div>

      {/* Bet */}
      <div className="w-full">
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">বেট পরিমাণ</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number"
          className="bg-black/60 border-white/10 font-mono text-lg" disabled={flipping} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={flipping}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1.5 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={flipping}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1.5 font-mono transition-colors disabled:opacity-40">2x</button>
        </div>
      </div>

      <Button onClick={flip} disabled={flipping}
        className="w-full h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)] rounded-xl">
        {flipping ? "🪙 ফ্লিপ হচ্ছে..." : "🪙 কয়েন ফ্লিপ করুন"}
      </Button>
    </div>
  );
}
