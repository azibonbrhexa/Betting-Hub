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
    <div className="flex flex-col items-center gap-5">
      {/* 3D Wheel Container */}
      <div className="relative flex flex-col items-center" style={{ perspective: "800px" }}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          animate={spinning ? { opacity: [0.3, 0.8, 0.3], scale: [0.95, 1.05, 0.95] } : { opacity: 0.4 }}
          transition={{ repeat: spinning ? Infinity : 0, duration: 0.8 }}
          style={{ width: size + 20, height: size + 20, top: -10, left: -10,
            background: "radial-gradient(circle, rgba(224,170,62,0.15) 0%, transparent 70%)",
            filter: "blur(10px)" }}
        />

        {/* Pointer */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20" style={{ filter: "drop-shadow(0 2px 8px #E0AA3E)" }}>
          <svg width="24" height="28" viewBox="0 0 24 28">
            <polygon points="12,28 0,0 24,0" fill="#E0AA3E" />
            <polygon points="12,24 2,2 22,2" fill="#ffd700" />
          </svg>
        </div>

        <motion.div
          style={{
            transformStyle: "preserve-3d",
            filter: `drop-shadow(0 0 ${spinning ? "30px" : "15px"} rgba(212,175,55,${spinning ? "0.5" : "0.3"}))`,
          }}
          animate={{ rotateX: spinning ? [0, -8, 0] : 0 }}
          transition={{ duration: 0.6, repeat: spinning ? Infinity : 0 }}
        >
          <motion.svg
            width={size} height={size}
            animate={{ rotate: rotation }}
            transition={{ duration: 4.5, ease: [0.17, 0.67, 0.12, 0.99] }}>
            {/* Outer ring */}
            <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="#E0AA3E" strokeWidth="4" opacity="0.6" />
            <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.3" />

            {segPaths.map((seg, i) => (
              <g key={i}>
                <path d={seg.d} fill={seg.color} stroke="#000" strokeWidth="1.5" />
                {/* Inner shine */}
                <path d={seg.d} fill="rgba(255,255,255,0.03)" stroke="none" />
                <text x={seg.tx} y={seg.ty} textAnchor="middle" dominantBaseline="middle"
                  fontSize={SEGMENTS[i].mult >= 10 ? "11" : "12"} fontWeight="bold"
                  fill={SEGMENTS[i].mult > 0 ? "#fff" : "#555"}
                  style={{ textShadow: SEGMENTS[i].mult > 3 ? "0 0 8px rgba(255,255,255,0.8)" : "none" }}>
                  {seg.label}
                </text>
              </g>
            ))}
            {/* Center hub */}
            <circle cx={cx} cy={cy} r="22" fill="#0d0d0d" stroke="#E0AA3E" strokeWidth="2" />
            <circle cx={cx} cy={cy} r="18" fill="#E0AA3E" />
            <circle cx={cx} cy={cy} r="14" fill="#ffd700" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#000" fontWeight="900">★</text>
          </motion.svg>
        </motion.div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`px-8 py-4 rounded-2xl text-center font-bold text-xl w-full ${
            result.won
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
          {result.won
            ? `🎡 ${result.seg.label} — +${formatCurrency(result.payout)} জিতেছেন!`
            : `🎡 ${result.seg.label} — পরের বার ভাগ্য থাকবে!`}
        </motion.div>
      )}

      <div className="w-full">
        <label className="text-xs text-muted-foreground mb-1 block uppercase tracking-wider">বেট পরিমাণ</label>
        <Input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number"
          className="bg-black/60 border-white/10 font-mono text-lg" disabled={spinning} />
        <div className="flex gap-1 mt-1">
          {QUICK_AMOUNTS.map(a => <button key={a} onClick={() => setBetAmount(a)} disabled={spinning}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-1 py-1.5 font-mono transition-colors disabled:opacity-40">৳{a}</button>)}
          <button onClick={() => setBetAmount(b => String(parseFloat(b) * 2))} disabled={spinning}
            className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1.5 font-mono transition-colors disabled:opacity-40">2x</button>
        </div>
      </div>

      <Button onClick={spin} disabled={spinning}
        className="w-full h-14 text-xl font-bold bg-primary text-black hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.4)] rounded-xl">
        {spinning ? "🎡 ঘুরছে..." : "🎡 Wheel স্পিন করুন"}
      </Button>
    </div>
  );
}
