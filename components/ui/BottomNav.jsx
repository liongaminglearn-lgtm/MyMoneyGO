'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sword, BarChart2, Target, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home,      label: 'Inicio' },
  { href: '/budget',    icon: BarChart2, label: 'Presupuesto' },
  { href: '/missions',  icon: Sword,     label: 'Misiones' },
  { href: '/goals',     icon: Target,    label: 'Metas' },
  { href: '/profile',   icon: User,      label: 'Perfil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom z-50"
      style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-around px-2 pt-2 pb-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all"
              style={{ minWidth: 52 }}>
              <div className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                style={{ background: active ? '#DCFCE7' : 'transparent' }}>
                <Icon
                  size={20}
                  color={active ? '#16A34A' : '#9CA3AF'}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span style={{
                color: active ? '#16A34A' : '#9CA3AF',
                fontSize: '10px',
                fontWeight: active ? 700 : 500,
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
