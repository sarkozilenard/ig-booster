"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedBackground } from "@/components/animated-background";
import { ShieldCheck, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Hibás jelszó"); return; }
      toast.success("Admin belépés");
      router.push("/admin");
    } finally { setLoading(false); }
  };

  return (
    <main className="relative min-h-screen grid place-items-center px-4">
      <AnimatedBackground />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-8 w-full max-w-md neon-border">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 grid place-items-center mx-auto glow">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-center mt-4">Admin <span className="neon-text">belépés</span></h1>
        <p className="text-center text-muted-foreground text-sm mt-1">Korlátozott hozzáférésű terület</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Label>Jelszó</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-12 bg-black/40 border-purple-500/30" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-fuchsia-600 to-purple-600 glow">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Belépés"}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
