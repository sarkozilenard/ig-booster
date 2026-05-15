"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedBackground } from "@/components/animated-background";
import { Sparkles, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/access/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, remember }) });
      const data = await res.json();
      if (!res.ok) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        toast.error(data.error || "Hibás kód");
      } else {
        toast.success("Hozzáférés engedélyezve");
        router.push("/shop");
      }
    } catch (err) {
      toast.error("Hálózati hiba");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-md ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}
        style={{ animationName: shake ? "shake" : undefined }}
      >
        <style jsx>{`@keyframes shake { 0%,100% { transform: translateX(0) } 20%,60% { transform: translateX(-10px) } 40%,80% { transform: translateX(10px) } }`}</style>

        <div className="glass-strong rounded-3xl p-8 sm:p-10 relative overflow-hidden neon-border">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/30 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-center mb-6">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-purple-600 grid place-items-center glow"
              >
                <Sparkles className="h-8 w-8" />
              </motion.div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight">
              <span className="neon-text">Social Booster</span>
            </h1>
            <p className="text-center text-muted-foreground mt-2 text-sm">
              Privát hozzáférés—add meg a hozzáférési kódot
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-muted-foreground">Hozzáférési kód</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="code" placeholder="Add meg a kódot" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                    autoFocus className="pl-9 h-12 text-base tracking-widest font-semibold bg-black/40 border-purple-500/30 focus-visible:ring-fuchsia-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} className="border-purple-500/40 data-[state=checked]:bg-fuchsia-500" />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Emlékezz rám 30 napig</Label>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:opacity-95 glow">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Belépés <span className="ml-2">→</span></>}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Biztonságos titkosított kapcsolat</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Social Booster — Premium Social Growth
        </p>
      </motion.div>
    </main>
  );
}
