'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getTransactions } from '@/lib/supabase'
import { formatCurrency, CATEGORIES } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { Download, TrendingUp, TrendingDown, Wallet, Hash, ChevronLeft, ChevronDown } from 'lucide-react'

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getPresetRange(preset) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const to = toDateStr(today)

  if (preset === 'today') {
    return { from: to, to }
  }
  if (preset === 'week') {
    const mon = new Date(today)
    mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
    return { from: toDateStr(mon), to }
  }
  if (preset === 'month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toDateStr(first), to }
  }
  if (preset === 'lastmonth') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const last = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: toDateStr(first), to: toDateStr(last) }
  }
  if (preset === 'quarter') {
    const q = new Date(today)
    q.setMonth(today.getMonth() - 2)
    q.setDate(1)
    return { from: toDateStr(q), to }
  }
  if (preset === 'year') {
    return { from: `${today.getFullYear()}-01-01`, to }
  }
  return null
}

const PRESETS = [
  { key: 'today',     label: 'Hoy' },
  { key: 'week',      label: 'Esta semana' },
  { key: 'month',     label: 'Este mes' },
  { key: 'lastmonth', label: 'Mes pasado' },
  { key: 'quarter',   label: '3 meses' },
  { key: 'year',      label: 'Este año' },
  { key: 'custom',    label: 'Personalizado' },
]

const CAT_COLORS = {
  housing:'#6366F1', food:'#F97316', transport:'#3B82F6',
  health:'#EF4444', entertainment:'#8B5CF6', education:'#EC4899',
  savings:'#059669', salary:'#059669', freelance:'#06B6D4',
  other:'#9CA3AF', debt:'#DC2626', clothing:'#F59E0B', utilities:'#14B8A6',
}

