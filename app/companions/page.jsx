'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getProfile, updateProfile } from '@/lib/supabase'
import { calculateLevel, getLevelProgress } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import CompanionAvatar, { COMPANIONS } from '@/components/ui/CompanionAvatar'
import { ChevronLeft, Check } from 'lucide-react'

const EVOLUTION_STAGES = {
  sparky: [
    { name: 'Sparky',    level: 1,  emoji: '⚡', desc: 'Tu compañero inicial' },
    { name: 'Sparky+',   level: 5,  emoji: '⚡✨', desc: 'Ha aprendido técnicas básicas' },
    { name: 'Voltara',   level: 10, emoji: '⚡🌟', desc: 'Domina el ahorro avanzado' },
    { name: 'Voltaria',  level: 20, emoji: '⚡👑', desc: 'Maestro supremo del ahorro' },
  ],
  nova: [
    { name: 'Nova',      level: 1,  emoji: '🦊', desc: 'Tu compañero estratégico' },
    { name: 'Nova+',     level: 5,  emoji: '🦊✨', desc: 'Estrategias más complejas' },
    { name: 'Novara',    level: 10, emoji: '🦊🌟', desc: 'Analista financiero avanzado' },
    { name: 'Novaria',   level: 20, emoji: '🦊👑', desc: 'La zorra más inteligente del reino' },
  ],
  vault: [
    { name: 'Vault',     level: 1,  emoji: '🐢', desc: 'Tu compañero de estabilidad' },
    { name: 'Vault+',    level: 5,  emoji: '🐢✨', desc: 'Escudo financiero activo' },
    { name: 'Vaultara',  level: 10, emoji: '🐢🌟', desc: 'Fortaleza económica' },
    { name: 'Vaultaria', level: 20, emoji: '🐢👑', desc: 'La tortuga más poderosa' },
  ],
}

const SKILLS = {
  sparky: [
    { icon: '💰', name: 'Ahorro acelerado', desc: '+5% más XP en cada ahorro registrado' },
    { icon: '📊', name: 'Meta express',      desc: 'Notificaciones cuando una meta está al 80%' },
    { icon: '⚡', name: 'Energía extra',     desc: 'Duplica XP los viernes' },
  ],
  nova: [
    { icon: '🧠', name: 'Estrategia élite', desc: 'Sugerencias inteligentes de gastos' },
    { icon: '📈', name: 'Análisis pro',     desc: 'Gráficos detallados de tendencias' },
    { icon: '🦊', name: 'Intuición fox',   desc: '+15% más monedas al completar misiones' },
  ],
  vault: [
    { icon: '🛡️', name: 'Escudo deudas',   desc: 'Alertas antes de gastar más del presupuesto' },
    { icon: '🏦', name: 'Bóveda fuerte',    desc: '+10% más XP al pagar deudas' },
    { icon: '🐢', name: 'Paso a paso',      desc: 'Misiones de estabilidad financiera extra' },
  ],
}

