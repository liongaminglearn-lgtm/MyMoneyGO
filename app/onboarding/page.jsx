'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getProfile, updateProfile, addDebt } from '@/lib/supabase'
import CompanionAvatar, { COMPANIONS } from '@/components/ui/CompanionAvatar'
import { ChevronRight, Check } from 'lucide-react'

const STEPS = ['welcome', 'companion', 'finances', 'goal', 'done']

const GOALS = [
  { id: 'budget',   emoji: '📊', title: 'Controlar mi presupuesto',  desc: 'Saber exactamente en qué gasto cada mes' },
  { id: 'debt',     emoji: '⚔️', title: 'Eliminar mis deudas',        desc: 'Derrotar mis deudas como jefes finales' },
  { id: 'savings',  emoji: '🏔️', title: 'Ahorrar más dinero',         desc: 'Construir mi fondo de emergencia y metas' },
  { id: 'control',  emoji: '🎯', title: 'Organizar mis finanzas',     desc: 'Tener claridad total de mis ingresos y gastos' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId]               = useState(null)
  const [step, setStep]                   = useState(0)
  const [selectedCompanion, setSelectedCompanion] = useState('nova')
  const [income, setIncome]               = useState('')
  const [fixedExpenses, setFixedExpenses] = useState('')
  const [hasDebts, setHasDebts]           = useState(null)
  const [debtName, setDebtName]           = useState('')
  const [debtBalance, setDebtBalance]     = useState('')
  const [hasSavings, setHasSavings]       = useState(null)
  const [savingsAmount, setSavingsAmount] = useState('')
  const [selectedGoal, setSelectedGoal]   = useState('budget')
  const [saving, setSaving]               = useState(false)

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      const { data: prof } = await getProfile(u.id)
      if (prof?.onboarding_complete) { router.push('/dashboard'); return }
      setUserId(u.id)
    }
    load()
  }, [router])

  async function handleFinish() {
    if (!userId) return
    setSaving(true)
    await updateProfile(userId, {
      companion_id:        selectedCompanion,
      monthly_income:      Number(income) || 0,
      primary_goal:        selectedGoal,
      onboarding_complete: true,
      xp:                  50,
      coins:               100,
    })
    if (hasDebts && debtName && debtBalance) {
      await addDebt({
        user_id:           userId,
        name:              debtName,
        balance:           Number(debtBalance),
        original_balance:  Number(debtBalance),
        apr:               18,
        minimum_payment:   Math.round(Number(debtBalance) * 0.03),
        boss_emoji:        '🐉',
        boss_name:         debtName,
      })
    }
    router.push('/dashboard')
  }

  const currentStep = STEPS[step]
  const totalDots   = STEPS.length - 2  // exclude welcome and done
  const dotIndex    = step - 1

  function ProgressDots() {
    return (
      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: totalDots }).map((_, i) => (
          <div key={i} style={{
            width: i === dotIndex ? 24 : 8,
            height: 8,
            borderRadius: 99,
            background: i <= dotIndex ? '#22C55E' : '#E5E7EB',
            transition: 'width 0.3s',
          }} />
        ))}
      </div>
    )
  }

  // ── S1: Bienvenida ──
  if (currentStep === 'welcome') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(160deg, #16A34A 0%, #22C55E 40%, #4ADE80 100%)' }}>
      <div className="mb-6">
        <div className="text-7xl mb-4" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>🎮</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', letterSpacing: -1, lineHeight: 1.1 }}>MONEY GO</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8, lineHeight: 1.6 }}>
          Convierte tus finanzas en una<br />aventura épica. ¡Sube de nivel!
        </p>
      </div>
      <div className="w-full max-w-sm space-y-3 mt-4">
        {[
          { icon: '⚔️', text: 'Derrota deudas como jefes finales' },
          { icon: '🏔️', text: 'Escala la Savings Mountain' },
          { icon: '⚡', text: 'Gana XP y sube de nivel' },
          { icon: '🦊', text: 'Tu compañero te guía en cada paso' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 600 }}>{item.text}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setStep(1)}
        className="mt-10 w-full max-w-sm flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg"
        style={{ background: '#FFFFFF', color: '#16A34A', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        ¡Comenzar aventura! <ChevronRight size={22} />
      </button>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 16 }}>
        ¡50 XP de bienvenida te esperan!
      </p>
    </div>
  )

  // ── S2: Elegir compañero ──
  if (currentStep === 'companion') return (
    <div className="min-h-screen flex flex-col px-6 py-12" style={{ background: '#F9FAFB' }}>
      <ProgressDots />
      <div className="text-center mb-8">
        <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Paso 1 de 3</p>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', marginTop: 4 }}>Elige tu compañero</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>Tu aliado en cada decisión financiera</p>
      </div>
      <div className="space-y-3 flex-1">
        {Object.entries(COMPANIONS).map(([id, c]) => {
          const isSelected = selectedCompanion === id
          return (
            <button key={id} onClick={() => setSelectedCompanion(id)} className="w-full text-left" style={{ display: 'block' }}>
              <div className="rounded-3xl p-4 transition-all" style={{
                background: isSelected ? `${c.color}10` : '#FFFFFF',
                border: `2px solid ${isSelected ? c.color : '#E5E7EB'}`,
                boxShadow: isSelected ? `0 4px 20px ${c.color}25` : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div className="flex items-center gap-4">
                  <CompanionAvatar companionId={id} size={64} showGlow={isSelected} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{c.name}</p>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: c.color }}>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: c.color, fontWeight: 700 }}>{c.specialty}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.4 }}>{c.desc}</p>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <button onClick={() => setStep(2)} className="btn-primary mt-6"
        style={{ background: COMPANIONS[selectedCompanion]?.color || '#22C55E' }}>
        Continuar con {COMPANIONS[selectedCompanion]?.name} →
      </button>
    </div>
  )

  // ── S3: Situación financiera ──
  if (currentStep === 'finances') return (
    <div className="min-h-screen flex flex-col px-6 py-12 pb-8" style={{ background: '#F9FAFB' }}>
      <ProgressDots />
      <div className="text-center mb-6">
        <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Paso 2 de 3</p>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginTop: 4 }}>Tu situación financiera</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Calcularemos tu foto financiera inicial</p>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Ingreso */}
        <div className="card-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#DCFCE7' }}>💰</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Ingreso mensual</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Salario, freelance, etc.</p>
            </div>
          </div>
          <input
            type="number" inputMode="decimal" placeholder="$0"
            value={income} onChange={e => setIncome(e.target.value)}
            className="input-dark" />
        </div>

        {/* Gastos fijos */}
        <div className="card-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#FEE2E2' }}>🏠</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Gastos fijos mensuales</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Arriendo, servicios, etc.</p>
            </div>
          </div>
          <input
            type="number" inputMode="decimal" placeholder="$0"
            value={fixedExpenses} onChange={e => setFixedExpenses(e.target.value)}
            className="input-dark" />
        </div>

        {/* ¿Tienes deudas? */}
        <div className="card-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#FEF3C7' }}>⚔️</div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>¿Tienes deudas activas?</p>
          </div>
          <div className="flex gap-3 mb-3">
            {[{ val: true, label: 'Sí, tengo deudas' }, { val: false, label: 'No, estoy libre' }].map(o => (
              <button key={String(o.val)} onClick={() => setHasDebts(o.val)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                style={{
                  background: hasDebts === o.val ? '#FEF3C7' : '#F3F4F6',
                  color: hasDebts === o.val ? '#D97706' : '#6B7280',
                  border: `2px solid ${hasDebts === o.val ? '#FDE68A' : 'transparent'}`,
                }}>
                {o.label}
              </button>
            ))}
          </div>
          {hasDebts && (
            <div className="space-y-3 mt-2 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
              <input type="text" placeholder="Nombre de la deuda (ej. Tarjeta Visa)"
                value={debtName} onChange={e => setDebtName(e.target.value)}
                className="input-dark" />
              <input type="number" inputMode="decimal" placeholder="Balance total ($)"
                value={debtBalance} onChange={e => setDebtBalance(e.target.value)}
                className="input-dark" />
              <p style={{ fontSize: 11, color: '#9CA3AF' }}>Puedes agregar más deudas en el Debt Dungeon</p>
            </div>
          )}
        </div>

        {/* ¿Tienes ahorros? */}
        <div className="card-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#ECFEFF' }}>🏔️</div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>¿Tienes ahorros actuales?</p>
          </div>
          <div className="flex gap-3 mb-3">
            {[{ val: true, label: 'Sí tengo' }, { val: false, label: 'Aún no' }].map(o => (
              <button key={String(o.val)} onClick={() => setHasSavings(o.val)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                style={{
                  background: hasSavings === o.val ? '#ECFEFF' : '#F3F4F6',
                  color: hasSavings === o.val ? '#0891B2' : '#6B7280',
                  border: `2px solid ${hasSavings === o.val ? '#A5F3FC' : 'transparent'}`,
                }}>
                {o.label}
              </button>
            ))}
          </div>
          {hasSavings && (
            <div className="mt-2 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
              <input type="number" inputMode="decimal" placeholder="¿Cuánto tienes ahorrado? ($)"
                value={savingsAmount} onChange={e => setSavingsAmount(e.target.value)}
                className="input-dark" />
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button onClick={() => setStep(3)} disabled={!income}
          className="btn-primary" style={{ opacity: income ? 1 : 0.5 }}>
          Continuar →
        </button>
        <button onClick={() => setStep(3)} className="w-full text-center py-2 text-sm font-semibold mt-2"
          style={{ color: '#9CA3AF' }}>
          Saltar por ahora
        </button>
      </div>
    </div>
  )

  // ── S4: Elegir objetivo ──
  if (currentStep === 'goal') return (
    <div className="min-h-screen flex flex-col px-6 py-12" style={{ background: '#F9FAFB' }}>
      <ProgressDots />
      <div className="text-center mb-6">
        <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Paso 3 de 3</p>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginTop: 4 }}>¿Cuál es tu meta principal?</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Esto define tu misión principal</p>
      </div>

      <div className="space-y-3 flex-1">
        {GOALS.map(g => {
          const isSelected = selectedGoal === g.id
          return (
            <button key={g.id} onClick={() => setSelectedGoal(g.id)} className="w-full text-left" style={{ display: 'block' }}>
              <div className="rounded-3xl p-4 transition-all" style={{
                background: isSelected ? '#F0FDF4' : '#FFFFFF',
                border: `2px solid ${isSelected ? '#22C55E' : '#E5E7EB'}`,
                boxShadow: isSelected ? '0 4px 16px rgba(34,197,94,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: isSelected ? '#DCFCE7' : '#F9FAFB' }}>
                    {g.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{g.title}</p>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: '#22C55E' }}>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{g.desc}</p>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Financial summary card */}
      {income && (
        <div className="card mt-4" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 8 }}>📊 Tu foto financiera inicial</p>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#6B7280' }}>Ingresos</span>
            <span style={{ fontWeight: 700, color: '#111827' }}>${Number(income).toLocaleString()}/mes</span>
          </div>
          {fixedExpenses && (
            <div className="flex justify-between text-sm mt-1">
              <span style={{ color: '#6B7280' }}>Gastos fijos</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>${Number(fixedExpenses).toLocaleString()}/mes</span>
            </div>
          )}
          {income && fixedExpenses && (
            <div className="flex justify-between text-sm mt-1 pt-2" style={{ borderTop: '1px solid #DCFCE7' }}>
              <span style={{ color: '#6B7280' }}>Disponible estimado</span>
              <span style={{ fontWeight: 700, color: '#16A34A' }}>
                ${(Number(income) - Number(fixedExpenses)).toLocaleString()}/mes
              </span>
            </div>
          )}
        </div>
      )}

      <button onClick={handleFinish} disabled={saving} className="btn-primary mt-4">
        {saving ? '🚀 Preparando tu aventura...' : '¡Empezar aventura! →'}
      </button>
    </div>
  )

  return null
}
