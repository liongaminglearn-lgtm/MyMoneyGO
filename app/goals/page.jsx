'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getGoals, addGoal, updateGoal } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { X, Target, Plus } from 'lucide-react'

export default function GoalsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAdd, setShowAdd] = useState(null)

  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [deadline, setDeadline] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const EMOJIS = ['🎯', '🏠', '✈️', '🚗', '📱', '💻', '👶', '🎓', '💍', '🏖️', '🏋️', '💰']

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data } = await getGoals(u.id)
      setGoals(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleAddGoal(e) {
    e.preventDefault()
    setSaving(true)
    const { data } = await addGoal({
      user_id: user.id,
      name,
      emoji,
      target_amount: Number(target),
      current_amount: 0,
      deadline: deadline || null,
    })
    if (data) {
      setGoals(prev => [data[0], ...prev])
      setName(''); setTarget(''); setDeadline(''); setEmoji('🎯')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleAddAmount(goalId) {
    if (!addAmount || isNaN(addAmount)) return
    const goal = goals.find(g => g.id === goalId)
    const newAmount = (goal.current_amount || 0) + Number(addAmount)
    const { data } = await updateGoal(goalId, { current_amount: newAmount })
    if (data) {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount } : g))
      setAddAmount('')
      setShowAdd(null)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark pb-24 safe-top page-transition">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-gray-900 text-xl font-black">Metas de Ahorro</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(0,200,150,0.1)', color: '#00C896' }}>
            <Plus size={16} /> Nueva
          </button>
        </div>

        {loading ? (
          <p className="text-brand-muted text-center py-10">Cargando tus metas...</p>
        ) : goals.length === 0 ? (
          <div className="card text-center py-12" style={{ border: '1.5px dashed rgba(0,200,150,0.35)' }}>
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-800 font-semibold">Misión: primera meta</p>
            <p className="text-brand-muted text-sm mt-1">
              Crea tu primer objetivo de ahorro<br />
              y desbloquea el logro "Meta creada" 🏆
            </p>
            <button onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-2 rounded-xl font-semibold text-sm"
              style={{ background: '#00C896', color: '#FFFFFF' }}>
              Crear primera meta →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const progress = goal.target_amount > 0
                ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                : 0
              const completed = progress >= 100
              return (
                <div key={goal.id} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <p className="text-gray-900 font-bold">{goal.name}</p>
                        {goal.deadline && (
                          <p className="text-brand-muted text-xs">
                            Plazo: {new Date(goal.deadline).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    {completed && <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(234,179,8,0.12)', color: '#CA8A04' }}>¡Logrado! 🏆</span>}
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 rounded-full mb-2" style={{ background: '#E2E8F0' }}>
                    <div className="h-2.5 rounded-full transition-all duration-700"
                      style={{
                        width: `${progress}%`,
                        background: completed
                          ? 'linear-gradient(90deg, #EAB308, #F59E0B)'
                          : 'linear-gradient(90deg, #00C896, #00E5B0)'
                      }} />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-800 font-bold text-sm">
                      {formatCurrency(goal.current_amount || 0)}
                      <span className="text-brand-muted font-normal"> / {formatCurrency(goal.target_amount)}</span>
                    </span>
                    <span className="text-brand-green text-sm font-bold">{progress}%</span>
                  </div>

                  {!completed && (
                    showAdd === goal.id ? (
                      <div className="flex gap-2">
                        <input
                          className="input-dark flex-1 py-2"
                          type="number"
                          placeholder="¿Cuánto abonas?"
                          value={addAmount}
                          onChange={e => setAddAmount(e.target.value)}
                          inputMode="decimal"
                          autoFocus
                        />
                        <button onClick={() => handleAddAmount(goal.id)}
                          className="px-4 py-2 rounded-xl font-semibold text-sm"
                          style={{ background: '#00C896', color: '#FFFFFF' }}>
                          Abonar
                        </button>
                        <button onClick={() => setShowAdd(null)}
                          className="px-3 py-2 rounded-xl"
                          style={{ background: '#F1F5F9' }}>
                          <X size={16} color="#6B7280" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowAdd(goal.id)}
                        className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(0,200,150,0.08)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }}>
                        + Abonar
                      </button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full rounded-t-3xl flex flex-col"
            style={{ background: '#FFFFFF', maxHeight: '92vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3"
              style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h2 className="text-gray-900 text-lg font-bold">Nueva meta</h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#F1F5F9' }}>
                <X size={18} color="#6B7280" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form id="add-goal-form" onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label className="text-brand-muted text-sm mb-2 block">Elige un emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button key={e} type="button"
                        onClick={() => setEmoji(e)}
                        className="w-10 h-10 rounded-xl text-xl transition-all"
                        style={{
                          background: emoji === e ? 'rgba(0,200,150,0.12)' : '#F8FAFC',
                          border: `1px solid ${emoji === e ? '#00C896' : '#E2E8F0'}`
                        }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Nombre de la meta</label>
                  <input className="input-dark" placeholder="Ej: Vacaciones en Cartagena"
                    value={name} onChange={e => setName(e.target.value)} required />
                </div>

                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Monto objetivo</label>
                  <input className="input-dark" type="number" placeholder="$0"
                    value={target} onChange={e => setTarget(e.target.value)}
                    inputMode="decimal" required />
                </div>

                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Fecha límite (opcional)</label>
                  <input className="input-dark" type="date"
                    value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
              </form>
            </div>

            {/* Sticky save button */}
            <div className="px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}>
              <button form="add-goal-form" className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear meta 🎯'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
