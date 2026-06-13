import { Switch, Route, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Gamepad2, Gift, Receipt, CreditCard, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

import AdminDashboard from "./index";
import AdminUsers from "./users";
import AdminGames from "./games";
import AdminBonuses from "./bonuses";
import AdminTransactions from "./transactions";
import AdminDeposits from "./deposits";

function AdminNav() {
  const [location] = useLocation();

  const links = [
    { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard },
    { href: "/admin/deposits",     label: "Deposits 🔴",  icon: CreditCard },
    { href: "/admin/users",        label: "Users",        icon: Users },
    { href: "/admin/games",        label: "Games",        icon: Gamepad2 },
    { href: "/admin/bonuses",      label: "Bonuses",      icon: Gift },
    { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  ];

  return (
    <div className="w-full md:w-56 shrink-0 flex flex-col gap-2">
      <div className="glass-panel p-4 rounded-xl border border-primary/20 mb-2">
        <h2 className="font-serif font-bold text-xl gold-gradient-text flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" /> Admin
        </h2>
      </div>
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {links.map((link) => {
          const isActive = link.href === "/admin"
            ? location === "/admin"
            : location.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 whitespace-nowrap text-sm",
                  isActive ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(224,170,62,0.3)]" : "text-muted-foreground hover:text-white"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        <AdminNav />
        <div className="flex-1 min-w-0">
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/deposits" component={AdminDeposits} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/admin/games" component={AdminGames} />
            <Route path="/admin/bonuses" component={AdminBonuses} />
            <Route path="/admin/transactions" component={AdminTransactions} />
          </Switch>
        </div>
      </div>
    </Layout>
  );
}
