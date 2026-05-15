"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedBackground } from "@/components/animated-background";
import { ShopNav } from "@/components/shop-nav";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/components/cart-provider";
import { formatHUF } from "@/lib/pricing";
import { Loader2, ShoppingBag, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const schema = z.object({
  fullName: z.string().min(2, "Még 1 karakter"),
  email: z.string().email("Érvénytelen email"),
  phone: z.string().min(6, "Érvénytelen szám"),
  notes: z.string().optional(),
  isPublic: z.boolean().refine(val => val === true, "El kell fogadnod, hogy a profilod nyilvános"),
});

export default function CheckoutPage() {
  const router = useRouter();
  const { items, coupon, clear } = useCart();
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", phone: "", notes: "", isPublic: false }
  });

  useEffect(() => {
    fetch("/api/access/me").then(r => r.json()).then(d => {
      if (!d.authenticated) router.replace("/"); else setAuthChecked(true);
    });
  }, [router]);

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const discount = coupon ? Math.round(subtotal * (coupon.discountPercent / 100)) : 0;
  const total = subtotal - discount;

  const onSubmit = async (data) => {
    if (items.length === 0) { toast.error("A kosarad üres"); return; }
    for (const item of items) {
      if (!item.userHandle || !item.userHandle.trim()) {
        toast.error("Adj meg minden termékhez felhasználónevet");
        return;
      }
      if (item.serviceType === 'like' && (!item.mediaLink || !item.mediaLink.trim())) {
        toast.error("Adj meg minden like termékhez poszt/videó linket");
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map(i => ({
            packageId: i.packageId,
            quantity: i.quantity,
            userHandle: i.userHandle,
            mediaLink: i.mediaLink,
            serviceType: i.serviceType,
          })),
          couponCode: coupon?.code,
        }),
      });
      const out = await res.json();
      if (!res.ok) { toast.error(out.error || "Hiba"); return; }
      toast.success("Megrendelés leadva!");
      clear();
      router.push(`/success?id=${out.orderId}`);
    } catch (e) {
      toast.error("Hálózati hiba");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-fuchsia-500 border-t-transparent animate-spin" /></div>;

  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />
      <ShopNav />
      <CartDrawer />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition mb-4">
          <ArrowLeft className="h-4 w-4" /> Vissza a shopba
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-extrabold">
          <span className="neon-text">Checkout</span>
        </motion.h1>
        <p className="text-muted-foreground mt-1">Add meg az adataid és leadjuk a rendelést</p>

        <div className="mt-8 grid lg:grid-cols-5 gap-6">
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 glass-strong rounded-2xl p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Teljes név</Label>
                <Input {...register("fullName")} className="mt-1 bg-black/40 border-purple-500/30 h-11" placeholder="Kovács János" />
                {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input {...register("email")} type="email" className="mt-1 bg-black/40 border-purple-500/30 h-11" placeholder="email@example.com" />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label>Telefon</Label>
                <Input {...register("phone")} className="mt-1 bg-black/40 border-purple-500/30 h-11" placeholder="+36 30 123 4567" />
                {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isPublic" {...register("isPublic")} />
                <Label htmlFor="isPublic" className="text-sm">Nyilvános a profilom</Label>
                {errors.isPublic && <p className="text-xs text-red-400">{errors.isPublic.message}</p>}
              </div>
            </div>
            <div>
              <Label>Megjegyzés (opcionális)</Label>
              <Textarea {...register("notes")} className="mt-1 bg-black/40 border-purple-500/30" placeholder="Egyéb információ..." />
            </div>

            <Button type="submit" disabled={submitting || items.length === 0} className="w-full h-12 text-base font-semibold bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:opacity-95 glow">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Rendelés leadása →</>}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Az adataid biztonságban vannak. Nem kérjük a jelszavadat.
            </div>
          </form>

          <div className="lg:col-span-2">
            <div className="glass-strong rounded-2xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-5 w-5 text-fuchsia-400" />
                <h3 className="font-bold">Rendelés összegzés</h3>
              </div>
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground">A kosarad üres</div>
              ) : (
                <div className="space-y-2">
                  {items.map(i => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span>
                        {i.quantity}× {i.followers.toLocaleString("hu-HU")} követő
                        {i.bonus ? <span className="text-emerald-300"> +{i.bonus}</span> : null}
                      </span>
                      <span className="font-semibold">{formatHUF(i.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="my-4 h-px bg-purple-500/20" />
              <div className="flex justify-between text-sm text-muted-foreground"><span>Részösszeg</span><span>{formatHUF(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-300"><span>Kupon ({coupon.code})</span><span>- {formatHUF(discount)}</span></div>
              )}
              <div className="flex justify-between text-lg font-bold mt-2"><span>Végösszeg</span><span className="neon-text">{formatHUF(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
