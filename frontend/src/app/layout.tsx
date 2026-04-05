import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Complif - KYB Platform',
  description: 'Know Your Business onboarding platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
