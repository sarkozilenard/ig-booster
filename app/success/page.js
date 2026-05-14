"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/animated-background";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Suspense } from "react";

function Inner() {
  const sp = useSearchParams();
  const id = sp.get("id");
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <AnimatedBackground />
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }}
        className="glass-strong rounded-3xl p-10 max-w-lg w-full neon-border relative overflow-hidden text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
          className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-fuchsia-500 grid place-items-center mx-auto glow mb-4">
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>
        <h1 className="text-3xl font-extrabold">Sikeres rendelés!</h1>
        <p className="text-muted-foreground mt-2">Köszönjük a vásárlást. A rendelésed feldolgozás alatt áll.</p>
        {id && (
          <div className="mt-6 glass rounded-xl p-4 flex items-center justify-between">
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Rendelési azonosító</div>
              <div className="font-bold tracking-wider">{id}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(id); toast.success("Másolva"); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="mt-6 grid gap-2">
          <Link href="/shop">
            <Button className="w-full h-12 bg-gradient-to-r from-fuchsia-600 to-purple-600 glow">
              További vasárlás <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function SuccessPage() {
  return <Suspense><Inner /></Suspense>;
}
