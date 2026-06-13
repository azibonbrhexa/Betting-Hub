import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ username, email, password });
      toast({ title: "Welcome to the VIP Club" });
      setLocation("/");
    } catch (err: any) {
      toast({ 
        title: "Registration Failed", 
        description: err.message || "Please check your details",
        variant: "destructive"
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
          <p className="text-muted-foreground text-sm">Create your exclusive account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              placeholder="HighRoller99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus:border-primary h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus:border-primary h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-black/50 border-white/10 focus:border-primary h-12"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)] mt-6"
            disabled={loading}
          >
            {loading ? "Processing..." : "Join Now"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-bold">
            Log In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