function DonutChart({ segs, total }) {
  const r = 44, cx = 55, cy = 55, sw = 18, circ = 2 * Math.PI * r
  let off = 0
  const arcs = segs.map(s => {
    const pct = total > 0 ? s.amt / total : 0
    const arc = { ...s, da: pct * circ, start: off * circ }
    off += pct
    return arc
  })
  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <svg viewBox="0 0 110 110" style={{ width: 110, height: 110, transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={sw} />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={a.color} strokeWidth={sw}
            strokeDasharray={`${a.da} ${circ - a.da}`}
            strokeDashoffset={-a.start} strokeLinecap="butt" />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>TOTAL</p>
        <p style={{ fontSize: 11, fontWeight: 900, color: '#111827' }}>{formatCurrency(total)}</p>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [transactions, setTransactions] = useState([])

  const [activePreset, setActivePreset] = useState('month')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [showAllTxns, setShowAllTxns] = useState(false)

  // Init with current month preset
  useEffect(() => {
    const range = getPresetRange('month')
    setFromDate(range.from)
    setToDate(range.to)
    setCustomFrom(range.from)
    setCustomTo(range.to)
  }, [])

  // Auth
  useEffect(() => {
    getUser().then(u => {
      if (!u) { router.push('/auth/login'); return }
      setUserId(u.id)
    })
  }, [router])

  // Load transactions when date range or user changes
  const load = useCallback(async () => {
    if (!userId || !fromDate || !toDate) return
    setLoading(true)
    const { data } = await getTransactions(userId, null, fromDate, toDate)
    setTransactions(data || [])
    setLoading(false)
  }, [userId, fromDate, toDate])

  useEffect(() => { load() }, [load])

  function applyPreset(key) {
    setActivePreset(key)
    setShowAllTxns(false)
    if (key === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    const range = getPresetRange(key)
    if (range) { setFromDate(range.from); setToDate(range.to) }
  }

  function applyCustom() {
    if (!customFrom || !customTo || customFrom > customTo) return
    setFromDate(customFrom)
    setToDate(customTo)
  }

  // ── Computed ──────────────────────────────────────────────────
  const expenses  = transactions.filter(t => t.type === 'expense')
  const incomes   = transactions.filter(t => t.type === 'income')
  const totalExp  = expenses.reduce((s, t) => s + t.amount, 0)
  const totalInc  = incomes.reduce((s, t) => s + t.amount, 0)
  const balance   = totalInc - totalExp

  const catMap = {}
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount })
  const topCats = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, amt]) => {
      const cat = CATEGORIES.find(c => c.id === id)
      const color = cat?.color || CAT_COLORS[id] || '#9CA3AF'
      return { id, cat, amt, color, pct: totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0 }
    })

  const maxBar = Math.max(totalInc, totalExp, 1)

  function formatDateLabel(str) {
    if (!str) return ''
    const [y, m, d] = str.split('-')
    const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`
  }

  const periodLabel = fromDate === toDate
    ? formatDateLabel(fromDate)
    : `${formatDateLabel(fromDate)} – ${formatDateLabel(toDate)}`

  function exportCSV() {
    const rows = []
    rows.push([`REPORTE: ${periodLabel}`])
    rows.push([])
    rows.push(['RESUMEN'])
    rows.push(['Ingresos', totalInc])
    rows.push(['Gastos', totalExp])
    rows.push(['Balance', balance])
    rows.push(['Transacciones', transactions.length])
    rows.push([])
    rows.push(['TRANSACCIONES'])
    rows.push(['Fecha', 'Tipo', 'Categoría', 'Subcategoría', 'Monto', 'Descripción'])
    transactions.forEach(t => {
      const cat = CATEGORIES.find(c => c.id === t.category)
      rows.push([t.date, t.type === 'income' ? 'Ingreso' : 'Gasto', cat?.name || t.category, t.subcategory || '', t.amount, t.note || ''])
    })
    rows.push([])
    rows.push(['TOP CATEGORÍAS'])
    rows.push(['Categoría', 'Monto', '% del total'])
    topCats.forEach(c => rows.push([c.cat?.name || c.id, c.amt, c.pct]))

    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-${fromDate}-${toDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const visibleTxns = showAllTxns ? transactions : transactions.slice(0, 10)

  return (
    <div className="min-h-screen pb-28 page-transition" style={{ background: '#FFFFFF' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(145deg, #059669 0%, #047857 100%)', paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="px-5 pt-2 pb-6">
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '6px 8px', cursor: 'pointer' }}>
              <ChevronLeft size={20} color="#fff" />
            </button>
            <button onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 12, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Download size={14} />
              Exportar
            </button>
          </div>
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, marginTop: 10 }}>📊 Reportes</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>{periodLabel}</p>
        </div>
      </div>

      <div className="px-5">

        {/* Preset chips */}
        <div style={{ overflowX: 'auto', display: 'flex', gap: 8, paddingTop: 16, paddingBottom: 4, scrollbarWidth: 'none' }}>
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => applyPreset(p.key)}
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: activePreset === p.key ? '#059669' : '#F3F4F6',
                color: activePreset === p.key ? '#fff' : '#374151',
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {showCustom && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12, padding: '12px', background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Desde</p>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, background: '#fff', color: '#111827', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Hasta</p>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, background: '#fff', color: '#111827', outline: 'none' }} />
            </div>
            <button onClick={applyCustom}
              style={{ flexShrink: 0, background: '#059669', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Aplicar
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#059669', fontWeight: 700 }} className="animate-pulse">Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              {[
                { icon: <TrendingUp size={18} color="#059669" />, label: 'INGRESOS', value: formatCurrency(totalInc), bg: '#ECFDF5', color: '#047857' },
                { icon: <TrendingDown size={18} color="#DC2626" />, label: 'GASTOS', value: formatCurrency(totalExp), bg: '#FEF2F2', color: '#DC2626' },
                { icon: <Wallet size={18} color={balance >= 0 ? '#059669' : '#DC2626'} />, label: 'BALANCE', value: formatCurrency(Math.abs(balance)), bg: balance >= 0 ? '#ECFDF5' : '#FEF2F2', color: balance >= 0 ? '#047857' : '#DC2626', extra: balance < 0 ? ' ↓' : ' ↑' },
                { icon: <Hash size={18} color="#6366F1" />, label: 'MOVIMIENTOS', value: transactions.length, bg: '#EEF2FF', color: '#4338CA' },
              ].map((c, i) => (
                <div key={i} style={{ background: c.bg, borderRadius: 18, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.icon}
                  <p style={{ fontSize: 10, color: c.color, fontWeight: 800, letterSpacing: 0.5 }}>{c.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: c.color, fontVariantNumeric: 'tabular-nums' }}>
                    {c.value}{c.extra || ''}
                  </p>
                </div>
              ))}
            </div>

            {/* Donut + leyenda */}
            {topCats.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '16px', marginTop: 16, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Distribución de gastos</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <DonutChart segs={topCats} total={totalExp} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                    {topCats.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.cat?.icon} {c.cat?.name || c.id}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#111827', flexShrink: 0 }}>{c.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Barras Ingresos vs Gastos */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '16px', marginTop: 16, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Ingresos vs Gastos</p>
              {[
                { label: 'Ingresos', value: totalInc, color: '#059669' },
                { label: 'Gastos',   value: totalExp, color: '#EF4444' },
              ].map(b => (
                <div key={b.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{b.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: b.color }}>{formatCurrency(b.value)}</span>
                  </div>
                  <div style={{ height: 10, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((b.value / maxBar) * 100)}%`, background: b.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Balance neto</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: balance >= 0 ? '#047857' : '#DC2626' }}>
                  {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                </span>
              </div>
            </div>

            {/* Top categorías con barras */}
            {topCats.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '16px', marginTop: 16, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Top categorías</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topCats.map((c, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 17 }}>{c.cat?.icon || '📦'}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.cat?.name || c.id}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{formatCurrency(c.amt)}</span>
                          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>{c.pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 7, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                  {totalExp > 0 && (
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Total gastos</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#DC2626' }}>{formatCurrency(totalExp)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista de transacciones */}
            {transactions.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '16px', marginTop: 16, marginBottom: 8, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Movimientos ({transactions.length})</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visibleTxns.map(t => {
                    const cat = CATEGORIES.find(c => c.id === t.category)
                    const isIncome = t.type === 'income'
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${cat?.color || '#9CA3AF'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          {cat?.icon || '📦'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.note || cat?.name || (isIncome ? 'Ingreso' : 'Gasto')}
                          </p>
                          <p style={{ fontSize: 11, color: '#9CA3AF' }}>{t.date} · {cat?.name}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: isIncome ? '#059669' : '#DC2626', flexShrink: 0 }}>
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
                {transactions.length > 10 && (
                  <button onClick={() => setShowAllTxns(v => !v)}
                    style={{ width: '100%', marginTop: 14, padding: '10px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ChevronDown size={16} style={{ transform: showAllTxns ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    {showAllTxns ? 'Mostrar menos' : `Ver ${transactions.length - 10} más`}
                  </button>
                )}
              </div>
            )}

            {transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>📭</p>
                <p style={{ color: '#6B7280', fontWeight: 600 }}>Sin movimientos en este período</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
