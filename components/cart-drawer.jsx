"use client";
import { useCart } from "@/components/cart-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatHUF } from "@/lib/pricing";
import { Trash2, ShoppingBag, Ticket, X, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export function CartDrawer() {
  const { items, removeItem, updateQty, updateItem, open, setOpen, coupon, setCoupon } = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const discount = coupon ? Math.round(subtotal * (coupon.discountPercent / 100)) : 0;
  const total = subtotal - discount;

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplying(true);
    try {
      const res = await fetch("/api/coupon/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponInput }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Hibás kupon"); return; }
      setCoupon({ code: data.code, discountPercent: data.discountPercent });
      toast.success(`Kupon aktiválva: -${data.discountPercent}%`);
    } finally { setApplying(false); }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-[#0a0618] border-l border-purple-500/30 text-foreground p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b border-purple-500/20">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5 text-fuchsia-400" />
            Kosarad
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              A kosarad üres. Válassz egy követő csomagot.
            </div>
          )}
          <AnimatePresence>
            {items.map((it) => (
              <motion.div key={it.id} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                className="glass rounded-xl p-4 relative group">
                <button onClick={() => removeItem(it.id)} className="absolute right-3 top-3 text-muted-foreground hover:text-red-400 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="text-sm text-muted-foreground">
                  {it.serviceType === 'like' ? 'Like csomag' : `${(it.platform || 'instagram') === 'instagram' ? 'Instagram' : 'TikTok'} követő csomag`}
                </div>
                <div className="text-lg font-bold">
                  {it.followers.toLocaleString("hu-HU")} {it.serviceType === 'like' ? 'like' : 'követő'}
                  {it.bonus ? <span className="text-emerald-300 text-sm ml-1">+{it.bonus} 💎</span> : null}
                </div>
                <div className="mt-3 space-y-2">
                  <Input
                    value={it.userHandle || ''}
                    onChange={(e) => updateItem(it.id, { userHandle: e.target.value })}
                    placeholder="Profil felhasználónév"
                    className="bg-black/40 border-purple-500/30"
                  />
                  {it.serviceType === 'like' && (
                    <Input
                      value={it.mediaLink || ''}
                      onChange={(e) => updateItem(it.id, { mediaLink: e.target.value })}
                      placeholder="Poszt / videó link"
                      className="bg-black/40 border-purple-500/30"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7 border-purple-500/30" onClick={() => updateQty(it.id, Math.max(1, it.quantity - 1))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7 border-purple-500/30" onClick={() => updateQty(it.id, Math.min(20, it.quantity + 1))}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">× {formatHUF(it.price)}</span>
                  <span className="ml-auto text-fuchsia-300 font-semibold">{formatHUF(it.subtotal)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="border-t border-purple-500/20 px-6 py-4 space-y-3">
          {!coupon ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Kupon kód" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="pl-9 bg-black/50 border-purple-500/30" />
              </div>
              <Button onClick={applyCoupon} disabled={applying || !couponInput} variant="secondary" className="bg-purple-600/30 border border-purple-500/40 hover:bg-purple-600/50">Alkalmaz</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm">
              <span className="text-emerald-300">Kupon: <b>{coupon.code}</b> (-{coupon.discountPercent}%)</span>
              <button onClick={() => setCoupon(null)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Részösszeg</span>
            <span>{formatHUF(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-300">
              <span>Kedvezmény</span>
              <span>- {formatHUF(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Végösszeg</span>
            <span className="neon-text">{formatHUF(total)}</span>
          </div>

          <Link href="/checkout" onClick={() => setOpen(false)}>
            <Button disabled={items.length === 0} className="w-full h-12 text-base font-semibold bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:opacity-95 glow">
              Tovább a checkoutra
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
