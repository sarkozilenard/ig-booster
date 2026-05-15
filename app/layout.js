import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CartProvider } from '@/components/cart-provider'

export const metadata = {
  title: 'Social Booster — Premium Social Growth',
  description: 'Premium social booster service. Real engagement, fast delivery.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="hu" className="dark">
      <body className="min-h-screen bg-[#07050d] text-foreground antialiased">
        <CartProvider>
          {children}
        </CartProvider>
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  )
}
