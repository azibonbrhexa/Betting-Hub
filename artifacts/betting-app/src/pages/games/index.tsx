import { Layout } from "@/components/layout";
import { useGetGames, useGetGameCategories } from "@workspace/api-client-react";
import { GameCard } from "@/components/game-card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GamesLobby() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  
  const { data: gamesData, isLoading } = useGetGames({
    query: {
      queryKey: ["games", search, category],
    },
    request: {
      // @ts-ignore
      query: { search, category, limit: 50 }
    }
  });

  const { data: categories } = useGetGameCategories();

  return (
    <Layout>
      <div className="container px-4 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-serif font-bold gold-gradient-text">Game Lobby</h1>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search games..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-black/50 border-white/10 focus:border-primary h-12"
              />
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12 border-white/10 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-2 scrollbar-none">
            <Button 
              variant={!category ? "default" : "outline"} 
              className={!category ? "bg-primary text-primary-foreground font-bold" : "border-white/10"}
              onClick={() => setCategory(undefined)}
            >
              All Games
            </Button>
            {categories?.map(cat => (
              <Button 
                key={cat.slug}
                variant={category === cat.slug ? "default" : "outline"}
                className={category === cat.slug ? "bg-primary text-primary-foreground font-bold" : "border-white/10"}
                onClick={() => setCategory(cat.slug)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {gamesData?.data.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
            {gamesData?.data.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                No games found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
