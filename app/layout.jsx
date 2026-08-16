import './globals.css'

export const metadata = {
  title: 'MyMoney GO',
  description: 'Tu dinero. Tus metas. Tu futuro.',
  manifest: '/manifest.json',
  themeColor: '#22C55E',
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
        <meta name="theme-color" content="#22C55E" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyMoney GO" />
        <style>{`
          :root { --bg:#F9FAFB; --bg-card:#FFFFFF; --bg-input:#F9FAFB; --border:#E5E7EB; --text:#111827; --text-muted:#6B7280; color-scheme:light; }
          html, body { background-color:#F9FAFB !important; color:#111827 !important; }
          .bg-brand-dark { background-color:#F9FAFB !important; }
          .bg-brand-card { background-color:#FFFFFF !important; }
          .card { background-color:#FFFFFF !important; color:#111827 !important; }
          .text-gray-900 { color:#111827 !important; }
          .text-gray-800 { color:#1F2937 !important; }
          .text-gray-700 { color:#374151 !important; }
          .text-gray-600 { color:#4B5563 !important; }
          .text-gray-500 { color:#6B7280 !important; }
          .text-brand-muted { color:#6B7280 !important; }
          .text-brand-green { color:#22C55E !important; }
          .input-dark { background-color:#F9FAFB !important; color:#111827 !important; border:1.5px solid #E5E7EB !important; border-radius:14px; padding:13px 16px; width:100%; font-size:16px; outline:none; -webkit-appearance:none; appearance:none; }
          .input-dark:focus { background-color:#FFFFFF !important; border-color:#22C55E !important; box-shadow:0 0 0 3px rgba(34,197,94,0.12); }
          input, textarea, select { background-color:#F9FAFB !important; color:#111827 !important; }
          input:focus, textarea:focus, select:focus { background-color:#FFFFFF !important; }
          @media (prefers-color-scheme:dark) { html,body{background-color:#F9FAFB !important;color:#111827 !important;} .bg-brand-dark{background-color:#F9FAFB !important;} input,textarea,select{background-color:#F9FAFB !important;color:#111827 !important;} }
        `}</style>
      </head>
      <body style={{ backgroundColor: '#F9FAFB', color: '#111827' }}>
        {children}
      </body>
    </html>
  )
}
