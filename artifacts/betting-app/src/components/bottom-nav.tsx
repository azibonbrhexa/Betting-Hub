import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  if (location.startsWith("/admin")) return null;

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/games", label: "Games", icon: Gamepad2 },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/bonuses", label: "Promos", icon: Gift },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 z-50 w-full glass-panel border-t border-white/5 pb-safe pt-2 px-2 md:hidden">
      <ul className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <li key={item.href} className="flex-1">
              <Link href={item.href}>
                <div className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer transition-colors",
                  isActive ? "text-[#E0AA3E]" : "text-muted-foreground hover:text-white"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "fill-[#E0AA3E]/20")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
