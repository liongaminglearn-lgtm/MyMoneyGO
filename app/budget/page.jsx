'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getProfile, getTransactions, getBudgets, upsertBudget } from '@/lib/supabase'
import { CATEGORIES, formatCurrency, getCurrentMonth } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { ChevronLeft, Edit3, Check, X } from 'lucide-react'
import Link from 'next/link'

const EXPENSE_CATS = ['housing','food','transport','utilities','health','entertainment','education','clothing','subscriptions','credit_card','debt','savings','other']

export default function BudgetPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draftBudgets, setDraftBudgets] = useState({})
  const [saving, setSaving] = useState(false)
  const [monthlyIncome, setMonthlyIncome] = useState(0)

  const month = getCurrentMonth()
  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const now = new Date()
  const monthLabel = `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
      const [{ data: prof }, { data: txns }, { data: bdgs }] = await Promise.all([
        getProfile(u.id),
        getTransactions(u.id, month),
        getBudgets(u.id, month),
      ])
      const txList = txns || []
      setTransactions(txList)
      const incomeFromTxns = txList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      setMonthlyIncome(prof?.monthly_income || incomeFromTxns || 0)
      const budgetMap = {}
      ;(bdgs || []).forEach(b => { budgetMap[b.category] = b.amount })
      setBudgets(budgetMap)
      setDraftBudgets(budgetMap)
      setLoading(false)
    }
    load()
  }, [router, month])

  const spentMap = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    spentMap[t.category] = (spentMap[t.category] || 0) + t.amount
  })

  async function handleSave() {
    setSaving(true)
    const entries = Object.entries(draftBudgets).filter(([, v]) => Number(v) > 0)
    await Promise.all(entries.map(([cat, amt]) => upsertBudget(userId, month, cat, Number(amt))))
    setBudgets({ ...draftBudgets })
    setEditing(false)
    setSaving(false)
  }

  const totalBudgeted = Object.values(budgets).reduce((s, v) => s + Number(v), 0)
  const totalSpent = Object.values(spentMap).reduce((s, v) => s + v, 0)
  const spentPct = monthlyIncome > 0 ? Math.round((totalSpent / monthlyIncome) * 100) : 0

  // Regla 50/30/20
  const rule = monthlyIncome > 0 ? {
    needs:   Math.round(monthlyIncome * 0.50),
    wants:   Math.round(monthlyIncome * 0.30),
    savings: Math.round(monthlyIncome * 0.20),
  } : null

  const cats = EXPENSE_CATS.map(id => {
    const cat = CATEGORIES.find(c => c.id === id)
    const spent = spentMap[id] || 0
    const limit = budgets[id] || 0
    const pct = limit > 0 ? (spent / limit) * 100 : 0
    return { id, cat, spent, limit, pct }
  }).filter(c => c.spent > 0 || c.limit > 0 || editing)

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#FFFFFF' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6' }}>
        <div className="flex items-center justify-between px-5 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                <ChevronLeft size={20} color="#374151" />
              </div>
            </Link>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>Presupuesto</h1>
              <p style={{ fontSize: 12, color: '#6B7280' }}>{monthLabel}</p>
            </div>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setDraftBudgets(budgets) }}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#FEE2E2' }}>
                <X size={18} color="#DC2626" />
              </button>
              <button onClick={handleSave} disabled={saving}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#D1FAE5' }}>
                <Check size={18} color="#047857" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#F3F4F6', color: '#374151' }}>
              <Edit3 size={14} />
              Editar
            </button>
          )}
        </div>

        {/* Banner % de ingresos */}
        {!editing && monthlyIncome > 0 && (
          <div className="mx-5 mb-3 rounded-2xl p-4" style={{
            background: spentPct > 90 ? '#FEF2F2' : spentPct > 70 ? '#FFFBEB' : '#ECFDF5',
            border: `1.5px solid ${spentPct > 90 ? '#FCA5A5' : spentPct > 70 ? '#FDE68A' : '#A7F3D0'}`,
          }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                {monthLabel}: gastaste el <span style={{ color: spentPct > 90 ? '#DC2626' : spentPct > 70 ? '#D97706' : '#047857' }}>{spentPct}%</span> de tus ingresos
              </p>
              <span style={{ fontSize: 20 }}>{spentPct > 90 ? '🚨' : spentPct > 70 ? '⚠️' : '✅'}</span>
            </div>
            <div style={{ height: 6, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${Math.min(100, spentPct)}%`, borderRadius: 99,
                background: spentPct > 90 ? '#EF4444' : spentPct > 70 ? '#F97316' : '#059669' }} />
            </div>
            {rule && (
              <div>
                <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, marginBottom: 6 }}>REGLA 50 / 30 / 20</p>
                <div className="flex gap-2">
                  {[
                    { label: '50% Necesidades', val: rule.needs, color: '#3B82F6' },
                    { label: '30% Deseos',       val: rule.wants, color: '#8B5CF6' },
                    { label: '20% Ahorro',        val: rule.savings, color: '#059669' },
                  ].map(r => (
                    <div key={r.label} className="flex-1 rounded-xl p-2 text-center" style={{ background: `${r.color}12` }}>
                      <p style={{ fontSize: 9, color: r.color, fontWeight: 700 }}>{r.label}</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>{formatCurrency(r.val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary bar */}
        {!editing && (
          <div className="px-5 pb-4 flex gap-3">
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#ECFDF5' }}>
              <p style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>PRESUPUESTO</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#047857' }}>{formatCurrency(totalBudgeted)}</p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#FEF2F2' }}>
              <p style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>GASTADO</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#DC2626' }}>{formatCurrency(totalSpent)}</p>
            </div>
            <div className="flex-1 rounded-xl p-3 text-center" style={{ background: '#F0F9FF' }}>
              <p style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>RESTANTE</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#0369A1' }}>{formatCurrency(totalBudgeted - totalSpent)}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p style={{ color: '#059669', fontWeight: 700 }} className="animate-pulse">Cargando...</p>
        </div>
      ) : (
        <div className="px-5 mt-5 space-y-3">
          {editing && (
            <div className="card" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
              <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                💡 Establece un límite de gasto para cada categoría
              </p>
            </div>
          )}

          {cats.length === 0 && !editing && (
            <div className="card text-center py-10" style={{ border: '1.5px dashed #E5E7EB' }}>
              <p className="text-4xl mb-3">📊</p>
              <p style={{ fontWeight: 600, color: '#374151' }}>Sin datos aún</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>Registra gastos o edita los límites</p>
            </div>
          )}

          {/* All cats in edit mode, only cats with data otherwise */}
          {(editing ? EXPENSE_CATS : cats.map(c => c.id)).map(id => {
            const catInfo = CATEGORIES.find(c => c.id === id)
            const spent = spentMap[id] || 0
            const limit = editing ? (Number(draftBudgets[id]) || 0) : (budgets[id] || 0)
            const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : (spent > 0 ? 100 : 0)
            const over = limit > 0 && spent > limit
            const near = !over && limit > 0 && pct >= 80

            const barColor = over ? '#EF4444' : near ? '#F97316' : '#059669'

            return (
              <div key={id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 20 }}>{catInfo?.icon || '📦'}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{catInfo?.name || id}</span>
                    {over && <span className="chip chip-red text-xs">Excedido</span>}
                  </div>
                  {editing ? (
                    <input
                      type="number"
                      placeholder="Límite"
                      value={draftBudgets[id] || ''}
                      onChange={e => setDraftBudgets(prev => ({ ...prev, [id]: e.target.value }))}
                      className="input-field text-right font-bold"
                      style={{ width: 110, padding: '6px 10px', fontSize: 14 }}
                      inputMode="decimal"
                    />
                  ) : (
                    <div className="text-right">
                      <p style={{ fontSize: 13, fontWeight: 700, color: over ? '#DC2626' : '#111827' }}>
                        {formatCurrency(spent)}
                      </p>
                      {limit > 0 && <p style={{ fontSize: 11, color: '#9CA3AF' }}>de {formatCurrency(limit)}</p>}
                    </div>
                  )}
                </div>

                {!editing && (
                  <>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    {limit > 0 && (
                      <div className="flex justify-between mt-1.5">
                        <span style={{ fontSize: 11, color: barColor, fontWeight: 600 }}>
                          {Math.round(pct)}%
                        </span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                          {over ? `−${formatCurrency(spent - limit)} excedido` : `${formatCurrency(limit - spent)} libre`}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
