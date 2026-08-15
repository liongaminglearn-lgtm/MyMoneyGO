'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getMissions, completeMission, getProfile } from '@/lib/supabase'
import { calculateLevel } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import XPBar from '@/components/ui/XPBar'
import { Zap, CheckCircle2 } from 'lucide-react'

export default function MissionsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const [{ data: prof }, { data: miss }] = await Promise.all([
        getProfile(u.id),
        getMissions(u.id),
      ])
      setProfile(prof)
      setMissions(miss || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleComplete(mission) {
    if (mission.completed) return
    await completeMission(mission.id, user.id, mission.xp_reward)
    setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, completed: true } : m))
    setProfile(prev => prev ? { ...prev, xp: (prev.xp || 0) + mission.xp_reward } : prev)
  }

  const daily = missions.filter(m => m.type === 'daily')
  const weekly = missions.filter(m => m.type === 'weekly')
  const levelInfo = calculateLevel(profile?.xp || 0)

  return (
    <div className="min-h-screen bg-brand-dark pb-24 safe-top page-transition">
      <div className="px-5 pt-6">
        <h1 className="text-gray-900 text-xl font-black mb-1">Misiones 🎮</h1>
        <p className="text-brand-muted text-sm mb-5">Completa misiones y gana XP</p>

        {profile && <div className="mb-5"><XPBar xp={profile.xp || 0} /></div>}

        {/* Level badge */}
        <div className="card flex items-center gap-4 mb-5"
          style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.06), rgba(234,179,8,0.02))', borderColor: 'rgba(234,179,8,0.2)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(234,179,8,0.1)' }}>
            {levelInfo.level >= 5 ? '👑' : levelInfo.level >= 4 ? '🥇' : levelInfo.level >= 3 ? '🥈' : levelInfo.level >= 2 ? '🥉' : '🌱'}
          </div>
          <div>
            <p className="text-yellow-600 font-bold">{levelInfo.name}</p>
            <p className="text-brand-muted text-xs">Nivel {levelInfo.level} · {profile?.xp || 0} XP total</p>
          </div>
        </div>

        {loading ? (
          <p className="text-brand-muted text-center py-10">Cargando misiones...</p>
        ) : (
          <>
            {daily.length > 0 && (
              <div className="mb-5">
                <h2 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
                  <Zap size={16} color="#EAB308" />
                  Misiones del día
                </h2>
                <div className="space-y-3">
                  {daily.map(mission => (
                    <MissionCard key={mission.id} mission={mission} onComplete={handleComplete} />
                  ))}
                </div>
              </div>
            )}

            {weekly.length > 0 && (
              <div className="mb-5">
                <h2 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
                  <Zap size={16} color="#8B5CF6" />
                  Retos semanales
                </h2>
                <div className="space-y-3">
                  {weekly.map(mission => (
                    <MissionCard key={mission.id} mission={mission} onComplete={handleComplete} />
                  ))}
                </div>
              </div>
            )}

            {missions.length === 0 && (
              <div className="card text-center py-12">
                <Zap size={40} color="#9CA3AF" className="mx-auto mb-3" />
                <p className="text-gray-800 font-semibold">Sin misiones activas</p>
                <p className="text-brand-muted text-sm mt-1">
                  Completa el onboarding para recibir tus primeras misiones
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function MissionCard({ mission, onComplete }) {
  return (
    <button
      onClick={() => onComplete(mission)}
      disabled={mission.completed}
      className="card w-full text-left flex items-center gap-4 transition-all active:scale-98"
      style={{
        opacity: mission.completed ? 0.8 : 1,
        borderColor: mission.completed ? 'rgba(0,200,150,0.3)' : '#E2E8F0',
        background: mission.completed ? 'rgba(0,200,150,0.04)' : '#FFFFFF',
      }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: mission.completed ? 'rgba(0,200,150,0.12)' : '#F8FAFC' }}>
        {mission.completed
          ? <CheckCircle2 size={22} color="#00C896" />
          : <Zap size={22} color="#EAB308" />}
      </div>
      <div className="flex-1">
        <p className="text-gray-900 font-semibold text-sm">{mission.title}</p>
        <p className="text-brand-muted text-xs mt-0.5">{mission.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(234,179,8,0.1)', color: '#CA8A04' }}>
          +{mission.xp_reward} XP
        </span>
        {mission.completed && (
          <span className="text-xs text-brand-green font-medium">✓ Hecho</span>
        )}
      </div>
    </button>
  )
}
