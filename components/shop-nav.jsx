"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { ShoppingBag, Sparkles, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function ShopNav() {
  const { items, setOpen } = useCart();
  const router = useRouter();
  const count = items.length;

  const logout = async () => {
    await fetch("/api/access/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#07050d]/70 border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/shop" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 grid place-items-center glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-extrabold tracking-tight text-lg neon-text">SOCIAL BOOSTER</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setOpen(true)} className="relative hover:bg-purple-500/10">
            <ShoppingBag className="h-5 w-5" />
            <span className="ml-2 hidden sm:inline">Kosaram</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-fuchsia-500 text-xs font-bold grid place-items-center">
                {count}
              </span>
            )}
          </Button>
          <Button variant="ghost" onClick={logout} className="hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
