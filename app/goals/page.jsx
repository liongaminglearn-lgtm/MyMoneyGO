'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getUser, getGoals, addGoal, updateGoal, deleteGoal,
  getProfile, updateProfile,
  getBills, addBill, updateBill, deleteBill, addTransaction,
} from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { ChevronLeft, Plus, X, Mountain, Trash2, Sword, Check, Pencil, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Mountain SVG ────────────────────────────────────────────────────────────
function MountainVisual({ pct }) {
  return (
    <svg viewBox="0 0 260 120" style={{ width: '100%', maxWidth: 260, height: 120 }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>
        <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </linearGradient>
        <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3F4F6" />
        </linearGradient>
        <linearGradient id="progress-green" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="260" height="120" fill="url(#sky)" />
      <polygon points="130,8 30,110 230,110" fill="url(#mountain)" />
      <polygon points="130,8 100,45 160,45" fill="url(#snow)" />
      <rect x="0" y="108" width="260" height="12" fill="#D1FAE5" rx="4"/>
      {pct > 0 && (
        <line x1="130" y1="110" x2={130 - (100 * Math.min(pct, 1))} y2={110 - (102 * Math.min(pct, 1))}
          stroke="url(#progress-green)" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 3" />
      )}
      <text
        x={130 - (100 * Math.min(pct, 0.98)) + (pct > 0 ? -5 : 0)}
        y={110 - (102 * Math.min(pct, 0.98)) + 4}
        fontSize="14" textAnchor="middle">
        🧗
      </text>
      <text x="130" y="18" fontSize="12" textAnchor="middle">🚩</text>
    </svg>
  )
}

// ─── Bills constants ──────────────────────────────────────────────────────────
const BILL_CATEGORIES = [
  { id: 'rent',        name: 'Arriendo',   icon: '🏠', color: '#EC4899' },
  { id: 'electricity', name: 'Luz',        icon: '💡', color: '#F59E0B' },
  { id: 'water',       name: 'Agua',       icon: '💧', color: '#60A5FA' },
  { id: 'gas',         name: 'Gas',        icon: '🔥', color: '#F97316' },
  { id: 'internet',    name: 'Internet',   icon: '📡', color: '#8B5CF6' },
  { id: 'phone',       name: 'Celular',    icon: '📱', color: '#06B6D4' },
  { id: 'streaming',   name: 'Streaming',  icon: '📺', color: '#EF4444' },
  { id: 'insurance',   name: 'Seguro',     icon: '🛡️', color: '#10B981' },
  { id: 'credit',      name: 'Crédito',    icon: '💳', color: '#6366F1' },
  { id: 'gym',         name: 'Gimnasio',   icon: '💪', color: '#F43F5E' },
  { id: 'transport',   name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
  { id: 'other',       name: 'Otro',       icon: '📦', color: '#6B7280' },
]

const FREQUENCY_LABELS = { monthly: 'Mensual', quarterly: 'Trimestral', annual: 'Anual' }
const PAYMENT_METHODS = ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'PSE', 'Nequi', 'Daviplata']

function getCatById(id) {
  return BILL_CATEGORIES.find(c => c.id === id) || BILL_CATEGORIES[BILL_CATEGORIES.length - 1]
}

function getDueBadge(dueDay, t) {
  const today = new Date().getDate()
  const diff = dueDay - today
  if (diff < 0) return { label: t ? t('bills_due') : 'Overdue', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }
  if (diff === 0) return { label: t ? t('bills_due_today') : 'Today!', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
  if (diff <= 3) return { label: `${diff}d`, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
  return { label: t ? t('bills_due_day', dueDay) : `Day ${dueDay}`, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const router = useRouter()
  const [tab, setTab] = useState('metas')
  const { t } = useLanguage()

  // ── Auth ──
  const [userId, setUserId] = useState(null)

  // ── Goals state ──
  const [goals, setGoals] = useState([])
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmt, setDepositAmt] = useState('')
  const [savingDeposit, setSavingDeposit] = useState(false)
  const [xpFlash, setXpFlash] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [goalEmoji, setGoalEmoji] = useState('🎯')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  // ── Bills state ──
  const [bills, setBills] = useState([])
  const [billsLoading, setBillsLoading] = useState(true)
  const [billFilter, setBillFilter] = useState('all')
  const [showBillForm, setShowBillForm] = useState(false)
  const [editBill, setEditBill] = useState(null)
  const [savingBill, setSavingBill] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  // Bill form fields
  const [bName, setBName] = useState('')
  const [bCompany, setBCompany] = useState('')
  const [bAmount, setBAmount] = useState('')
  const [bCategory, setBCategory] = useState('other')
  const [bDueDay, setBDueDay] = useState(1)
  const [bFrequency, setBFrequency] = useState('monthly')
  const [bPaymentMethod, setBPaymentMethod] = useState('Débito')
  const [bNotes, setBNotes] = useState('')

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)

      const [{ data: gs }, { data: bs }] = await Promise.all([
        getGoals(u.id),
        getBills(u.id),
      ])
      const goalList = gs || []
      setGoals(goalList)
      if (goalList.length > 0) setSelectedGoal(goalList[0])
      setGoalsLoading(false)

      setBills(bs || [])
      setBillsLoading(false)
    }
    load()
  }, [router])

  // ── Goals handlers ──────────────────────────────────────────────────────────
  async function handleAddGoal(e) {
    e.preventDefault()
    if (!goalName || !targetAmount) return
    setSavingGoal(true)
    const { data } = await addGoal({
      user_id: userId,
      name: goalName, emoji: goalEmoji,
      target_amount: Number(targetAmount),
      current_amount: 0,
      deadline: deadline || null,
    })
    if (data && data[0]) {
      const newGoals = [data[0], ...goals]
      setGoals(newGoals)
      setSelectedGoal(data[0])
      setGoalName(''); setGoalEmoji('🎯'); setTargetAmount(''); setDeadline('')
      setShowGoalForm(false)
    }
    setSavingGoal(false)
  }

  async function handleDeposit() {
    if (!depositAmt || !selectedGoal) return
    setSavingDeposit(true)
    const newAmount = (selectedGoal.current_amount || 0) + Number(depositAmt)
    const { data } = await updateGoal(selectedGoal.id, { current_amount: newAmount })
    if (data && data[0]) {
      const updated = data[0]
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))
      setSelectedGoal(updated)
      const { data: profile } = await getProfile(userId)
      if (profile) await updateProfile(userId, { xp: (profile.xp || 0) + 25 })
      setXpFlash(true)
      setTimeout(() => setXpFlash(false), 1400)
    }
    setDepositAmt('')
    setShowDeposit(false)
    setSavingDeposit(false)
  }

  // ── Bills handlers ──────────────────────────────────────────────────────────
  function openAddBill() {
    setEditBill(null)
    setBName(''); setBCompany(''); setBAmount(''); setBCategory('other')
    setBDueDay(1); setBFrequency('monthly'); setBPaymentMethod('Débito'); setBNotes('')
    setShowBillForm(true)
  }

  function openEditBill(bill) {
    setEditBill(bill)
    setBName(bill.name || ''); setBCompany(bill.company || '')
    setBAmount(bill.amount || ''); setBCategory(bill.category || 'other')
    setBDueDay(bill.due_day || 1); setBFrequency(bill.frequency || 'monthly')
    setBPaymentMethod(bill.payment_method || 'Débito'); setBNotes(bill.notes || '')
    setShowBillForm(true)
  }

  async function handleSaveBill(e) {
    e.preventDefault()
    if (!bName || !bAmount) return
    setSavingBill(true)
    const payload = {
      name: bName, company: bCompany, amount: Number(bAmount),
      category: bCategory, due_day: Number(bDueDay),
      frequency: bFrequency, payment_method: bPaymentMethod, notes: bNotes,
    }
    if (editBill) {
      const { data } = await updateBill(editBill.id, payload)
      if (data && data[0]) setBills(prev => prev.map(b => b.id === editBill.id ? data[0] : b))
    } else {
      const { data } = await addBill({ ...payload, user_id: userId, is_paid: false })
      if (data && data[0]) setBills(prev => [data[0], ...prev])
    }
    setShowBillForm(false)
    setSavingBill(false)
  }

  async function togglePaid(bill) {
    setTogglingId(bill.id)
    const nowPaid = !bill.is_paid
    const { data } = await updateBill(bill.id, { is_paid: nowPaid })
    if (data && data[0]) {
      setBills(prev => prev.map(b => b.id === bill.id ? data[0] : b))
      // Auto-register expense transaction when marking as paid
      if (nowPaid && userId) {
        const today = new Date().toISOString().split('T')[0]
        await addTransaction({
          user_id: userId,
          type: 'expense',
          category: bill.category || 'other',
          amount: bill.amount,
          note: bill.name + (bill.company ? ` — ${bill.company}` : ''),
          date: today,
        })
      }
    }
    setTogglingId(null)
  }

  async function handleDeleteBill(id) {
    await deleteBill(id)
    setBills(prev => prev.filter(b => b.id !== id))
  }

  // ── Computed ────────────────────────────────────────────────────────────────
  const goal = selectedGoal
  const pct = goal ? Math.min(1, (goal.current_amount || 0) / goal.target_amount) : 0
  const pctDisplay = Math.round(pct * 100)

  const monthlyNeeded = goal && goal.deadline
    ? (() => {
        const months = Math.max(1, Math.round((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)))
        return Math.ceil(((goal.target_amount || 0) - (goal.current_amount || 0)) / months)
      })()
    : null

  const filteredBills = bills.filter(b =>
    billFilter === 'all' ? true : billFilter === 'paid' ? b.is_paid : !b.is_paid
  ).sort((a, b) => (a.is_paid ? 1 : -1) * 1 || a.due_day - b.due_day)

  const totalMonthly = bills.reduce((s, b) => s + (b.amount || 0), 0)
  const totalPaid = bills.filter(b => b.is_paid).reduce((s, b) => s + (b.amount || 0), 0)
  const totalPending = totalMonthly - totalPaid
  const progressPct = totalMonthly > 0 ? Math.round((totalPaid / totalMonthly) * 100) : 0

  const GOAL_EMOJIS = ['🎯','🏠','🚗','✈️','💍','🎓','💻','🏖️','🐶','💪','🏋️','🎸']

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#FFFFFF' }}>

      {/* ── Header ── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6' }}>
        <div className="flex items-center justify-between px-5 pt-14 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                <ChevronLeft size={20} color="#374151" />
              </div>
            </Link>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>
                {tab === 'metas' ? t('goals_title') : t('bills_title')}
              </h1>
              <p style={{ fontSize: 12, color: '#6B7280' }}>
                {tab === 'metas' ? t('goals_subtitle') : t('bills_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => tab === 'metas' ? setShowGoalForm(true) : openAddBill()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#D1FAE5' }}>
            <Plus size={18} color="#047857" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-0 px-5 pb-0">
          {[
            { id: 'metas', label: t('goals_tab_goals') },
            { id: 'bills', label: t('goals_tab_bills') },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 text-sm font-bold transition-all"
              style={{
                borderBottom: tab === t.id ? '2.5px solid #059669' : '2.5px solid transparent',
                color: tab === t.id ? '#059669' : '#9CA3AF',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          METAS TAB
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'metas' && (
        <>
          {/* Goal selector pills */}
          {goals.length > 1 && (
            <div className="px-5 pt-3 flex gap-2 overflow-x-auto pb-1">
              {goals.map(g => (
                <button key={g.id} onClick={() => setSelectedGoal(g)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: selectedGoal?.id === g.id ? '#059669' : '#F3F4F6',
                    color: selectedGoal?.id === g.id ? '#FFFFFF' : '#374151',
                  }}>
                  {g.emoji} {g.name}
                </button>
              ))}
            </div>
          )}

          {goalsLoading ? (
            <div className="flex items-center justify-center py-20">
              <p style={{ color: '#059669', fontWeight: 700 }} className="animate-pulse">{t('goals_loading')}</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="px-5 mt-10 text-center">
              <Mountain size={64} color="#D1D5DB" className="mx-auto mb-4" />
              <p style={{ fontSize: 18, fontWeight: 800, color: '#374151' }}>{t('goals_empty_title')}</p>
              <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8, marginBottom: 24 }}>
                {t('goals_empty_desc')}
              </p>
              <button onClick={() => setShowGoalForm(true)} className="btn-primary" style={{ maxWidth: 240, margin: '0 auto' }}>
                {t('goals_empty_btn')}
              </button>
            </div>
          ) : goal && (
            <div className="px-5 mt-5 space-y-4">

              {/* Mountain visual */}
              <div className="card-lg text-center">
                <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                  {goal.emoji} {goal.name}
                </p>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                  {t('goals_target')} {formatCurrency(goal.target_amount)}
                </p>
                <MountainVisual pct={pct} />
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#047857' }}>{formatCurrency(goal.current_amount || 0)}</span>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>de {formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill"
                      style={{ width: `${pctDisplay}%`, background: 'linear-gradient(90deg, #059669, #047857)' }} />
                  </div>
                  <p style={{ fontSize: 13, color: '#047857', fontWeight: 700, marginTop: 6 }}>{t('goals_completed', pctDisplay)}</p>
                </div>
              </div>

              {monthlyNeeded && goal.current_amount < goal.target_amount && (
                <div className="card" style={{ background: '#EDE9FE', border: '1.5px solid #C4B5FD' }}>
                  <p style={{ fontSize: 13, color: '#5B21B6', lineHeight: 1.5 }}>
                    {t('goals_tip_save', formatCurrency(monthlyNeeded))}
                  </p>
                </div>
              )}

              {goal.current_amount >= goal.target_amount && (
                <div className="card text-center" style={{ background: '#D1FAE5', border: '2px solid #059669' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>🏆</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#047857' }}>{t('goals_reached_title')}</p>
                  <p style={{ fontSize: 13, color: '#15803D', marginTop: 4 }}>{t('goals_reached_desc')}</p>
                </div>
              )}

              {goal.current_amount < goal.target_amount && (
                <button onClick={() => setShowDeposit(true)} className="btn-primary">
                  {t('goals_add_savings_btn')}
                </button>
              )}

              <button
                onClick={async () => {
                  await deleteGoal(goal.id)
                  const remaining = goals.filter(g => g.id !== goal.id)
                  setGoals(remaining)
                  setSelectedGoal(remaining[0] || null)
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
                style={{ color: '#EF4444', background: '#FEF2F2' }}>
                <Trash2 size={15} />
                {t('goals_delete')}
              </button>

              <Link href="/debt-dungeon">
                <div className="card flex items-center gap-3" style={{ border: '1.5px solid #FEE2E2', background: '#FFF5F5' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#FEE2E2' }}>
                    🐉
                  </div>
                  <div className="flex-1">
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{t('goals_dungeon_title')}</p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>{t('goals_dungeon_desc')}</p>
                  </div>
                  <Sword size={18} color="#EF4444" />
                </div>
              </Link>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          FACTURAS TAB
      ════════════════════════════════════════════════════════════════ */}
      {tab === 'bills' && (
        <div className="px-5 mt-4 space-y-4">

          {billsLoading ? (
            <div className="flex items-center justify-center py-20">
              <p style={{ color: '#059669', fontWeight: 700 }} className="animate-pulse">{t('bills_loading')}</p>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>{t('bills_monthly_total')}</p>
                    <p style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>{formatCurrency(totalMonthly)}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '6px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{t('bills_paid')}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{progressPct}%</p>
                  </div>
                </div>
                <div className="flex gap-3 mb-3">
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 10px' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{t('bills_paid')}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{formatCurrency(totalPaid)}</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 10px' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{t('bills_pending')}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: totalPending > 0 ? '#FDE68A' : '#FFFFFF' }}>{formatCurrency(totalPending)}</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, background: '#FFFFFF', height: '100%', borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex gap-2">
                {[
                  { id: 'all', label: t('bills_filter_all') },
                  { id: 'pending', label: t('bills_filter_pending') },
                  { id: 'paid', label: t('bills_filter_paid') },
                ].map(f => (
                  <button key={f.id} onClick={() => setBillFilter(f.id)}
                    className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: billFilter === f.id ? '#059669' : '#F3F4F6',
                      color: billFilter === f.id ? '#FFFFFF' : '#6B7280',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Empty state */}
              {bills.length === 0 && (
                <div className="text-center py-10">
                  <p style={{ fontSize: 48, marginBottom: 12 }}>📋</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#374151' }}>{t('bills_empty_title')}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6, marginBottom: 20 }}>
                    {t('bills_empty_desc')}
                  </p>
                  <button onClick={openAddBill} className="btn-primary" style={{ maxWidth: 220, margin: '0 auto' }}>
                    {t('bills_empty_btn')}
                  </button>
                </div>
              )}

              {/* Bills list */}
              {filteredBills.map(bill => {
                const cat = getCatById(bill.category)
                const badge = getDueBadge(bill.due_day, t)
                const toggling = togglingId === bill.id
                return (
                  <div key={bill.id} className="card flex items-center gap-3"
                    style={{ opacity: bill.is_paid ? 0.65 : 1, transition: 'opacity 0.2s' }}>

                    {/* Category icon */}
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: cat.color + '22' }}>
                      {cat.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}
                          className={bill.is_paid ? 'line-through' : ''}>
                          {bill.name}
                        </p>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: badge.color,
                          background: badge.bg, borderRadius: 6, padding: '1px 6px',
                        }}>
                          {badge.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6B7280' }}>
                        {t('bills_cat_' + cat.id)}{bill.company ? ` · ${bill.company}` : ''} · {t(bill.frequency) || t('monthly')}
                      </p>
                      {bill.payment_method && (
                        <p style={{ fontSize: 11, color: '#9CA3AF' }}>{bill.payment_method}</p>
                      )}
                    </div>

                    {/* Amount + actions */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p style={{ fontSize: 15, fontWeight: 800, color: bill.is_paid ? '#059669' : '#111827' }}>
                        {formatCurrency(bill.amount)}
                      </p>
                      <div className="flex gap-1">
                        <button onClick={() => openEditBill(bill)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: '#F3F4F6' }}>
                          <Pencil size={12} color="#6B7280" />
                        </button>
                        <button onClick={() => handleDeleteBill(bill.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: '#FEF2F2' }}>
                          <Trash2 size={12} color="#EF4444" />
                        </button>
                        <button
                          onClick={() => togglePaid(bill)}
                          disabled={toggling}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: bill.is_paid ? '#D1FAE5' : '#F0FDF4',
                            border: `1.5px solid ${bill.is_paid ? '#059669' : '#D1FAE5'}`,
                          }}>
                          {toggling
                            ? <span style={{ fontSize: 10 }}>...</span>
                            : <Check size={13} color={bill.is_paid ? '#059669' : '#9CA3AF'} strokeWidth={3} />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Tip about auto-transaction */}
              {bills.length > 0 && (
                <div className="card flex items-start gap-2" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <AlertCircle size={14} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>
                    {t('bills_auto_tip')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Deposit modal ─────────────────────────────────────────────── */}
      {showDeposit && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeposit(false)} />
          <div className="relative w-full rounded-t-3xl" style={{ background: '#FFFFFF', padding: 24 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{t('goals_deposit_title')}</h2>
              <button onClick={() => setShowDeposit(false)}><X size={20} color="#6B7280" /></button>
            </div>
            <input
              className="input-field"
              style={{ fontSize: 28, fontWeight: 800, color: '#047857', marginBottom: 16 }}
              type="number" placeholder="0.00"
              value={depositAmt}
              onChange={e => setDepositAmt(e.target.value)}
              inputMode="decimal"
            />
            <button onClick={handleDeposit} disabled={savingDeposit || !depositAmt} className="btn-primary">
              {savingDeposit ? t('goals_deposit_saving') : t('goals_deposit_btn')}
            </button>
          </div>
        </div>
      )}

      {/* ── Add/Edit goal modal ───────────────────────────────────────── */}
      {showGoalForm && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowGoalForm(false)} />
          <div className="relative w-full rounded-t-3xl" style={{ background: '#FFFFFF', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{t('goals_new_title')}</h2>
              <button onClick={() => setShowGoalForm(false)}><X size={20} color="#6B7280" /></button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              <form id="goal-form" onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Emoji</label>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {GOAL_EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => setGoalEmoji(e)}
                        className="text-2xl p-2 rounded-xl transition-all"
                        style={{ background: goalEmoji === e ? '#D1FAE5' : '#F3F4F6', border: `2px solid ${goalEmoji === e ? '#059669' : 'transparent'}` }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nombre</label>
                  <input className="input-field" placeholder="Ej: Vacaciones a París" value={goalName} onChange={e => setGoalName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('goals_form_target')}</label>
                  <input className="input-field" type="number" placeholder="0.00" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} inputMode="decimal" required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('goals_form_deadline')}</label>
                  <input className="input-field" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
              </form>
            </div>
            <div className="px-6 py-4" style={{ borderTop: '1px solid #F3F4F6' }}>
              <button form="goal-form" type="submit" disabled={savingGoal} className="btn-primary">
                {savingGoal ? t('goals_form_saving') : t('goals_form_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit bill modal ───────────────────────────────────────── */}
      {showBillForm && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBillForm(false)} />
          <div className="relative w-full rounded-t-3xl" style={{ background: '#FFFFFF', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>
                {editBill ? t('bills_edit_title') : t('bills_new_title')}
              </h2>
              <button onClick={() => setShowBillForm(false)}><X size={20} color="#6B7280" /></button>
            </div>
            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <form id="bill-form" onSubmit={handleSaveBill} className="space-y-4">

                {/* Category grid */}
                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 8 }}>{t('bills_form_category')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BILL_CATEGORIES.map(cat => (
                      <button key={cat.id} type="button" onClick={() => setBCategory(cat.id)}
                        className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                        style={{
                          background: bCategory === cat.id ? cat.color + '22' : '#F9FAFB',
                          border: `2px solid ${bCategory === cat.id ? cat.color : 'transparent'}`,
                        }}>
                        <span style={{ fontSize: 20 }}>{cat.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: bCategory === cat.id ? cat.color : '#6B7280' }}>{t('bills_cat_' + cat.id)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('bills_form_name')} *</label>
                  <input className="input-field" placeholder="Ej: Internet fibra óptica" value={bName} onChange={e => setBName(e.target.value)} required />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('bills_form_company')}</label>
                  <input className="input-field" placeholder="Ej: Claro, EPM, DirecTV" value={bCompany} onChange={e => setBCompany(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Monto *</label>
                  <input className="input-field" type="number" placeholder="0.00" value={bAmount} onChange={e => setBAmount(e.target.value)} inputMode="decimal" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('bills_form_due_day')}</label>
                    <input className="input-field" type="number" min={1} max={31} value={bDueDay} onChange={e => setBDueDay(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('bills_form_frequency')}</label>
                    <select className="input-field" value={bFrequency} onChange={e => setBFrequency(e.target.value)}>
                      {Object.keys(FREQUENCY_LABELS).map(k => (
                        <option key={k} value={k}>{t(k)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('bills_form_payment')}</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m} type="button" onClick={() => setBPaymentMethod(m)}
                        className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                        style={{
                          background: bPaymentMethod === m ? '#059669' : '#F3F4F6',
                          color: bPaymentMethod === m ? '#FFFFFF' : '#374151',
                        }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Notas</label>
                  <input className="input-field" placeholder={t('bills_form_notes_ph')} value={bNotes} onChange={e => setBNotes(e.target.value)} />
                </div>
              </form>
            </div>
            <div className="px-6 py-4" style={{ borderTop: '1px solid #F3F4F6' }}>
              <button form="bill-form" type="submit" disabled={savingBill} className="btn-primary">
                {savingBill ? t('bills_form_saving') : editBill ? t('bills_form_btn_save') : t('bills_form_btn_add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {xpFlash && <div className="xp-float">⚡ +25 XP ¡Buen ahorro!</div>}
      <BottomNav />
    </div>
  )
}
