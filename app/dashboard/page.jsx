'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getProfile, getTransactions, getDebts } from '@/lib/supabase'
import { calculateLevel, getLevelProgress, formatCurrency, getCurrentMonth } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import CompanionAvatar, { COMPANIONS } from '@/components/ui/CompanionAvatar'
import { Coins, Zap, Flame, ChevronRight, ChevronLeft, Plus, TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react'

function offsetMonth(base, delta) {
  const [y, m] = base.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [xpFlash, setXpFlash] = useState(false)
  const [userId, setUserId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
      const [{ data: prof }, { data: txns }, { data: dts }] = await Promise.all([
        getProfile(u.id),
        getTransactions(u.id, selectedMonth),
        getDebts(u.id),
      ])
      setProfile(prof)
      setTransactions(txns || [])
      setDebts(dts || [])
      setLoading(false)
    }
    load()
  }, [router, selectedMonth])

  async function changeMonth(delta) {
    const newMonth = offsetMonth(selectedMonth, delta)
    setSelectedMonth(newMonth)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🎮</div>
        <p style={{ color: '#22C55E', fontWeight: 800 }} className="animate-pulse">Cargando tu aventura...</p>
      </div>
    </div>
  )

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const available = income - expense

  const monthlyIncome = profile?.monthly_income || income
  const levelInfo = calculateLevel(profile?.xp || 0)
  const progress = getLevelProgress(profile?.xp || 0)
  const companionId = profile?.companion_id || 'nova'
  const companion = COMPANIONS[companionId] || COMPANIONS.nova
  const activeMission = debts[0]

  const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const [selY, selM] = selectedMonth.split('-').map(Number)
  const monthLabel = `${MONTHS_ES[selM - 1]} ${selY}`
  const isCurrentMonth = selectedMonth === getCurrentMonth()

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#F9FAFB' }}>

      {/* ── Header con gradiente verde ── */}
      <div style={{ background: 'linear-gradient(145deg, #15803D 0%, #052E16 100%)', paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="px-5 pt-2 pb-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CompanionAvatar companionId={companionId} size={52} showGlow />
              <div>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>¡Hola, {profile?.name?.split(' ')[0] || 'héroe'}!</p>
                <p style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 18 }}>Tu progreso</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <span style={{ fontSize: 14 }}>🪙</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14 }}>{profile?.coins || 0}</span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}>
                  ⚡ Nivel {levelInfo.level}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{levelInfo.name}</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{profile?.xp || 0} XP</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.25)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#FFFFFF', borderRadius: 99 }} />
            </div>
          </div>

          {/* ── Selector de mes dentro del header ── */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <ChevronLeft size={18} color="#FFFFFF" />
            </button>
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>{monthLabel}</span>
            <button onClick={() => changeMonth(1)} disabled={isCurrentMonth} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isCurrentMonth ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <ChevronRight size={18} color={isCurrentMonth ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats grid — elevado sobre el header ── */}
      <div className="px-5 -mt-12">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Ingresos', value: formatCurrency(income || monthlyIncome), color: '#16A34A', bg: '#DCFCE7', icon: '📈' },
            { label: 'Gastos',   value: formatCurrency(expense),   color: '#DC2626', bg: '#FEF2F2', icon: '📉' },
            { label: 'Disponible', value: formatCurrency(available), color: available >= 0 ? '#0891B2' : '#DC2626', bg: '#ECFEFF', icon: '💳' },
            { label: 'Deudas',   value: formatCurrency(totalDebt), color: '#D97706', bg: '#FFFBEB', icon: '⚔️' },
          ].map((s, i) => (
            <div key={i} className="card-lg" style={{ border: `1px solid ${s.bg}` }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
                  {s.label}
                </span>
              </div>
              <p style={{ color: s.color, fontWeight: 800, fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">

        {/* ── Misión activa ── */}
        {activeMission ? (
          <Link href="/debt-dungeon">
            <div className="card-lg" style={{ border: '1.5px solid #FEF3C7', background: 'linear-gradient(135deg, #FFFBEB, #FFFFFF)' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: '#FEF3C7', border: '2px solid #FDE68A' }}>
                  {activeMission.boss_emoji || '🐉'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                      ⚔️ MISIÓN ACTIVA
                    </span>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>
                    Derrota a {activeMission.boss_name || activeMission.name}
                  </p>
                  <p style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                    {formatCurrency(activeMission.balance)} restante
                  </p>
                  <div className="progress-track mt-3">
                    <div className="progress-fill"
                      style={{
                        width: `${Math.max(5, ((activeMission.original_balance - activeMission.balance) / activeMission.original_balance) * 100)}%`,
                        background: 'linear-gradient(90deg, #22C55E, #16A34A)',
                      }} />
                  </div>
                  <p style={{ color: '#6B7280', fontSize: 11, marginTop: 4 }}>
                    {Math.round(((activeMission.original_balance - activeMission.balance) / activeMission.original_balance) * 100)}% eliminado
                  </p>
                </div>
                <ChevronRight size={18} color="#D97706" />
              </div>
              {debts.length > 1 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #FEF3C7' }}>
                  <p style={{ fontSize: 12, color: '#D97706', fontWeight: 600, textAlign: 'center' }}>
                    ⚔️ +{debts.length - 1} {debts.length - 1 === 1 ? 'deuda más' : 'deudas más'} esperando en el Dungeon
                  </p>
                </div>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/debt-dungeon">
            <div className="card-lg" style={{ border: '1.5px dashed #E5E7EB', textAlign: 'center' }}>
              <div className="text-4xl mb-2">🗡️</div>
              <p style={{ fontWeight: 700, color: '#374151' }}>Debt Dungeon</p>
              <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>Agrega una deuda para comenzar la batalla</p>
            </div>
          </Link>
        )}

        {/* ── Racha & companion ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: '#FFF7ED' }}>
              🔥
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#F97316' }}>{profile?.streak || 0}</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Días en racha</p>
            </div>
          </div>
          <Link href="/companions" className="card-lg flex items-center gap-3">
            <CompanionAvatar companionId={companionId} size={40} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{companion.name}</p>
              <p style={{ fontSize: 11, color: companion.color, fontWeight: 600 }}>{companion.specialty}</p>
            </div>
          </Link>
        </div>

        {/* ── Acciones rápidas ── */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Acciones rápidas</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/transactions?type=income">
              <div className="card flex items-center gap-3" style={{ border: '1.5px solid #DCFCE7' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                  <TrendingUp size={18} color="#16A34A" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Ingreso</p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>+10 XP</p>
                </div>
              </div>
            </Link>
            <Link href="/transactions?type=expense">
              <div className="card flex items-center gap-3" style={{ border: '1.5px solid #FEE2E2' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                  <TrendingDown size={18} color="#DC2626" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Gasto</p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>+10 XP</p>
                </div>
              </div>
            </Link>
            <Link href="/goals">
              <div className="card flex items-center gap-3" style={{ border: '1.5px solid #EDE9FE' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EDE9FE' }}>
                  <Wallet size={18} color="#7C3AED" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Ahorrar</p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>+25 XP</p>
                </div>
              </div>
            </Link>
            <Link href="/transactions">
              <div className="card flex items-center gap-3" style={{ border: '1.5px solid #E0F2FE' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E0F2FE' }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Movimientos</p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>Ver historial</p>
                </div>
              </div>
            </Link>
            <Link href="/budget" className="col-span-2">
              <div className="card flex items-center gap-3" style={{ border: '1.5px solid #FEF9C3' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF9C3' }}>
                  <span style={{ fontSize: 18 }}>📊</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Presupuesto</p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>Gestionar límites por categoría</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Tip del compañero → enlaza a Coach ── */}
        <Link href="/coach">
          <div className="card" style={{ background: `${companion.color}10`, border: `1.5px solid ${companion.color}30` }}>
            <div className="flex items-start gap-3">
              <CompanionAvatar companionId={companionId} size={36} />
              <div className="flex-1">
                <p style={{ fontWeight: 700, fontSize: 13, color: companion.color }}>💬 {companion.name} dice:</p>
                <p style={{ fontSize: 13, color: '#374151', marginTop: 4, lineHeight: 1.5 }}>{companion.tip}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl flex-shrink-0"
                style={{ background: companion.color + '20', alignSelf: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: companion.color }}>Ver Coach</span>
              </div>
            </div>
          </div>
        </Link>

      </div>

      {xpFlash && <div className="xp-float">⚡ +10 XP</div>}
      <BottomNav />
    </div>
  )
}
