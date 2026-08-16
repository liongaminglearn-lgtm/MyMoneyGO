'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getProfile, updateProfile } from '@/lib/supabase'
import CompanionAvatar, { COMPANIONS } from '@/components/ui/CompanionAvatar'
import { ChevronRight, Check } from 'lucide-react'

const STEPS = ['welcome', 'companion', 'income', 'done']

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [step, setStep] = useState(0)
  const [selectedCompanion, setSelectedCompanion] = useState('nova')
  const [income, setIncome] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      const { data: prof } = await getProfile(u.id)
      if (prof?.onboarding_complete) {
        router.push('/dashboard')
        return
      }
      setUserId(u.id)
    }
    load()
  }, [router])

  async function handleFinish() {
    if (!userId) return
    setSaving(true)
    await updateProfile(userId, {
      companion_id: selectedCompanion,
      monthly_income: Number(income) || 0,
      onboarding_complete: true,
      xp: 50,
      coins: 100,
    })
    router.push('/dashboard')
  }

  const currentStep = STEPS[step]

  // Screen 1: Welcome
  if (currentStep === 'welcome') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'linear-gradient(160deg, #16A34A 0%, #22C55E 40%, #4ADE80 100%)' }}>
      <div className="mb-6">
        <div className="text-7xl mb-4" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>
          🎮
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', letterSpacing: -1, lineHeight: 1.1 }}>
          MONEY GO
        </h1>
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
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 600 }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStep(1)}
        className="mt-10 w-full max-w-sm flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg"
        style={{ background: '#FFFFFF', color: '#16A34A', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        ¡Comenzar aventura!
        <ChevronRight size={22} />
      </button>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 16 }}>
        ¡50 XP de bienvenida te esperan!
      </p>
    </div>
  )

  // Screen 2: Choose companion
  if (currentStep === 'companion') return (
    <div className="min-h-screen flex flex-col px-6 py-12" style={{ background: '#F9FAFB' }}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.slice(1, -1).map((_, i) => (
          <div key={i} style={{
            width: i === step - 1 ? 24 : 8,
            height: 8,
            borderRadius: 99,
            background: i <= step - 1 ? '#22C55E' : '#E5E7EB',
            transition: 'width 0.3s',
          }} />
        ))}
      </div>

      <div className="text-center mb-8">
        <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Paso 1 de 2</p>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', marginTop: 4 }}>
          Elige tu compañero
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>
          Tu compañero te ayudará a alcanzar la libertad financiera
        </p>
      </div>

      <div className="space-y-3 flex-1">
        {Object.entries(COMPANIONS).map(([id, c]) => {
          const isSelected = selectedCompanion === id
          return (
            <button
              key={id}
              onClick={() => setSelectedCompanion(id)}
              className="w-full text-left transition-all"
              style={{ display: 'block' }}>
              <div className="rounded-3xl p-4 transition-all"
                style={{
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
                        <div className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: c.color }}>
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

      <button
        onClick={() => setStep(2)}
        className="btn-primary mt-6"
        style={{ background: COMPANIONS[selectedCompanion]?.color || '#22C55E' }}>
        Continuar con {COMPANIONS[selectedCompanion]?.name} →
      </button>
    </div>
  )

  // Screen 3: Income setup
  if (currentStep === 'income') return (
    <div className="min-h-screen flex flex-col px-6 py-12" style={{ background: '#F9FAFB' }}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.slice(1, -1).map((_, i) => (
          <div key={i} style={{
            width: i === step - 1 ? 24 : 8,
            height: 8,
            borderRadius: 99,
            background: i <= step - 1 ? '#22C55E' : '#E5E7EB',
            transition: 'width 0.3s',
          }} />
        ))}
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4"
          style={{ background: '#DCFCE7' }}>
          💰
        </div>
        <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Paso 2 de 2</p>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', marginTop: 4 }}>
          ¿Cuánto ganas al mes?
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>
          Esto nos ayuda a calcular tu presupuesto ideal
        </p>
      </div>

      <div className="card-lg text-center mb-6">
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, fontWeight: 600 }}>INGRESO MENSUAL TOTAL</p>
        <input
          type="number"
          placeholder="$0.00"
          value={income}
          onChange={e => setIncome(e.target.value)}
          className="w-full text-center border-0 outline-none"
          style={{
            fontSize: 40,
            fontWeight: 900,
            color: income ? '#22C55E' : '#D1D5DB',
            background: 'transparent',
            fontVariantNumeric: 'tabular-nums',
          }}
          inputMode="decimal"
          autoFocus
        />
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Incluye salario, freelance, etc.</p>
      </div>

      <div className="card mb-4" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
        <p style={{ fontSize: 13, color: '#92400E' }}>
          🔒 Esta información es privada y solo se usa para calcular tu presupuesto. Puedes cambiarla cuando quieras.
        </p>
      </div>

      <div className="mt-auto space-y-3">
        <button onClick={handleFinish} disabled={saving} className="btn-primary">
          {saving ? 'Preparando tu aventura...' : '🚀 ¡Empezar aventura!'}
        </button>
        <button onClick={handleFinish} className="w-full text-center py-2 text-sm font-semibold"
          style={{ color: '#9CA3AF' }}>
          Saltar por ahora
        </button>
      </div>
    </div>
  )

  return null
}
