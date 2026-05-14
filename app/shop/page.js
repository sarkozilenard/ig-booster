"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/animated-background";
import { ShopNav } from "@/components/shop-nav";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/components/cart-provider";
import { PACKAGES, formatHUF, packageLabel } from "@/lib/pricing";
import { Sparkles, Zap, ShieldCheck, Rocket, Users, Clock, Check, Plus, Gem, TrendingUp, Heart, Crown } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { icon: Zap, title: "Gyors start", desc: "Azonnal feldolgozzuk a rendelésed" },
  { icon: ShieldCheck, title: "100% biztonságos", desc: "Nem kérjük a jelszavadat, csak a felhasználóneved" },
  { icon: Users, title: "Minőségi követők", desc: "Aktív profilok, valódi megjelenés" },
  { icon: Rocket, title: "Organikus boost", desc: "Algoritmus-barát ütemezett kézbesítés" },
];

const FAQ = [
  { q: "Kell jelszó a fiókhoz?", a: "Soha. Csak a nyilvános felhasználónév szükséges." },
  { q: "Mi történik ha a fiók privát?", a: "Kérjük a checkout során állítsd közepszűre a fiókot, amíg a kézbesítés megtörténik." },
  { q: "Garanciális a szolgáltatás?", a: "Igen, 30 napos drop-protection minden csomagra." },
  { q: "Mennyi időn belül érkezik?", a: "A kézbesítési idő változó, a méretek és aktuális forgalom függvényében." },
];

function pkgIcon(p) {
  if (p.followers >= 10000) return Crown;
  if (p.followers >= 5000) return TrendingUp;
  if (p.bonus) return Gem;
  if (p.followers >= 1000) return Rocket;
  if (p.followers >= 400) return Sparkles;
  return Heart;
}

export default function ShopPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const { addItem } = useCart();

  useEffect(() => {
    fetch("/api/access/me").then(r => r.json()).then(d => {
      if (!d.authenticated) router.replace("/");
      else setAuthChecked(true);
    });
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-fuchsia-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const addPackage = (p) => {
    addItem({
      packageId: p.id,
      followers: p.followers,
      bonus: p.bonus || 0,
      price: p.price,
      quantity: 1,
      subtotal: p.price,
    });
    toast.success(`Kosaradba téve: ${packageLabel(p)}`);
  };

  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />
      <ShopNav />
      <CartDrawer />

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Badge className="mb-4 bg-purple-500/15 text-fuchsia-200 border border-fuchsia-500/30 hover:bg-purple-500/20">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Premium Instagram Growth
          </Badge>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Növeld <span className="neon-text">Instagram</span><br className="hidden sm:block" /> követőidet villámgyorsan
          </h1>
          <p className="mt-5 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Válaszd ki a tökéletes csomagot 50 és 10.000 követő között. Valódi profilok, garancia.
          </p>
        </motion.div>
      </section>

      {/* PACKAGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Válaszd a <span className="neon-text">csomagod</span></h2>
          <p className="text-muted-foreground mt-2">Egy kattintás és máris a kosaradban van</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PACKAGES.map((p, i) => {
            const Icon = pkgIcon(p);
            const unitPrice = (p.price / p.followers).toFixed(1);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                className={`relative group glass-strong rounded-2xl p-5 overflow-hidden ${p.popular ? "neon-border glow" : "border border-purple-500/20"}`}
              >
                {/* gradient backdrop */}
                <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-fuchsia-500/40 to-purple-600/30 blur-3xl group-hover:scale-125 transition-transform duration-700" />

                {p.popular && (
                  <div className="absolute top-3 right-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-lg">POPULÁRIS</div>
                )}
                {p.bonus && (
                  <div className="absolute top-3 left-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">+{p.bonus} INGYEN</div>
                )}

                <div className="relative">
                  <div className="mt-6 h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-purple-600 grid place-items-center glow">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-3xl font-extrabold tracking-tight">
                    {p.followers.toLocaleString("hu-HU")}
                    {p.bonus && <span className="text-emerald-300 text-base ml-1">+{p.bonus}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">Instagram követő</div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <div className="text-2xl font-bold neon-text">{formatHUF(p.price)}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{unitPrice} Ft / követő</div>

                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Drop-protection</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Valódi profilok</li>
                  </ul>

                  <Button onClick={() => addPackage(p)} className="mt-4 w-full h-10 text-sm font-semibold bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:opacity-95">
                    <Plus className="h-4 w-4 mr-1" /> Kosárba
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h3 className="text-2xl sm:text-3xl font-bold text-center">Miért az <span className="neon-text">IG Booster</span>?</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5 hover:border-fuchsia-500/40 transition relative overflow-hidden">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 grid place-items-center mb-3">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="font-bold">{f.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h3 className="text-2xl sm:text-3xl font-bold text-center">Gyakori kérdések</h3>
        <div className="mt-8 space-y-3">
          {FAQ.map((f, i) => (
            <details key={i} className="glass rounded-xl p-5 group">
              <summary className="cursor-pointer font-semibold list-none flex justify-between items-center">
                {f.q}
                <span className="text-fuchsia-400 group-open:rotate-45 transition">+</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-purple-500/15 mt-12 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} IG Booster — Premium Instagram Growth
      </footer>
    </main>
  );
}
