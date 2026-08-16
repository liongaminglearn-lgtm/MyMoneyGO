'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, updateProfile } from '@/lib/supabase'
import CompanionAvatar, { COMPANIONS } from '@/components/ui/CompanionAvatar'
import { CheckCircle2, Zap, Star, Shield } from 'lucide-react'

const GOAL_LABELS = {
  budget: { label: 'Controlar tu presupuesto', emoji: '📊' },
  debt: { label: 'Eliminar tus deudas', emoji: '⚔️' },
  savings: { label: 'Ahorrar más cada mes', emoji: '🎯' },
  control: { label: 'Tener control financiero', emoji: '🏆' },
}

const INCOME_LABELS = {
  lt500: 'menos de $500',
  '500-1500': '$500–$1,500',
  '1500-3000': '$1,500–$3,000',
  '3000-5000': '$3,000–$5,000',
  gt5000: 'más de $5,000',
}

export default function PaywallPage() {
  const router = useRouter()
  const [quiz, setQuiz] = useState({ goal: 'control', companion: 'nova', income: '1500-3000' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mmg_quiz')
      if (raw) {
        const parsed = JSON.parse(raw)
        setQuiz(parsed)
      }
    } catch {}
  }, [])

  const companion = COMPANIONS[quiz.companion] || COMPANIONS.nova
  const goal = GOAL_LABELS[quiz.goal] || GOAL_LABELS.control

  async function handleStart() {
    setLoading(true)
    localStorage.removeItem('mmg_quiz')

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await updateProfile(user.id, { onboarding_complete: true })
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }

  const features = [
    { icon: '🎯', text: 'Plan personalizado para ' + goal.label.toLowerCase() },
    { icon: '🤖', text: `${companion.name} como tu coach financiero personal` },
    { icon: '⚡', text: 'Sistema de XP y misiones para mantenerte motivado' },
    { icon: '📊', text: 'Presupuesto inteligente con alertas automáticas' },
    { icon: '🏆', text: 'Retos y logros que hacen divertido ahorrar' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F9FAFB' }}>

      {/* Header con companion */}
      <div style={{
        background: `linear-gradient(145deg, ${companion.color}22 0%, ${companion.color}11 100%)`,
        borderBottom: `2px solid ${companion.color}33`,
        paddingTop: 'max(24px, env(safe-area-inset-top))',
      }}>
        <div className="flex flex-col items-center px-6 pb-6 pt-4">
          <div className="text-sm font-bold mb-4 px-4 py-1.5 rounded-full"
            style={{ background: `${companion.color}22`, color: companion.color }}>
            ✨ TU PLAN ESTÁ LISTO
          </div>

          <div className="relative mb-4">
            <CompanionAvatar companionId={quiz.companion} size={90} showGlow />
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ background: '#22C55E' }}>
              ✓
            </div>
          </div>

          <h1 className="text-2xl font-black text-center mb-1" style={{ color: '#111827' }}>
            ¡{companion.name} está listo!
          </h1>
          <p className="text-center text-sm" style={{ color: '#6B7280' }}>
            Tu plan para {goal.emoji} {goal.label.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Plan summary */}
      <div className="px-5 py-5 flex-1">

        <div className="rounded-2xl p-4 mb-5" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold mb-3" style={{ color: '#9CA3AF' }}>TU PERFIL FINANCIERO</p>
          <div className="flex items-center gap-3 mb-3">
            <span style={{ fontSize: 24 }}>{goal.emoji}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#111827' }}>Meta principal</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>{goal.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 24 }}>💰</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#111827' }}>Ingresos mensuales</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>{INCOME_LABELS[quiz.income] || 'por configurar'}</p>
            </div>
          </div>
        </div>

        <p className="text-sm font-bold mb-3" style={{ color: '#374151' }}>Lo que incluye tu plan gratuito:</p>

        <div className="space-y-3 mb-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                {f.icon}
              </div>
              <p className="text-sm" style={{ color: '#374151' }}>{f.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 mb-6" style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎁</div>
            <div>
              <p className="font-black text-white text-sm">Bono de bienvenida</p>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                +50 XP y 100 monedas al empezar tu aventura
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* CTA fijo */}
      <div className="px-5 pb-10 pt-4" style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-white text-lg"
          style={{
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Cargando...' : '🚀 Empezar mi aventura gratis'}
        </button>
        <p className="text-center text-xs mt-3" style={{ color: '#9CA3AF' }}>
          Sin tarjeta de crédito · Siempre gratis
        </p>
      </div>
    </div>
  )
}
