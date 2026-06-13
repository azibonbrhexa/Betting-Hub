import { useState, useRef } from "react";
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

function DiceFace({ value, won, rolling }: { value: number; won: boolean | null; rolling: boolean }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };

  const dotPositions = dots[Math.min(Math.max(value, 1), 6)] ?? dots[1];
  const color = won === null ? "#E0AA3E" : won ? "#22c55e" : "#ef4444";
  const glowColor = won === null ? "#D4AF3740" : won ? "#22c55e40" : "#ef444440";

  return (
    <div className="relative w-32 h-32" style={{ perspective: "400px" }}>
      <motion.div
        className="w-full h-full rounded-2xl relative"
        animate={rolling ? {
          rotateX: [0, 360, 720],
          rotateY: [0, 180, 360, 540],
          scale: [1, 0.9, 1.1, 1],
        } : { rotateX: 0, rotateY: 0, scale: 1 }}
        transition={rolling ? { duration: 0.8, ease: "easeInOut", repeat: 2 } : { duration: 0.3 }}
        style={{
          transformStyle: "preserve-3d",
          background: `linear-gradient(135deg, #1a1a1a, #0d0d0d)`,
          border: `2px solid ${color}66`,
          boxShadow: `0 0 30px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* Dice face */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
          {/* Background gradient */}
          <defs>
            <linearGradient id="diceGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#0d0d0d" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#diceGrad)" rx="12" />
          {dotPositions.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="7" fill={color}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
          ))}
        </svg>

        {/* 3D sides */}
        <div className="absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)" }} />
      </motion.div>
    </div>
  );
}

export default function DiceGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("100");
  const [target, setTarget] = useState(50);
  const [over, setOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ roll: number; won: boolean; payout: number } | null>(null);
  const [displayRoll, setDisplayRoll] = useState(3);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const roll = async () => {
    if (!user) { toast({ title: "লগইন করুন", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 50) { toast({ title: "সর্বনিম্ন ৳50", variant: "destructive" }); return; }

    setRolling(true);
    setResult(null);

    const interval = setInterval(() => {
      setDisplayRoll(Math.floor(Math.random() * 6) + 1);
    }, 100);

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "dice", target, over } }
      });
      const finalRoll = Math.min(Math.max(Math.round(((res.gameData as any)?.roll ?? Math.random() * 100) / 100 * 6), 1), 6);
      clearInterval(interval);
      setTimeout(() => {
        setDisplayRoll(finalRoll);
        const won = res.payout > 0;
        setResult({ roll: finalRoll, won, payout: res.payout });
        setRolling(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      setRolling(false);
      toast({ title: "বেট ব্যর্থ", description: err.message, variant: "destructive" });
    }
  };

  const mult = calcMultiplier(target, over);
  const winChance = over ? 100 - target : target;

  return (
    <div className="flex flex-col gap-5">
      {/* 3D Dice Display */}
      <div className="relative bg-gradient-to-b from-black/80 to-black/40 rounded-2xl border border-white/10 p-8 overflow-hidden">
        {/* Stars background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                animation: `pulse ${1 + Math.random() * 2}s ease-in-out infinite`, animationDelay: `${Math.random() * 2}s` }} />
          ))}
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <DiceFace value={displayRoll} won={result?.won ?? null} rolling={rolling} />

          <AnimatePresence mode="wait">
            {result && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`text-center font-bold text-xl ${result.won ? "text-green-400" : "text-red-400"}`}>
                {result.won ? `✅ +${formatCurrency(result.payout)}` : `❌ -${formatCurrency(parseFloat(betAmount))}`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slider */}
          <div className="w-full">
            <div className="relative w-full h-8 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${over ? "bg-gradient-to-r from-red-500/60 to-transparent" : "bg-gradient-to-l from-blue-500/60 to-transparent"}`}
                style={{ width: `${target}%` }} />
              <div className="absolute inset-0 rounded-full border border-white/10" />
              <div className="absolute top-0 bottom-0 w-0.5 bg-primary"
                style={{ left: `${target}%`, boxShadow: "0 0 10px #E0AA3E" }} />
            </div>
            <input type="range" min={2} max={98} value={target} onChange={e => setTarget(Number(e.target.value))}
              className="w-full mt-2 accent-yellow-400" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span><span className="text-primary font-bold text-base">{target}</span><span>100</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { label: "জয়ের সম্ভাবনা", value: `${winChance}%` },
              { label: "মাল্টিপ্লায়ার", value: `${mult}x` },
              { label: "পেআউট", value: formatCurrency(parseFloat(betAmount || "0") * mult) },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
                <p className="font-mono font-bold text-sm text-primary">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Over / Under Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setOver(true)}
          className={`h-12 rounded-xl font-bold text-sm transition-all border-2 ${over
            ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_#3b82f640]"
            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"}`}>
          ⬆️ Over {target}
        </button>
        <button onClick={() => setOver(false)}
          className={`h-12 rounded-xl font-bold text-sm transition-all border-2 ${!over
            ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_#ef444440]"
            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"}`}>
          ⬇️ Under {target}
        </button>
      </div>

      {/* Bet Amount */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">বেট পরিমাণ</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number"
          className="bg-black/60 border-white/10 font-mono text-lg h-11" disabled={rolling} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={rolling}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1.5 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) / 2))} disabled={rolling}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1.5 font-mono transition-colors disabled:opacity-40">½</button>
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={rolling}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1.5 font-mono transition-colors disabled:opacity-40">2x</button>
        </div>
      </div>

      <Button onClick={roll} disabled={rolling}
        className="h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.4)] rounded-xl">
        {rolling ? "🎲 রোল হচ্ছে..." : "🎲 রোল করুন"}
      </Button>
    </div>
  );
}
