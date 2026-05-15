import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, addDoc
} from 'firebase/firestore/lite';
import { v4 as uuidv4 } from 'uuid';
import { createToken, verifyToken, SESSION_COOKIE, ADMIN_COOKIE } from '@/lib/session';
import { PACKAGES } from '@/lib/pricing';

// --- helpers ---
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

async function seedIfNeeded() {
  // Seed default access code if collection empty
  const codesSnap = await getDocs(collection(db, 'accessCodes'));
  if (codesSnap.empty) {
    const def = process.env.DEFAULT_ACCESS_CODE || 'WELCOME2025';
    await setDoc(doc(db, 'accessCodes', def), {
      code: def,
      active: true,
      usageLimit: 0, // 0 = unlimited
      usedCount: 0,
      expiresAt: null,
      createdAt: Date.now(),
      note: 'Default welcome code'
    });
  }

  // Seed packages if collection empty
  const packagesSnap = await getDocs(collection(db, 'packages'));
  if (packagesSnap.empty) {
    for (const p of PACKAGES) {
      await setDoc(doc(db, 'packages', p.id), p);
    }
  }
}

function normalizeDoc(d) {
  const data = d.data ? d.data() : d;
  return { id: d.id, ...data };
}

function parseBodyOrEmpty(req) {
  return req.json().catch(() => ({}));
}

function badRequest(msg) { return NextResponse.json({ error: msg }, { status: 400 }); }
function unauthorized() { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
function notFound() { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }

async function requireUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifyToken(token);
}
async function requireAdmin() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

function setCookie(name, value, maxAgeMs) {
  cookies().set({
    name, value,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: Math.floor(maxAgeMs / 1000),
  });
}
function clearCookie(name) {
  cookies().set({ name, value: '', path: '/', maxAge: 0 });
}

// --- packages ---
if (path === 'packages') {
  const snap = await getDocs(collection(db, 'packages'));
  return NextResponse.json(snap.docs.map(normalizeDoc));
}

// --- coupon helper ---
async function validateCouponCode(code) {
  if (!code) return null;
  const c = (code + '').trim().toUpperCase();
  const refDoc = await getDoc(doc(db, 'coupons', c));
  if (!refDoc.exists()) return { error: 'Kupon nem létezik' };
  const data = refDoc.data();
  if (!data.active) return { error: 'Kupon inaktív' };
  if (data.expiresAt && Date.now() > data.expiresAt) return { error: 'Kupon lejárt' };
  if (data.usageLimit && data.usedCount >= data.usageLimit) return { error: 'Kupon elhasználódott' };
  return { ok: true, code: c, discountPercent: data.discountPercent || 0 };
}

