import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetWallet, useGetNotifications } from "@workspace/api-client-react";
import { Bell, Wallet, ChevronRight, X, Trophy, Crown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Header() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // @ts-ignore
  const { data: wallet } = useGetWallet({ query: { enabled: !!user } });
  // @ts-ignore
  const { data: notifications, refetch: refetchNotifs } = useGetNotifications({ query: { enabled: !!user, refetchInterval: 30000 } });

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(`${BASE}/api/notifications/read-all`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    refetchNotifs();
  };

  const NOTIF_ICONS: Record<string, string> = {
    deposit: "💰", withdrawal: "💸", bonus: "🎁", info: "ℹ️", win: "🏆", system: "🔔",
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 px-4 h-16 flex items-center justify-between">
      <Link href="/">
        <div className="font-serif font-bold text-2xl gold-gradient-text tracking-wider cursor-pointer flex items-center gap-1">
          <Crown className="w-5 h-5 text-primary" />
          BetRoyal
        </div>
      </Link>

      {user ? (
        <div className="flex items-center gap-2">
          {/* Balance */}
          <button onClick={() => setLocation("/wallet")}
            className="hidden sm:flex flex-col items-end mr-1 hover:opacity-80 transition-opacity">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Balance</span>
            <span className="text-sm font-bold text-primary font-mono">
              {wallet ? formatCurrency(wallet.balance) : "৳0.00"}
            </span>
          </button>

          {/* Deposit Button */}
          <Button
            size="sm"
            className="bg-primary text-black font-bold shadow-[0_0_10px_rgba(224,170,62,0.3)] h-8 px-3 rounded-full text-xs hidden sm:flex"
            onClick={() => setLocation("/wallet")}
          >
            + ডিপোজিট
          </Button>

          {/* Notifications Bell */}
          <div ref={notifRef} className="relative">
            <Button
              variant="ghost" size="icon"
              className="relative rounded-full text-muted-foreground hover:text-white w-9 h-9"
              onClick={() => setNotifOpen(o => !o)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-80 glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <h3 className="font-bold text-sm">নোটিফিকেশন</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">সব পড়া</button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {(!notifications || notifications.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>কোনো নোটিফিকেশন নেই</p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((n: any) => (
                        <div key={n.id} className={`px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0">{NOTIF_ICONS[n.type] ?? "🔔"}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${!n.read ? "text-white" : "text-muted-foreground"}`}>{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(n.createdAt)}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button onClick={() => setNotifOpen(false)} className="w-full py-2 text-xs text-muted-foreground hover:text-white transition-colors border-t border-white/5 flex items-center justify-center gap-1">
                    বন্ধ করুন <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/auth/login")} className="text-sm">
            Log In
          </Button>
          <Button size="sm" className="rounded-full font-bold text-sm" onClick={() => setLocation("/auth/register")}>
            Register
          </Button>
        </div>
      )}
    </header>
  );
}
