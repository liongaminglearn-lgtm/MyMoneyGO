'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getProfile, getTransactions, getDebts } from '@/lib/supabase'
import { calculateLevel, getLevelProgress, formatCurrency, getCurrentMonth } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import CompanionAvatar, { COMPANIONS } from '@/components/ui/CompanionAvatar'
import { ChevronRight, ChevronLeft, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

function offsetMonth(base, delta) {
  const [y, m] = base.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTH_KEYS = ['month_jan','month_feb','month_mar','month_apr','month_may','month_jun','month_jul','month_aug','month_sep','month_oct','month_nov','month_dec']

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [xpFlash, setXpFlash] = useState(false)
  const [userId, setUserId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
      const [{ data: prof }, { data: txns }, { data: dts }] = await Promise.all([
        getProfile(u.id),
        getTransactions(u.id, selectedMonth),
        getDebts(u.id),
      ])
      setProfile(prof)
      setTransactions(txns || [])
      setDebts(dts || [])
      setLoading(false)
    }
    load()
  }, [router, selectedMonth])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🎮</div>
        <p style={{ color: '#059669', fontWeight: 800 }} className="animate-pulse">{t('dashboard_loading')}</p>
      </div>
    </div>
  )

  // ── Computed ─────────────────────────────────────────────────
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense  = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance  = income - expense
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const spentPct = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0

  const levelInfo  = calculateLevel(profile?.xp || 0)
  const progress   = getLevelProgress(profile?.xp || 0)
  const companionId = profile?.companion_id || 'nova'
  const companion   = COMPANIONS[companionId] || COMPANIONS.nova
  const activeMission = debts[0]

  const [selY, selM] = selectedMonth.split('-').map(Number)
  const monthLabel   = `${t(MONTH_KEYS[selM - 1])} ${selY}`
  const isCurrentMonth = selectedMonth === getCurrentMonth()

  const recentTxns = transactions.slice(0, 6)

  // Category label map for display
  const CAT_LABELS = {
    housing: t('cat_housing'), food: t('cat_food'), transport: t('cat_transport'),
    health: t('cat_health'), entertainment: t('cat_entertainment'), education: t('cat_education'),
    savings: t('cat_savings'), salary: t('cat_salary'), freelance: t('cat_freelance'),
    other: t('cat_other'), debt: t('cat_debt'), clothing: t('cat_clothing'),
    utilities: t('cat_utilities'), subscriptions: t('cat_subscriptions'), credit_card: t('cat_credit_card'),
  }

  const barColor = spentPct >= 90 ? '#EF4444' : spentPct >= 70 ? '#F97316' : '#059669'
  const balanceColor = balance >= 0 ? '#047857' : '#DC2626'

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#F9FAFB' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(160deg, #059669 0%, #064E3B 100%)', paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="px-5 pt-3 pb-24">

          {/* Top row: avatar + name + coins */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/companions">
                <CompanionAvatar companionId={companionId} size={46} showGlow />
              </Link>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t('dashboard_greeting', profile?.name?.split(' ')[0] || '👋')}</p>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{t('dashboard_level', levelInfo.level)}</span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>· {levelInfo.name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/missions">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
                  <span style={{ fontSize: 13 }}>🪙</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{profile?.coins || 0}</span>
                </div>
              </Link>
            </div>
          </div>

          {/* XP bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-1.5">
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>XP: {profile?.xp || 0}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{progress}%</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#fff', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          {/* Month selector */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <button onClick={() => setSelectedMonth(offsetMonth(selectedMonth, -1))}
              style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronLeft size={18} color="#fff" />
            </button>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: 0.3 }}>{monthLabel}</span>
            <button onClick={() => !isCurrentMonth && setSelectedMonth(offsetMonth(selectedMonth, 1))}
              style={{ background: isCurrentMonth ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCurrentMonth ? 'default' : 'pointer' }}>
              <ChevronRight size={18} color={isCurrentMonth ? 'rgba(255,255,255,0.3)' : '#fff'} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero balance card ─────────────────────────────── */}
      <div className="px-4 -mt-16">
        <div style={{ background: '#fff', borderRadius: 24, padding: '20px 20px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>

          {/* Balance */}
          <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>{t('dashboard_balance').toUpperCase()}</p>
          <p style={{ fontSize: 34, fontWeight: 900, color: balanceColor, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>
            {balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance))}
          </p>

          {/* Income vs Expense */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <div style={{ background: '#ECFDF5', borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <TrendingUp size={13} color="#059669" />
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>{t('dashboard_income').toUpperCase()}</span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 900, color: '#047857', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(income)}</p>
            </div>
            <div style={{ background: '#FEF2F2', borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <TrendingDown size={13} color="#DC2626" />
                <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>{t('dashboard_expense').toUpperCase()}</span>
              </div>
              <p style={{ fontSize: 17, fontWeight: 900, color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(expense)}</p>
            </div>
          </div>

          {/* Spending bar */}
          {income > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{t('dashboard_spent_label')}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{spentPct}%</span>
              </div>
              <div style={{ height: 7, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${spentPct}%`, background: barColor, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* ── Acciones rápidas ───────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href="/transactions?type=income">
            <div style={{ background: '#059669', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color="#fff" />
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{t('dashboard_income_label')}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>+10 XP</p>
              </div>
            </div>
          </Link>
          <Link href="/transactions?type=expense">
            <div style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid #FEE2E2' }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color="#DC2626" />
              </div>
              <div>
                <p style={{ color: '#111827', fontWeight: 800, fontSize: 14 }}>{t('dashboard_expense_label')}</p>
                <p style={{ color: '#9CA3AF', fontSize: 11 }}>+10 XP</p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Últimos movimientos ────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 10px' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('dashboard_recent')}</p>
            <Link href="/transactions">
              <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{t('dashboard_see_all')} →</span>
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <div style={{ padding: '20px 16px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, marginBottom: 6 }}>📭</p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>{t('dashboard_no_txns')}</p>
              <Link href="/transactions?type=expense">
                <p style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginTop: 8 }}>{t('dashboard_add_first')}</p>
              </Link>
            </div>
          ) : (
            <div>
              {recentTxns.map((txn, i) => {
                const isIncome = txn.type === 'income'
                const emoji = isIncome ? '💰' : { housing:'🏠', food:'🍔', transport:'🚗', health:'💊', entertainment:'🎮', education:'📚', savings:'🏦', other:'📦', debt:'⚔️', clothing:'👕', utilities:'💡', subscriptions:'📱', credit_card:'💳' }[txn.category] || '📦'
                return (
                  <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #F9FAFB' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 13, background: isIncome ? '#ECFDF5' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                      {emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {txn.note || CAT_LABELS[txn.category] || (isIncome ? t('dashboard_income_label') : t('dashboard_expense_label'))}
                      </p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{txn.date} · {CAT_LABELS[txn.category] || txn.category}</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: isIncome ? '#059669' : '#374151', flexShrink: 0 }}>
                      {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Misión activa / Deudas ─────────────────────── */}
        {activeMission ? (
          <Link href="/debt-dungeon">
            <div style={{ background: '#fff', borderRadius: 20, padding: '16px', border: '1.5px solid #FEF3C7', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: 20 }}>⚔️ {t('dashboard_active_mission').toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                  {activeMission.boss_emoji || '🐉'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{t('dashboard_defeat', activeMission.boss_name || activeMission.name)}</p>
                  <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>{formatCurrency(activeMission.balance)} {t('dashboard_remaining')}</p>
                  <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginTop: 8 }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #059669, #047857)',
                      width: `${Math.max(4, ((activeMission.original_balance - activeMission.balance) / activeMission.original_balance) * 100)}%` }} />
                  </div>
                </div>
                <ChevronRight size={16} color="#D97706" style={{ flexShrink: 0 }} />
              </div>
              {debts.length > 1 && (
                <p style={{ fontSize: 11, color: '#D97706', fontWeight: 600, marginTop: 10, textAlign: 'center' }}>
                  {t('dashboard_more_debts', debts.length - 1)}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/debt-dungeon">
            <div style={{ background: '#fff', borderRadius: 20, padding: '16px', border: '1.5px dashed #E5E7EB', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 28, marginBottom: 4 }}>🗡️</p>
              <p style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>Debt Dungeon</p>
              <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 3 }}>{t('dashboard_dungeon_empty')}</p>
            </div>
          </Link>
        )}

        {/* ── Stats secundarias ──────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: '14px 10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#F97316' }}>{profile?.streak || 0}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>🔥 {t('dashboard_streak')}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 18, padding: '14px 10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#059669' }}>{levelInfo.level}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>⚡ {t('dashboard_level_label')}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 18, padding: '14px 10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: totalDebt > 0 ? '#DC2626' : '#059669' }}>{totalDebt > 0 ? formatCurrency(totalDebt) : '✓'}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>⚔️ {t('dashboard_debts')}</p>
          </div>
        </div>

        {/* ── Accesos rápidos ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { href: '/transactions', emoji: '📋', label: t('dashboard_moves') },
            { href: '/budget',       emoji: '📊', label: t('dashboard_budget') },
            { href: '/goals',        emoji: '🎯', label: t('dashboard_goals') },
            { href: '/reports',      emoji: '📈', label: t('nav_reports') },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '12px 8px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: 22, marginBottom: 4 }}>{item.emoji}</p>
                <p style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Tip del compañero ──────────────────────────── */}
        <Link href="/coach">
          <div style={{ background: `${companion.color}0F`, borderRadius: 20, padding: '14px 16px', border: `1.5px solid ${companion.color}25` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <CompanionAvatar companionId={companionId} size={38} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: companion.color }}>💬 {companion.name} {t('dashboard_coach')}</p>
                <p style={{ fontSize: 13, color: '#374151', marginTop: 4, lineHeight: 1.5 }}>{companion.tip}</p>
              </div>
              <span style={{ fontSize: 10, color: companion.color, fontWeight: 700, background: `${companion.color}20`, padding: '4px 8px', borderRadius: 10, flexShrink: 0, alignSelf: 'center' }}>Coach →</span>
            </div>
          </div>
        </Link>

      </div>

      {xpFlash && <div className="xp-float">⚡ +10 XP</div>}
      <BottomNav />
    </div>
  )
}
