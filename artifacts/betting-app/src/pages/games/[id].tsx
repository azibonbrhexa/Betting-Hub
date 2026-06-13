import { Layout } from "@/components/layout";
import { useGetGame, useGetBets } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, History } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameRouter from "@/games/GameRouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function GameDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: game, isLoading } = useGetGame(id, { query: { enabled: !!id } });

  const { data: bets } = useGetBets({
    // @ts-ignore
    query: { gameId: id, limit: 15 },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <div className="text-6xl">🎮</div>
          <p className="text-xl font-bold">Game not found</p>
          <Button onClick={() => setLocation("/games")} variant="outline">Back to Lobby</Button>
        </div>
      </Layout>
    );
  }

  const categoryColors: Record<string, string> = {
    crash: "text-orange-400", mines: "text-red-400", dice: "text-blue-400",
    coin_flip: "text-yellow-400", limbo: "text-purple-400", plinko: "text-cyan-400",
    lucky_wheel: "text-green-400", slots: "text-pink-400", live_casino: "text-emerald-400",
  };
  const catColor = categoryColors[game.category] ?? "text-primary";

  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        <Button variant="ghost" onClick={() => setLocation("/games")} className="w-fit -ml-2 text-muted-foreground hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Lobby
        </Button>

        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-serif">{game.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm font-bold uppercase tracking-wider ${catColor}`}>{game.category.replace(/_/g, " ")}</span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-muted-foreground text-sm">{game.provider}</span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-mono">RTP {game.rtp.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-2xl border border-white/8 p-6">
              <GameRouter
                gameId={id}
                category={game.category}
                slug={game.slug ?? ""}
                name={game.name}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass-panel rounded-2xl border border-white/8 p-5">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Min Bet</p>
                  <p className="font-mono font-bold text-primary">{formatCurrency(game.minBet ?? 0.1)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Max Bet</p>
                  <p className="font-mono font-bold text-primary">{formatCurrency(game.maxBet ?? 1000)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Max Win</p>
                  <p className="font-mono font-bold">{game.maxWin ? `${game.maxWin}x` : "∞"}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Plays</p>
                  <p className="font-mono font-bold">{(game.playCount ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl border border-white/8 p-5">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> My Recent Bets
              </h3>
              <div className="space-y-2">
                {!bets?.data?.length ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No bets yet</p>
                ) : (
                  bets.data.slice(0, 8).map(bet => (
                    <div key={bet.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-xs text-muted-foreground">{formatDate(bet.createdAt)}</p>
                        <p className="font-mono text-sm font-bold">{formatCurrency(bet.amount)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bet.status === "won" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {bet.status === "won" ? `+${formatCurrency(bet.payout)}` : `-${formatCurrency(bet.amount)}`}
                        </span>
                        {bet.multiplier && <p className="text-xs text-muted-foreground mt-0.5">{bet.multiplier.toFixed(2)}x</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
