import CrashGame from "./CrashGame";
import MinesGame from "./MinesGame";
import DiceGame from "./DiceGame";
import CoinFlipGame from "./CoinFlipGame";
import LimboGame from "./LimboGame";
import PlinkoGame from "./PlinkoGame";
import LuckyWheelGame from "./LuckyWheelGame";
import SlotsGame from "./SlotsGame";

interface GameRouterProps {
  gameId: number;
  category: string;
  slug: string;
  name: string;
}

export default function GameRouter({ gameId, category, slug, name }: GameRouterProps) {
  if (slug === "crash" || slug === "aviator") return <CrashGame gameId={gameId} />;
  if (slug === "mines") return <MinesGame gameId={gameId} />;
  if (slug === "dice-roll" || category === "dice") return <DiceGame gameId={gameId} />;
  if (slug === "coin-flip" || category === "coin_flip") return <CoinFlipGame gameId={gameId} />;
  if (slug === "limbo" || category === "limbo") return <LimboGame gameId={gameId} />;
  if (slug === "plinko" || category === "plinko") return <PlinkoGame gameId={gameId} />;
  if (slug === "lucky-wheel" || category === "lucky_wheel") return <LuckyWheelGame gameId={gameId} />;
  if (category === "slots" || category === "cards" || category === "blockchain") return <SlotsGame gameId={gameId} />;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">🎮</div>
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-muted-foreground">Live game coming soon.</p>
      <p className="text-xs text-muted-foreground mt-1">Use the Quick Bet panel on the right to place a bet.</p>
    </div>
  );
}
