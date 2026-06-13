import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetBetStats, useLogout } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/format";
import { LogOut, ShieldCheck, Trophy, Activity } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Profile() {
  const { user, logout } = useAuth();
  // @ts-ignore
  const { data: stats } = useGetBetStats({ query: { enabled: !!user } });
  const [, setLocation] = useLocation();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Profile Header */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
          
          <Avatar className="w-24 h-24 border-2 border-primary shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="text-3xl bg-black text-primary font-bold">
              {user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center md:text-left z-10">
            <h1 className="text-3xl font-serif font-bold text-white mb-1">{user.username}</h1>
            <p className="text-muted-foreground text-sm mb-3">{user.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3" /> VIP Level {user.vipLevel || 1}
              </span>
              {user.kycStatus === 'approved' && (
                <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>

          <div className="z-10 flex flex-col gap-2">
            {user.role === 'admin' && (
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full md:w-auto" onClick={() => setLocation("/admin")}>
                Admin Dashboard
              </Button>
            )}
            <Button variant="destructive" className="w-full md:w-auto flex items-center gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Bets</p>
            <p className="text-2xl font-mono font-bold text-white">{formatNumber(stats?.totalBets)}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Wagered</p>
            <p className="text-2xl font-mono font-bold text-white">{formatCurrency(stats?.totalWagered)}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Total Won</p>
            <p className="text-2xl font-mono font-bold text-green-500">{formatCurrency(stats?.totalWon)}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Biggest Win</p>
            <p className="text-2xl font-mono font-bold text-primary">{formatCurrency(stats?.biggestWin)}</p>
          </div>
        </div>

        {/* Actions List */}
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            <Link href="/referrals">
              <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Affiliate Program</p>
                    <p className="text-xs text-muted-foreground">Invite friends and earn commissions</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </Layout>
  );
}
