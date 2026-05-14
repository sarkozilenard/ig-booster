# 🚀 IG Booster — Premium Instagram Followers Webshop

Modern Next.js webshop Instagram követő csomagok értékesítésére, access-code-os belépéssel, glassmorphism dark UI-jal, kuponokkal és teljes admin panellel.

![Tech](https://img.shields.io/badge/Next.js-14-black) ![Tech](https://img.shields.io/badge/Firebase-Firestore-orange) ![Tech](https://img.shields.io/badge/Tailwind-CSS-cyan) ![Tech](https://img.shields.io/badge/Framer-Motion-pink)

---

## ✨ Funkciók

- 🔐 **Access code rendszer** – privát hozzáférés, admin által kezelt kódokkal
- 🛍️ **11 fix Instagram csomag** (50–10.000 követő, 490–24.490 Ft)
- 🎟️ **Kuponkód rendszer** – százalékos kedvezmény, használati limit, lejárat
- 🛒 **Cart drawer** – slide animáció, quantity kontrol, kupon
- ✅ **Checkout** – Zod validációval, react-hook-form-mal
- 👑 **Admin panel** – statisztikák, rendelések kezelése, kuponok, access kódok
- 🎨 **Premium dark UI** – glassmorphism, neon gradient, Framer Motion animációk
- 📱 **Teljesen reszponzív**

---

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **JavaScript** (JSX)
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion**
- **Firebase Firestore** (lite/REST – serverless friendly)
- **React Hook Form** + **Zod**
- **Sonner** toast
- **lucide-react** ikonok

---

## 🚀 Telepítés

### 1. Klónozás és csomagok

```bash
git clone https://github.com/<a_te_neved>/ig-booster.git
cd ig-booster
yarn install
```

### 2. Firebase setup

1. Hozz létre projektet: https://console.firebase.google.com
2. Add Web App → másold ki a config-ot
3. **Firestore Database** → Create database → **Test mode**
4. Firestore Rules-t állítsd ide:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Environment változók

```bash
cp .env.example .env
```

Nyisd meg a `.env`-t és töltsd ki:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
SESSION_SECRET=valami-eros-veletlenszeru-string
ADMIN_PASSWORD=valami-eros-jelszo
DEFAULT_ACCESS_CODE=WELCOME2025
```

⚠️ **Cseréld le mindenképp:** `SESSION_SECRET`, `ADMIN_PASSWORD`, `DEFAULT_ACCESS_CODE`

### 4. Indítás

```bash
yarn dev
```

Nyisd meg: http://localhost:3000

Az első API hívásnál automatikusan létrejön az alapértelmezett access code a Firestore-ban.

---

## 🌐 Deployment Vercelre (INGYEN)

1. Push GitHub-ra (lásd lent)
2. Menj: https://vercel.com/new
3. Import a GitHub repo-t
4. **Environment Variables** szekcióban add hozzá az összes változót a `.env`-ből
5. Deploy
6. **Settings → Domains** → add hozzá a saját domained
7. Domain szolgáltatónál állítsd be a CNAME-et:
   ```
   Type:  CNAME
   Name:  <subdomain>
   Value: cname.vercel-dns.com
   ```

---

## 📤 GitHub-ra feltöltés

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<a_te_neved>/ig-booster.git
git push -u origin main
```

---

## 🔑 Belépési adatok (alapértelmezett)

- **Access code:** `WELCOME2025` (admin paneles módosítható)
- **Admin URL:** `/admin/login`
- **Admin jelszó:** amit az `.env`-ben `ADMIN_PASSWORD`-nak megadtál

---

## 📁 Projekt struktúra

```
app/
  api/[[...path]]/route.js  # Catch-all REST API
  layout.js                  # Root layout (dark theme, providers)
  page.js                    # Access code page
  globals.css                # Tailwind + neon utilities
  shop/                      # Shop oldal
  checkout/                  # Checkout form
  success/                   # Rendelés sikeres oldal
  admin/                     # Admin login + dashboard
components/
  animated-background.jsx    # Floating blob + particle
  cart-provider.jsx          # Cart context
  cart-drawer.jsx            # Slide-out kosár
  shop-nav.jsx               # Top navbar
  ui/                        # shadcn komponensek
lib/
  firebase.js                # Firestore lite init
  pricing.js                 # PACKAGES + formatHUF
  session.js                 # HMAC cookie session
```

---

## 🗄️ Firestore Collections

| Collection | Mező |
|------------|------|
| `accessCodes` | code, active, usageLimit, usedCount, expiresAt, note |
| `coupons` | code, discountPercent, active, usageLimit, usedCount |
| `orders` | orderId, fullName, instagramUsername, email, phone, items, total, status |

---

## 💡 Csomagok és árazás

| Mennyiség | Ár |
|-----------|-----|
| 50 | 490 Ft |
| 100 | 790 Ft |
| 200 | 1.290 Ft |
| 400 | 2.390 Ft |
| 600 + 100 INGYEN 💎 | 3.390 Ft |
| 1000 | 4.190 Ft |
| 1500 | 5.390 Ft |
| 2000 | 6.390 Ft |
| 3000 | 9.490 Ft |
| 5000 | 14.490 Ft |
| 10000 | 24.490 Ft |

 A csomagokat a `lib/pricing.js`-ben tudod módosítani.

---

## 📝 Licenc

MIT — szabadon használható.