// --- ROUTER ---
async function handle(req, params, method) {
  const path = (params?.path || []).join('/');
  await seedIfNeeded().catch(() => {});

  // Health
  if (path === '' || path === 'health') {
    return NextResponse.json({ ok: true, service: 'ig-booster' });
  }

  // === ACCESS CODE ===
  if (path === 'access/verify' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    const code = (body.code || '').trim().toUpperCase();
    const remember = !!body.remember;
    if (!code) return badRequest('Kód szükséges');
    const ref = doc(db, 'accessCodes', code);
    const snap = await getDoc(ref);
    if (!snap.exists()) return NextResponse.json({ error: 'Hibás kód' }, { status: 401 });
    const data = snap.data();
    if (!data.active) return NextResponse.json({ error: 'A kód inaktív' }, { status: 401 });
    if (data.expiresAt && Date.now() > data.expiresAt) return NextResponse.json({ error: 'A kód lejárt' }, { status: 401 });
    if (data.usageLimit && data.usedCount >= data.usageLimit) return NextResponse.json({ error: 'A kód elhasználódott' }, { status: 401 });

    // increment usedCount (best effort)
    await updateDoc(ref, { usedCount: (data.usedCount || 0) + 1 }).catch(() => {});

    const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : SEVEN_DAYS;
    const token = createToken({ role: 'user', code, exp: Date.now() + maxAge });
    setCookie(SESSION_COOKIE, token, maxAge);
    return NextResponse.json({ ok: true });
  }

  if (path === 'access/me' && method === 'GET') {
    const user = await requireUser();
    return NextResponse.json({ authenticated: !!user });
  }

  if (path === 'access/logout' && method === 'POST') {
    clearCookie(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  }

  // === COUPON validate (user side) ===
  if (path === 'coupon/validate' && method === 'POST') {
    if (!(await requireUser())) return unauthorized();
    const body = await parseBodyOrEmpty(req);
    const res = await validateCouponCode(body.code);
    if (!res || res.error) return NextResponse.json({ error: res?.error || 'Hibás kupon' }, { status: 400 });
    return NextResponse.json(res);
  }

  // === ORDERS (create) ===
  if (path === 'orders/create' && method === 'POST') {
    if (!(await requireUser())) return unauthorized();
    const body = await parseBodyOrEmpty(req);
    const { fullName, email, phone, notes, items, couponCode } = body || {};
    if (!fullName || !email || !phone) return badRequest('Hiányzó mezők');
    if (!Array.isArray(items) || items.length === 0) return badRequest('A kosár üres');

    // recompute amounts server-side based on packageId
    let subtotal = 0;
    let totalFollowers = 0;
    const normItems = [];
    for (const it of items) {
      const pkgSnap = await getDoc(doc(db, 'packages', it.packageId));
      if (!pkgSnap.exists()) return badRequest(`Ismeretlen csomag: ${it.packageId}`);
      const pkg = pkgSnap.data();
      const qty = Math.max(1, Math.min(20, Math.floor(Number(it.quantity) || 1)));
      const userHandle = (it.userHandle || '').trim();
      if (!userHandle) return badRequest('Hiányzó felhasználónév egy termékhez');
      const serviceType = pkg.serviceType || 'followers';
      const mediaLink = (it.mediaLink || '').trim();
      if (serviceType === 'like' && !mediaLink) return badRequest('Hiányzó poszt/videó link egy like termékhez');
      const lineTotal = pkg.price * qty;
      subtotal += lineTotal;
      if (serviceType === 'followers') {
        totalFollowers += (pkg.followers + (pkg.bonus || 0)) * qty;
      }
      normItems.push({
        packageId: pkg.id,
        followers: pkg.followers,
        bonus: pkg.bonus || 0,
        price: pkg.price,
        quantity: qty,
        subtotal: lineTotal,
        userHandle,
        mediaLink: serviceType === 'like' ? mediaLink : '',
        serviceType,
      });
    }

    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const v = await validateCouponCode(couponCode);
      if (v && v.ok) {
        discount = Math.round(subtotal * (v.discountPercent / 100));
        appliedCoupon = { code: v.code, discountPercent: v.discountPercent };
        await updateDoc(doc(db, 'coupons', v.code), { usedCount: ((await getDoc(doc(db, 'coupons', v.code))).data().usedCount || 0) + 1 }).catch(() => {});
      }
    }
    const total = subtotal - discount;
    const orderId = 'IGB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

    const orderDoc = {
      orderId,
      fullName, email, phone, notes: notes || '',
      items: normItems,
      totalFollowers,
      subtotal, discount, total, currency: 'HUF',
      coupon: appliedCoupon,
      status: 'pending',
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'orders', orderId), orderDoc);
    return NextResponse.json({ ok: true, orderId, total });
  }

  if (path.startsWith('orders/get/') && method === 'GET') {
    if (!(await requireUser())) return unauthorized();
    const orderId = path.replace('orders/get/', '');
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return notFound();
    return NextResponse.json(normalizeDoc(snap));
  }

  // === ADMIN AUTH ===
  if (path === 'admin/login' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Hibás admin jelszó' }, { status: 401 });
    }
    const token = createToken({ role: 'admin', exp: Date.now() + ONE_DAY });
    setCookie(ADMIN_COOKIE, token, ONE_DAY);
    return NextResponse.json({ ok: true });
  }
  if (path === 'admin/logout' && method === 'POST') {
    clearCookie(ADMIN_COOKIE);
    return NextResponse.json({ ok: true });
  }
  if (path === 'admin/me' && method === 'GET') {
    return NextResponse.json({ authenticated: !!(await requireAdmin()) });
  }

  // From here on, admin only
  if (path.startsWith('admin/')) {
    if (!(await requireAdmin())) return unauthorized();
  }

  // === ADMIN: STATS ===
  if (path === 'admin/stats' && method === 'GET') {
    const [ordersSnap, codesSnap, couponsSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'accessCodes')),
      getDocs(collection(db, 'coupons')),
    ]);
    const orders = ordersSnap.docs.map(normalizeDoc);
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalFollowers = orders.reduce((s, o) => s + (o.totalFollowers || (o.items || []).reduce((a, it) => a + ((it.followers || 0) + (it.bonus || 0)) * (it.quantity || 1), 0)), 0);
    return NextResponse.json({
      totalOrders: orders.length,
      totalRevenue,
      totalFollowers,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      activeCodes: codesSnap.docs.filter(d => d.data().active).length,
      activeCoupons: couponsSnap.docs.filter(d => d.data().active).length,
      recentOrders: orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5),
    });
  }

  // === ADMIN: ORDERS ===
  if (path === 'admin/orders' && method === 'GET') {
    const snap = await getDocs(collection(db, 'orders'));
    const list = snap.docs.map(normalizeDoc).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return NextResponse.json({ orders: list });
  }
  if (path === 'admin/orders/status' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    if (!body.orderId || !body.status) return badRequest('orderId + status szükséges');
    await updateDoc(doc(db, 'orders', body.orderId), { status: body.status });
    return NextResponse.json({ ok: true });
  }
  if (path === 'admin/orders/delete' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    await deleteDoc(doc(db, 'orders', body.orderId));
    return NextResponse.json({ ok: true });
  }

  // === ADMIN: ACCESS CODES ===
  if (path === 'admin/access-codes' && method === 'GET') {
    const snap = await getDocs(collection(db, 'accessCodes'));
    return NextResponse.json({ codes: snap.docs.map(normalizeDoc) });
  }
  if (path === 'admin/access-codes' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    let code = (body.code || '').trim().toUpperCase();
    if (!code) code = 'IGB-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const docRef = doc(db, 'accessCodes', code);
    const exists = await getDoc(docRef);
    if (exists.exists()) return badRequest('A kód már létezik');
    await setDoc(docRef, {
      code,
      active: true,
      usageLimit: Number(body.usageLimit) || 0,
      usedCount: 0,
      expiresAt: body.expiresAt ? Number(body.expiresAt) : null,
      note: body.note || '',
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true, code });
  }
  if (path === 'admin/access-codes/toggle' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    await updateDoc(doc(db, 'accessCodes', body.code), { active: !!body.active });
    return NextResponse.json({ ok: true });
  }
  if (path === 'admin/access-codes/delete' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    await deleteDoc(doc(db, 'accessCodes', body.code));
    return NextResponse.json({ ok: true });
  }

  // === ADMIN: COUPONS ===
  if (path === 'admin/coupons' && method === 'GET') {
    const snap = await getDocs(collection(db, 'coupons'));
    return NextResponse.json({ coupons: snap.docs.map(normalizeDoc) });
  }
  if (path === 'admin/coupons' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    let code = (body.code || '').trim().toUpperCase();
    if (!code) code = 'SAVE' + Math.floor(Math.random() * 9000 + 1000);
    const ref = doc(db, 'coupons', code);
    const exists = await getDoc(ref);
    if (exists.exists()) return badRequest('A kupon már létezik');
    const discountPercent = Math.max(1, Math.min(100, Number(body.discountPercent) || 10));
    await setDoc(ref, {
      code,
      discountPercent,
      active: true,
      usageLimit: Number(body.usageLimit) || 0,
      usedCount: 0,
      expiresAt: body.expiresAt ? Number(body.expiresAt) : null,
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true, code, discountPercent });
  }
  if (path === 'admin/coupons/toggle' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    await updateDoc(doc(db, 'coupons', body.code), { active: !!body.active });
    return NextResponse.json({ ok: true });
  }
  if (path === 'admin/coupons/delete' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    await deleteDoc(doc(db, 'coupons', body.code));
    return NextResponse.json({ ok: true });
  }

  // === ADMIN: PACKAGES ===
  if (path === 'admin/packages' && method === 'GET') {
    const snap = await getDocs(collection(db, 'packages'));
    return NextResponse.json({ packages: snap.docs.map(normalizeDoc) });
  }
  if (path === 'admin/packages' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    let id = (body.id || '').trim();
    if (!id) id = `social-${Date.now()}`;
    const ref = doc(db, 'packages', id);
    const exists = await getDoc(ref);
    if (exists.exists()) return badRequest('A termék már létezik');
    await setDoc(ref, {
      id,
      followers: Number(body.followers) || 100,
      price: Number(body.price) || 1000,
      bonus: Number(body.bonus) || 0,
      popular: !!body.popular,
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true, id });
  }
  if (path === 'admin/packages/delete' && method === 'POST') {
    const body = await parseBodyOrEmpty(req);
    await deleteDoc(doc(db, 'packages', body.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Not Found', path, method }, { status: 404 });
}

export async function GET(req, ctx)  { return handle(req, await ctx.params ?? ctx.params, 'GET'); }
export async function POST(req, ctx) { return handle(req, await ctx.params ?? ctx.params, 'POST'); }
export async function PUT(req, ctx)  { return handle(req, await ctx.params ?? ctx.params, 'PUT'); }
export async function DELETE(req, ctx){ return handle(req, await ctx.params ?? ctx.params, 'DELETE'); }
export async function PATCH(req, ctx){ return handle(req, await ctx.params ?? ctx.params, 'PATCH'); }
