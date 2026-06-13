import { Layout } from "@/components/layout";
import { useGetBonuses, useGetActiveBonuses, useClaimBonus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gift, Percent, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

export default function Bonuses() {
  const { data: availableBonuses } = useGetBonuses();
  const { data: activeBonuses, refetch: refetchActive } = useGetActiveBonuses();
  const claimMutation = useClaimBonus();
  const { toast } = useToast();

  const handleClaim = async (bonusId: number) => {
    try {
      await claimMutation.mutateAsync({ id: bonusId });
      toast({ title: "Bonus Claimed", description: "The bonus has been added to your account!" });
      refetchActive();
    } catch (err: any) {
      toast({ title: "Failed to claim", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        <h1 className="text-3xl font-serif font-bold gold-gradient-text flex items-center gap-3">
          <Gift className="w-8 h-8 text-primary" /> Promotions
        </h1>

        {activeBonuses && activeBonuses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Active Bonuses</h2>
            <div className="grid gap-4">
              {activeBonuses.map(ub => (
                <div key={ub.id} className="glass-panel p-6 rounded-2xl border border-primary/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-white mb-1">{ub.bonus?.name}</h3>
                      <p className="text-sm text-primary font-mono">{formatCurrency(ub.amount)} Bonus</p>
                    </div>
                    {ub.expiresAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-black/40 px-3 py-1.5 rounded-full w-fit">
                        <Clock className="w-3 h-3" /> Expires: {formatDate(ub.expiresAt)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground">
                      <span>Wager Progress</span>
                      <span>{formatCurrency(ub.wagerCompleted)} / {formatCurrency(ub.wagerRequired)}</span>
                    </div>
                    <Progress value={(ub.wagerCompleted / ub.wagerRequired) * 100} className="h-2 bg-black/50" />
                    <p className="text-[10px] text-right text-muted-foreground mt-1">
                      {((ub.wagerCompleted / ub.wagerRequired) * 100).toFixed(1)}% Completed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Available Offers</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {availableBonuses?.map(bonus => (
              <div key={bonus.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {bonus.valueType === 'percentage' ? <Percent className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{bonus.name}</h3>
                  {bonus.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{bonus.description}</p>}
                  
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-black/30 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase">Value</p>
                      <p className="font-mono font-bold text-primary">
                        {bonus.valueType === 'percentage' ? `${bonus.value}%` : formatCurrency(bonus.value)}
                      </p>
                    </div>
                    <div className="bg-black/30 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase">Wager Req.</p>
                      <p className="font-mono font-bold">{bonus.wagerRequirement}x</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleClaim(bonus.id)} 
                  disabled={claimMutation.isPending || activeBonuses?.some(ab => ab.bonusId === bonus.id)}
                  className="w-full font-bold"
                >
                  {activeBonuses?.some(ab => ab.bonusId === bonus.id) ? "Already Active" : "Claim Offer"}
                </Button>
              </div>
            ))}
            {availableBonuses?.length === 0 && (
              <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-2xl">
                No promotions available at this time. Check back later!
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
