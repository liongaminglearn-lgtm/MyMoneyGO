'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUser, getProfile, getTransactions, getBudgets, updateProfile } from '@/lib/supabase'
import { formatCurrency, getCurrentMonth, getMonthName, calculateLevel } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import XPBar from '@/components/ui/XPBar'
import TransactionCard from '@/components/ui/TransactionCard'
import { Flame, TrendingUp, TrendingDown, Wallet, Sword } from 'lucide-react'
import Link from 'next/link'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function BudgetMini({ budgets, expenses }) {
  if (!budgets || budgets.length === 0) {
    return (
      <Link href="/budget"
        className="flex items-center justify-between rounded-2xl px-4 py-3"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.05))', border: '1px solid rgba(124,58,237,0.18)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <div>
            <p className="text-purple-700 font-bold text-sm">Modo Batalla</p>
            <p className="text-purple-500 text-xs">Define tu presupuesto mensual</p>
          </div>
        </div>
        <span className="text-purple-400 text-xs font-bold">→</span>
      </Link>
    )
  }

  const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0)
  const totalSpent = expenses
  const pct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0
  const hpPct = 100 - pct
  const barColor = hpPct <= 25 ? '#EF4444' : hpPct <= 50 ? '#F59E0B' : '#00C896'
  const status = hpPct <= 25 ? '🔴 PELIGRO' : hpPct <= 50 ? '🟡 ALERTA' : '🟢 BIEN'

  return (
    <Link href="/budget"
      className="rounded-2xl p-4 block"
      style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D1B69)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <p className="text-white font-bold text-sm">Batalla del Mes</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#E2E8F0' }}>
          {status}
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${hpPct}%`, background: barColor }} />
      </div>
      <div className="flex justify-between">
        <p className="text-purple-300 text-xs">{formatCurrency(totalSpent)} gastado</p>
        <p className="text-purple-300 text-xs">de {formatCurrency(totalBudget)}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  const currentMonth = getCurrentMonth()

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const [{ data: prof }, { data: txns }, { data: bgets }] = await Promise.all([
        getProfile(u.id),
        getTransactions(u.id, currentMonth),
        getBudgets(u.id, currentMonth),
      ])

      // Actualizar streak
      if (prof) {
        const today = new Date().toISOString().split('T')[0]
        const lastActive = prof.last_active
        if (lastActive !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]
          const newStreak = lastActive === yesterdayStr ? (prof.streak || 0) + 1 : 1
          await updateProfile(u.id, { last_active: today, streak: newStreak })
          prof.streak = newStreak
          prof.last_active = today
        }
      }

      setProfile(prof)
      setTransactions(txns || [])
      setBudgets(bgets || [])
      setLoading(false)
    }
    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.push('/auth/login')
    })
    return () => subscription.unsubscribe()
  }, [router, currentMonth])

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const recent = transactions.slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-brand-green text-2xl font-black animate-pulse">MyMoney GO</div>
          <p className="text-brand-muted text-sm">Cargando tu universo...</p>
        </div>
      </div>
    )
  }

  const levelInfo = calculateLevel(profile?.xp || 0)

  return (
    <div className="min-h-screen bg-brand-dark pb-24 safe-top page-transition">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-brand-muted text-sm">{getGreeting()} 👋</p>
            <h1 className="text-gray-900 text-xl font-black">{profile?.name || 'Amigo'}</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <Flame size={16} color="#F97316" />
            <span className="text-gray-800 text-sm font-bold">{profile?.streak || 0}</span>
            <span className="text-brand-muted text-xs">días</span>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-5 mb-4">
        <div className="rounded-3xl p-6 relative overflow-hidden glow-green"
          style={{ background: 'linear-gradient(135deg, #00C896 0%, #00A67C 100%)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
          <p className="text-green-100 text-sm font-medium opacity-90 mb-1 capitalize">{getMonthName(currentMonth)}</p>
          <p className="text-white text-4xl font-black mb-4">{formatCurrency(balance)}</p>
          <div className="flex gap-4">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp size={14} color="rgba(255,255,255,0.8)" />
                <p className="text-green-100 text-xs opacity-80">Ingresos</p>
              </div>
              <p className="text-white font-bold">{formatCurrency(income)}</p>
            </div>
            <div className="w-px bg-white opacity-20" />
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingDown size={14} color="rgba(255,255,255,0.8)" />
                <p className="text-green-100 text-xs opacity-80">Gastos</p>
              </div>
              <p className="text-white font-bold">{formatCurrency(expense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* XP Bar — tap para ver misiones */}
      <div className="px-5 mb-4">
        <Link href="/missions" className="block active:scale-95 transition-transform">
          <XPBar xp={profile?.xp || 0} />
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-3 gap-2">
          <Link href="/transactions?type=income"
            className="card flex flex-col items-center gap-1.5 py-3 active:scale-95 transition-transform text-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,200,150,0.12)' }}>
              <TrendingUp size={16} color="#00C896" />
            </div>
            <span className="text-gray-700 font-semibold text-xs">+ Ingreso</span>
          </Link>
          <Link href="/transactions?type=expense"
            className="card flex flex-col items-center gap-1.5 py-3 active:scale-95 transition-transform text-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              <TrendingDown size={16} color="#EF4444" />
            </div>
            <span className="text-gray-700 font-semibold text-xs">- Gasto</span>
          </Link>
          <Link href="/budget"
            className="flex flex-col items-center gap-1.5 py-3 active:scale-95 transition-transform text-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Sword size={16} color="#FFFFFF" />
            </div>
            <span className="text-white font-semibold text-xs">Batalla</span>
          </Link>
        </div>
      </div>

      {/* Budget Health */}
      <div className="px-5 mb-4">
        <BudgetMini budgets={budgets} expenses={expense} />
      </div>

      {/* Insight */}
      {expense > 0 && (
        <div className="px-5 mb-5">
          <div className="rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(167,139,250,0.04))', border: '1px solid rgba(167,139,250,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🤖</span>
              <p className="text-purple-500 text-xs font-semibold">Insight</p>
            </div>
            <p className="text-gray-700 text-sm">
              {balance > 0
                ? `¡Vas bien! Llevas ${formatCurrency(balance)} de saldo positivo este mes. 🎉`
                : `Tus gastos superan tus ingresos. Reduce gastos o agrega ingresos. 💡`}
            </p>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 font-bold">Últimos movimientos</h2>
          <Link href="/transactions" className="text-brand-green text-sm font-medium">Ver todo</Link>
        </div>

        {recent.length === 0 ? (
          <div className="card text-center py-8">
            <Wallet size={32} color="#9CA3AF" className="mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Sin transacciones este mes</p>
            <p className="text-brand-muted text-sm mt-1">Agrega tu primer movimiento</p>
            <Link href="/transactions" className="inline-block mt-4 px-6 py-2 rounded-xl font-semibold text-sm"
              style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896' }}>
              Agregar ahora +
            </Link>
          </div>
        ) : (
          recent.map(t => <TransactionCard key={t.id} transaction={t} />)
        )}
      </div>
    </div>
  )
}
