import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceBet } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";

const QUICK_AMOUNTS = ["50", "100", "500", "1000"];
const ROWS = 8;

const MULTIPLIERS: Record<string, number[]> = {
  low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
  medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
  high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
};

type Risk = "low" | "medium" | "high";

function simPath(): number[] {
  const path: number[] = [];
  let pos = 0;
  for (let row = 0; row < ROWS; row++) {
    const dir = Math.random() < 0.5 ? 0 : 1;
    pos += dir;
    path.push(dir);
  }
  return path;
}

export default function PlinkoGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [risk, setRisk] = useState<Risk>("medium");
  const [dropping, setDropping] = useState(false);
  const [ballPath, setBallPath] = useState<number[]>([]);
  const [finalSlot, setFinalSlot] = useState<number | null>(null);
  const [result, setResult] = useState<{ mult: number; won: boolean; payout: number } | null>(null);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const drop = useCallback(async () => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 0.1) return;
    setDropping(true);
    setResult(null);
    setBallPath([]);
    setFinalSlot(null);

    const path = simPath();
    const slot = path.reduce((a, b) => a + b, 0);

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "plinko", risk, rows: ROWS, slot } }
      });
      const mult = MULTIPLIERS[risk][slot] ?? 1;
      setBallPath(path);
      setTimeout(() => {
        setFinalSlot(slot);
        setResult({ mult, won: res.payout > 0, payout: res.payout });
        setDropping(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, ROWS * 150 + 400);
    } catch (err: any) {
      setDropping(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [user, betAmount, risk, gameId, placeBetMutation, queryClient, toast]);

  const mults = MULTIPLIERS[risk];
  const numSlots = mults.length;

  const pegRows = Array.from({ length: ROWS }, (_, row) => Array.from({ length: row + 2 }, (_, col) => ({ row, col })));

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-black/60 rounded-2xl border border-white/10 p-4 overflow-hidden">
        <div className="relative" style={{ paddingTop: `${ROWS * 24 + 40}px` }}>
          {pegRows.map((row, rowIdx) => (
            <div key={rowIdx} className="absolute flex items-center justify-center" style={{
              top: `${rowIdx * 24 + 8}px`, left: 0, right: 0,
            }}>
              {row.map((_, colIdx) => {
                const isBallHere = dropping && ballPath[rowIdx] !== undefined &&
                  ballPath.slice(0, rowIdx).reduce((a, b) => a + b, 0) === colIdx;
                return (
                  <div key={colIdx} className="relative flex items-center justify-center"
                    style={{ width: `${100 / (row.length + 1)}%` }}>
                    <motion.div
                      className={`w-2.5 h-2.5 rounded-full ${isBallHere ? "bg-primary scale-150" : "bg-white/30"}`}
                      animate={isBallHere ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.15 }} />
                  </div>
                );
              })}
            </div>
          ))}

          <AnimatePresence>
            {dropping && (
              <motion.div
                key="ball"
                initial={{ top: 0, left: "50%", x: "-50%" }}
                animate={{ top: `${ROWS * 24 + 10}px` }}
                transition={{ duration: ROWS * 0.15, ease: "easeIn" }}
                style={{ position: "absolute" }}
                className="w-4 h-4 rounded-full bg-primary z-10 shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-1 mt-2">
          {mults.map((m, i) => (
            <motion.div key={i}
              animate={finalSlot === i ? { scale: [1, 1.3, 1], backgroundColor: ["#D4AF37", "#D4AF37", m > 1 ? "#22c55e" : "#ef4444"] } : {}}
              transition={{ delay: 0.3 }}
              className={`flex-1 rounded-lg py-2 text-center font-mono font-bold text-xs transition-colors
                ${m >= 10 ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                  m >= 3 ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                  m >= 1 ? "bg-blue-500/15 text-blue-300 border border-blue-500/20" :
                  "bg-red-500/15 text-red-300/70 border border-red-500/15"}`}>
              {m}x
            </motion.div>
          ))}
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl p-3 text-center font-bold ${result.payout > parseFloat(betAmount) ? "bg-green-500/20 text-green-400 border border-green-500/30" : result.payout > 0 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.mult}x — {result.payout > 0 ? `✅ +${formatCurrency(result.payout)}` : `❌ Lost ${formatCurrency(parseFloat(betAmount))}`}
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(["low", "medium", "high"] as Risk[]).map(r => (
          <button key={r} onClick={() => setRisk(r)} disabled={dropping}
            className={`py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 capitalize
              ${risk === r ? "bg-primary text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]" : "bg-white/5 hover:bg-white/10"}`}>
            {r}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Bet Amount</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" className="bg-black/60 border-white/10 font-mono" disabled={dropping} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={dropping} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
        </div>
      </div>

      <Button onClick={drop} disabled={dropping} className="h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
        {dropping ? "⬇️ Dropping..." : "⬇️ Drop Ball"}
      </Button>
    </div>
  );
}
