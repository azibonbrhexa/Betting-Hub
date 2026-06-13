import { useState } from "react";
import { useGetAdminUsers, useUpdateAdminUser } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Shield, Ban, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  
  const { data: usersData, refetch } = useGetAdminUsers({
    // @ts-ignore
    query: { search, status: status === 'all' ? undefined : status }
  });
  
  const updateMutation = useUpdateAdminUser();
  const { toast } = useToast();

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id: userId, data: { status: newStatus } });
      toast({ title: "User updated successfully" });
      refetch();
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">User Management</h1>
          <p className="text-muted-foreground text-sm">View and manage platform users</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[250px] bg-black/40 border-white/10"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px] bg-black/40 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-panel border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/40 text-muted-foreground text-xs uppercase border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role/VIP</th>
                <th className="px-6 py-4 font-medium text-right">Balance</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersData?.data.map(u => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{u.username}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-col items-start">
                      {u.role === 'admin' ? (
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] uppercase font-bold">Admin</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] uppercase">User</span>
                      )}
                      {u.vipLevel && u.vipLevel > 1 && (
                        <span className="text-xs text-primary font-bold">VIP {u.vipLevel}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    <div className="font-bold text-white">{formatCurrency(u.balance)}</div>
                    <div className="text-xs text-muted-foreground">Bonus: {formatCurrency(u.bonusBalance || 0)}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      u.status === 'active' ? 'bg-green-500/20 text-green-500' : 
                      u.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.status !== 'active' ? (
                        <Button size="icon" variant="outline" className="h-8 w-8 border-green-500/30 text-green-500 hover:bg-green-500/10" onClick={() => handleStatusChange(u.id, 'active')} title="Activate">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="outline" className="h-8 w-8 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" onClick={() => handleStatusChange(u.id, 'suspended')} title="Suspend">
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="outline" className="h-8 w-8 border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={() => handleStatusChange(u.id, 'banned')} title="Ban">
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
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
