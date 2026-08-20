'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getGoals, addGoal, updateGoal, deleteGoal, getProfile, updateProfile } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { ChevronLeft, Plus, X, Mountain, Trash2, Sword } from 'lucide-react'

// Mountain SVG visual
function MountainVisual({ pct }) {
  return (
    <svg viewBox="0 0 260 120" style={{ width: '100%', maxWidth: 260, height: 120 }}>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>
        <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </linearGradient>
        <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3F4F6" />
        </linearGradient>
        <linearGradient id="progress-green" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="260" height="120" fill="url(#sky)" />
      {/* Main mountain */}
      <polygon points="130,8 30,110 230,110" fill="url(#mountain)" />
      {/* Snow cap */}
      <polygon points="130,8 100,45 160,45" fill="url(#snow)" />
      {/* Ground */}
      <rect x="0" y="108" width="260" height="12" fill="#D1FAE5" rx="4"/>
      {/* Progress path */}
      {pct > 0 && (
        <line x1="130" y1="110" x2={130 - (100 * Math.min(pct, 1))} y2={110 - (102 * Math.min(pct, 1))}
          stroke="url(#progress-green)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3" />
      )}
      {/* Character at progress point */}
      <text
        x={130 - (100 * Math.min(pct, 0.98)) + (pct > 0 ? -5 : 0)}
        y={110 - (102 * Math.min(pct, 0.98)) + 4}
        fontSize="14" textAnchor="middle">
        🧗
      </text>
      {/* Flag at top */}
      <text x="130" y="18" fontSize="12" textAnchor="middle">🚩</text>
    </svg>
  )
}

