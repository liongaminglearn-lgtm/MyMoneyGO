'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUser, updateProfile } from '@/lib/supabase'
import { ChevronRight } from 'lucide-react'

const STEPS = [
  {
    id: 'goal',
    title: '¿Cuál es tu meta principal? 🎯',
    subtitle: 'Te personalizaremos la experiencia',
    options: [
      { value: 'save', label: 'Ahorrar más dinero', emoji: '💰' },
      { value: 'debt', label: 'Salir de deudas', emoji: '🔓' },
      { value: 'control', label: 'Controlar mis gastos', emoji: '📊' },
      { value: 'invest', label: 'Empezar a invertir', emoji: '📈' },
    ],
  },
  {
    id: 'income',
    title: '¿Cuánto ganas al mes? 💼',
    subtitle: 'Esto es privado, solo lo ves tú',
    options: [
      { value: 'under500', label: 'Menos de $500', emoji: '🌱' },
      { value: '500-1500', label: '$500 - $1,500', emoji: '🌿' },
      { value: '1500-3000', label: '$1,500 - $3,000', emoji: '🌳' },
      { value: 'over3000', label: 'Más de $3,000', emoji: '🏔️' },
    ],
  },
  {
    id: 'challenge',
    title: '¿Cuál es tu mayor reto? 💪',
    subtitle: 'Sé honesto, sin juicios',
    options: [
      { value: 'tracking', label: 'No llevo registro de gastos', emoji: '📝' },
      { value: 'impulse', label: 'Compro por impulso', emoji: '🛍️' },
      { value: 'saving', label: 'No logro ahorrar', emoji: '😤' },
      { value: 'planning', label: 'No planifico el futuro', emoji: '🗓️' },
    ],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const current = STEPS[step]

  async function handleSelect(value) {
    setSelected(value)
    const newAnswers = { ...answers, [current.id]: value }
    setAnswers(newAnswers)

    await new Promise(r => setTimeout(r, 300))

    if (step < STEPS.length - 1) {
      setStep(step + 1)
      setSelected(null)
    } else {
      setLoading(true)
      const user = await getUser()
      if (user) {
        await updateProfile(user.id, {
          onboarding_goal: newAnswers.goal,
          onboarding_income: newAnswers.income,
          onboarding_challenge: newAnswers.challenge,
          onboarding_completed: true,
          xp: 50,
        })

        await supabase.from('missions').insert([
          {
            user_id: user.id,
            title: 'Registra tu primer gasto',
            description: 'Agrega una transacción hoy',
            xp_reward: 50,
            type: 'daily',
            completed: false,
          },
          {
            user_id: user.id,
            title: 'Completa tu perfil',
            description: 'Agrega tu primera meta de ahorro',
            xp_reward: 100,
            type: 'daily',
            completed: false,
          },
        ])
      }
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col safe-top safe-bottom">
      {/* Progress bar */}
      <div className="px-6 pt-8">
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= step ? '#00C896' : '#E2E8F0' }}
            />
          ))}
        </div>

        <p className="text-brand-muted text-sm mb-2">Paso {step + 1} de {STEPS.length}</p>
        <h2 className="text-2xl font-black text-gray-900 mb-1">{current.title}</h2>
        <p className="text-brand-muted text-sm mb-8">{current.subtitle}</p>
      </div>

      {/* Options */}
      <div className="flex-1 px-6 space-y-3">
        {current.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200"
            style={{
              background: selected === opt.value ? 'rgba(0,200,150,0.08)' : '#FFFFFF',
              borderColor: selected === opt.value ? '#00C896' : '#E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <span className="flex-1 text-left text-gray-800 font-medium">{opt.label}</span>
            <ChevronRight size={18} color={selected === opt.value ? '#00C896' : '#9CA3AF'} />
          </button>
        ))}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-gray-900 font-bold text-lg">¡Todo listo!</p>
            <p className="text-brand-muted text-sm mt-1">Preparando tu experiencia...</p>
          </div>
        </div>
      )}
    </div>
  )
}
