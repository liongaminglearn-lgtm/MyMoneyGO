'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getDebts, addDebt, makeDebtPayment, deleteDebt } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { ChevronLeft, Plus, X, Trash2 } from 'lucide-react'

const BOSS_OPTIONS = [
  { emoji: '🐉', name: 'Dragón de Visa',     danger: 'ALTO' },
  { emoji: '🧟', name: 'Zombie de Tarjeta',   danger: 'MEDIO' },
  { emoji: '👹', name: 'Demonio de Préstamo', danger: 'ALTO' },
  { emoji: '🦇', name: 'Vampiro de Interés',  danger: 'EXTREMO' },
  { emoji: '💀', name: 'Calavera Hipotecaria', danger: 'EXTREMO' },
  { emoji: '🤖', name: 'Titán Bancario',      danger: 'MEDIO' },
]

const DANGER_COLOR = { EXTREMO: '#DC2626', ALTO: '#F97316', MEDIO: '#EAB308' }

export default function DebtDungeonPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [debts, setDebts] = useState([])
  const [selectedDebt, setSelectedDebt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [attacking, setAttacking] = useState(false)
  const [xpFlash, setXpFlash] = useState('')
  const [shakeAnim, setShakeAnim] = useState(false)

  // Add form
  const [dName, setDName] = useState('')
  const [dBalance, setDBalance] = useState('')
  const [dApr, setDApr] = useState('')
  const [dMinPay, setDMinPay] = useState('')
  const [dBoss, setDBoss] = useState(0)
  const [savingDebt, setSavingDebt] = useState(false)

  // Payment
  const [payAmt, setPayAmt] = useState('')
  const [showCustomPay, setShowCustomPay] = useState(false)

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
      const { data } = await getDebts(u.id)
      const ds = data || []
      setDebts(ds)
      if (ds.length > 0) setSelectedDebt(ds[0])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleAddDebt(e) {
    e.preventDefault()
    if (!dName || !dBalance) return
    setSavingDebt(true)
    const boss = BOSS_OPTIONS[dBoss]
    const { data } = await addDebt({
      user_id: userId,
      name: dName,
      balance: Number(dBalance),
      original_balance: Number(dBalance),
      apr: Number(dApr) || 0,
      minimum_payment: Number(dMinPay) || 0,
      boss_name: boss.name,
      boss_emoji: boss.emoji,
    })
    if (data && data[0]) {
      const newDebts = [data[0], ...debts]
      setDebts(newDebts)
      setSelectedDebt(data[0])
      setDName(''); setDBalance(''); setDApr(''); setDMinPay('')
      setShowAddForm(false)
    }
    setSavingDebt(false)
  }

  async function handleAttack(amount) {
    if (!selectedDebt || attacking || amount <= 0) return
    setAttacking(true)
    setShakeAnim(true)
    setTimeout(() => setShakeAnim(false), 600)

    const { data, newBalance } = await makeDebtPayment(selectedDebt.id, userId, amount)
    if (data && data[0]) {
      const updated = data[0]
      setDebts(prev => prev.map(d => d.id === updated.id ? updated : d))
      setSelectedDebt(updated)
      setXpFlash(`⚔️ ¡Golpe! +25 XP`)
      setTimeout(() => setXpFlash(''), 1500)
      if (newBalance <= 0) {
        setXpFlash('🏆 ¡JEFE DERROTADO! +100 XP')
        setTimeout(() => setXpFlash(''), 3000)
      }
    }
    setPayAmt('')
    setShowCustomPay(false)
    setAttacking(false)
  }

  const debt = selectedDebt
  const hpPct = debt
    ? Math.max(0, (debt.balance / debt.original_balance) * 100)
    : 100
  const boss = debt
    ? BOSS_OPTIONS.find(b => b.name === debt.boss_name) || BOSS_OPTIONS[0]
    : null
  const dangerColor = boss ? (DANGER_COLOR[boss.danger] || '#F97316') : '#F97316'
  const isDefeated = debt && debt.balance <= 0

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#1A1025' }}>

      {/* Dark dungeon header */}
      <div style={{ background: 'linear-gradient(180deg, #1A1025, #2D1B69)', paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="px-5 pt-2 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <ChevronLeft size={20} color="#FFFFFF" />
                </div>
              </Link>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>⚔️ Debt Dungeon</h1>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Derrota tus deudas</p>
              </div>
            </div>
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
              <Plus size={14} />
              Jefe
            </button>
          </div>

          {/* Debt selector tabs */}
          {debts.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {debts.map(d => (
                <button key={d.id}
                  onClick={() => setSelectedDebt(d)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: selectedDebt?.id === d.id ? '#EF4444' : 'rgba(255,255,255,0.1)',
                    color: selectedDebt?.id === d.id ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                  }}>
                  {d.boss_emoji} {d.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p style={{ color: '#A78BFA', fontWeight: 700 }} className="animate-pulse">Cargando enemigos...</p>
        </div>
      ) : debts.length === 0 ? (
        <div className="px-5 mt-10 text-center">
          <p style={{ fontSize: 60, marginBottom: 16 }}>🗡️</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>¡Mazmorra despejada!</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 24 }}>
            No tienes deudas registradas.<br />Si tienes alguna, agrégala para combatirla.
          </p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary mx-auto" style={{ maxWidth: 240 }}>
            + Agregar deuda
          </button>
        </div>
      ) : debt && (
        <div className="px-5 mt-5 space-y-4">

          {/* Boss card */}
          <div className="card-lg" style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(45,27,105,0.6))',
            border: `1.5px solid ${dangerColor}40`,
          }}>
            {/* Danger badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="chip" style={{ background: `${dangerColor}20`, color: dangerColor }}>
                ⚠️ Peligro: {boss?.danger}
              </span>
              {debt.apr > 0 && (
                <span className="chip chip-purple">APR {debt.apr}%</span>
              )}
            </div>

            {/* Boss emoji with shake animation */}
            <div className="text-center mb-4">
              <div style={{
                fontSize: 80,
                lineHeight: 1,
                filter: isDefeated ? 'grayscale(1) opacity(0.5)' : 'none',
                animation: shakeAnim ? 'shake 0.5s ease' : 'none',
                display: 'inline-block',
              }}>
                {isDefeated ? '💀' : debt.boss_emoji}
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginTop: 8 }}>
                {isDefeated ? '¡Derrotado!' : debt.boss_name}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{debt.name}</p>
            </div>

            {/* HP Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: 13, color: dangerColor, fontWeight: 700 }}>❤️ HP</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
                  {formatCurrency(debt.balance)} / {formatCurrency(debt.original_balance)}
                </span>
              </div>
              <div style={{ height: 14, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${hpPct}%`,
                  background: hpPct > 60 ? '#EF4444' : hpPct > 30 ? '#F97316' : '#22C55E',
                  borderRadius: 99,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' }}>
                {Math.round(hpPct)}% de vida restante
              </p>
            </div>
          </div>

          {/* Attack buttons */}
          {!isDefeated ? (
            <div className="card-lg" style={{ background: '#1F1535', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#A78BFA', marginBottom: 12 }}>⚔️ Elige tu ataque:</p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: '$50',  amt: 50  },
                  { label: '$100', amt: 100 },
                  { label: '$200', amt: 200 },
                ].map(a => (
                  <button key={a.label}
                    onClick={() => handleAttack(a.amt)}
                    disabled={attacking}
                    className="py-3 rounded-2xl font-bold text-sm transition-all"
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: '1.5px solid rgba(239,68,68,0.4)',
                      color: '#FCA5A5',
                    }}>
                    {a.label}
                  </button>
                ))}
              </div>

              {!showCustomPay ? (
                <button onClick={() => setShowCustomPay(true)}
                  className="w-full py-2.5 rounded-2xl font-semibold text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                  Otro monto
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Monto"
                    value={payAmt}
                    onChange={e => setPayAmt(e.target.value)}
                    className="flex-1 rounded-2xl px-4 py-2.5 font-bold text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)', outline: 'none' }}
                    inputMode="decimal"
                  />
                  <button
                    onClick={() => handleAttack(Number(payAmt))}
                    disabled={attacking || !payAmt}
                    className="px-5 py-2.5 rounded-2xl font-bold text-sm"
                    style={{ background: '#EF4444', color: '#FFFFFF' }}>
                    ⚔️
                  </button>
                </div>
              )}

              <button
                onClick={() => handleAttack(debt.minimum_payment || 50)}
                disabled={attacking}
                className="w-full mt-3 py-3.5 rounded-2xl font-bold text-base"
                style={{ background: '#EF4444', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}>
                {attacking ? '⚔️ Atacando...' : `⚔️ ATACAR — +25 XP`}
              </button>
            </div>
          ) : (
            <div className="card-lg text-center" style={{ background: '#0F2A1A', border: '2px solid #22C55E' }}>
              <p style={{ fontSize: 48, marginBottom: 8 }}>🏆</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#22C55E' }}>¡Jefe Derrotado!</p>
              <p style={{ fontSize: 14, color: '#86EFAC', marginTop: 4 }}>Has eliminado esta deuda completamente</p>
            </div>
          )}

          {/* Tip */}
          {debt.apr > 0 && !isDefeated && (
            <div className="card" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <p style={{ fontSize: 13, color: '#C4B5FD', lineHeight: 1.5 }}>
                💡 Con {debt.apr}% APR, cada mes que pases es dinero extra al enemigo.
                ¡Ataca con fuerza para derrotarlo más rápido!
              </p>
            </div>
          )}

          {/* Delete */}
          <button
            onClick={async () => {
              await deleteDebt(debt.id)
              const remaining = debts.filter(d => d.id !== debt.id)
              setDebts(remaining)
              setSelectedDebt(remaining[0] || null)
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{ color: '#9CA3AF', background: 'rgba(255,255,255,0.05)' }}>
            <Trash2 size={14} />
            Eliminar deuda
          </button>
        </div>
      )}

      {/* Add Debt Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full rounded-t-3xl flex flex-col" style={{ background: '#1A1025', maxHeight: '92vh' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Nueva deuda</h2>
              <button onClick={() => setShowAddForm(false)}><X size={20} color="#9CA3AF" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form id="debt-form" onSubmit={handleAddDebt} className="space-y-4">
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nombre</label>
                  <input className="input-field" placeholder="Ej: Tarjeta Visa" value={dName} onChange={e => setDName(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.15)' }} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: 6 }}>Saldo actual</label>
                  <input className="input-field" type="number" placeholder="0.00" value={dBalance} onChange={e => setDBalance(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.15)' }}
                    inputMode="decimal" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: 6 }}>APR %</label>
                    <input className="input-field" type="number" placeholder="0" value={dApr} onChange={e => setDApr(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.15)' }}
                      inputMode="decimal" />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: 6 }}>Pago mínimo</label>
                    <input className="input-field" type="number" placeholder="0" value={dMinPay} onChange={e => setDMinPay(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.15)' }}
                      inputMode="decimal" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, display: 'block', marginBottom: 8 }}>Tipo de jefe</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BOSS_OPTIONS.map((b, i) => (
                      <button key={i} type="button" onClick={() => setDBoss(i)}
                        className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all"
                        style={{
                          background: dBoss === i ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1.5px solid ${dBoss === i ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                        }}>
                        <span style={{ fontSize: 26 }}>{b.emoji}</span>
                        <span style={{ fontSize: 9, color: dBoss === i ? '#FCA5A5' : '#9CA3AF', textAlign: 'center', lineHeight: 1.3 }}>{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button form="debt-form" type="submit" disabled={savingDebt} className="btn-primary"
                style={{ background: '#EF4444', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}>
                {savingDebt ? 'Creando...' : '⚔️ Invocar al jefe'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`}</style>
      {xpFlash && <div className="xp-float" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>{xpFlash}</div>}
      <BottomNav />
    </div>
  )
}
