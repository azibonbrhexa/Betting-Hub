import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground pb-16 md:pb-0">
      <Header />
      <main className="flex-1 flex flex-col relative w-full max-w-7xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
