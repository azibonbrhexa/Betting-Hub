import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetWallet, useGetNotifications } from "@workspace/api-client-react";
import { Bell, Wallet, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

export function Header() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  // @ts-ignore
  const { data: wallet } = useGetWallet({ query: { enabled: !!user } });
  // @ts-ignore
  const { data: notifications } = useGetNotifications({ query: { enabled: !!user } });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/">
          <div className="font-serif font-bold text-2xl gold-gradient-text tracking-wider flex items-center cursor-pointer">
            BetRoyal
          </div>
        </Link>
      </div>

      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs text-muted-foreground font-mono">BALANCE</span>
            <span className="text-sm font-bold text-[#E0AA3E]">
              {wallet ? formatCurrency(wallet.balance) : "৳0.00"}
            </span>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 h-9 px-4 rounded-full"
            onClick={() => setLocation("/wallet")}
          >
            Deposit
          </Button>
          <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-white">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/auth/login")}>
            Log In
          </Button>
          <Button size="sm" className="rounded-full font-bold" onClick={() => setLocation("/auth/register")}>
            Register
          </Button>
        </div>
      )}
    </header>
  );
}
