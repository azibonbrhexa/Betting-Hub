import { Link } from "wouter";
import { Game } from "@workspace/api-client-react";
import { Heart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleFavoriteGame } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function GameCard({ game }: { game: Game }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const toggleFavorite = useToggleFavoriteGame();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to favorite games.", variant: "destructive" });
      return;
    }
    try {
      await toggleFavorite.mutateAsync({ id: game.id });
      toast({ title: "Success", description: game.isFavorited ? "Removed from favorites" : "Added to favorites" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update favorite", variant: "destructive" });
    }
  };

  return (
    <Link href={`/games/${game.id}`}>
      <div className="group relative rounded-xl overflow-hidden bg-card border border-white/5 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:-translate-y-1">
        <div className="aspect-[4/3] relative overflow-hidden bg-black/50">
          {game.thumbnail ? (
            <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-black/80 to-primary/20 flex items-center justify-center">
              <span className="text-4xl">🎰</span>
            </div>
          )}
          
          {/* Overlays */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <Button className="rounded-full w-14 h-14 bg-primary text-primary-foreground shadow-[0_0_15px_rgba(212,175,55,0.5)]">
              <Play className="w-6 h-6 ml-1" />
            </Button>
          </div>

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {game.isPopular && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Hot</span>
            )}
            {game.isFeatured && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">VIP</span>
            )}
          </div>
          
          <button 
            onClick={handleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-primary transition-colors"
          >
            <Heart className={`w-4 h-4 ${game.isFavorited ? 'fill-primary text-primary' : ''}`} />
          </button>

          <div className="absolute bottom-2 left-2">
            <span className="bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-medium px-2 py-0.5 rounded border border-white/10">
              RTP {game.rtp.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-foreground truncate">{game.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">{game.provider}</p>
        </div>
      </div>
    </Link>
  );
}
