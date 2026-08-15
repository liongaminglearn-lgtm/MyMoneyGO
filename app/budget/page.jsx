'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getUser, getProfile, getTransactions, getBudgets, upsertBudget, updateProfile,
} from '@/lib/supabase'
import { CATEGORIES, formatCurrency, getCurrentMonth, getMonthName } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { X, Pencil, Shield, Zap, Trophy, ChevronLeft, ChevronRight } from 'lucide-react'

const EXPENSE_CATS = CATEGORIES.filter(c => !['salary', 'freelance'].includes(c.id))

function getHPColor(pct) {
  if (pct <= 25) return { bar: '#EF4444', text: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'PELIGRO' }
  if (pct <= 50) return { bar: '#F59E0B', text: '#D97706', bg: 'rgba(245,158,11,0.1)', label: 'ALERTA' }
  if (pct <= 75) return { bar: '#EAB308', text: '#CA8A04', bg: 'rgba(234,179,8,0.08)', label: 'CUIDADO' }
  return { bar: '#00C896', text: '#00A67C', bg: 'rgba(0,200,150,0.08)', label: 'BIEN' }
}

function HPBar({ pct, color, height = 10 }) {
  const safePct = Math.min(100, Math.max(0, pct))
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#E2E8F0' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${safePct}%`, background: color }}
      />
    </div>
  )
}

