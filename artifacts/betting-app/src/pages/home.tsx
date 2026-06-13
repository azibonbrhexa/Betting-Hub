import { Layout } from "@/components/layout";
import { JackpotCounter } from "@/components/jackpot-counter";
import { GameCard } from "@/components/game-card";
import { RecentBets } from "@/components/recent-bets";
import { useGetJackpot, useGetTrendingGames, useGetPlatformStats } from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, TrendingUp, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  // @ts-ignore
  const { data: jackpot } = useGetJackpot({ query: { refetchInterval: 3000 } });
  const { data: trendingGames } = useGetTrendingGames();
  const { data: stats } = useGetPlatformStats();

  return (
    <Layout>
      <div className="flex flex-col pb-20">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero.png" 
              alt="Casino Lounge" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
          </div>
          
          <div className="relative z-10 container px-4 flex flex-col items-center text-center mt-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl"
            >
              Where High Rollers <span className="gold-gradient-text">Play</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-white/80 max-w-2xl mb-8 font-light"
            >
              Experience the adrenaline of a Monaco VIP lounge directly from your device.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/games">
                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                  Enter Lobby
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Jackpots */}
        <section className="container px-4 -mt-16 relative z-20 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <JackpotCounter label="Mini" value={jackpot?.mini || 1254.32} />
            <JackpotCounter label="Minor" value={jackpot?.main || 15420.50} />
            <JackpotCounter label="Major" value={jackpot?.major || 85400.00} />
            <JackpotCounter label="Grand" value={jackpot?.grand || 1250000.00} />
          </div>
        </section>

        <div className="container px-4 flex flex-col gap-12">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5">
            <div className="flex flex-col items-center text-center gap-1">
              <Users className="w-5 h-5 text-primary mb-1" />
              <span className="text-xl font-bold font-mono">{stats?.onlineUsers ? formatNumber(stats.onlineUsers) : '12,450'}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Online Now</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 border-x border-white/5">
              <TrendingUp className="w-5 h-5 text-primary mb-1" />
              <span className="text-xl font-bold font-mono">{stats?.totalBetsToday ? formatNumber(stats.totalBetsToday) : '8,45,210'}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Bets Today</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <Trophy className="w-5 h-5 text-primary mb-1" />
              <span className="text-xl font-bold font-mono">{stats?.biggestWinToday ? formatCurrency(Number(stats.biggestWinToday)) : '৳2,54,000'}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Top Win</span>
            </div>
          </div>

          {/* Trending Games */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                <span className="text-primary">#</span> Trending Now
              </h2>
              <Link href="/games">
                <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-transparent">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trendingGames?.slice(0, 5).map(game => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>

          {/* Categories Quick Nav */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'slots', label: 'Slots', image: '/images/slots.png' },
              { id: 'live_casino', label: 'Live Casino', image: '/images/roulette.png' },
              { id: 'crash', label: 'Crash', image: '/images/crash.png' },
              { id: 'cards', label: 'Cards', image: '/images/blackjack.png' },
            ].map(cat => (
              <Link key={cat.id} href={`/games?category=${cat.id}`}>
                <div className="relative h-24 rounded-xl overflow-hidden group cursor-pointer border border-white/5">
                  <img src={cat.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-80" alt={cat.label} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-3 left-4 font-bold text-lg">{cat.label}</span>
                </div>
              </Link>
            ))}
          </section>

          {/* Live Bets */}
          <section>
            <RecentBets />
          </section>
        </div>
      </div>
    </Layout>
  );
}
