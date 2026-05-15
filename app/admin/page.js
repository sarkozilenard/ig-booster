"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedBackground } from "@/components/animated-background";
import { formatHUF } from "@/lib/pricing";
import { toast } from "sonner";
import { LogOut, RefreshCw, Plus, Copy, Trash2, ShieldCheck, ShoppingBag, Ticket, KeyRound, BarChart3, Users, TrendingUp, Clock, Package } from "lucide-react";

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full ${gradient} opacity-30 blur-3xl`} />
      <div className="relative">
        <Icon className="h-5 w-5 text-fuchsia-300" />
        <div className="text-2xl sm:text-3xl font-extrabold mt-2">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [auth, setAuth] = useState(false);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [codes, setCodes] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [packages, setPackages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const [s, o, c, cu, p] = await Promise.all([
        fetch("/api/admin/stats").then(r => r.json()),
        fetch("/api/admin/orders").then(r => r.json()),
        fetch("/api/admin/access-codes").then(r => r.json()),
        fetch("/api/admin/coupons").then(r => r.json()),
        fetch("/api/admin/packages").then(r => r.json()),
      ]);
      setStats(s); setOrders(o.orders || []); setCodes(c.codes || []); setCoupons(cu.coupons || []); setPackages(p.packages || []);
    } finally { setRefreshing(false); }
  };

  useEffect(() => {
    fetch("/api/admin/me").then(r => r.json()).then(d => {
      if (!d.authenticated) router.replace("/admin/login");
      else { setAuth(true); refresh(); }
    });
  }, [router]);

  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); };

  if (!auth) return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-fuchsia-500 border-t-transparent animate-spin" /></div>;

  return (
    <main className="relative min-h-screen">
      <AnimatedBackground />
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#07050d]/70 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-fuchsia-400" />
            <span className="font-bold neon-text">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={refresh} disabled={refreshing}><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /></Button>
            <Button variant="ghost" onClick={() => window.open('https://smm-panel.net', '_blank')}>
              SMM Panel
            </Button>
            <Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-extrabold">Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <StatCard icon={ShoppingBag} label="Összes rendelés" value={stats.totalOrders} gradient="bg-fuchsia-500" />
            <StatCard icon={TrendingUp} label="Bevétel" value={formatHUF(stats.totalRevenue)} gradient="bg-emerald-500" />
            <StatCard icon={Users} label="Követők összesen" value={(stats.totalFollowers || 0).toLocaleString("hu-HU")} gradient="bg-purple-500" />
            <StatCard icon={Clock} label="Függőben" value={stats.pendingOrders} gradient="bg-amber-500" />
          </div>
        )}

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="bg-black/40 border border-purple-500/30">
            <TabsTrigger value="orders"><ShoppingBag className="h-4 w-4 mr-1" /> Rendelések</TabsTrigger>
            <TabsTrigger value="coupons"><Ticket className="h-4 w-4 mr-1" /> Kuponok</TabsTrigger>
            <TabsTrigger value="codes"><KeyRound className="h-4 w-4 mr-1" /> Hozzáférési kódok</TabsTrigger>
            <TabsTrigger value="packages"><Package className="h-4 w-4 mr-1" /> Termékek</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <OrdersTab orders={orders} onChange={refresh} />
          </TabsContent>
          <TabsContent value="coupons" className="mt-4">
            <CouponsTab coupons={coupons} onChange={refresh} />
          </TabsContent>
          <TabsContent value="codes" className="mt-4">
            <CodesTab codes={codes} onChange={refresh} />
          </TabsContent>
          <TabsContent value="packages" className="mt-4">
            <PackagesTab packages={packages} onChange={refresh} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function OrdersTab({ orders, onChange }) {
  const setStatus = async (orderId, status) => {
    await fetch("/api/admin/orders/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status }) });
    toast.success("Frissítve"); onChange();
  };
  const del = async (orderId) => {
    if (!confirm("Biztosan törlöd?")) return;
    await fetch("/api/admin/orders/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
    toast.success("Törölve"); onChange();
  };

  const statusColor = (s) => s === "completed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : s === "in_progress" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : s === "cancelled" ? "bg-red-500/20 text-red-300 border-red-500/40" : "bg-amber-500/20 text-amber-300 border-amber-500/40";

  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-purple-500/10">
            <tr className="text-left">
              <th className="p-3">Rendelés ID</th><th className="p-3">Név</th><th className="p-3">Profil</th><th className="p-3">Mennyiség</th><th className="p-3">Összeg</th><th className="p-3">Státusz</th><th className="p-3">Idő</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-muted-foreground">Még nincsenek rendelések</td></tr>}
            {orders.map(o => (
              <tr key={o.orderId} className="border-t border-purple-500/10">
                <td className="p-3 font-mono text-xs">{o.orderId}</td>
                <td className="p-3">{o.fullName}<div className="text-xs text-muted-foreground">{o.email}</div></td>
                <td className="p-3">{(o.items || []).map(i => i.userHandle).filter(Boolean).join(', ') || '-'}</td>
                <td className="p-3">{(o.totalFollowers || (o.items || []).reduce((s, i) => s + ((i.followers || 0) + (i.bonus || 0)) * (i.quantity || 1), 0)).toLocaleString("hu-HU")}</td>
                <td className="p-3 font-semibold">{formatHUF(o.total)}</td>
                <td className="p-3">
                  <Select value={o.status} onValueChange={(v) => setStatus(o.orderId, v)}>
                    <SelectTrigger className={`h-8 w-32 text-xs border ${statusColor(o.status)}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Függőben</SelectItem>
                      <SelectItem value="in_progress">Folyamatban</SelectItem>
                      <SelectItem value="completed">Teljesítve</SelectItem>
                      <SelectItem value="cancelled">Törölve</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("hu-HU")}</td>
                <td className="p-3"><Button size="icon" variant="ghost" onClick={() => del(o.orderId)}><Trash2 className="h-4 w-4 text-red-400" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CouponsTab({ coupons, onChange }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", discountPercent: 10, usageLimit: 0 });
  const create = async () => {
    const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error || "Hiba"); return; }
    toast.success(`Kupon: ${d.code}`); setOpen(false); setForm({ code: "", discountPercent: 10, usageLimit: 0 }); onChange();
  };
  const toggle = async (code, active) => {
    await fetch("/api/admin/coupons/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, active }) });
    onChange();
  };
  const del = async (code) => {
    if (!confirm("Törlés?")) return;
    await fetch("/api/admin/coupons/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    onChange();
  };
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Kuponok</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-fuchsia-600 to-purple-600"><Plus className="h-4 w-4 mr-1" /> Új kupon</Button></DialogTrigger>
          <DialogContent className="bg-[#0a0618] border-purple-500/30">
            <DialogHeader><DialogTitle>Új kupon</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Kód (opcionális, auto-generálás ha üres)</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER25" className="bg-black/40" /></div>
              <div><Label>Kedvezmény %</Label><Input type="number" min={1} max={100} value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })} className="bg-black/40" /></div>
              <div><Label>Felhasználási limit (0 = korlátlan)</Label><Input type="number" min={0} value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} className="bg-black/40" /></div>
              <Button onClick={create} className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600">Létrehozás</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-purple-500/10"><tr className="text-left"><th className="p-3">Kód</th><th className="p-3">Kedv.</th><th className="p-3">Használat</th><th className="p-3">Státusz</th><th className="p-3"></th></tr></thead>
        <tbody>
          {coupons.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-muted-foreground">Még nincs kupon</td></tr>}
          {coupons.map(c => (
            <tr key={c.code} className="border-t border-purple-500/10">
              <td className="p-3"><div className="flex items-center gap-2 font-mono font-bold">{c.code}<Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Másolva"); }}><Copy className="h-3 w-3" /></Button></div></td>
              <td className="p-3 text-fuchsia-300 font-semibold">-{c.discountPercent}%</td>
              <td className="p-3">{c.usedCount || 0} / {c.usageLimit || "∞"}</td>
              <td className="p-3"><Badge onClick={() => toggle(c.code, !c.active)} className={`cursor-pointer ${c.active ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-zinc-500/20 text-zinc-300"}`}>{c.active ? "Aktív" : "Inaktív"}</Badge></td>
              <td className="p-3"><Button size="icon" variant="ghost" onClick={() => del(c.code)}><Trash2 className="h-4 w-4 text-red-400" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}

function CodesTab({ codes, onChange }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", usageLimit: 0, note: "" });
  const create = async () => {
    const res = await fetch("/api/admin/access-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error || "Hiba"); return; }
    toast.success(`Kód: ${d.code}`); setOpen(false); setForm({ code: "", usageLimit: 0, note: "" }); onChange();
  };
  const toggle = async (code, active) => {
    await fetch("/api/admin/access-codes/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, active }) });
    onChange();
  };
  const del = async (code) => {
    if (!confirm("Törlés?")) return;
    await fetch("/api/admin/access-codes/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    onChange();
  };
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Hozzáférési kódok</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-fuchsia-600 to-purple-600"><Plus className="h-4 w-4 mr-1" /> Új kód</Button></DialogTrigger>
          <DialogContent className="bg-[#0a0618] border-purple-500/30">
            <DialogHeader><DialogTitle>Új hozzáférési kód</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Kód (opcionális)</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VIP2025" className="bg-black/40" /></div>
              <div><Label>Felhasználási limit (0 = korlátlan)</Label><Input type="number" min={0} value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} className="bg-black/40" /></div>
              <div><Label>Megjegyzés</Label><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="bg-black/40" /></div>
              <Button onClick={create} className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600">Létrehozás</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-purple-500/10"><tr className="text-left"><th className="p-3">Kód</th><th className="p-3">Használat</th><th className="p-3">Megjegyzés</th><th className="p-3">Státusz</th><th className="p-3"></th></tr></thead>
        <tbody>
          {codes.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-muted-foreground">Még nincsenek kódok</td></tr>}
          {codes.map(c => (
            <tr key={c.code} className="border-t border-purple-500/10">
              <td className="p-3"><div className="flex items-center gap-2 font-mono font-bold">{c.code}<Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Másolva"); }}><Copy className="h-3 w-3" /></Button></div></td>
              <td className="p-3">{c.usedCount || 0} / {c.usageLimit || "∞"}</td>
              <td className="p-3 text-xs text-muted-foreground">{c.note || "—"}</td>
              <td className="p-3"><Badge onClick={() => toggle(c.code, !c.active)} className={`cursor-pointer ${c.active ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-zinc-500/20 text-zinc-300"}`}>{c.active ? "Aktív" : "Inaktív"}</Badge></td>
              <td className="p-3"><Button size="icon" variant="ghost" onClick={() => del(c.code)}><Trash2 className="h-4 w-4 text-red-400" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
function PackagesTab({ packages, onChange }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", followers: 100, price: 1000, bonus: 0, popular: false, serviceType: "followers", platform: "instagram" });
  const create = async () => {
    const res = await fetch("/api/admin/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error || "Hiba"); return; }
    toast.success(`Termék hozzáadva: ${d.id}`); setOpen(false); setForm({ id: "", followers: 100, price: 1000, bonus: 0, popular: false, serviceType: "followers", platform: "instagram" }); onChange();
  };
  const del = async (id) => {
    if (!confirm("Törlés?")) return;
    await fetch("/api/admin/packages/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    onChange();
  };
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Termékek</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-fuchsia-600 to-purple-600"><Plus className="h-4 w-4 mr-1" /> Új termék</Button></DialogTrigger>
          <DialogContent className="bg-[#0a0618] border-purple-500/30">
            <DialogHeader><DialogTitle>Új termék</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>ID (opcionális, auto-generálás ha üres)</Label><Input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="social-100" className="bg-black/40" /></div>
              <div><Label>Követők / Like mennyiség</Label><Input type="number" min={1} value={form.followers} onChange={e => setForm({ ...form, followers: Number(e.target.value) })} className="bg-black/40" /></div>
              <div><Label>Ár (HUF)</Label><Input type="number" min={1} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="bg-black/40" /></div>
              <div><Label>Platform</Label>
                <Select value={form.platform} onValueChange={(value) => setForm({ ...form, platform: value })}>
                  <SelectTrigger className="h-11 bg-black/40 border-purple-500/30">
                    <SelectValue placeholder="Válassz platformot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Szolgáltatás</Label>
                <Select value={form.serviceType} onValueChange={(value) => setForm({ ...form, serviceType: value })}>
                  <SelectTrigger className="h-11 bg-black/40 border-purple-500/30">
                    <SelectValue placeholder="Válassz típust" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">Követők</SelectItem>
                    <SelectItem value="like">Like</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Bónusz (opcionális)</Label><Input type="number" min={0} value={form.bonus} onChange={e => setForm({ ...form, bonus: Number(e.target.value) })} className="bg-black/40" /></div>
              <div className="flex items-center space-x-2"><Checkbox checked={form.popular} onCheckedChange={checked => setForm({ ...form, popular: checked })} /><Label>Népszerű</Label></div>
              <Button onClick={create} className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600">Létrehozás</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {([...packages].sort((a, b) => (a.followers || 0) - (b.followers || 0))).map(p => (
          <div key={p.id} className="flex justify-between items-center p-3 bg-purple-500/10 rounded">
            <span>{p.id}: {p.followers.toLocaleString("hu-HU")} {p.serviceType === 'like' ? `${p.platform === 'tiktok' ? 'TikTok' : 'Instagram'} like` : `${p.platform === 'tiktok' ? 'TikTok' : 'Instagram'} követő`} - {formatHUF(p.price)} {p.bonus ? `+${p.bonus}` : ""} {p.popular ? "⭐" : ""}</span>
            <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
