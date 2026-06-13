import { useGetAdminStats, useGetDailyReport } from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Users, DollarSign, ArrowDownLeft, ArrowUpRight, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const { data: stats } = useGetAdminStats();
  // Get last 7 days report
  const { data: dailyReport } = useGetDailyReport({ query: { date: new Date().toISOString() } });

  // Mock data for charts if API doesn't return full historical array
  const chartData = [
    { name: 'Mon', revenue: 4000, bets: 2400 },
    { name: 'Tue', revenue: 3000, bets: 1398 },
    { name: 'Wed', revenue: 2000, bets: 9800 },
    { name: 'Thu', revenue: 2780, bets: 3908 },
    { name: 'Fri', revenue: 1890, bets: 4800 },
    { name: 'Sat', revenue: 2390, bets: 3800 },
    { name: 'Sun', revenue: 3490, bets: 4300 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Platform Overview</h1>
        <p className="text-muted-foreground text-sm">Key metrics and performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><DollarSign className="w-4 h-4" /></div>
            <p className="text-sm font-medium text-muted-foreground uppercase">Total Revenue</p>
          </div>
          <p className="text-2xl font-mono font-bold">{formatCurrency(stats?.revenue)}</p>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Users className="w-4 h-4" /></div>
            <p className="text-sm font-medium text-muted-foreground uppercase">Active Users</p>
          </div>
          <p className="text-2xl font-mono font-bold">{formatNumber(stats?.activeUsers)}</p>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500"><ArrowDownLeft className="w-4 h-4" /></div>
            <p className="text-sm font-medium text-muted-foreground uppercase">Total Deposits</p>
          </div>
          <p className="text-2xl font-mono font-bold">{formatCurrency(stats?.totalDeposits)}</p>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><ArrowUpRight className="w-4 h-4" /></div>
            <p className="text-sm font-medium text-muted-foreground uppercase">Total Withdrawals</p>
          </div>
          <p className="text-2xl font-mono font-bold">{formatCurrency(stats?.totalWithdrawals)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <h3 className="font-bold mb-6">Revenue Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <h3 className="font-bold mb-6">Betting Activity</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="bets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
