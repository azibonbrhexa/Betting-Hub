import { Layout } from "@/components/layout";
import { useGetReferrals, useGetReferralSummary, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, DollarSign, Share2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

export default function Referrals() {
  const { data: user } = useGetMe();
  const { data: summary } = useGetReferralSummary();
  const { data: referrals } = useGetReferrals();
  const { toast } = useToast();

  const referralLink = `${window.location.origin}/auth/register?ref=${user?.referralCode}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        <div className="text-center space-y-4 py-8 border-b border-white/10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold gold-gradient-text">Invite & Earn</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Earn up to <span className="text-primary font-bold">{summary?.commissionRate || 10}%</span> commission on every bet your friends make, forever.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Referrals</p>
            <p className="text-3xl font-mono font-bold text-white">{summary?.totalReferrals || 0}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Earned</p>
            <p className="text-3xl font-mono font-bold text-green-500">{formatCurrency(summary?.totalEarned || 0)}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-primary/20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="relative z-10">
              <Share2 className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Pending Comm.</p>
              <p className="text-3xl font-mono font-bold text-primary">{formatCurrency(summary?.pendingEarnings || 0)}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
          <h2 className="text-xl font-bold">Your Referral Link</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Referral Code</label>
              <div className="flex gap-2">
                <Input readOnly value={user?.referralCode || ""} className="bg-black/50 border-white/10 font-mono text-primary font-bold text-lg h-12" />
                <Button onClick={() => handleCopy(user?.referralCode || "", "Code")} className="h-12 w-12 px-0 shrink-0">
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Invite Link</label>
              <div className="flex gap-2">
                <Input readOnly value={referralLink} className="bg-black/50 border-white/10 font-mono text-xs h-12" />
                <Button onClick={() => handleCopy(referralLink, "Link")} className="h-12 px-6 shrink-0 font-bold">
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Referred Users</h2>
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/40 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Commission Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {referrals?.referrals?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                        You haven't referred anyone yet. Share your link to get started!
                      </td>
                    </tr>
                  ) : (
                    referrals?.referrals?.map(ref => (
                      <tr key={ref.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 font-medium">{ref.username}</td>
                        <td className="px-6 py-4 text-muted-foreground">{formatDate(ref.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                            ref.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/50'
                          }`}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                          {formatCurrency(ref.commission)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