function BossHealthBar({ totalBudget, totalSpent }) {
  if (totalBudget === 0) return null
  const pct = Math.max(0, 100 - Math.min(100, (totalSpent / totalBudget) * 100))
  const theme = getHPColor(pct)
  const bossHurt = pct <= 50

  return (
    <div className="card rounded-3xl p-5 mb-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #2D1B69 100%)' }}>
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #A78BFA 0%, transparent 60%)' }} />

      {/* Boss */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-purple-300 text-xs font-semibold tracking-widest uppercase mb-0.5">Jefe del Mes</p>
          <h2 className="text-white text-xl font-black">
            {bossHurt ? '💀 Mes en Peligro' : '👹 Gastos Monstruosos'}
          </h2>
        </div>
        <div className="text-4xl">{bossHurt ? '💔' : '🛡️'}</div>
      </div>

      {/* Boss HP */}
      <div className="mb-1 flex justify-between items-center">
        <span className="text-purple-300 text-xs font-bold">HP DEL BOSS</span>
        <span className="text-xs font-bold" style={{ color: theme.text }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-4 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-4 rounded-full transition-all duration-700 relative overflow-hidden"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.bar}, ${theme.bar}CC)` }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 12px)' }} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <p className="text-purple-300 text-xs mb-0.5">Presupuesto</p>
          <p className="text-white font-black text-base">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <p className="text-purple-300 text-xs mb-0.5">Gastado</p>
          <p className="font-black text-base" style={{ color: theme.bar }}>{formatCurrency(totalSpent)}</p>
        </div>
        <div className="flex-1 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <p className="text-purple-300 text-xs mb-0.5">Libre</p>
          <p className="text-white font-black text-base">{formatCurrency(Math.max(0, totalBudget - totalSpent))}</p>
        </div>
      </div>
    </div>
  )
}

export default function BudgetPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(getCurrentMonth())
  const [editCat, setEditCat] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [xpFlash, setXpFlash] = useState(false)

  const load = useCallback(async (m) => {
    const u = await getUser()
    if (!u) { router.push('/auth/login'); return }
    setUser(u)
    const [{ data: prof }, { data: txns }, { data: bgets }] = await Promise.all([
      getProfile(u.id),
      getTransactions(u.id, m),
      getBudgets(u.id, m),
    ])
    setProfile(prof)
    setTransactions(txns || [])
    setBudgets(bgets || [])
    setLoading(false)
  }, [router])

  useEffect(() => { load(month) }, [load, month])

  function changeMonth(dir) {
    const [y, mo] = month.split('-').map(Number)
    const d = new Date(y, mo - 1 + dir, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function getBudgetForCat(catId) {
    return budgets.find(b => b.category === catId)?.amount || 0
  }

  function getSpentForCat(catId) {
    return transactions
      .filter(t => t.type === 'expense' && t.category === catId)
      .reduce((s, t) => s + t.amount, 0)
  }

  async function handleSaveBudget() {
    if (!editAmount || isNaN(editAmount) || Number(editAmount) < 0) return
    setSaving(true)
    const prev = getBudgetForCat(editCat)
    const { data } = await upsertBudget(user.id, month, editCat, Number(editAmount))
    if (data) {
      setBudgets(prev2 => {
        const existing = prev2.findIndex(b => b.category === editCat)
        const updated = { category: editCat, amount: Number(editAmount), month }
        return existing >= 0
          ? prev2.map((b, i) => i === existing ? { ...b, ...updated } : b)
          : [...prev2, { ...updated, id: Date.now() }]
      })
      if (prev === 0 && Number(editAmount) > 0 && profile) {
        const newXp = (profile.xp || 0) + 15
        await updateProfile(user.id, { xp: newXp })
        setProfile(p => ({ ...p, xp: newXp }))
        setXpFlash(true)
        setTimeout(() => setXpFlash(false), 2000)
      }
    }
    setEditCat(null)
    setSaving(false)
  }

  const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0)
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const catsWithBudget = EXPENSE_CATS.filter(c => getBudgetForCat(c.id) > 0)
  const catsNoBudget = EXPENSE_CATS.filter(c => getBudgetForCat(c.id) === 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl font-black animate-pulse">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark pb-28 safe-top page-transition">
      {/* XP Flash */}
      {xpFlash && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl font-bold text-sm animate-bounce"
          style={{ background: 'rgba(0,200,150,0.95)', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,200,150,0.5)' }}>
          ⚡ +15 XP ¡Presupuesto configurado!
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-gray-900 text-xl font-black">Presupuesto 🎮</h1>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl"
            style={{ background: 'rgba(0,200,150,0.1)' }}>
            <Zap size={13} color="#00C896" />
            <span className="text-brand-green text-xs font-bold">{profile?.xp || 0} XP</span>
          </div>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => changeMonth(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F1F5F9' }}>
            <ChevronLeft size={16} color="#6B7280" />
          </button>
          <span className="flex-1 text-center text-gray-800 font-semibold text-sm capitalize">
            {getMonthName(month)}
          </span>
          <button onClick={() => changeMonth(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F1F5F9' }}>
            <ChevronRight size={16} color="#6B7280" />
          </button>
        </div>
      </div>

      <div className="px-5">
        {/* Boss health bar */}
        {totalBudget > 0
          ? <BossHealthBar totalBudget={totalBudget} totalSpent={totalSpent} />
          : (
            <div className="card rounded-2xl p-5 mb-4 text-center"
              style={{ background: 'linear-gradient(135deg, #1E1B4B, #2D1B69)' }}>
              <div className="text-4xl mb-2">🎮</div>
              <p className="text-white font-bold mb-1">¡Define tu presupuesto!</p>
              <p className="text-purple-300 text-sm">Configura límites por categoría para activar el modo batalla</p>
            </div>
          )
        }

        {/* Categories with budget */}
        {catsWithBudget.length > 0 && (
          <div className="mb-5">
            <h2 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
              <Shield size={15} color="#00C896" />
              Categorías activas
            </h2>
            <div className="space-y-3">
              {catsWithBudget.map(cat => {
                const budget = getBudgetForCat(cat.id)
                const spent = getSpentForCat(cat.id)
                const remaining = budget - spent
                const spentPct = budget > 0 ? (spent / budget) * 100 : 0
                const hpPct = Math.max(0, 100 - spentPct)
                const theme = getHPColor(hpPct)
                const over = spent > budget

                return (
                  <div key={cat.id} className="card rounded-2xl p-4"
                    style={{ background: over ? 'rgba(239,68,68,0.04)' : theme.bg, borderColor: over ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: `${cat.color}20` }}>
                          {cat.icon}
                        </div>
                        <div>
                          <p className="text-gray-900 font-bold text-sm">{cat.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: over ? 'rgba(239,68,68,0.12)' : theme.bg, color: over ? '#EF4444' : theme.text }}>
                              {over ? '⚠ EXCEDIDO' : theme.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { setEditCat(cat.id); setEditAmount(String(budget)) }}
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#F1F5F9' }}>
                        <Pencil size={12} color="#6B7280" />
                      </button>
                    </div>

                    {/* HP Bar */}
                    <HPBar pct={hpPct} color={over ? '#EF4444' : theme.bar} height={8} />

                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs text-brand-muted">
                        {formatCurrency(spent)} gastado
                      </span>
                      <span className="text-xs font-semibold" style={{ color: over ? '#EF4444' : theme.text }}>
                        {over
                          ? `${formatCurrency(Math.abs(remaining))} de exceso`
                          : `${formatCurrency(remaining)} libre`}
                      </span>
                    </div>
                    <p className="text-right text-xs text-brand-muted mt-0.5">
                      Límite: {formatCurrency(budget)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Categories without budget */}
        <div className="mb-5">
          <h2 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
            <Trophy size={15} color="#EAB308" />
            {catsWithBudget.length > 0 ? 'Añadir límites' : 'Elige tus categorías'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {catsNoBudget.map(cat => {
              const spent = getSpentForCat(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => { setEditCat(cat.id); setEditAmount('') }}
                  className="card rounded-2xl p-3 text-left transition-all active:scale-95"
                  style={{ border: '1.5px dashed #E2E8F0' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-gray-800 font-semibold text-sm">{cat.name}</span>
                  </div>
                  {spent > 0 && (
                    <p className="text-xs text-red-500 font-medium">{formatCurrency(spent)} gastado</p>
                  )}
                  <p className="text-brand-green text-xs font-semibold mt-0.5">+ Definir límite</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editCat && (() => {
        const cat = EXPENSE_CATS.find(c => c.id === editCat)
        const spent = getSpentForCat(editCat)
        return (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditCat(null)} />
            <div className="relative w-full rounded-t-3xl safe-bottom"
              style={{ background: '#FFFFFF' }}>
              <div className="flex items-center justify-between px-6 pt-5 pb-4"
                style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${cat.color}20` }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="text-gray-900 font-bold">{cat.name}</h2>
                    <p className="text-brand-muted text-xs">Gastado: {formatCurrency(spent)}</p>
                  </div>
                </div>
                <button onClick={() => setEditCat(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#F1F5F9' }}>
                  <X size={18} color="#6B7280" />
                </button>
              </div>

              <div className="px-6 py-5">
                <label className="text-brand-muted text-sm mb-2 block">Límite mensual para {cat.name}</label>
                <input
                  className="input-dark text-2xl font-bold mb-4"
                  type="number"
                  placeholder="0"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  inputMode="decimal"
                  autoFocus
                />

                {/* Quick suggestions */}
                <div className="flex gap-2 mb-5">
                  {[50, 100, 200, 500].map(v => (
                    <button key={v} onClick={() => setEditAmount(String(v))}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: editAmount === String(v) ? 'rgba(0,200,150,0.1)' : '#F8FAFC',
                        border: `1px solid ${editAmount === String(v) ? '#00C896' : '#E2E8F0'}`,
                        color: editAmount === String(v) ? '#00C896' : '#6B7280',
                      }}>
                      ${v}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSaveBudget}
                  disabled={saving}
                  className="btn-primary">
                  {saving ? 'Guardando...' : `Guardar límite ${getBudgetForCat(editCat) === 0 ? '(+15 XP)' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      <BottomNav />
    </div>
  )
}
