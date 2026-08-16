'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Check } from 'lucide-react'

const COMPANIONS = {
  sparky: { name: 'Sparky', emoji: '⚡', avatar: '🐱', color: '#FBBF24', bg: '#FEF9C3', specialty: 'Ahorro', desc: 'Experto en optimizar cada peso que ahorras' },
  nova:   { name: 'Nova',   emoji: '🦊', avatar: '🦊', color: '#F97316', bg: '#FFF7ED', specialty: 'Estrategia', desc: 'Domina el juego financiero con inteligencia' },
  vault:  { name: 'Vault',  emoji: '🐢', avatar: '🐢', color: '#06B6D4', bg: '#ECFEFF', specialty: 'Estabilidad', desc: 'Construye bases financieras sólidas y duraderas' },
}

const GOALS = [
  { id: 'budget',  emoji: '📊', title: 'Controlar mi presupuesto', desc: 'Saber exactamente en qué gasto cada mes' },
  { id: 'debt',    emoji: '⚔️', title: 'Eliminar mis deudas',       desc: 'Derrotar mis deudas como jefes finales' },
  { id: 'savings', emoji: '🏔️', title: 'Ahorrar más dinero',        desc: 'Construir mi fondo de emergencia y metas' },
  { id: 'control', emoji: '🎯', title: 'Organizar mis finanzas',    desc: 'Tener claridad total de mi dinero' },
]

const INCOME_OPTIONS = [
  { id: 'u500',   label: 'Menos de $500',     value: 300 },
  { id: '500',    label: '$500 – $1,000',      value: 750 },
  { id: '1000',   label: '$1,000 – $2,500',    value: 1750 },
  { id: '2500',   label: '$2,500 – $5,000',    value: 3750 },
  { id: '5000',   label: 'Más de $5,000',      value: 6000 },
]

