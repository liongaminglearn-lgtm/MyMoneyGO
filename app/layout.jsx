import './globals.css'

export const metadata = {
  title: 'MyMoney GO',
  description: 'Tu dinero. Tus metas. Tu futuro.',
  manifest: '/manifest.json',
  themeColor: '#00C896',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MyMoney GO',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#00C896" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyMoney GO" />
      </head>
      <body style={{ backgroundColor: '#F0FDF9', color: '#0F172A' }}>
        {children}
      </body>
    </html>
  )
}
