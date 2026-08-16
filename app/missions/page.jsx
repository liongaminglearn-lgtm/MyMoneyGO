'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getProfile } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { ChevronLeft, CheckCircle2, Lock } from 'lucide-react'

const DAILY_MISSIONS = [
  { id: 'm1', icon: '💳', title: 'Registra un gasto hoy', desc: 'Anota cualquier gasto del día', xp: 15, coins: 5, type: 'daily' },
  { id: 'm2', icon: '📊', title: 'Revisa tu presupuesto', desc: 'Visita la sección de presupuesto', xp: 10, coins: 3, type: 'daily' },
  { id: 'm3', icon: '🎯', title: 'Actualiza una meta', desc: 'Agrega ahorro a una de tus metas', xp: 25, coins: 10, type: 'daily' },
]

const WEEKLY_MISSIONS = [
  { id: 'w1', icon: '⚔️', title: 'Ataca una deuda', desc: 'Haz un pago a cualquier deuda', xp: 50, coins: 20, type: 'weekly' },
  { id: 'w2', icon: '📈', title: 'Semana en verde', desc: 'Gasta menos de lo que ingresaste', xp: 75, coins: 30, type: 'weekly' },
  { id: 'w3', icon: '🔥', title: 'Racha de 7 días', desc: 'Mantén tu racha toda la semana', xp: 100, coins: 50, type: 'weekly' },
]

const SPECIAL_MISSIONS = [
  { id: 's1', icon: '🏔️', title: 'Primer pico', desc: 'Completa el 50% de una meta de ahorro', xp: 200, coins: 100, type: 'special', locked: false },
  { id: 's2', icon: '🐉', title: 'Caza-dragones', desc: 'Paga completamente una deuda', xp: 500, coins: 250, type: 'special', locked: false },
  { id: 's3', icon: '👑', title: 'Maestro financiero', desc: 'Llega al Nivel 10', xp: 1000, coins: 500, type: 'special', locked: true },
]

export default function MissionsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('daily')
  const [completed, setCompleted] = useState({})
  const [xpFlash, setXpFlash] = useState('')

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      const { data } = await getProfile(u.id)
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleComplete(mission) {
    if (completed[mission.id] || mission.locked) return
    setCompleted(prev => ({ ...prev, [mission.id]: true }))
    setXpFlash(`+${mission.xp} XP`)
    setTimeout(() => setXpFlash(''), 1400)
  }

  const missionGroups = { daily: DAILY_MISSIONS, weekly: WEEKLY_MISSIONS, special: SPECIAL_MISSIONS }
  const currentMissions = missionGroups[activeTab] || []
  const completedCount = currentMissions.filter(m => completed[m.id]).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
      <p style={{ color: '#22C55E', fontWeight: 700 }} className="animate-pulse">Cargando misiones...</p>
    </div>
  )

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#F9FAFB' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6' }}>
        <div className="px-5 pt-14 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                <ChevronLeft size={20} color="#374151" />
              </div>
            </Link>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>Misiones</h1>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Completa misiones y gana XP</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: '#EDE9FE' }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED' }}>⚡ {profile?.xp || 0}</p>
              <p style={{ fontSize: 10, color: '#6D28D9', fontWeight: 600 }}>XP TOTAL</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: '#FFFBEB' }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#D97706' }}>🪙 {profile?.coins || 0}</p>
              <p style={{ fontSize: 10, color: '#92400E', fontWeight: 600 }}>MONEDAS</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: '#FFF7ED' }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#EA580C' }}>🔥 {profile?.streak || 0}</p>
              <p style={{ fontSize: 10, color: '#9A3412', fontWeight: 600 }}>RACHA</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pb-0 gap-0">
          {[
            { id: 'daily',   label: 'Diarias' },
            { id: 'weekly',  label: 'Semanales' },
            { id: 'special', label: 'Especiales' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 text-sm font-bold transition-all"
              style={{
                color: activeTab === tab.id ? '#22C55E' : '#6B7280',
                borderBottom: activeTab === tab.id ? '2.5px solid #22C55E' : '2px solid transparent',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-3">
        {/* Progress */}
        {completedCount > 0 && (
          <div className="card flex items-center gap-3" style={{ background: '#F0FDF4', border: '1.5px solid #DCFCE7' }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <p style={{ fontWeight: 700, color: '#16A34A', fontSize: 14 }}>
                {completedCount}/{currentMissions.length} misiones completadas
              </p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>¡Sigue así, campeón!</p>
            </div>
          </div>
        )}

        {currentMissions.map(mission => {
          const isDone = completed[mission.id]
          const isLocked = mission.locked

          return (
            <div key={mission.id} className="card-lg"
              style={{ opacity: isLocked ? 0.6 : 1, border: isDone ? '1.5px solid #DCFCE7' : '1.5px solid #F3F4F6' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: isDone ? '#DCFCE7' : '#F3F4F6' }}>
                  {mission.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{mission.title}</p>
                      <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{mission.desc}</p>
                    </div>
                    {isLocked ? (
                      <Lock size={18} color="#9CA3AF" />
                    ) : isDone ? (
                      <CheckCircle2 size={22} color="#22C55E" />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="chip chip-purple">⚡ +{mission.xp} XP</span>
                    <span className="chip chip-yellow">🪙 +{mission.coins}</span>
                    {!isDone && !isLocked && (
                      <button
                        onClick={() => handleComplete(mission)}
                        className="ml-auto px-4 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: '#22C55E', color: '#FFFFFF' }}>
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {activeTab === 'daily' && (
          <div className="text-center py-4">
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              🕐 Nuevas misiones diarias a las 00:00
            </p>
          </div>
        )}
        {activeTab === 'weekly' && (
          <div className="text-center py-4">
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              🕐 Nuevas misiones semanales cada lunes
            </p>
          </div>
        )}
      </div>

      {xpFlash && <div className="xp-float">{xpFlash} ¡Misión!</div>}
      <BottomNav />
    </div>
  )
}