const STEPS = ['welcome', 'goal', 'companion', 'income', 'loading']
const TOTAL_QUIZ = 3 // preguntas reales (goal, companion, income)

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]               = useState(0)
  const [goal, setGoal]               = useState('')
  const [companion, setCompanion]     = useState('nova')
  const [income, setIncome]           = useState('')
  const [loadPct, setLoadPct]         = useState(0)
  const [loadMsg, setLoadMsg]         = useState('Analizando tu situación financiera...')

  // Auth redirect handled by middleware

  // Loading screen animation
  useEffect(() => {
    if (STEPS[step] !== 'loading') return
    const msgs = [
      'Analizando tu situación financiera...',
      'Configurando tu compañero...',
      'Diseñando tu plan personalizado...',
      '¡Tu plan Money GO está listo!',
    ]
    let pct = 0
    const interval = setInterval(() => {
      pct += 3
      setLoadPct(Math.min(pct, 100))
      if (pct < 30)  setLoadMsg(msgs[0])
      else if (pct < 60) setLoadMsg(msgs[1])
      else if (pct < 90) setLoadMsg(msgs[2])
      else setLoadMsg(msgs[3])
      if (pct >= 100) {
        clearInterval(interval)
        // Save quiz data to localStorage for register page
        localStorage.setItem('mmg_quiz', JSON.stringify({ goal, companion, income }))
        setTimeout(() => router.push('/auth/register'), 600)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [step, goal, companion, income, router])

  const currentStep = STEPS[step]
  const quizStep = step - 1 // 0-indexed among quiz steps
  const progressPct = currentStep === 'loading' ? 100
    : currentStep === 'welcome' ? 5
    : Math.round(5 + (quizStep / TOTAL_QUIZ) * 90)

  function ProgressBar() {
    if (currentStep === 'welcome') return null
    return (
      <div style={{ padding: '0 20px', paddingTop: 'max(20px, env(safe-area-inset-top))', background: '#F9FAFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentStep !== 'loading' && step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280', flexShrink: 0 }}>
              ‹
            </button>
          )}
          <div style={{ flex: 1, height: 3, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: '#22C55E', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', minWidth: 30, textAlign: 'right' }}>{progressPct}%</span>
        </div>
      </div>
    )
  }

  // ── Welcome ──
  if (currentStep === 'welcome') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 32px', background: 'linear-gradient(160deg, #16A34A 0%, #22C55E 50%, #4ADE80 100%)', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>🎮</div>
      <h1 style={{ fontSize: 38, fontWeight: 900, color: '#FFF', letterSpacing: -1, lineHeight: 1.1, margin: 0 }}>MONEY GO</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 10, lineHeight: 1.6 }}>
        Convierte tus finanzas en<br />una aventura épica. ¡Sube de nivel!
      </p>
      <div style={{ width: '100%', maxWidth: 340, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: '⚔️', text: 'Derrota deudas como jefes finales' },
          { icon: '🏔️', text: 'Escala la Savings Mountain' },
          { icon: '⚡', text: 'Gana XP y sube de nivel' },
          { icon: '🦊', text: 'Tu compañero te guía en cada paso' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ color: '#FFF', fontSize: 14, fontWeight: 600 }}>{item.text}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setStep(1)}
        style={{ marginTop: 28, width: '100%', maxWidth: 340, padding: '16px', background: '#FFF', color: '#16A34A', fontWeight: 900, fontSize: 16, borderRadius: 18, border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        ¡Comenzar aventura! →
      </button>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 14 }}>🎁 50 XP de bienvenida te esperan</p>
    </div>
  )

  // ── Goal ──
  if (currentStep === 'goal') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <ProgressBar />
      <div style={{ flex: 1, padding: '32px 20px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Pregunta 1 de 3</p>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginTop: 8, marginBottom: 6, lineHeight: 1.15, letterSpacing: -0.5 }}>¿Cuál es tu meta principal?</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Esto define tu misión principal en Money GO</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GOALS.map(g => {
            const sel = goal === g.id
            return (
              <button key={g.id} onClick={() => { setGoal(g.id); setTimeout(() => setStep(2), 300) }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 18, border: `2px solid ${sel ? '#22C55E' : '#E5E7EB'}`, background: sel ? '#F0FDF4' : '#FFF', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', boxShadow: sel ? '0 4px 16px rgba(34,197,94,0.15)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: sel ? '#DCFCE7' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{g.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{g.desc}</div>
                </div>
                {sel && <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={13} color="#FFF" strokeWidth={3} /></div>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ── Companion ──
  if (currentStep === 'companion') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <ProgressBar />
      <div style={{ flex: 1, padding: '32px 20px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Pregunta 2 de 3</p>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginTop: 8, marginBottom: 6, lineHeight: 1.15, letterSpacing: -0.5 }}>Elige tu compañero</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Tu aliado en cada decisión financiera</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(COMPANIONS).map(([id, c]) => {
            const sel = companion === id
            return (
              <button key={id} onClick={() => { setCompanion(id); setTimeout(() => setStep(3), 300) }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 18, border: `2px solid ${sel ? c.color : '#E5E7EB'}`, background: sel ? c.bg : '#FFF', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', boxShadow: sel ? `0 4px 16px ${c.color}25` : '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, ${c.bg}, ${c.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0, border: '3px solid rgba(255,255,255,0.8)', boxShadow: sel ? `0 0 16px ${c.color}60` : 'none' }}>{c.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: c.color, fontWeight: 700, marginTop: 2 }}>{c.specialty}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{c.desc}</div>
                </div>
                {sel && <div style={{ width: 24, height: 24, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={13} color="#FFF" strokeWidth={3} /></div>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ── Income ──
  if (currentStep === 'income') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <ProgressBar />
      <div style={{ flex: 1, padding: '32px 20px 24px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Pregunta 3 de 3</p>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#111827', marginTop: 8, marginBottom: 6, lineHeight: 1.15, letterSpacing: -0.5 }}>¿Cuánto ganas al mes?</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Calculamos tu presupuesto ideal — solo tú lo ves</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {INCOME_OPTIONS.map(opt => {
            const sel = income === opt.id
            return (
              <button key={opt.id} onClick={() => { setIncome(opt.id); setTimeout(() => setStep(4), 300) }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderRadius: 18, border: `2px solid ${sel ? '#22C55E' : '#E5E7EB'}`, background: sel ? '#F0FDF4' : '#FFF', cursor: 'pointer', transition: 'all 0.2s', boxShadow: sel ? '0 4px 14px rgba(34,197,94,0.15)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{opt.label}</span>
                {sel && <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} color="#FFF" strokeWidth={3} /></div>}
              </button>
            )
          })}
        </div>
        <button onClick={() => setStep(4)} style={{ marginTop: 16, width: '100%', textAlign: 'center', padding: '12px', fontSize: 13, color: '#9CA3AF', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          Saltar por ahora
        </button>
      </div>
    </div>
  )

  // ── Loading ──
  if (currentStep === 'loading') {
    const comp = COMPANIONS[companion]
    const goalObj = GOALS.find(g => g.id === goal)
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #F0FDF4, #F9FAFB)', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg, ${comp.bg}, ${comp.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 24, border: '3px solid rgba(255,255,255,0.9)', boxShadow: `0 0 32px ${comp.color}60` }}>
          {comp.avatar}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>Construyendo tu plan...</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, lineHeight: 1.5 }}>{loadMsg}</p>
        <div style={{ width: '100%', maxWidth: 300, height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${loadPct}%`, background: 'linear-gradient(90deg, #22C55E, #16A34A)', borderRadius: 99, transition: 'width 0.1s linear' }} />
        </div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#22C55E' }}>{loadPct}%</p>
        {goalObj && (
          <div style={{ marginTop: 28, background: '#FFF', borderRadius: 20, padding: '16px 20px', border: '1.5px solid #DCFCE7', maxWidth: 300, width: '100%' }}>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px' }}>Tu meta principal</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>{goalObj.emoji} {goalObj.title}</p>
          </div>
        )}
      </div>
    )
  }

  return null
}
