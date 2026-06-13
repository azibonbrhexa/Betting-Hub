import { Switch, Route, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Gamepad2, Gift, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

// Subpages
import AdminDashboard from "./index";
import AdminUsers from "./users";
import AdminGames from "./games";
import AdminBonuses from "./bonuses";
import AdminTransactions from "./transactions";

function AdminNav() {
  const [location] = useLocation();

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/games", label: "Games", icon: Gamepad2 },
    { href: "/admin/bonuses", label: "Bonuses", icon: Gift },
    { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  ];

  return (
    <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
      <div className="glass-panel p-4 rounded-xl border border-white/5 mb-4">
        <h2 className="font-serif font-bold text-xl gold-gradient-text">Admin Panel</h2>
      </div>
      <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {links.map((link) => {
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <Button 
                variant={isActive ? "default" : "ghost"} 
                className={cn(
                  "w-full justify-start gap-3 whitespace-nowrap",
                  isActive ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-white"
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
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <AdminNav />
        <div className="flex-1 min-w-0">
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
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
