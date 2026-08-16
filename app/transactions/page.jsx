'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUser, getTransactions, addTransaction, deleteTransaction, updateProfile, getProfile } from '@/lib/supabase'
import { CATEGORIES, formatCurrency, getCurrentMonth } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import TransactionCard from '@/components/ui/TransactionCard'
import { X, ChevronDown } from 'lucide-react'

function TransactionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'expense'

  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(!!searchParams.get('type'))

  // Form state
  const [type, setType] = useState(defaultType)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const currentMonth = getCurrentMonth()

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data } = await getTransactions(u.id, currentMonth)
      setTransactions(data || [])
      setLoading(false)
    }
    load()
  }, [router, currentMonth])

  async function handleAdd(e) {
    e.preventDefault()
    if (!amount || isNaN(amount) || Number(amount) <= 0) return
    setSaving(true)

    const { data } = await addTransaction({
      user_id: user.id,
      type,
      amount: Number(amount),
      category,
      note,
      date,
    })

    if (data) {
      const { data: profile } = await getProfile(user.id)
      if (profile) {
        await updateProfile(user.id, { xp: (profile.xp || 0) + 10 })
      }
      setTransactions(prev => [data[0], ...prev])
      setAmount('')
      setNote('')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    await deleteTransaction(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const incomeCategories = ['salary', 'freelance', 'other']
  const expenseCategories = CATEGORIES.filter(c => !incomeCategories.includes(c.id))
  const filteredCats = type === 'income'
    ? CATEGORIES.filter(c => incomeCategories.includes(c.id))
    : expenseCategories

  return (
    <div className="min-h-screen bg-brand-dark pb-24 safe-top page-transition">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-gray-900 text-xl font-black mb-4">Transacciones</h1>

        {/* Summary pills */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)' }}>
            <p className="text-brand-muted text-xs mb-0.5">Ingresos</p>
            <p className="text-brand-green font-bold">{formatCurrency(income)}</p>
          </div>
          <div className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-brand-muted text-xs mb-0.5">Gastos</p>
            <p className="text-red-500 font-bold">{formatCurrency(expense)}</p>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="px-5">
        {loading ? (
          <p className="text-brand-muted text-center py-8">Cargando...</p>
        ) : transactions.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-gray-800 font-semibold">Sin movimientos este mes</p>
            <p className="text-brand-muted text-sm mt-1">Agrega tu primer ingreso o gasto</p>
          </div>
        ) : (
          transactions.map(t => (
            <TransactionCard key={t.id} transaction={t} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
        style={{ background: '#00C896', boxShadow: '0 4px 16px rgba(0,200,150,0.4)' }}>
        <span className="text-2xl font-bold text-white leading-none">+</span>
      </button>

      {/* Add Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full rounded-t-3xl flex flex-col"
            style={{ background: '#FFFFFF', maxHeight: '92vh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 0px)' }}>

            {/* Modal header - always visible */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3"
              style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h2 className="text-gray-900 text-lg font-bold">Agregar movimiento</h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#F1F5F9' }}>
                <X size={18} color="#6B7280" />
              </button>
            </div>

            {/* Scrollable form content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Type toggle */}
              <div className="flex rounded-xl p-1 mb-5" style={{ background: '#F1F5F9' }}>
                {['expense', 'income'].map(t => (
                  <button key={t}
                    onClick={() => { setType(t); setCategory(t === 'income' ? 'salary' : 'food') }}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: type === t ? (t === 'income' ? '#00C896' : '#EF4444') : 'transparent',
                      color: type === t ? '#FFFFFF' : '#6B7280',
                    }}>
                    {t === 'income' ? '+ Ingreso' : '- Gasto'}
                  </button>
                ))}
              </div>

              <form id="add-txn-form" onSubmit={handleAdd} className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Monto</label>
                  <input
                    className="input-dark text-2xl font-bold"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    inputMode="decimal"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-brand-muted text-sm mb-2 block">Categoría</label>
                  <div className="grid grid-cols-4 gap-2">
                    {filteredCats.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                        style={{
                          background: category === cat.id ? `${cat.color}15` : '#F8FAFC',
                          borderColor: category === cat.id ? cat.color : '#E2E8F0',
                        }}>
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-xs text-brand-muted truncate w-full text-center">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Nota (opcional)</label>
                  <input
                    className="input-dark"
                    placeholder="¿En qué gastaste?"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Fecha</label>
                  <input
                    className="input-dark"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Sticky save button - always visible at bottom */}
            <div className="px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}>
              <button
                form="add-txn-form"
                type="submit"
                disabled={saving}
                className="btn-primary">
                {saving ? 'Guardando...' : `Guardar ${type === 'income' ? 'ingreso' : 'gasto'} +10 XP`}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-dark flex items-center justify-center"><p className="text-brand-green">Cargando...</p></div>}>
      <TransactionsContent />
    </Suspense>
  )
}
