// Social media packages (HUF) — loaded from database
export const PACKAGES = [
  { id: 'social-50',    followers: 50,    price: 490,   serviceType: 'followers' },
  { id: 'social-100',   followers: 100,   price: 790,   serviceType: 'followers' },
  { id: 'social-200',   followers: 200,   price: 1290,  serviceType: 'followers' },
  { id: 'social-400',   followers: 400,   price: 2390,  serviceType: 'followers' },
  { id: 'social-600',   followers: 600,   price: 3390, bonus: 100, popular: true, serviceType: 'followers' },
  { id: 'social-1000',  followers: 1000,  price: 4190,  serviceType: 'followers' },
  { id: 'social-1500',  followers: 1500,  price: 5390,  serviceType: 'followers' },
  { id: 'social-2000',  followers: 2000,  price: 6390,  serviceType: 'followers' },
  { id: 'social-3000',  followers: 3000,  price: 9490, popular: true, serviceType: 'followers' },
  { id: 'social-5000',  followers: 5000,  price: 14490, serviceType: 'followers' },
  { id: 'social-10000', followers: 10000, price: 24490, serviceType: 'followers' },
];

export const loadPackages = async () => {
  try {
    const res = await fetch('/api/packages');
    const data = await res.json();
    PACKAGES.splice(0, PACKAGES.length, ...data.map(p => ({ serviceType: 'followers', ...p })));
  } catch (e) {
    console.error('Failed to load packages', e);
  }
};

export function getPackage(id) {
  return PACKAGES.find(p => p.id === id) || null;
}

export function packageLabel(p) {
  if (!p) return '';
  const label = p.serviceType === 'like'
    ? `${p.followers.toLocaleString('hu-HU')} like`
    : `${p.followers.toLocaleString('hu-HU')} követő`;
  return p.bonus ? `${label} (+${p.bonus} ingyen 💎)` : label;
}

export function formatHUF(n) {
  return new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(n);
}
