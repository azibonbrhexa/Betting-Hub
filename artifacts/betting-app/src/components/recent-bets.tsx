import { useGetRecentBets } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

export function RecentBets() {
  const { data: bets } = useGetRecentBets({
    query: {
      refetchInterval: 5000, // refresh every 5 seconds to feel live
    }
  });

  if (!bets || bets.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Bets
        </h2>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground p-3 border-b border-white/5 uppercase tracking-wider">
          <div className="col-span-2">Game / User</div>
          <div className="text-right">Bet</div>
          <div className="text-right">Multiplier</div>
          <div className="text-right">Payout</div>
        </div>

        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {bets.slice(0, 10).map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: -20, backgroundColor: "rgba(212, 175, 55, 0.2)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0, 0, 0, 0)" }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-5 items-center p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
              >
                <div className="col-span-2 flex items-center gap-2 overflow-hidden">
                  <Avatar className="w-6 h-6 border border-primary/20">
                    <AvatarImage src={bet.avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-black">{bet.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate">{bet.gameName}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{bet.username}</span>
                  </div>
                </div>
                
                <div className="text-right text-xs font-mono">
                  {formatCurrency(bet.amount)}
                </div>
                
                <div className="text-right text-xs font-mono">
                  <span className={bet.multiplier > 1 ? "text-primary" : "text-muted-foreground"}>
                    {bet.multiplier.toFixed(2)}x
                  </span>
                </div>
                
                <div className="text-right text-xs font-mono font-bold">
                  {bet.payout > 0 ? (
                    <span className="text-green-500">+{formatCurrency(bet.payout)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
