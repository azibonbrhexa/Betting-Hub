import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { DailyBonusModal } from "@/components/daily-bonus-modal";
import { Analytics } from "@vercel/analytics/react";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Wallet from "@/pages/wallet";
import Profile from "@/pages/profile";
import GamesLobby from "@/pages/games";
import GameDetail from "@/pages/games/[id]";
import Bonuses from "@/pages/bonuses";
import Referrals from "@/pages/referrals";
import AdminLayout from "@/pages/admin/layout";
import Leaderboard from "@/pages/leaderboard";
import Achievements from "@/pages/achievements";
import VIP from "@/pages/vip";
import Promotions from "@/pages/promotions";
import Support from "@/pages/support";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/auth/login" />;
  if (adminOnly && user.role !== 'admin') return <Redirect to="/" />;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/games" component={GamesLobby} />
      <Route path="/games/:id" component={GameDetail} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/promotions" component={Promotions} />
      <Route path="/support" component={Support} />
      <Route path="/vip" component={VIP} />

      <Route path="/bonuses">{() => <ProtectedRoute component={Bonuses} />}</Route>
      <Route path="/referrals">{() => <ProtectedRoute component={Referrals} />}</Route>
      <Route path="/wallet">{() => <ProtectedRoute component={Wallet} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/achievements">{() => <ProtectedRoute component={Achievements} />}</Route>

      <Route path="/admin*">{() => <ProtectedRoute component={AdminLayout} adminOnly={true} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  const { user } = useAuth();
  return (
    <>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      {user && <DailyBonusModal />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
      <Analytics />
    </QueryClientProvider>
  );
}

export default App;