export default function GoalsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [goals, setGoals] = useState([])
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmt, setDepositAmt] = useState('')
  const [savingDeposit, setSavingDeposit] = useState(false)
  const [xpFlash, setXpFlash] = useState(false)

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
      const { data } = await getGoals(u.id)
      const gs = data || []
      setGoals(gs)
      if (gs.length > 0) setSelectedGoal(gs[0])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleAddGoal(e) {
    e.preventDefault()
    if (!name || !targetAmount) return
    setSavingGoal(true)
    const { data } = await addGoal({
      user_id: userId,
      name, emoji,
      target_amount: Number(targetAmount),
      current_amount: 0,
      deadline: deadline || null,
    })
    if (data && data[0]) {
      const newGoals = [data[0], ...goals]
      setGoals(newGoals)
      setSelectedGoal(data[0])
      setName(''); setEmoji('🎯'); setTargetAmount(''); setDeadline('')
      setShowForm(false)
    }
    setSavingGoal(false)
  }

  async function handleDeposit() {
    if (!depositAmt || !selectedGoal) return
    setSavingDeposit(true)
    const newAmount = (selectedGoal.current_amount || 0) + Number(depositAmt)
    const { data } = await updateGoal(selectedGoal.id, { current_amount: newAmount })
    if (data && data[0]) {
      const updated = data[0]
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))
      setSelectedGoal(updated)
      const { data: profile } = await getProfile(userId)
      if (profile) await updateProfile(userId, { xp: (profile.xp || 0) + 25 })
      setXpFlash(true)
      setTimeout(() => setXpFlash(false), 1400)
    }
    setDepositAmt('')
    setShowDeposit(false)
    setSavingDeposit(false)
  }

  const goal = selectedGoal
  const pct = goal ? Math.min(1, (goal.current_amount || 0) / goal.target_amount) : 0
  const pctDisplay = Math.round(pct * 100)

  const monthlyNeeded = goal && goal.deadline
    ? (() => {
        const months = Math.max(1, Math.round((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)))
        return Math.ceil(((goal.target_amount || 0) - (goal.current_amount || 0)) / months)
      })()
    : null

  const EMOJIS = ['🎯','🏠','🚗','✈️','💍','🎓','💻','🏖️','🐶','💪','🏋️','🎸']

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
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>Savings Mountain</h1>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Tu camino al pico financiero</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#D1FAE5' }}>
            <Plus size={18} color="#047857" />
          </button>
        </div>

        {/* Goal selector */}
        {goals.length > 1 && (
          <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
            {goals.map(g => (
              <button key={g.id} onClick={() => setSelectedGoal(g)}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: selectedGoal?.id === g.id ? '#059669' : '#F3F4F6',
                  color: selectedGoal?.id === g.id ? '#FFFFFF' : '#374151',
                }}>
                {g.emoji} {g.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p style={{ color: '#059669', fontWeight: 700 }} className="animate-pulse">Cargando tus metas...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="px-5 mt-10 text-center">
          <Mountain size={64} color="#D1D5DB" className="mx-auto mb-4" />
          <p style={{ fontSize: 18, fontWeight: 800, color: '#374151' }}>Sin metas aún</p>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8, marginBottom: 24 }}>
            Crea tu primera meta y empieza a escalar la montaña
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary" style={{ maxWidth: 240, margin: '0 auto' }}>
            + Crear primera meta
          </button>
        </div>
      ) : goal && (
        <div className="px-5 mt-5 space-y-4">

          {/* Mountain visual */}
          <div className="card-lg text-center">
            <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              {goal.emoji} {goal.name}
            </p>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              Meta: {formatCurrency(goal.target_amount)}
            </p>
            <MountainVisual pct={pct} />
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: 22, fontWeight: 900, color: '#047857' }}>{formatCurrency(goal.current_amount || 0)}</span>
                <span style={{ fontSize: 13, color: '#6B7280' }}>de {formatCurrency(goal.target_amount)}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill"
                  style={{ width: `${pctDisplay}%`, background: 'linear-gradient(90deg, #059669, #047857)' }} />
              </div>
              <p style={{ fontSize: 13, color: '#047857', fontWeight: 700, marginTop: 6 }}>{pctDisplay}% completado</p>
            </div>
          </div>

          {/* Monthly tip */}
          {monthlyNeeded && goal.current_amount < goal.target_amount && (
            <div className="card" style={{ background: '#EDE9FE', border: '1.5px solid #C4B5FD' }}>
              <p style={{ fontSize: 13, color: '#5B21B6', lineHeight: 1.5 }}>
                💡 Si ahorras <strong>{formatCurrency(monthlyNeeded)}</strong>/mes,
                alcanzarás tu meta antes de la fecha límite.
              </p>
            </div>
          )}

          {goal.current_amount >= goal.target_amount && (
            <div className="card text-center" style={{ background: '#D1FAE5', border: '2px solid #059669' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🏆</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#047857' }}>¡Meta alcanzada!</p>
              <p style={{ fontSize: 13, color: '#15803D', marginTop: 4 }}>Subiste a la cima. ¡Sigue escalando!</p>
            </div>
          )}

          {/* Deposit button */}
          {goal.current_amount < goal.target_amount && (
            <button onClick={() => setShowDeposit(true)} className="btn-primary">
              💰 Agregar ahorro — +25 XP
            </button>
          )}

          {/* Delete */}
          <button
            onClick={async () => {
              await deleteGoal(goal.id)
              const remaining = goals.filter(g => g.id !== goal.id)
              setGoals(remaining)
              setSelectedGoal(remaining[0] || null)
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{ color: '#EF4444', background: '#FEF2F2' }}>
            <Trash2 size={15} />
            Eliminar meta
          </button>

          {/* Debt Dungeon link */}
          <Link href="/debt-dungeon">
            <div className="card flex items-center gap-3" style={{ border: '1.5px solid #FEE2E2', background: '#FFF5F5' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#FEE2E2' }}>
                🐉
              </div>
              <div className="flex-1">
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Debt Dungeon</p>
                <p style={{ fontSize: 12, color: '#6B7280' }}>Derrota tus deudas como jefes finales</p>
              </div>
              <Sword size={18} color="#EF4444" />
            </div>
          </Link>
        </div>
      )}

      {/* Add deposit modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeposit(false)} />
          <div className="relative w-full rounded-t-3xl" style={{ background: '#FFFFFF', padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Agregar ahorro</h2>
              <button onClick={() => setShowDeposit(false)}><X size={20} color="#6B7280" /></button>
            </div>
            <input
              className="input-field"
              style={{ fontSize: 28, fontWeight: 800, color: '#047857', marginBottom: 16 }}
              type="number" placeholder="0.00"
              value={depositAmt}
              onChange={e => setDepositAmt(e.target.value)}
              inputMode="decimal"
            />
            <button onClick={handleDeposit} disabled={savingDeposit || !depositAmt} className="btn-primary">
              {savingDeposit ? 'Guardando...' : '💰 Guardar ahorro — +25 XP'}
            </button>
          </div>
        </div>
      )}

      {/* Add goal modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full rounded-t-3xl" style={{ background: '#FFFFFF', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Nueva meta</h2>
              <button onClick={() => setShowForm(false)}><X size={20} color="#6B7280" /></button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              <form id="goal-form" onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Emoji</label>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => setEmoji(e)}
                        className="text-2xl p-2 rounded-xl transition-all"
                        style={{ background: emoji === e ? '#D1FAE5' : '#F3F4F6', border: `2px solid ${emoji === e ? '#059669' : 'transparent'}` }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nombre de la meta</label>
                  <input className="input-field" placeholder="Ej: Vacaciones a París" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Monto objetivo</label>
                  <input className="input-field" type="number" placeholder="0.00" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} inputMode="decimal" required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Fecha límite (opcional)</label>
                  <input className="input-field" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
              </form>
            </div>
            <div className="px-6 py-4" style={{ borderTop: '1px solid #F3F4F6' }}>
              <button form="goal-form" type="submit" disabled={savingGoal} className="btn-primary">
                {savingGoal ? 'Creando...' : '🏔️ Crear meta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {xpFlash && <div className="xp-float">⚡ +25 XP ¡Buen ahorro!</div>}
      <BottomNav />
    </div>
  )
}
