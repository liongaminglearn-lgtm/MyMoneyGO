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
        <style>{`
          :root { --bg:#F0FDF9; --bg-card:#FFFFFF; --bg-input:#F8FAFC; --border:#E2E8F0; --text:#0F172A; --text-muted:#64748B; color-scheme:light; }
          html, body { background-color:#F0FDF9 !important; color:#0F172A !important; }
          .bg-brand-dark { background-color:#F0FDF9 !important; }
          .bg-brand-card { background-color:#FFFFFF !important; }
          .card { background-color:#FFFFFF !important; color:#0F172A !important; }
          .text-gray-900 { color:#0F172A !important; }
          .text-gray-800 { color:#1E293B !important; }
          .text-gray-700 { color:#374151 !important; }
          .text-gray-600 { color:#4B5563 !important; }
          .text-gray-500 { color:#6B7280 !important; }
          .text-brand-muted { color:#64748B !important; }
          .text-brand-green { color:#00C896 !important; }
          .input-dark { background-color:#F8FAFC !important; color:#0F172A !important; border:1.5px solid #E2E8F0 !important; border-radius:14px; padding:13px 16px; width:100%; font-size:16px; outline:none; }
          .input-dark:focus { background-color:#FFFFFF !important; border-color:#00C896 !important; }
          input, textarea, select { background-color:#F8FAFC !important; color:#0F172A !important; }
          input:focus, textarea:focus, select:focus { background-color:#FFFFFF !important; }
          @media (prefers-color-scheme:dark) { html,body{background-color:#F0FDF9 !important;color:#0F172A !important;} .bg-brand-dark{background-color:#F0FDF9 !important;} input,textarea,select{background-color:#F8FAFC !important;color:#0F172A !important;} }
        `}</style>
      </head>
      <body style={{ backgroundColor: '#F0FDF9', color: '#0F172A' }}>
        {children}
      </body>
    </html>
  )
}
