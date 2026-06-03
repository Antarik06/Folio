import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// We're using system font stacks to avoid build-time fetch errors with Google Fonts
const dmSans = { variable: '--font-sans' }
const dmMono = { variable: '--font-mono' }
const cormorant = { variable: '--font-serif' }

export const metadata: Metadata = {
  title: 'Folio — Where memories become books',
  description: 'Upload your photos. AI creates personalized albums for everyone. Order beautifully printed books that tell your story.',
  generator: 'v0.app',
  keywords: ['photo album', 'AI photo sorting', 'facial recognition', 'photo book', 'event photos', 'personalized album'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#F5F0E8',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} ${cormorant.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
