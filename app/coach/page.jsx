'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getProfile, getTransactions, getDebts } from '@/lib/supabase'
import { formatCurrency, getCurrentMonth } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import CompanionAvatar, { COMPANIONS } from '@/components/ui/CompanionAvatar'
import { ChevronRight } from 'lucide-react'

function buildRecommendations({ income, expense, debts, monthlyIncome }) {
  const recs = []
  const available = (income || monthlyIncome) - expense
  const savingsRate = income > 0 ? ((available / income) * 100) : 0
  const highAprDebt = debts.filter(d => (d.apr || 0) >= 20).sort((a, b) => (b.apr || 0) - (a.apr || 0))

  if (available < 0) {
    recs.push({
      icon: '🚨',
      color: '#EF4444',
      bg: '#FEF2F2',
      border: '#FEE2E2',
      title: 'Gastos superan ingresos',
      detail: `Estás gastando ${formatCurrency(Math.abs(available))} más de lo que ingresas. Revisa tus categorías y reduce gastos no esenciales.`,
      action: 'Revisar presupuesto',
      href: '/budget',
      xp: 50,
    })
  } else if (savingsRate < 10) {
    recs.push({
      icon: '⚠️',
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      title: 'Tasa de ahorro baja',
      detail: `Estás ahorrando solo el ${savingsRate.toFixed(0)}% de tus ingresos. Lo ideal es al menos el 20%. Ajusta tu presupuesto para liberar más dinero.`,
      action: 'Mejorar mi presupuesto',
      href: '/budget',
      xp: 30,
    })
  } else {
    recs.push({
      icon: '✅',
      color: '#16A34A',
      bg: '#F0FDF4',
      border: '#DCFCE7',
      title: `Tasa de ahorro: ${savingsRate.toFixed(0)}%`,
      detail: `¡Excelente! Tienes ${formatCurrency(available)} disponibles este mes. Considera destinar una parte a tus metas de ahorro.`,
      action: 'Ver mis metas',
      href: '/goals',
      xp: 20,
    })
  }

  if (highAprDebt.length > 0) {
    const top = highAprDebt[0]
    recs.push({
      icon: '🐉',
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FEE2E2',
      title: `Ataca ${top.name} (${top.apr}% APR)`,
      detail: `Esta deuda te cuesta más dinero cada mes. Con el método Avalanche, atacar primero la deuda de mayor tasa te ahorra intereses a largo plazo.`,
      action: 'Ir al Debt Dungeon',
      href: '/debt-dungeon',
      xp: 40,
    })
  }

  if (debts.length === 0) {
    recs.push({
      icon: '🏔️',
      color: '#0891B2',
      bg: '#ECFEFF',
      border: '#A5F3FC',
      title: '¡Sin deudas! Ahora construye tu montaña',
      detail: 'Estás libre de deudas. Enfócate en construir un fondo de emergencia de al menos 3-6 meses de gastos.',
      action: 'Ver Savings Mountain',
      href: '/goals',
      xp: 25,
    })
  }

  recs.push({
    icon: '📊',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    title: 'Regla 50/30/20',
    detail: '50% para necesidades (vivienda, comida), 30% para deseos (ocio, ropa), 20% para ahorro y deudas. Compara esto con tu presupuesto actual.',
    action: 'Ver mi presupuesto',
    href: '/budget',
    xp: 15,
  })

  return recs
}

