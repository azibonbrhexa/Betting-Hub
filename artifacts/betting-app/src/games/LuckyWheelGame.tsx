import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaceBet } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";

const QUICK_AMOUNTS = ["50", "100", "500", "1000"];

const SEGMENTS = [
  { label: "0x", mult: 0, color: "#1a1a1a" },
  { label: "1.5x", mult: 1.5, color: "#D4AF37" },
  { label: "0x", mult: 0, color: "#1a1a1a" },
  { label: "2x", mult: 2, color: "#c0392b" },
  { label: "0x", mult: 0, color: "#1a1a1a" },
  { label: "1.2x", mult: 1.2, color: "#2980b9" },
  { label: "0x", mult: 0, color: "#1a1a1a" },
  { label: "5x", mult: 5, color: "#D4AF37" },
  { label: "0x", mult: 0, color: "#1a1a1a" },
  { label: "1.5x", mult: 1.5, color: "#27ae60" },
  { label: "0x", mult: 0, color: "#1a1a1a" },
  { label: "10x", mult: 10, color: "#8e44ad" },
  { label: "0x", mult: 0, color: "#1a1a1a" },
  { label: "1.2x", mult: 1.2, color: "#2980b9" },
  { label: "0x", mult: 0, color: "#1a1a1a" },
  { label: "3x", mult: 3, color: "#e67e22" },
];

const SEG_ANGLE = 360 / SEGMENTS.length;

export default function LuckyWheelGame({ gameId }: { gameId: number }) {
  const [betAmount, setBetAmount] = useState("1.00");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ seg: typeof SEGMENTS[0]; won: boolean; payout: number } | null>(null);
  const placeBetMutation = usePlaceBet();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const spin = async () => {
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 0.1) return;
    setSpinning(true);
    setResult(null);

    try {
      const res = await placeBetMutation.mutateAsync({
        data: { gameId, amount, gameData: { type: "lucky_wheel" } }
      });
      const won = res.payout > 0;
      const targetIdx = won
        ? SEGMENTS.findIndex(s => s.mult > 1)
        : SEGMENTS.findIndex(s => s.mult === 0);
      const seg = SEGMENTS[targetIdx === -1 ? 0 : targetIdx];
      const targetAngle = -(targetIdx * SEG_ANGLE + SEG_ANGLE / 2);
      const spins = 5 + Math.floor(Math.random() * 5);
      setRotation(r => r + 360 * spins + targetAngle - (rotation % 360));

      setTimeout(() => {
        setResult({ seg, won, payout: res.payout });
        setSpinning(false);
        queryClient.invalidateQueries({ queryKey: ["getWallet"] });
      }, 4500);
    } catch (err: any) {
      setSpinning(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  const segPaths = SEGMENTS.map((seg, i) => {
    const startAngle = (i * SEG_ANGLE - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * SEG_ANGLE - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const midAngle = ((i + 0.5) * SEG_ANGLE - 90) * (Math.PI / 180);
    const tx = cx + (r * 0.7) * Math.cos(midAngle);
    const ty = cy + (r * 0.7) * Math.sin(midAngle);
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`, tx, ty, label: seg.label, color: seg.color };
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-3xl">▼</div>
        <motion.svg
          width={size} height={size}
          animate={{ rotate: rotation }}
          transition={{ duration: 4.5, ease: [0.17, 0.67, 0.12, 0.99] }}
          style={{ filter: "drop-shadow(0 0 20px rgba(212,175,55,0.3))" }}>
          {segPaths.map((seg, i) => (
            <g key={i}>
              <path d={seg.d} fill={seg.color} stroke="#000" strokeWidth="1.5" />
              <text x={seg.tx} y={seg.ty} textAnchor="middle" dominantBaseline="middle"
                fontSize={SEGMENTS[i].mult >= 10 ? "11" : "12"} fontWeight="bold" fill={SEGMENTS[i].mult > 0 ? "#fff" : "#666"}>
                {seg.label}
              </text>
            </g>
          ))}
          <circle cx={cx} cy={cy} r="18" fill="#D4AF37" stroke="#000" strokeWidth="2" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#000" fontWeight="900">★</text>
        </motion.svg>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`px-8 py-4 rounded-2xl text-center font-bold text-xl ${result.won ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {result.won ? `🎡 ${result.seg.label} — Won ${formatCurrency(result.payout)}!` : `🎡 ${result.seg.label} — Better luck next time!`}
        </motion.div>
      )}

      <div className="w-full">
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">Bet Amount</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" className="bg-black/60 border-white/10 font-mono text-lg" disabled={spinning} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={spinning} className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
        </div>
      </div>

      <Button onClick={spin} disabled={spinning} className="w-full h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
        {spinning ? "🎡 Spinning..." : "🎡 Spin Wheel"}
      </Button>
    </div>
  );
}
