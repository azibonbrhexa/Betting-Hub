import { useState } from "react";
import { useGetAdminBonuses, useCreateAdminBonus } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus, Gift, Percent } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AdminBonuses() {
  const { data: bonuses, refetch } = useGetAdminBonuses();
  const createMutation = useCreateAdminBonus();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "deposit",
    value: "",
    valueType: "fixed",
    wagerRequirement: "30",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          value: Number(formData.value),
          valueType: formData.valueType,
          wagerRequirement: Number(formData.wagerRequirement),
          isActive: true
        }
      });
      toast({ title: "Bonus created successfully" });
      setOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Failed to create bonus", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bonus Campaigns</h1>
          <p className="text-muted-foreground text-sm">Manage promotional offers and bonuses</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2">
              <Plus className="w-4 h-4" /> Create Bonus
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-white/10 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Bonus Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-black/50 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-black/50 border-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bonus Type</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger className="bg-black/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="free_spins">Free Spins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value Type</Label>
                  <Select value={formData.valueType} onValueChange={v => setFormData({...formData, valueType: v})}>
                    <SelectTrigger className="bg-black/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed ($)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input type="number" required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="bg-black/50 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label>Wager Multiplier (x)</Label>
                  <Input type="number" required value={formData.wagerRequirement} onChange={e => setFormData({...formData, wagerRequirement: e.target.value})} className="bg-black/50 border-white/10" />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full font-bold mt-4">
                {createMutation.isPending ? "Creating..." : "Launch Campaign"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bonuses?.map(bonus => (
          <div key={bonus.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {bonus.valueType === 'percentage' ? <Percent className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                </div>
                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                  bonus.isActive ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white/50'
                }`}>
                  {bonus.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">{bonus.name}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">{bonus.type.replace('_', ' ')}</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-black/30 p-2 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Value</p>
                  <p className="font-mono font-bold text-white">
                    {bonus.valueType === 'percentage' ? `${bonus.value}%` : formatCurrency(bonus.value)}
                  </p>
                </div>
                <div className="bg-black/30 p-2 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Wager Req.</p>
                  <p className="font-mono font-bold text-white">{bonus.wagerRequirement}x</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
              Edit Campaign
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
