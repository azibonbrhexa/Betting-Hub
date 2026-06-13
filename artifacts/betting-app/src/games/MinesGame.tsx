import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceBet } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Bomb, Diamond, DollarSign } from "lucide-react";

const GRID_SIZE = 25;
const QUICK_AMOUNTS = ["50", "100", "500", "1000"];

function calcMultiplier(minesCount: number, revealed: number): number {
  if (revealed === 0) return 1;
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    const safeLeft = GRID_SIZE - minesCount - i;
    const tilesLeft = GRID_SIZE - i;
    mult *= (tilesLeft / safeLeft);
  }
  return parseFloat((mult * 0.97).toFixed(2));
}

function generateMines(count: number, seed: number): Set<number> {
  const mines = new Set<number>();
  const rng = (s: number) => {
    let x = Math.sin(s + 1) * 10000;
    return x - Math.floor(x);
  };
  let s = seed;
  while (mines.size < count) {
    s++;
    const pos = Math.floor(rng(s) * GRID_SIZE);
    mines.add(pos);
  }
  return mines;
}

type TileState = "hidden" | "safe" | "mine" | "unrevealed_mine";

export default function MinesGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [minesCount, setMinesCount] = useState(3);
  const [tiles, setTiles] = useState<TileState[]>(Array(GRID_SIZE).fill("hidden"));
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);
  const [payout, setPayout] = useState(0);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const startGame = useCallback(() => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    const seed = Date.now();
    const mines = generateMines(minesCount, seed);
    setMinePositions(mines);
    setTiles(Array(GRID_SIZE).fill("hidden"));
    setRevealed(0);
    setGameActive(true);
    setGameOver(null);
    setPayout(0);
  }, [user, minesCount, toast]);

  const revealTile = useCallback((index: number) => {
    if (!gameActive || tiles[index] !== "hidden") return;

    if (minePositions.has(index)) {
      setTiles(prev => prev.map((t, i) => {
        if (i === index) return "mine";
        if (minePositions.has(i) && t === "hidden") return "unrevealed_mine";
        return t;
      }));
      setGameActive(false);
      setGameOver("lose");
      const amount = parseFloat(betAmount);
      placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "mines", minesCount, revealed, hitMine: true } }
      }).then(() => queryClient.invalidateQueries({ queryKey: ["getWallet"] })).catch(() => {});
      toast({ title: "💥 BOOM! Hit a mine!", variant: "destructive" });
    } else {
      setTiles(prev => prev.map((t, i) => i === index ? "safe" : t));
      setRevealed(r => r + 1);
    }
  }, [gameActive, tiles, minePositions, betAmount, gameId, minesCount, revealed, placeBetMutation, queryClient, toast]);

  const cashout = useCallback(async () => {
    if (!gameActive || revealed === 0) return;
    const amount = parseFloat(betAmount);
    const mult = calcMultiplier(minesCount, revealed);
    const win = amount * mult;
    setGameActive(false);
    setGameOver("win");
    setPayout(win);
    setTiles(prev => prev.map((t, i) => minePositions.has(i) && t === "hidden" ? "unrevealed_mine" : t));
    try {
      await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "mines", minesCount, revealed, cashout: true, multiplier: mult } }
      });
      queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      toast({ title: `💎 Cashed Out! ${mult}x`, description: `+${formatCurrency(win)}`, className: "border-green-500/50" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [gameActive, revealed, betAmount, minesCount, minePositions, gameId, placeBetMutation, queryClient, toast]);

  const currentMultiplier = calcMultiplier(minesCount, revealed);
  const currentPayout = parseFloat(betAmount) * currentMultiplier;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-1.5">
        {tiles.map((tile, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }}
            onClick={() => revealTile(i)}
            disabled={!gameActive || tile !== "hidden"}
            className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-200
              ${tile === "hidden" ? "bg-white/8 hover:bg-primary/20 hover:border-primary/40 border border-white/10 cursor-pointer active:scale-95" : ""}
              ${tile === "safe" ? "bg-green-500/20 border border-green-500/40" : ""}
              ${tile === "mine" ? "bg-red-500/30 border border-red-500/50 animate-pulse" : ""}
              ${tile === "unrevealed_mine" ? "bg-red-500/15 border border-red-500/20" : ""}
              ${!gameActive && tile === "hidden" ? "opacity-40" : ""}
            `}>
            <AnimatePresence>
              {tile === "safe" && <motion.div key="safe" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}><Diamond className="w-5 h-5 text-green-400" /></motion.div>}
              {tile === "mine" && <motion.div key="mine" initial={{ scale: 2 }} animate={{ scale: 1 }}><Bomb className="w-6 h-6 text-red-400" /></motion.div>}
              {tile === "unrevealed_mine" && <Bomb className="w-4 h-4 text-red-400/50" />}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {gameOver && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl p-3 text-center font-bold ${gameOver === "win" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {gameOver === "win" ? `✅ Won ${formatCurrency(payout)} (${calcMultiplier(minesCount, revealed)}x)` : `❌ Hit a mine! Lost ${formatCurrency(parseFloat(betAmount))}`}
        </motion.div>
      )}

      {gameActive && revealed > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">Current Multiplier</p>
            <p className="font-mono font-bold text-primary text-xl">{currentMultiplier}x</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Potential Win</p>
            <p className="font-mono font-bold text-green-400 text-xl">{formatCurrency(currentPayout)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Bet Amount</label>
          <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" className="bg-black/60 border-white/10 font-mono" disabled={gameActive} />
          <div className="flex gap-1 mt-1">
            {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={gameActive} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Mines: {minesCount}</label>
          <div className="flex flex-wrap gap-1">
            {[1, 3, 5, 10, 15, 20].map(n => (
              <button key={n} onClick={() => setMinesCount(n)} disabled={gameActive}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40 ${minesCount === n ? "bg-primary text-black" : "bg-white/5 hover:bg-white/10"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {!gameActive ? (
          <Button onClick={startGame} className="col-span-2 h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            💣 Start Game
          </Button>
        ) : (
          <>
            <Button variant="outline" disabled className="h-14 text-lg border-white/10 text-muted-foreground">
              {revealed} tiles revealed
            </Button>
            <Button onClick={cashout} disabled={revealed === 0}
              className="h-14 text-xl font-bold bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <DollarSign className="w-5 h-5" /> Cashout {currentMultiplier}x
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
