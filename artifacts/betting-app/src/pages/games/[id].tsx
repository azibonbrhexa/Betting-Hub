import { Layout } from "@/components/layout";
import { useGetGame, useLaunchGame, useGetBets, usePlaceBet } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Info, History } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function GameDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: game, isLoading } = useGetGame(id, { query: { enabled: !!id } });
  const launchMutation = useLaunchGame();
  const placeBetMutation = usePlaceBet();

  const { data: bets } = useGetBets({
    // @ts-ignore
    query: { gameId: id, limit: 10 },
  });

  const [betAmount, setBetAmount] = useState("1.00");

  const handleLaunch = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to play", variant: "destructive" });
      setLocation("/auth/login");
      return;
    }
    try {
      const res = await launchMutation.mutateAsync({ gameId: id });
      window.open(res.gameUrl, "_blank");
    } catch (err: any) {
      toast({ title: "Could not launch game", description: err.message, variant: "destructive" });
    }
  };

  const handleDemoBet = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to place a bet", variant: "destructive" });
      return;
    }
    const amount = Number(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      const res = await placeBetMutation.mutateAsync({
        data: {
          gameId: id,
          amount,
          gameData: { demo: true }
        }
      });
      toast({ 
        title: res.payout > 0 ? "You Won!" : "You Lost", 
        description: res.payout > 0 ? `Payout: ${formatCurrency(res.payout)}` : `Lost: ${formatCurrency(amount)}`,
        className: res.payout > 0 ? "bg-green-500/20 text-green-500 border-green-500/50" : ""
      });
    } catch (err: any) {
      toast({ title: "Bet Failed", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return <Layout><div className="flex-1 flex items-center justify-center">Loading...</div></Layout>;
  }

  if (!game) {
    return <Layout><div className="flex-1 flex items-center justify-center">Game not found</div></Layout>;
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        <Button variant="ghost" onClick={() => setLocation("/games")} className="w-fit -ml-4 text-muted-foreground hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lobby
        </Button>

        <div className="glass-panel p-1 rounded-3xl border border-white/5 overflow-hidden">
          <div className="aspect-video md:aspect-[21/9] relative bg-black/80 rounded-[1.4rem] overflow-hidden flex flex-col items-center justify-center">
            {game.thumbnail && (
              <img src={game.thumbnail} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
            )}
            <div className="z-10 text-center flex flex-col items-center">
              {game.thumbnail && (
                <img src={game.thumbnail} alt={game.name} className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-xl shadow-2xl mb-6 border border-white/10" />
              )}
              <h1 className="text-3xl md:text-5xl font-bold font-serif mb-2">{game.name}</h1>
              <p className="text-primary tracking-widest uppercase text-sm font-bold mb-8">{game.provider}</p>
              <Button size="lg" className="h-16 px-12 text-xl font-bold bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-[0_0_30px_rgba(212,175,55,0.4)] rounded-full" onClick={handleLaunch}>
                <Play className="w-6 h-6 mr-2 fill-current" /> Play Now
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> Game Info
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">RTP</p>
                  <p className="font-mono font-bold text-lg text-primary">{game.rtp.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Category</p>
                  <p className="font-bold text-lg capitalize">{game.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Min Bet</p>
                  <p className="font-mono font-bold text-lg">{formatCurrency(game.minBet || 0.1)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Max Win</p>
                  <p className="font-mono font-bold text-lg">{game.maxWin ? `${game.maxWin}x` : 'Unlimited'}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Recent Plays
              </h2>
              <div className="divide-y divide-white/5">
                {bets?.data.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No recent plays recorded.</p>
                ) : (
                  bets?.data.map(bet => (
                    <div key={bet.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{formatDate(bet.createdAt)}</p>
                        <p className="font-mono font-bold">{formatCurrency(bet.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${bet.payout > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {bet.payout > 0 ? '+' : ''}{formatCurrency(bet.payout)}
                        </p>
                        <p className="text-xs text-muted-foreground">{bet.multiplier ? `${bet.multiplier}x` : '-'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.05)]">
              <h3 className="font-bold text-lg mb-4">Quick Bet (Demo)</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Amount</label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={betAmount} 
                      onChange={e => setBetAmount(e.target.value)}
                      className="bg-black/50 border-white/10 font-mono"
                    />
                  </div>
                </div>
                <Button onClick={handleDemoBet} disabled={placeBetMutation.isPending} className="w-full font-bold">
                  {placeBetMutation.isPending ? "Placing..." : "Place Bet"}
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
