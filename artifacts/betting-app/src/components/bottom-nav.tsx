import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, Trophy, User, Star, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (location.startsWith("/admin")) return null;

  const items = user ? [
    { href: "/",            label: "হোম",      icon: Home },
    { href: "/games",       label: "গেম",      icon: Gamepad2 },
    { href: "/wallet",      label: "ওয়ালেট",   icon: Wallet },
    { href: "/promotions",  label: "অফার",     icon: Gift },
    { href: "/leaderboard", label: "র‍্যাংক",   icon: Trophy },
    { href: "/profile",     label: "প্রোফাইল", icon: User },
  ] : [
    { href: "/",            label: "হোম",      icon: Home },
    { href: "/games",       label: "গেম",      icon: Gamepad2 },
    { href: "/promotions",  label: "অফার",     icon: Gift },
    { href: "/leaderboard", label: "র‍্যাংক",   icon: Trophy },
    { href: "/auth/login",  label: "লগইন",    icon: User },
  ];

  return (
    <nav className="fixed bottom-0 z-50 w-full glass-panel border-t border-white/5 pb-safe pt-1 px-1 md:hidden">
      <ul className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <li key={item.href} className="flex-1">
              <Link href={item.href}>
                <div className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-0.5 cursor-pointer transition-all",
                  isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-white"
                )}>
                  <div className={cn("p-1 rounded-lg transition-all", isActive && "bg-primary/15")}>
                    <item.icon className={cn("w-4.5 h-4.5", isActive && "fill-primary/20")} style={{ width: "18px", height: "18px" }} />
                  </div>
                  <span className={cn("text-[9px] font-semibold", isActive ? "text-primary" : "")}>{item.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
