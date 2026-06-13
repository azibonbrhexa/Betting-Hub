import { useState } from "react";
import { useGetAdminGames, useUpdateAdminGame } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Edit } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";

export default function AdminGames() {
  const [search, setSearch] = useState("");
  const { data: gamesData, refetch } = useGetAdminGames({
    // @ts-ignore
    query: { search, limit: 50 }
  });
  
  const updateMutation = useUpdateAdminGame();
  const { toast } = useToast();

  const handleToggle = async (gameId: number, field: string, value: boolean) => {
    try {
      await updateMutation.mutateAsync({ id: gameId, data: { [field]: value } as any });
      toast({ title: "Game updated" });
      refetch();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Game Configuration</h1>
          <p className="text-muted-foreground text-sm">Manage games, RTP, and visibility</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search games..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-[300px] bg-black/40 border-white/10"
          />
        </div>
      </div>

      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/40 text-muted-foreground text-xs uppercase border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Game</th>
                <th className="px-6 py-4 font-medium">Provider</th>
                <th className="px-6 py-4 font-medium text-center">RTP %</th>
                <th className="px-6 py-4 font-medium text-right">Total Plays</th>
                <th className="px-6 py-4 font-medium text-center">Active</th>
                <th className="px-6 py-4 font-medium text-center">Featured</th>
                <th className="px-6 py-4 font-medium text-center">Popular</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(gamesData as any)?.map?.((g: any) => (
                <tr key={g.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{g.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{g.category.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground uppercase text-xs tracking-wider">
                    {g.provider}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-primary font-bold">
                    {g.rtp.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {formatNumber(g.playCount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Switch 
                      checked={g.isActive} 
                      onCheckedChange={(v) => handleToggle(g.id, 'isActive', v)} 
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Switch 
                      checked={g.isFeatured} 
                      onCheckedChange={(v) => handleToggle(g.id, 'isFeatured', v)} 
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Switch 
                      checked={g.isPopular || false} 
                      onCheckedChange={(v) => handleToggle(g.id, 'isPopular', v)} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
