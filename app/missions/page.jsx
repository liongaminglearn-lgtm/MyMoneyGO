'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, getProfile, getTransactions, getBudgets } from '@/lib/supabase'
import { formatCurrency, CATEGORIES, getCurrentMonth } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { ChevronLeft, CheckCircle2, Lock, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

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
  const [transactions, setTransactions] = useState([])
  const [budgetMap, setBudgetMap] = useState({})
  const [selectedCalDay, setSelectedCalDay] = useState(() => new Date().getDate())

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      const [{ data: prof }, { data: txns }, { data: bdgs }] = await Promise.all([
        getProfile(u.id),
        getTransactions(u.id, getCurrentMonth()),
        getBudgets(u.id, getCurrentMonth()),
      ])
      setProfile(prof)
      setTransactions(txns || [])
      const bm = {}
      ;(bdgs || []).forEach(b => { bm[b.category] = b.amount })
      setBudgetMap(bm)
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

  // Calendar data
  const now = new Date()
  const todayDay = now.getDate()
  const calYear = now.getFullYear()
  const calMonth = now.getMonth()
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstWeekday = new Date(calYear, calMonth, 1).getDay()
  const DAYS_ES_CAL = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const spendByDay = {}
  transactions.filter(t => t.type === 'expense' && t.date?.startsWith(getCurrentMonth())).forEach(t => {
    const day = parseInt(t.date.split('-')[2], 10)
    spendByDay[day] = (spendByDay[day] || 0) + t.amount
  })
  const todaySpend = spendByDay[todayDay] || 0

  const safeCalDay = Math.min(selectedCalDay, daysInCalMonth)
  const selectedDayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(safeCalDay).padStart(2, '0')}`
  const selectedDayTxns = transactions.filter(t => t.type === 'expense' && t.date === selectedDayStr)
  const selectedDayTotal = spendByDay[safeCalDay] || 0

  function compactAmt(n) {
    if (n >= 10000) return `$${(n / 1000).toFixed(0)}k`
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
    return `$${Math.round(n)}`
  }

  // Top categories current month
  const monthExpenses = transactions.filter(t => t.type === 'expense' && t.date?.startsWith(getCurrentMonth()))
  const totalMonthExp = monthExpenses.reduce((s, t) => s + t.amount, 0)
  const catMap = {}
  monthExpenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount })
  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, amt]) => ({
      cat: CATEGORIES.find(c => c.id === id),
      id, amt,
      pct: totalMonthExp > 0 ? Math.round((amt / totalMonthExp) * 100) : 0,
    }))

  // ── Report data ──────────────────────────────────────────────
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalMonthExp
  const MONTHS_FULL_ES = MONTHS_FULL

  // Donut chart segments for expense categories
  const donutRadius = 44, donutCx = 55, donutCy = 55, donutStroke = 18
  const donutCirc = 2 * Math.PI * donutRadius
  let donutOffset = 0
  const donutSegs = topCats.map(item => {
    const pct = totalMonthExp > 0 ? item.amt / totalMonthExp : 0
    const seg = { ...item, dasharray: pct * donutCirc, start: donutOffset * donutCirc }
    donutOffset += pct
    return seg
  })

  // Budget vs actual rows
  const budgetRows = Object.entries(budgetMap).map(([catId, limit]) => {
    const cat = CATEGORIES.find(c => c.id === catId)
    const spent = (catMap[catId] || 0)
    const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
    return { catId, cat, limit, spent, pct }
  }).sort((a, b) => b.pct - a.pct)

  function exportReport() {
    const cur = getCurrentMonth()
    const [y, m] = cur.split('-')
    const monthName = `${MONTHS_FULL_ES[parseInt(m,10)-1]} ${y}`

    const sections = []

    // Section 1: Summary
    sections.push(['RESUMEN DEL MES — ' + monthName])
    sections.push(['Ingresos', totalIncome])
    sections.push(['Gastos', totalMonthExp])
    sections.push(['Balance', balance])
    sections.push([])

    // Section 2: Transactions
    sections.push(['TRANSACCIONES'])
    sections.push(['Fecha','Tipo','Categoría','Subcategoría','Monto','Descripción'])
    transactions.forEach(t => {
      const cat = CATEGORIES.find(c => c.id === t.category)
      sections.push([
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        cat?.name || t.category,
        t.subcategory || '',
        t.amount,
        t.note || '',
      ])
    })
    sections.push([])

    // Section 3: Budget vs Actual
    sections.push(['PRESUPUESTO VS GASTO'])
    sections.push(['Categoría','Presupuesto','Gastado','Diferencia','%'])
    budgetRows.forEach(r => {
      sections.push([
        r.cat?.name || r.catId,
        r.limit,
        r.spent,
        r.limit - r.spent,
        r.pct,
      ])
    })
    sections.push([])

    // Section 4: Top categories
    sections.push(['TOP CATEGORÍAS'])
    sections.push(['Categoría','Monto','% del total'])
    topCats.forEach(item => {
      sections.push([item.cat?.name || item.id, item.amt, item.pct])
    })

    const csv = sections.map(row =>
      row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mymoneygo-reporte-${cur}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const missionGroups = { daily: DAILY_MISSIONS, weekly: WEEKLY_MISSIONS, special: SPECIAL_MISSIONS }
  const currentMissions = missionGroups[activeTab] || []
  const completedCount = currentMissions.filter(m => completed[m.id]).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
      <p style={{ color: '#059669', fontWeight: 700 }} className="animate-pulse">Cargando misiones...</p>
    </div>
  )

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#FFFFFF' }}>

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
                color: activeTab === tab.id ? '#059669' : '#6B7280',
                borderBottom: activeTab === tab.id ? '2.5px solid #059669' : '2px solid transparent',
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
                      <CheckCircle2 size={22} color="#059669" />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="chip chip-purple">⚡ +{mission.xp} XP</span>
                    <span className="chip chip-yellow">🪙 +{mission.coins}</span>
                    {!isDone && !isLocked && (
                      <button
                        onClick={() => handleComplete(mission)}
                        className="ml-auto px-4 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: '#059669', color: '#FFFFFF' }}>
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

      {/* ── Calendario de gastos del mes ── */}
      <div className="px-5 mt-6">
        <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
          📅 {MONTHS_FULL[calMonth]} {calYear}
        </p>
        <div className="card-lg">
          {/* Encabezados de día */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS_ES_CAL.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#9CA3AF', paddingBottom: 2 }}>
                {d}
              </div>
            ))}
          </div>
          {/* Celdas del calendario */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInCalMonth }, (_, i) => i + 1).map(day => {
              const isToday = day === todayDay
              const isSelected = day === selectedCalDay
              const isFuture = day > todayDay
              const spend = spendByDay[day] || 0
              return (
                <div key={day}
                  onClick={() => setSelectedCalDay(day)}
                  style={{
                    padding: '5px 2px',
                    borderRadius: 8,
                    background: isToday ? '#059669' : isSelected ? '#ECFDF5' : spend > 0 ? '#FEF2F2' : 'transparent',
                    border: isSelected && !isToday ? '1.5px solid #059669' : '1.5px solid transparent',
                    textAlign: 'center',
                    minHeight: 44,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: isToday || isSelected ? 800 : 500,
                    color: isToday ? '#FFFFFF' : isSelected ? '#059669' : isFuture ? '#D1D5DB' : '#374151',
                    lineHeight: 1,
                  }}>
                    {day}
                  </span>
                  {spend > 0 && (
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: isToday ? 'rgba(255,255,255,0.9)' : isSelected ? '#059669' : '#DC2626',
                      marginTop: 2,
                      lineHeight: 1.2,
                    }}>
                      {compactAmt(spend)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {/* Detalle del día seleccionado */}
          <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 14, paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                  {safeCalDay === todayDay ? '📍 Hoy' : `${safeCalDay} de ${MONTHS_FULL[calMonth]}`}
                </p>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                  {selectedDayTxns.length === 0 ? 'Sin gastos' : `${selectedDayTxns.length} ${selectedDayTxns.length === 1 ? 'gasto' : 'gastos'}`}
                </p>
              </div>
              <p style={{ fontSize: 18, fontWeight: 900, color: selectedDayTotal > 0 ? '#DC2626' : '#9CA3AF' }}>
                {selectedDayTotal > 0 ? formatCurrency(selectedDayTotal) : '—'}
              </p>
            </div>
            {selectedDayTxns.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '8px 0' }}>
                {safeCalDay > todayDay ? 'Día futuro' : 'Sin gastos este día'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedDayTxns.map(t => {
                  const cat = CATEGORIES.find(c => c.id === t.category)
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat?.color || '#9CA3AF'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                        {cat?.icon || '📦'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.note || cat?.name || 'Gasto'}
                        </p>
                        <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                          {cat?.name}{t.subcategory ? ` › ${t.subcategory}` : ''}
                        </p>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#DC2626', flexShrink: 0 }}>
                        -{formatCurrency(t.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Top categorías del mes ── */}
      <div className="px-5 mt-5 mb-6">
        <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>🏆 Top categorías del mes</p>
        <div className="card-lg" style={{ gap: 0 }}>
          {topCats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '8px 0' }}>
              Sin gastos registrados este mes
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topCats.map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{item.cat?.icon || '📦'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.cat?.name || item.id}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{formatCurrency(item.amt)}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>{item.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${item.pct}%`,
                      background: item.cat?.color || '#9CA3AF',
                      borderRadius: 99,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
              {totalMonthExp > 0 && (
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Total gastado</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#DC2626' }}>{formatCurrency(totalMonthExp)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Reporte mensual ── */}
      <div className="px-5 mt-5 mb-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>📋 Reporte del mes</p>
          <button onClick={exportReport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#059669', color: '#fff', border: 'none', borderRadius: 12, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Download size={14} />
            Descargar Excel
          </button>
        </div>

        {/* Tarjetas resumen */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: '#ECFDF5', borderRadius: 16, padding: '12px 10px', textAlign: 'center' }}>
            <TrendingUp size={18} color="#059669" style={{ margin: '0 auto 4px' }} />
            <p style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginBottom: 2 }}>INGRESOS</p>
            <p style={{ fontSize: 13, fontWeight: 900, color: '#047857' }}>{formatCurrency(totalIncome)}</p>
          </div>
          <div style={{ background: '#FEF2F2', borderRadius: 16, padding: '12px 10px', textAlign: 'center' }}>
            <TrendingDown size={18} color="#DC2626" style={{ margin: '0 auto 4px' }} />
            <p style={{ fontSize: 10, color: '#DC2626', fontWeight: 700, marginBottom: 2 }}>GASTOS</p>
            <p style={{ fontSize: 13, fontWeight: 900, color: '#DC2626' }}>{formatCurrency(totalMonthExp)}</p>
          </div>
          <div style={{ background: balance >= 0 ? '#ECFDF5' : '#FEF2F2', borderRadius: 16, padding: '12px 10px', textAlign: 'center' }}>
            <Wallet size={18} color={balance >= 0 ? '#059669' : '#DC2626'} style={{ margin: '0 auto 4px' }} />
            <p style={{ fontSize: 10, color: balance >= 0 ? '#059669' : '#DC2626', fontWeight: 700, marginBottom: 2 }}>BALANCE</p>
            <p style={{ fontSize: 13, fontWeight: 900, color: balance >= 0 ? '#047857' : '#DC2626' }}>{formatCurrency(Math.abs(balance))}{balance < 0 ? ' ⚠️' : ''}</p>
          </div>
        </div>

        {/* Gráfica de donut — distribución de gastos */}
        {topCats.length > 0 && (
          <div className="card-lg" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Distribución de gastos</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg viewBox="0 0 110 110" style={{ width: 110, height: 110, transform: 'rotate(-90deg)' }}>
                  <circle cx={donutCx} cy={donutCy} r={donutRadius} fill="none" stroke="#F3F4F6" strokeWidth={donutStroke} />
                  {donutSegs.map((s, i) => (
                    <circle key={i} cx={donutCx} cy={donutCy} r={donutRadius}
                      fill="none" stroke={s.cat?.color || '#9CA3AF'} strokeWidth={donutStroke}
                      strokeDasharray={`${s.dasharray} ${donutCirc - s.dasharray}`}
                      strokeDashoffset={-s.start} strokeLinecap="butt" />
                  ))}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>TOTAL</p>
                  <p style={{ fontSize: 12, fontWeight: 900, color: '#111827' }}>{formatCurrency(totalMonthExp)}</p>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {donutSegs.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: s.cat?.color || '#9CA3AF', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.cat?.icon} {s.cat?.name || s.id}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Presupuesto vs Gasto */}
        {budgetRows.length > 0 && (
          <div className="card-lg" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Presupuesto vs Gasto</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {budgetRows.map(r => (
                <div key={r.catId}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{r.cat?.icon || '📦'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{r.cat?.name || r.catId}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: r.pct >= 100 ? '#DC2626' : r.pct >= 80 ? '#D97706' : '#059669' }}>
                        {formatCurrency(r.spent)}
                      </span>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}> / {formatCurrency(r.limit)}</span>
                    </div>
                  </div>
                  <div style={{ position: 'relative', height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, height: '100%',
                      width: `${r.pct}%`,
                      background: r.pct >= 100 ? '#EF4444' : r.pct >= 80 ? '#F97316' : '#059669',
                      borderRadius: 99,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: 10, color: r.pct >= 100 ? '#DC2626' : '#9CA3AF', marginTop: 3, textAlign: 'right' }}>
                    {r.pct >= 100 ? `Excedido ${formatCurrency(r.spent - r.limit)}` : `Disponible ${formatCurrency(r.limit - r.spent)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gráfica de barras horizontales — ingresos vs gastos */}
        <div className="card-lg" style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Ingresos vs Gastos</p>
          {[
            { label: 'Ingresos', value: totalIncome, color: '#059669', max: Math.max(totalIncome, totalMonthExp, 1) },
            { label: 'Gastos', value: totalMonthExp, color: '#EF4444', max: Math.max(totalIncome, totalMonthExp, 1) },
          ].map(bar => (
            <div key={bar.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{bar.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: bar.color }}>{formatCurrency(bar.value)}</span>
              </div>
              <div style={{ height: 10, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${bar.max > 0 ? Math.round((bar.value / bar.max) * 100) : 0}%`,
                  background: bar.color,
                  borderRadius: 99,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Balance neto</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: balance >= 0 ? '#047857' : '#DC2626' }}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>

      {xpFlash && <div className="xp-float">{xpFlash} ¡Misión!</div>}
      <BottomNav />
    </div>
  )
}
