import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceBet } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";

type GameState = "idle" | "betting" | "flying" | "crashed" | "cashed_out";

const QUICK_AMOUNTS = ["1", "5", "10", "50", "100"];

function generateCrashPoint(): number {
  const r = Math.random();
  if (r < 0.01) return 1.0;
  return Math.max(1.0, 0.99 / (1 - r));
}

export default function CrashGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [autoCashout, setAutoCashout] = useState("2.00");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ won: boolean; at: number; payout: number } | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const startGame = useCallback(() => {
    if (!user) {
      toast({ title: "Login required", variant: "destructive" });
      return;
    }
    const cp = generateCrashPoint();
    setCrashPoint(cp);
    setMultiplier(1.0);
    setPoints([{ x: 0, y: 0 }]);
    setGameState("flying");
    setLastResult(null);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const m = Math.pow(Math.E, 0.06 * elapsed);
      setMultiplier(m);
      setPoints(prev => [...prev.slice(-80), { x: elapsed, y: m }]);

      const autoVal = parseFloat(autoCashout);
      if (!isNaN(autoVal) && autoVal > 1 && m >= autoVal) {
        cashOut(cp, m);
        return;
      }
      if (m >= cp) {
        setCrashPoint(cp);
        setMultiplier(cp);
        setGameState("crashed");
        recordLoss();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [user, autoCashout]);

  const cashOut = useCallback(async (cp: number, m: number) => {
    cancelAnimationFrame(frameRef.current);
    setGameState("cashed_out");
    const amount = parseFloat(betAmount);
    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "crash", cashoutAt: m.toFixed(2), crashPoint: cp.toFixed(2) } }
      });
      const payout = amount * m;
      setLastResult({ won: true, at: m, payout });
      queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      toast({ title: `Cashed out at ${m.toFixed(2)}x!`, description: `+${formatCurrency(payout)}`, className: "border-green-500/50" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [betAmount, gameId, placeBetMutation, queryClient, toast]);

  const recordLoss = useCallback(async () => {
    const amount = parseFloat(betAmount);
    try {
      await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "crash", crashed: true, lostAt: multiplier.toFixed(2) } }
      });
      setLastResult({ won: false, at: multiplier, payout: 0 });
      queryClient.invalidateQueries({ queryKey: ["getWallet"] });
    } catch {}
  }, [betAmount, gameId, multiplier, placeBetMutation, queryClient]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const handleCashout = () => {
    if (gameState !== "flying") return;
    cashOut(crashPoint!, multiplier);
  };

  const reset = () => {
    setGameState("idle");
    setMultiplier(1.0);
    setPoints([]);
    setCrashPoint(null);
  };

  const maxX = Math.max(...points.map(p => p.x), 10);
  const maxY = Math.max(...points.map(p => p.y), 2);
  const toSvgX = (x: number) => (x / maxX) * 560;
  const toSvgY = (y: number) => 200 - ((y - 1) / (maxY - 1 || 1)) * 180;
  const pathD = points.length > 1 ? `M ${points.map(p => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" L ")}` : "";

  const multiplierColor = gameState === "crashed" ? "#ef4444" : gameState === "cashed_out" ? "#22c55e" : "#D4AF37";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative bg-black rounded-2xl border border-white/10 overflow-hidden" style={{ minHeight: 280 }}>
        <svg viewBox="0 0 580 220" className="w-full" preserveAspectRatio="none" style={{ height: 220 }}>
          <defs>
            <linearGradient id="crashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={multiplierColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={multiplierColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {points.length > 1 && (
            <>
              <path d={`${pathD} L ${toSvgX(points[points.length-1].x)},210 L 0,210 Z`} fill="url(#crashGrad)" />
              <path d={pathD} stroke={multiplierColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx={toSvgX(points[points.length-1].x)} cy={toSvgY(points[points.length-1].y)} r="5" fill={multiplierColor} />
            </>
          )}
          {[1, 2, 5, 10].map(v => (
            <line key={v} x1="0" y1={toSvgY(v)} x2="580" y2={toSvgY(v)} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {gameState === "idle" && (
              <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} className="text-white text-lg">
                Place a bet to start
              </motion.p>
            )}
            {(gameState === "flying" || gameState === "cashed_out") && (
              <motion.div key="mult" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                <div className="text-6xl font-bold font-mono" style={{ color: multiplierColor, textShadow: `0 0 30px ${multiplierColor}60` }}>
                  {multiplier.toFixed(2)}x
                </div>
                {gameState === "cashed_out" && <div className="text-green-400 font-bold mt-1 text-lg">CASHED OUT ✓</div>}
              </motion.div>
            )}
            {gameState === "crashed" && (
              <motion.div key="crash" initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                <div className="text-5xl font-bold font-mono text-red-500" style={{ textShadow: "0 0 40px #ef444470" }}>
                  {crashPoint?.toFixed(2)}x
                </div>
                <div className="text-red-400 font-bold mt-1 text-xl">💥 CRASHED!</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {lastResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-3 text-center font-bold ${lastResult.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {lastResult.won ? `✅ Won ${formatCurrency(lastResult.payout)} at ${lastResult.at.toFixed(2)}x` : `❌ Crashed at ${crashPoint?.toFixed(2)}x — Lost ${formatCurrency(parseFloat(betAmount))}`}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Bet Amount</label>
          <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" className="bg-black/60 border-white/10 font-mono text-lg" disabled={gameState === "flying"} />
          <div className="flex gap-1 mt-1">
            {QUICK_AMOUNTS.map(a => (
              <button key={a} onClick={() => setBetAmount(a)} disabled={gameState === "flying"}
                className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1 font-mono transition-colors disabled:opacity-40">${a}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Auto Cashout</label>
          <Input value={autoCashout} onChange={e => setAutoCashout(e.target.value)} type="number" className="bg-black/60 border-white/10 font-mono text-lg" disabled={gameState === "flying"} />
          <p className="text-xs text-muted-foreground mt-1">Auto cashout at this multiplier</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {gameState === "idle" || gameState === "crashed" || gameState === "cashed_out" ? (
          <Button onClick={gameState === "idle" ? startGame : reset}
            className="col-span-2 h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            {gameState === "idle" ? "🚀 Start Game" : "🔄 Play Again"}
          </Button>
        ) : (
          <>
            <Button variant="outline" disabled className="h-14 text-lg border-white/10 text-muted-foreground">
              🚀 Flying...
            </Button>
            <Button onClick={handleCashout}
              className="h-14 text-xl font-bold bg-green-500 hover:bg-green-400 text-black animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              💰 Cashout {multiplier.toFixed(2)}x
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
