'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUser, getTransactions, addTransaction, deleteTransaction, updateProfile, getProfile } from '@/lib/supabase'
import { CATEGORIES, formatCurrency, getCurrentMonth } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { X, Trash2, Plus, TrendingUp, TrendingDown, Download, ChevronLeft, ChevronRight } from 'lucide-react'

// Donut chart SVG simple
function DonutChart({ data, total }) {
  const radius = 44
  const cx = 55
  const cy = 55
  const strokeW = 18
  const circ = 2 * Math.PI * radius
  let offset = 0
  const segments = data.map(d => {
    const pct = total > 0 ? d.value / total : 0
    const seg = { ...d, pct, dasharray: pct * circ, start: offset * circ }
    offset += pct
    return seg
  })

  return (
    <svg viewBox="0 0 110 110" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={s.color}
          strokeWidth={strokeW}
          strokeDasharray={`${s.dasharray} ${circ - s.dasharray}`}
          strokeDashoffset={-s.start}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  )
}

const CATEGORY_COLORS = {
  housing: '#6366F1', food: '#F97316', transport: '#3B82F6',
  health: '#EF4444', entertainment: '#8B5CF6', education: '#EC4899',
  savings: '#22C55E', salary: '#22C55E', freelance: '#06B6D4',
  other: '#9CA3AF', debt: '#DC2626', clothing: '#F59E0B', utilities: '#14B8A6',
}

function TransactionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'expense'

  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(!!searchParams.get('type'))

  const [type, setType] = useState(defaultType)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(defaultType === 'income' ? 'salary' : 'food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [xpFlash, setXpFlash] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const [selY, selM] = selectedMonth.split('-').map(Number)
  const monthLabel = `${MONTHS_ES[selM - 1]} ${selY}`
  const isCurrentMonth = selectedMonth === getCurrentMonth()

  function offsetMonth(delta) {
    const d = new Date(selY, selM - 1 + delta, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data } = await getTransactions(u.id, selectedMonth)
      setTransactions(data || [])
      setLoading(false)
    }
    load()
  }, [router, selectedMonth])

  async function handleAdd(e) {
    e.preventDefault()
    if (!amount || isNaN(amount) || Number(amount) <= 0) return
    setSaving(true)
    setSaveError('')

    const { data, error } = await addTransaction({
      user_id: user.id,
      type,
      amount: Number(amount),
      category,
      note,
      date,
    })

    if (error) {
      setSaveError(error.message || 'Error al guardar. Intenta de nuevo.')
      setSaving(false)
      return
    }

    if (data && data[0]) {
      const { data: profile } = await getProfile(user.id)
      if (profile) await updateProfile(user.id, { xp: (profile.xp || 0) + 10 })
      setTransactions(prev => [data[0], ...prev])
      setAmount('')
      setNote('')
      setSaveError('')
      setShowForm(false)
      setXpFlash(true)
      setTimeout(() => setXpFlash(false), 1400)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    await deleteTransaction(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  function exportCSV() {
    const CAT_LABELS_FULL = {
      housing: 'Vivienda', food: 'Comida', transport: 'Transporte',
      health: 'Salud', entertainment: 'Entretenimiento', education: 'Educación',
      savings: 'Ahorro', salary: 'Salario', freelance: 'Freelance',
      other: 'Otros', debt: 'Deudas', clothing: 'Ropa', utilities: 'Servicios',
    }
    const rows = [
      ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Nota'],
      ...transactions.map(t => [
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        CAT_LABELS_FULL[t.category] || t.category,
        t.amount,
        t.note || '',
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mymoneygo-${currentMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const expenses = transactions.filter(t => t.type === 'expense')
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0)
  const available = income - totalExp

  // Agrupar gastos por categoría para el donut
  const catMap = {}
  expenses.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount
  })
  const chartData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cat, val]) => ({
      cat,
      value: val,
      color: CATEGORY_COLORS[cat] || '#9CA3AF',
      pct: totalExp > 0 ? Math.round((val / totalExp) * 100) : 0,
    }))

  const incomeCategories = ['salary', 'freelance', 'other']
  const expenseCategories = CATEGORIES.filter(c => !incomeCategories.includes(c.id))
  const filteredCats = type === 'income'
    ? CATEGORIES.filter(c => incomeCategories.includes(c.id))
    : expenseCategories

  const CAT_LABELS = {
    housing: 'Vivienda', food: 'Comida', transport: 'Transporte',
    health: 'Salud', entertainment: 'Entrete.', education: 'Educación',
    savings: 'Ahorro', salary: 'Salario', freelance: 'Freelance',
    other: 'Otros', debt: 'Deudas', clothing: 'Ropa', utilities: 'Servicios',
  }

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#F9FAFB' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>Movimientos</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <button onClick={() => setSelectedMonth(offsetMonth(-1))} style={{ color: '#6B7280', padding: '0 2px' }}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>{monthLabel}</span>
              <button onClick={() => setSelectedMonth(offsetMonth(1))} disabled={isCurrentMonth} style={{ color: isCurrentMonth ? '#D1D5DB' : '#6B7280', padding: '0 2px' }}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm"
              style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}>
              <Download size={15} />
              Excel
            </button>
            <button onClick={() => { setShowForm(true); setType('expense') }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ background: '#22C55E', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(34,197,94,0.35)' }}>
              <Plus size={16} />
              Agregar
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: '#FEF2F2' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>GASTO TOTAL</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>{formatCurrency(totalExp)}</p>
          </div>
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: '#F0FDF4' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>DISPONIBLE</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: available >= 0 ? '#16A34A' : '#DC2626' }}>{formatCurrency(available)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p style={{ color: '#22C55E', fontWeight: 700 }} className="animate-pulse">Cargando...</p>
        </div>
      ) : (
        <div className="px-5 mt-5 space-y-5">

          {/* Donut chart */}
          {chartData.length > 0 && (
            <div className="card-lg">
              <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Distribución de gastos</p>
              <div className="flex items-center gap-5">
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <DonutChart data={chartData} total={totalExp} />
                </div>
                <div className="flex-1 space-y-2">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#374151' }}>{CAT_LABELS[d.cat] || d.cat}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transactions list */}
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 12 }}>Transacciones recientes</p>
            {transactions.length === 0 ? (
              <div className="card text-center py-10" style={{ border: '1.5px dashed #E5E7EB' }}>
                <p className="text-4xl mb-3">💳</p>
                <p style={{ fontWeight: 600, color: '#374151' }}>Sin movimientos este mes</p>
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
                  Registra tu primer movimiento<br />y gana <span style={{ color: '#22C55E', fontWeight: 700 }}>+10 XP ⚡</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(t => {
                  const cat = CATEGORIES.find(c => c.id === t.category)
                  const color = CATEGORY_COLORS[t.category] || '#9CA3AF'
                  return (
                    <div key={t.id} className="card flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: `${color}15` }}>
                        {cat?.icon || '💰'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.note || cat?.name || 'Movimiento'}
                        </p>
                        <p style={{ fontSize: 12, color: '#6B7280' }}>
                          {CAT_LABELS[t.category] || t.category} · {t.date}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p style={{ fontWeight: 700, fontSize: 15, color: t.type === 'income' ? '#16A34A' : '#DC2626' }}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <button onClick={() => handleDelete(t.id)} className="mt-1">
                          <Trash2 size={14} color="#D1D5DB" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => { setShowForm(true); setType('expense') }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-40"
        style={{ background: '#22C55E', boxShadow: '0 4px 16px rgba(34,197,94,0.45)' }}>
        <Plus size={24} color="#FFFFFF" strokeWidth={3} />
      </button>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); setSaveError('') }} />
          <div className="relative w-full rounded-t-3xl flex flex-col" style={{ background: '#FFFFFF', maxHeight: '92vh' }}>

            <div className="flex items-center justify-between px-6 pt-5 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Nuevo movimiento</h2>
              <button onClick={() => { setShowForm(false); setSaveError('') }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#F3F4F6' }}>
                <X size={18} color="#6B7280" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Toggle */}
              <div className="flex rounded-2xl p-1 mb-5" style={{ background: '#F3F4F6' }}>
                {[
                  { id: 'income',  label: '+ Ingreso',  color: '#16A34A' },
                  { id: 'expense', label: '- Gasto',    color: '#DC2626' },
                ].map(t => (
                  <button key={t.id}
                    onClick={() => { setType(t.id); setCategory(t.id === 'income' ? 'salary' : 'food') }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: type === t.id ? '#FFFFFF' : 'transparent',
                      color: type === t.id ? t.color : '#9CA3AF',
                      boxShadow: type === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <form id="txn-form" onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Monto</label>
                  <input
                    className="input-field"
                    style={{ fontSize: 28, fontWeight: 800, color: type === 'income' ? '#16A34A' : '#DC2626' }}
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    inputMode="decimal"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 8 }}>Categoría</label>
                  <div className="grid grid-cols-4 gap-2">
                    {filteredCats.map(cat => (
                      <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                        className="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all"
                        style={{
                          background: category === cat.id ? `${cat.color}18` : '#F9FAFB',
                          border: `1.5px solid ${category === cat.id ? cat.color : '#E5E7EB'}`,
                        }}>
                        <span style={{ fontSize: 22 }}>{cat.icon}</span>
                        <span style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.2, textAlign: 'center' }}>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Descripción (opcional)</label>
                  <input className="input-field" placeholder="¿En qué fue?" value={note} onChange={e => setNote(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Fecha</label>
                  <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </form>
            </div>

            <div className="px-6 py-4" style={{ borderTop: '1px solid #F3F4F6' }}>
              {saveError && <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 12, fontWeight: 600 }}>{saveError}</p>}
              <button form="txn-form" type="submit" disabled={saving} className="btn-primary"
                style={{ background: type === 'income' ? '#22C55E' : '#EF4444', boxShadow: `0 4px 14px ${type === 'income' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}` }}>
                {saving ? 'Guardando...' : `Guardar ${type === 'income' ? 'ingreso' : 'gasto'} ⚡ +10 XP`}
              </button>
            </div>
          </div>
        </div>
      )}

      {xpFlash && <div className="xp-float">⚡ +10 XP ¡Guardado!</div>}
      <BottomNav />
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
        <p style={{ color: '#22C55E', fontWeight: 700 }} className="animate-pulse">Cargando movimientos...</p>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  )
}
