'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getProfile, updateProfile, signOut } from '@/lib/supabase'
import { calculateLevel, getLevelProgress, formatCurrency } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { LogOut, User, Flame, Trophy, Zap, DollarSign, CheckCircle2, Receipt, Sword } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [salary, setSalary] = useState('')
  const [savingSalary, setSavingSalary] = useState(false)
  const [salarySaved, setSalarySaved] = useState(false)

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
      const { data } = await getProfile(u.id)
      setProfile(data)
      setSalary(data?.monthly_income ? String(data.monthly_income) : '')
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/auth/login')
  }

  async function handleSaveSalary(e) {
    e.preventDefault()
    if (!salary || isNaN(salary)) return
    setSavingSalary(true)
    await updateProfile(userId, { monthly_income: Number(salary) })
    setProfile(prev => prev ? { ...prev, monthly_income: Number(salary) } : prev)
    setSavingSalary(false)
    setSalarySaved(true)
    setTimeout(() => setSalarySaved(false), 3000)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-brand-green">Cargando...</p>
    </div>
  )

  const levelInfo = calculateLevel(profile?.xp || 0)
  const progress = getLevelProgress(profile?.xp || 0)

  const BADGES = [
    { icon: '🌱', name: 'Primer paso', desc: 'Completaste el onboarding', earned: true },
    { icon: '💸', name: 'Primer gasto', desc: 'Registraste tu primera transacción', earned: (profile?.xp || 0) >= 10 },
    { icon: '🔥', name: 'En racha', desc: '3 días seguidos activo', earned: (profile?.streak || 0) >= 3 },
    { icon: '🎯', name: 'Meta creada', desc: 'Creaste tu primera meta', earned: false },
    { icon: '⚡', name: 'Misión cumplida', desc: 'Completaste una misión', earned: false },
    { icon: '💰', name: 'Ahorrador', desc: 'Nivel 2 alcanzado', earned: levelInfo.level >= 2 },
  ]

  return (
    <div className="min-h-screen bg-brand-dark pb-24 safe-top page-transition">
      <div className="px-5 pt-6">
        {/* Profile header */}
        <div className="card text-center mb-5"
          style={{ background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-3"
            style={{ background: 'rgba(0,200,150,0.1)', border: '2px solid rgba(0,200,150,0.3)' }}>
            {levelInfo.level >= 5 ? '👑' : levelInfo.level >= 4 ? '🥇' : levelInfo.level >= 3 ? '🥈' : levelInfo.level >= 2 ? '🥉' : '🌱'}
          </div>
          <h2 className="text-gray-900 text-xl font-black">{profile?.name}</h2>
          <p className="text-brand-green text-sm font-semibold mt-0.5">{levelInfo.name}</p>

          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-brand-muted mb-1.5">
              <span>Nivel {levelInfo.level}</span>
              <span>{profile?.xp || 0} XP {levelInfo.next ? `/ ${levelInfo.next}` : '(Máximo)'}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#E2E8F0' }}>
              <div className="h-2 rounded-full transition-all"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00C896, #00E5B0)' }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: <Flame size={20} color="#F97316" />, value: profile?.streak || 0, label: 'Racha' },
            { icon: <Zap size={20} color="#EAB308" />, value: profile?.xp || 0, label: 'XP Total' },
            { icon: <Trophy size={20} color="#8B5CF6" />, value: levelInfo.level, label: 'Nivel' },
          ].map((stat, i) => (
            <div key={i} className="card text-center py-3">
              <div className="flex justify-center mb-1">{stat.icon}</div>
              <p className="text-gray-900 font-black text-lg">{stat.value}</p>
              <p className="text-brand-muted text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Salary / Monthly Income */}
        <div className="card mb-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} color="#00C896" />
            <h2 className="text-gray-900 font-bold">Ingreso mensual</h2>
          </div>
          <p className="text-brand-muted text-xs mb-3">
            Guarda tu salario para calcular mejor tu presupuesto
          </p>
          <form onSubmit={handleSaveSalary} className="flex gap-2">
            <input
              className="input-dark flex-1"
              type="number"
              placeholder="Ej: 2000"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              inputMode="decimal"
            />
            <button
              type="submit"
              disabled={savingSalary}
              className="px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all"
              style={{
                background: salarySaved ? 'rgba(0,200,150,0.12)' : '#00C896',
                color: salarySaved ? '#00C896' : '#FFFFFF',
                minWidth: 90,
              }}>
              {savingSalary ? 'Guardando...' : salarySaved ? (
                <><CheckCircle2 size={16} /> ¡Listo!</>
              ) : 'Guardar'}
            </button>
          </form>
          {profile?.monthly_income > 0 && (
            <p className="text-brand-muted text-xs mt-2">
              Ingreso actual: <span className="text-brand-green font-semibold">{formatCurrency(profile.monthly_income)}</span>
            </p>
          )}
        </div>

        {/* Badges */}
        <h2 className="text-gray-900 font-bold mb-3 flex items-center gap-2">
          <Trophy size={16} color="#EAB308" /> Logros
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {BADGES.map((badge, i) => (
            <div key={i} className="card text-center py-3"
              style={{ opacity: badge.earned ? 1 : 0.4 }}>
              <div className="text-2xl mb-1">{badge.icon}</div>
              <p className="text-gray-800 text-xs font-semibold leading-tight">{badge.name}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link href="/bills"
            className="card flex items-center gap-3 active:scale-95 transition-transform">
            <Receipt size={18} color="#6366F1" />
            <span className="text-gray-800 font-semibold text-sm">Facturas</span>
          </Link>
          <Link href="/missions"
            className="card flex items-center gap-3 active:scale-95 transition-transform">
            <Sword size={18} color="#7C3AED" />
            <span className="text-gray-800 font-semibold text-sm">Misiones</span>
          </Link>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all"
          style={{ background: 'rgba(239,68,68,0.06)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
