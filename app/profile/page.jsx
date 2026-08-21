'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getProfile, updateProfile, signOut, getTransactions } from '@/lib/supabase'
import { calculateLevel, getLevelProgress, formatCurrency, getCurrentMonth } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import CompanionAvatar, { COMPANIONS } from '@/components/ui/CompanionAvatar'
import { LogOut, CheckCircle2, ChevronRight, Edit3, X, Check, Globe } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const BADGES_BASE = [
  { icon: '🌱', key: 'first_step',    xpReq: 0,    earned: true },
  { icon: '💸', key: 'first_expense', xpReq: 10,   earned: false },
  { icon: '🔥', key: 'streak',        streak: 3,   earned: false },
  { icon: '🏔️', key: 'climber',       xpReq: 100,  earned: false },
  { icon: '⚡', key: 'mission',        xpReq: 50,   earned: false },
  { icon: '💰', key: 'saver',         xpReq: 200,  earned: false },
  { icon: '🐉', key: 'dragon',        xpReq: 500,  earned: false },
  { icon: '👑', key: 'master',        xpReq: 1000, earned: false },
  { icon: '🎯', key: 'goal',          xpReq: 300,  earned: false },
]

export default function ProfilePage() {
  const router = useRouter()
  const { t, lang, switchLang } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [editingSalary, setEditingSalary] = useState(false)
  const [salary, setSalary] = useState('')
  const [savingSalary, setSavingSalary] = useState(false)

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
      const [{ data: prof }, { data: txns }] = await Promise.all([
        getProfile(u.id),
        getTransactions(u.id, getCurrentMonth()),
      ])
      setProfile(prof)
      setTransactions(txns || [])
      setSalary(prof?.monthly_income ? String(prof.monthly_income) : '')
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.push('/auth/login')
  }

  async function handleSaveSalary() {
    if (!salary || isNaN(salary)) return
    setSavingSalary(true)
    await updateProfile(userId, { monthly_income: Number(salary) })
    setProfile(prev => prev ? { ...prev, monthly_income: Number(salary) } : prev)
    setSavingSalary(false)
    setEditingSalary(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <p style={{ color: '#059669', fontWeight: 700 }} className="animate-pulse">{t('profile_loading')}</p>
    </div>
  )

  const levelInfo = calculateLevel(profile?.xp || 0)
  const progress  = getLevelProgress(profile?.xp || 0)
  const companionId = profile?.companion_id || 'nova'
  const companion = COMPANIONS[companionId] || COMPANIONS.nova

  const xp = profile?.xp || 0
  const streak = profile?.streak || 0
  const BADGE_KEY_MAP = {
    first_step: 'profile_badge_first_step', first_expense: 'profile_badge_first_expense',
    streak: 'profile_badge_streak', climber: 'profile_badge_climber',
    mission: 'profile_badge_mission', saver: 'profile_badge_saver',
    dragon: 'profile_badge_dragon', master: 'profile_badge_master',
    goal: 'profile_badge_goal',
  }
  const earnedBadges = BADGES_BASE.map(b => ({
    ...b,
    name: t(BADGE_KEY_MAP[b.key] || b.key),
    earned: b.earned || (b.xpReq !== undefined && xp >= b.xpReq) || (b.streak !== undefined && streak >= b.streak),
  }))

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const daysInMonth  = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const today        = new Date().getDate()
  const avgDaily     = today > 0 ? totalExpense / today : 0

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#FFFFFF' }}>

      {/* Hero header */}
      <div style={{ background: 'linear-gradient(145deg, #059669, #047857)', paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="px-5 pt-2 pb-20">
          <div className="flex items-center justify-between">
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>{t('profile_title')}</h1>
            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <button
                onClick={() => switchLang(lang === 'es' ? 'en' : 'es')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }}>
                <Globe size={13} />
                {lang === 'es' ? 'EN' : 'ES'}
              </button>
              <button onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }}>
                <LogOut size={14} />
                {t('sign_out')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-14 space-y-4">

        {/* Profile card */}
        <div className="card-lg text-center" style={{ border: '2px solid #D1FAE5' }}>
          <div className="flex justify-center mb-3">
            <CompanionAvatar companionId={companionId} size={72} showGlow />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>{profile?.name}</h2>
          <p style={{ fontSize: 14, color: companion.color, fontWeight: 600, marginTop: 2 }}>
            {companion.name} · {companion.specialty}
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: '#6B7280', fontWeight: 500 }}>{t('profile_level', levelInfo.level, levelInfo.name)}</span>
              <span style={{ color: '#9CA3AF' }}>{xp} XP</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #059669, #047857)' }} />
            </div>
            {levelInfo.next && (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' }}>
                {t('profile_xp_to_next', levelInfo.next - xp, levelInfo.level + 1)}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '💎', value: profile?.gems || 0,   label: t('profile_gems'),   color: '#6366F1' },
            { icon: '🪙', value: profile?.coins || 0,  label: t('profile_coins'), color: '#D97706' },
            { icon: '🔥', value: profile?.streak || 0, label: t('profile_streak'), color: '#F97316' },
          ].map((s, i) => (
            <div key={i} className="card text-center py-3">
              <p style={{ fontSize: 24 }}>{s.icon}</p>
              <p style={{ fontWeight: 900, fontSize: 20, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ingreso mensual */}
        <div className="card-lg">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>💰 {t('profile_monthly_income')}</p>
            {!editingSalary ? (
              <button onClick={() => setEditingSalary(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: '#F3F4F6', color: '#374151' }}>
                <Edit3 size={12} /> {t('edit')}
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingSalary(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#FEE2E2' }}>
                  <X size={14} color="#DC2626" />
                </button>
                <button onClick={handleSaveSalary} disabled={savingSalary}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#D1FAE5' }}>
                  <Check size={14} color="#047857" />
                </button>
              </div>
            )}
          </div>
          {editingSalary ? (
            <input
              className="input-field"
              type="number"
              placeholder="Ej: 3500"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              inputMode="decimal"
            />
          ) : (
            <p style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>
              {profile?.monthly_income ? formatCurrency(profile.monthly_income) : '—'}
            </p>
          )}
        </div>

        {/* Compañero */}
        <Link href="/companions">
          <div className="card-lg flex items-center gap-4" style={{ border: `1.5px solid ${companion.color}30` }}>
            <CompanionAvatar companionId={companionId} size={52} showGlow />
            <div className="flex-1">
              <p style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{t('profile_companion')} {companion.name}</p>
              <p style={{ fontSize: 12, color: companion.color, fontWeight: 600 }}>{companion.specialty}</p>
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{companion.desc}</p>
            </div>
            <ChevronRight size={18} color="#9CA3AF" />
          </div>
        </Link>

        {/* Badges */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 12 }}>{t('profile_badges')}</p>
          <div className="grid grid-cols-3 gap-3">
            {earnedBadges.map((badge, i) => (
              <div key={i} className="card text-center py-3" style={{ opacity: badge.earned ? 1 : 0.35 }}>
                <p style={{ fontSize: 26, marginBottom: 4 }}>{badge.icon}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>{badge.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Estadísticas del mes */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 12 }}>{t('profile_stats')}</p>
          <div className="card-lg space-y-4">
            {[
              { label: t('profile_stat_income'),  value: formatCurrency(totalIncome), color: '#047857' },
              { label: t('profile_stat_expense'), value: formatCurrency(totalExpense), color: '#DC2626' },
              { label: t('profile_stat_daily'),   value: formatCurrency(avgDaily),   color: '#D97706' },
              { label: t('profile_stat_balance'), value: formatCurrency(totalIncome - totalExpense), color: totalIncome >= totalExpense ? '#047857' : '#DC2626' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <p style={{ fontSize: 14, color: '#374151' }}>{s.label}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/budget" className="card flex items-center gap-3">
            <span style={{ fontSize: 22 }}>📊</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{t('profile_budget_link')}</span>
          </Link>
          <Link href="/debt-dungeon" className="card flex items-center gap-3">
            <span style={{ fontSize: 22 }}>🐉</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>Debt Dungeon</span>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
