'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Sword, Target, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',    icon: Home,           label: 'Inicio' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Gastos' },
  { href: '/budget',       icon: Sword,          label: 'Batalla' },
  { href: '/goals',        icon: Target,         label: 'Metas' },
  { href: '/profile',      icon: User,           label: 'Perfil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom z-50"
      style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-around px-1 pt-2 pb-4">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const isBattle = href === '/budget'
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all"
              style={{ minWidth: 52 }}>
              {isBattle && active ? (
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center -mt-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', boxShadow: '0 4px 14px rgba(124,58,237,0.5)' }}>
                  <Icon size={18} color="#FFFFFF" strokeWidth={2.5} />
                </div>
              ) : isBattle ? (
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center -mt-5 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #A78BFA, #818CF8)', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
                  <Icon size={18} color="#FFFFFF" strokeWidth={2} />
                </div>
              ) : (
                <Icon size={22} color={active ? '#00C896' : '#9CA3AF'} strokeWidth={active ? 2.5 : 1.8} />
              )}
              <span className="font-medium"
                style={{ color: isBattle ? (active ? '#7C3AED' : '#A78BFA') : (active ? '#00C896' : '#9CA3AF'), fontSize: '10px' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
