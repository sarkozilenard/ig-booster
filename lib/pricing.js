// Fixed Instagram follower packages (HUF) — based on socialbazis.com pricing
export const PACKAGES = [
  { id: 'ig-50',    followers: 50,    price: 490   },
  { id: 'ig-100',   followers: 100,   price: 790   },
  { id: 'ig-200',   followers: 200,   price: 1290  },
  { id: 'ig-400',   followers: 400,   price: 2390  },
  { id: 'ig-600',   followers: 600,   price: 3390, bonus: 100, popular: true },
  { id: 'ig-1000',  followers: 1000,  price: 4190  },
  { id: 'ig-1500',  followers: 1500,  price: 5390  },
  { id: 'ig-2000',  followers: 2000,  price: 6390  },
  { id: 'ig-3000',  followers: 3000,  price: 9490, popular: true },
  { id: 'ig-5000',  followers: 5000,  price: 14490 },
  { id: 'ig-10000', followers: 10000, price: 24490 },
];

export function getPackage(id) {
  return PACKAGES.find(p => p.id === id) || null;
}

export function packageLabel(p) {
  if (!p) return '';
  const base = `${p.followers.toLocaleString('hu-HU')} követő`;
  return p.bonus ? `${base} (+${p.bonus} ingyen 💎)` : base;
}

export function formatHUF(n) {
  return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(n);
}
