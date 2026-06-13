import { Link } from "wouter";
import { Game } from "@workspace/api-client-react";
import { Heart, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleFavoriteGame } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const GAME_ICONS: Record<string, string> = {
  crash:        "🚀",
  mines:        "💣",
  dice:         "🎲",
  plinko:       "🎯",
  limbo:        "🌙",
  "lucky-wheel":"🎡",
  "lucky_wheel":"🎡",
  "coin-flip":  "🪙",
  "coin_flip":  "🪙",
  slots:        "🎰",
  blackjack:    "🃏",
  roulette:     "🎰",
  baccarat:     "🎴",
  poker:        "♠️",
  keno:         "🎱",
  "fish-hunter":"🐟",
  fishing:      "🐟",
  blockchain:   "⛓️",
  "hi-lo":      "🔢",
  hilo:         "🔢",
  "tower":      "🗼",
  "video-poker":"🃏",
  "dragon-tiger":"🐉",
  "football":   "⚽",
  "basketball": "🏀",
};

const GAME_GRADIENTS: Record<string, string> = {
  crash:        "from-orange-900/80 to-red-900/80",
  mines:        "from-green-900/80 to-emerald-900/80",
  dice:         "from-blue-900/80 to-indigo-900/80",
  plinko:       "from-purple-900/80 to-violet-900/80",
  limbo:        "from-slate-900/80 to-blue-950/80",
  slots:        "from-yellow-900/80 to-amber-900/80",
  blackjack:    "from-gray-900/80 to-zinc-900/80",
  roulette:     "from-red-900/80 to-rose-900/80",
  baccarat:     "from-teal-900/80 to-cyan-900/80",
};

function getGameIcon(slug: string, name: string): string {
  const s = slug.toLowerCase().replace(/\s+/g, "-");
  if (GAME_ICONS[s]) return GAME_ICONS[s];
  const n = name.toLowerCase();
  for (const [key, icon] of Object.entries(GAME_ICONS)) {
    if (n.includes(key.replace("-", " ")) || n.includes(key.replace("_", " "))) return icon;
  }
  return "🎮";
}

function getGameGradient(slug: string): string {
  const s = slug.toLowerCase();
  for (const [key, grad] of Object.entries(GAME_GRADIENTS)) {
    if (s.includes(key)) return grad;
  }
  return "from-purple-900/80 to-black/80";
}

export function GameCard({ game }: { game: Game }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const toggleFavorite = useToggleFavoriteGame();
  const icon = getGameIcon(game.slug, game.name);
  const gradient = getGameGradient(game.slug);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "লগইন করুন", description: "ফেভারিট করতে লগইন প্রয়োজন", variant: "destructive" });
      return;
    }
    try {
      await toggleFavorite.mutateAsync({ id: game.id });
    } catch (err) {
      toast({ title: "ব্যর্থ হয়েছে", variant: "destructive" });
    }
  };

  return (
    <Link href={`/games/${game.id}`}>
      <div className="group relative rounded-2xl overflow-hidden bg-card border border-white/5 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] hover:-translate-y-1 cursor-pointer">
        <div className="aspect-[4/3] relative overflow-hidden">
          {game.thumbnail ? (
            <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
              {/* Icon with glow */}
              <div className="relative">
                <div className="absolute inset-0 blur-xl opacity-60 text-7xl flex items-center justify-center">{icon}</div>
                <span className="relative text-5xl drop-shadow-lg">{icon}</span>
              </div>
              {/* Game name overlay */}
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-xs font-bold text-white/80 tracking-wide">{game.name}</span>
              </div>
            </div>
          )}

          {/* Hover Play Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2">
              <Button className="rounded-full w-14 h-14 bg-primary text-primary-foreground shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:scale-110 transition-transform">
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
              </Button>
              <span className="text-xs font-bold text-white/90">খেলুন</span>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {game.isPopular && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                🔥 HOT
              </span>
            )}
            {game.isFeatured && (
              <span className="bg-primary text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                ⭐ VIP
              </span>
            )}
          </div>

          {/* Favorite */}
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 hover:text-primary transition-colors z-10"
          >
            <Heart className={`w-3.5 h-3.5 ${game.isFavorited ? "fill-primary text-primary" : ""}`} />
          </button>

          {/* RTP Badge */}
          <div className="absolute bottom-2 left-2">
            <span className="bg-black/70 backdrop-blur-md text-white/80 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10">
              RTP {game.rtp.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-2.5">
          <h3 className="font-bold text-sm truncate text-foreground">{game.name}</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{game.provider}</p>
        </div>
      </div>
    </Link>
  );
}