export default function CoachPage() {
  const router = useRouter()
  const [profile, setProfile]   = useState(null)
  const [income, setIncome]     = useState(0)
  const [expense, setExpense]   = useState(0)
  const [debts, setDebts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [accepted, setAccepted] = useState({})

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      const month = getCurrentMonth()
      const [{ data: prof }, { data: txns }, { data: dts }] = await Promise.all([
        getProfile(u.id),
        getTransactions(u.id, month),
        getDebts(u.id),
      ])
      setProfile(prof)
      setIncome((txns || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setExpense((txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
      setDebts(dts || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🦊</div>
        <p style={{ color: '#22C55E', fontWeight: 800 }} className="animate-pulse">Analizando tus finanzas...</p>
      </div>
    </div>
  )

  const companionId = profile?.companion_id || 'nova'
  const companion   = COMPANIONS[companionId] || COMPANIONS.nova
  const monthlyIncome = profile?.monthly_income || 0
  const available   = (income || monthlyIncome) - expense
  const recs        = buildRecommendations({ income: income || monthlyIncome, expense, debts, monthlyIncome })

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9FAFB' }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(145deg, ${companion.color}, ${companion.color}CC)`, paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="px-5 pt-2 pb-16">
          <div className="flex items-center gap-3">
            <CompanionAvatar companionId={companionId} size={48} showGlow />
            <div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Tu coach financiero</p>
              <p style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 20 }}>{companion.name} Coach</p>
            </div>
          </div>
          <div className="card-lg mt-4" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <p style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 1.6 }}>
              💬 <strong>{companion.name} dice:</strong> {companion.tip}
            </p>
          </div>
        </div>
      </div>

      {/* Financial snapshot */}
      <div className="px-5 -mt-10">
        <div className="card-lg" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 12 }}>📊 Tu foto financiera — {new Date().toLocaleString('es', { month: 'long', year: 'numeric' })}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Ingresos', value: formatCurrency(income || monthlyIncome), color: '#16A34A' },
              { label: 'Gastos',   value: formatCurrency(expense),                  color: '#DC2626' },
              { label: 'Libre',    value: formatCurrency(Math.max(0, available)),    color: available >= 0 ? '#0891B2' : '#DC2626' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 16, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
          {debts.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, color: '#6B7280' }}>Total en deudas</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#D97706' }}>
                  {formatCurrency(debts.reduce((s, d) => s + d.balance, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="px-5 mt-5">
        <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 14 }}>
          ⚡ Recomendaciones de {companion.name}
        </p>
        <div className="space-y-4">
          {recs.map((rec, i) => (
            <div key={i} className="card-lg" style={{ border: `1.5px solid ${rec.border}`, background: rec.bg }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.7)' }}>
                  {rec.icon}
                </div>
                <div className="flex-1">
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{rec.title}</p>
                  <p style={{ fontSize: 12, color: '#374151', marginTop: 4, lineHeight: 1.5 }}>{rec.detail}</p>
                </div>
              </div>
              {!accepted[i] ? (
                <button
                  onClick={() => { setAccepted(a => ({ ...a, [i]: true })); router.push(rec.href) }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm"
                  style={{ background: rec.color, color: '#FFFFFF', boxShadow: `0 4px 12px ${rec.color}40` }}>
                  <span>{rec.action}</span>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 99 }}>
                      ⚡ +{rec.xp} XP
                    </span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: '#DCFCE7' }}>
                  <span style={{ fontSize: 14 }}>✅</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>¡Misión aceptada!</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Educational section */}
      <div className="px-5 mt-5">
        <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 12 }}>📚 Estrategias de pago de deuda</p>
        <div className="space-y-3">
          <div className="card" style={{ border: '1.5px solid #FDE68A', background: '#FFFBEB' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#D97706' }}>🌊 Método Avalanche</p>
            <p style={{ fontSize: 12, color: '#374151', marginTop: 4, lineHeight: 1.5 }}>
              Paga primero la deuda con mayor tasa de interés (APR). Ahorras más dinero en total, aunque tarda más en ver la primera deuda eliminada.
            </p>
          </div>
          <div className="card" style={{ border: '1.5px solid #BBF7D0', background: '#F0FDF4' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#15803D' }}>⛄ Método Snowball</p>
            <p style={{ fontSize: 12, color: '#374151', marginTop: 4, lineHeight: 1.5 }}>
              Paga primero la deuda de menor balance. Eliminas deudas más rápido, lo que genera motivación. Puede costar un poco más en intereses totales.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