export default function CompanionsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('current')
  const [switching, setSwitching] = useState(false)
  const [switched, setSwitched] = useState(false)
  const [previewCompanion, setPreviewCompanion] = useState(null)

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
      const { data } = await getProfile(u.id)
      setProfile(data)
      setPreviewCompanion(data?.companion_id || 'nova')
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSwitch(companionId) {
    if (companionId === profile?.companion_id) return
    setSwitching(true)
    await updateProfile(userId, { companion_id: companionId })
    setProfile(prev => ({ ...prev, companion_id: companionId }))
    setPreviewCompanion(companionId)
    setSwitched(true)
    setTimeout(() => setSwitched(false), 2000)
    setSwitching(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
      <p style={{ color: '#22C55E', fontWeight: 700 }} className="animate-pulse">Cargando compañeros...</p>
    </div>
  )

  const companionId = profile?.companion_id || 'nova'
  const companion   = COMPANIONS[previewCompanion || companionId] || COMPANIONS.nova
  const levelInfo   = calculateLevel(profile?.xp || 0)
  const xpProgress  = getLevelProgress(profile?.xp || 0)
  const stages      = EVOLUTION_STAGES[previewCompanion || companionId] || EVOLUTION_STAGES.nova
  const currentStage = stages.reduce((acc, s) => s.level <= levelInfo.level ? s : acc, stages[0])
  const skills      = SKILLS[previewCompanion || companionId] || SKILLS.nova

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#F9FAFB' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6' }}>
        <div className="flex items-center justify-between px-5 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                <ChevronLeft size={20} color="#374151" />
              </div>
            </Link>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>Mi Compañero</h1>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Cuida y evoluciona a tu aliado</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pb-0 gap-0">
          {[
            { id: 'current',  label: 'Mi compañero' },
            { id: 'choose',   label: 'Cambiar' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
              className="flex-1 py-3 text-sm font-bold transition-all"
              style={{
                color: selectedTab === tab.id ? companion.color : '#6B7280',
                borderBottom: selectedTab === tab.id ? `2.5px solid ${companion.color}` : '2px solid transparent',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {selectedTab === 'current' && (
        <div className="px-5 mt-5 space-y-4">
          {/* Companion hero */}
          <div className="card-lg text-center" style={{ background: `linear-gradient(135deg, ${companion.color}08, #FFFFFF)`, border: `2px solid ${companion.color}30` }}>
            <div className="flex justify-center mb-4">
              <CompanionAvatar companionId={previewCompanion || companionId} size={100} showGlow />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827' }}>{companion.name}</h2>
            <p style={{ fontSize: 14, color: companion.color, fontWeight: 700 }}>{currentStage.name}</p>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{companion.specialty}</p>

            <div className="mt-5">
              <div className="flex justify-between items-center mb-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: `${companion.color}15`, color: companion.color }}>
                  Nivel {levelInfo.level}
                </span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{profile?.xp || 0} XP</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${xpProgress}%`, background: `linear-gradient(90deg, ${companion.color}, ${companion.color}CC)` }} />
              </div>
            </div>
          </div>

          {/* Evolution stages */}
          <div className="card-lg">
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>✨ Evoluciones</p>
            <div className="flex justify-between">
              {stages.map((stage, i) => {
                const unlocked = levelInfo.level >= stage.level
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5" style={{ opacity: unlocked ? 1 : 0.3 }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                      style={{
                        background: unlocked ? `${companion.color}15` : '#F3F4F6',
                        border: `2px solid ${unlocked ? companion.color : '#E5E7EB'}`,
                      }}>
                      {stage.emoji.split(/(?<=.)(?=[🌟✨👑])/)[0]}
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: unlocked ? companion.color : '#9CA3AF', textAlign: 'center' }}>
                      {stage.name}
                    </p>
                    <p style={{ fontSize: 9, color: '#9CA3AF' }}>Nv.{stage.level}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Skills */}
          <div className="card-lg">
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 12 }}>🎯 Habilidades</p>
            <div className="space-y-3">
              {skills.map((skill, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: `${companion.color}08` }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{skill.icon}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{skill.name}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{skill.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'choose' && (
        <div className="px-5 mt-5 space-y-4">
          <div className="card" style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
            <p style={{ fontSize: 13, color: '#92400E' }}>💡 Puedes cambiar de compañero cuando quieras. Cada uno tiene habilidades únicas.</p>
          </div>

          {switched && (
            <div className="card flex items-center gap-3" style={{ background: '#F0FDF4', border: '1.5px solid #22C55E' }}>
              <Check size={20} color="#22C55E" />
              <p style={{ fontWeight: 700, color: '#16A34A' }}>¡Compañero actualizado!</p>
            </div>
          )}

          {Object.entries(COMPANIONS).map(([id, c]) => {
            const isActive = profile?.companion_id === id
            return (
              <div key={id} className="card-lg"
                style={{ border: `2px solid ${isActive ? c.color : '#E5E7EB'}`, background: isActive ? `${c.color}05` : '#FFFFFF' }}>
                <div className="flex items-center gap-4">
                  <CompanionAvatar companionId={id} size={64} showGlow={isActive} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p style={{ fontWeight: 800, fontSize: 17, color: '#111827' }}>{c.name}</p>
                      {isActive && <span className="chip chip-green">Activo</span>}
                    </div>
                    <p style={{ fontSize: 13, color: c.color, fontWeight: 600, marginTop: 2 }}>{c.specialty}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c.desc}</p>
                  </div>
                </div>
                {!isActive && (
                  <button
                    onClick={() => handleSwitch(id)}
                    disabled={switching}
                    className="w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{ background: `${c.color}15`, color: c.color, border: `1.5px solid ${c.color}40` }}>
                    {switching ? 'Cambiando...' : `Elegir ${c.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
