import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        username,
        email,
        password,
        ...(referralCode ? { referralCode } : {}),
      });
      toast({ title: "🎉 BetRoyal-এ স্বাগতম!" });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "রেজিস্ট্রেশন ব্যর্থ",
        description: err.message || "তথ্য যাচাই করুন",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/blackjack.png"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl shadow-primary/10"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold gold-gradient-text tracking-wider mb-2">BetRoyal</h1>
          <p className="text-muted-foreground text-sm">আপনার VIP একাউন্ট তৈরি করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ইউজারনেম</Label>
            <Input
              id="username"
              placeholder="HighRoller99"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus:border-primary h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">ইমেইল</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus:border-primary h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-black/50 border-white/10 focus:border-primary h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref">রেফারেল কোড <span className="text-muted-foreground">(ঐচ্ছিক)</span></Label>
            <Input
              id="ref"
              placeholder="REF123456"
              value={referralCode}
              onChange={e => setReferralCode(e.target.value)}
              className="bg-black/50 border-white/10 focus:border-primary h-12 uppercase tracking-widest"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)] mt-6"
            disabled={loading}
          >
            {loading ? "প্রসেসিং..." : "এখনই যোগ দিন"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          ইতিমধ্যে সদস্য?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-bold">
            লগ ইন করুন
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
