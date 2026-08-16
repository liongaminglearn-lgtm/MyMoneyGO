'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, getBills, addBill, updateBill, deleteBill, getProfile, updateProfile } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import BottomNav from '@/components/ui/BottomNav'
import { X, Plus, Check, Trash2, Pencil, AlertCircle, ChevronDown } from 'lucide-react'

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

const FREQUENCY_LABELS = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  annual: 'Anual',
}

const PAYMENT_METHODS = ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'PSE', 'Nequi', 'Daviplata']

function getCatById(id) {
  return BILL_CATEGORIES.find(c => c.id === id) || BILL_CATEGORIES[BILL_CATEGORIES.length - 1]
}

function getDueBadge(dueDay) {
  const today = new Date().getDate()
  const diff = dueDay - today
  if (diff < 0) return { label: 'Vencida', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }
  if (diff === 0) return { label: '¡Hoy!', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
  if (diff <= 3) return { label: `${diff}d`, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
  return { label: `Día ${dueDay}`, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
}

export default function BillsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBill, setEditBill] = useState(null)
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('other')
  const [dueDay, setDueDay] = useState(1)
  const [frequency, setFrequency] = useState('monthly')
  const [paymentMethod, setPaymentMethod] = useState('Débito')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const u = await getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)
      const { data } = await getBills(u.id)
      setBills(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  function openAdd() {
    setEditBill(null)
    setName(''); setCompany(''); setAmount(''); setCategory('other')
    setDueDay(1); setFrequency('monthly'); setPaymentMethod('Débito'); setNotes('')
    setShowForm(true)
  }

  function openEdit(bill) {
    setEditBill(bill)
    setName(bill.name); setCompany(bill.company || ''); setAmount(String(bill.amount))
    setCategory(bill.category); setDueDay(bill.due_day); setFrequency(bill.frequency)
    setPaymentMethod(bill.payment_method || 'Débito'); setNotes(bill.notes || '')
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!name || !amount || isNaN(amount) || Number(amount) <= 0) return
    setSaving(true)

    const payload = {
      user_id: user.id,
      name,
      company,
      amount: Number(amount),
      category,
      due_day: Number(dueDay),
      frequency,
      payment_method: paymentMethod,
      notes,
    }

    if (editBill) {
      const { data } = await updateBill(editBill.id, payload)
      if (data) {
        setBills(prev => prev.map(b => b.id === editBill.id ? data[0] : b))
      }
    } else {
      const { data } = await addBill({ ...payload, is_paid: false })
      if (data) {
        const { data: profile } = await getProfile(user.id)
        if (profile) await updateProfile(user.id, { xp: (profile.xp || 0) + 5 })
        setBills(prev => [...prev, data[0]].sort((a, b) => a.due_day - b.due_day))
      }
    }
    setShowForm(false)
    setSaving(false)
  }

  async function togglePaid(bill) {
    const { data } = await updateBill(bill.id, { is_paid: !bill.is_paid })
    if (data) {
      setBills(prev => prev.map(b => b.id === bill.id ? data[0] : b))
    }
  }

  async function handleDelete(id) {
    await deleteBill(id)
    setBills(prev => prev.filter(b => b.id !== id))
  }

  const filtered = filter === 'all' ? bills
    : filter === 'paid' ? bills.filter(b => b.is_paid)
    : bills.filter(b => !b.is_paid)

  const totalMonthly = bills.reduce((s, b) => {
    if (b.frequency === 'quarterly') return s + b.amount / 3
    if (b.frequency === 'annual') return s + b.amount / 12
    return s + b.amount
  }, 0)
  const totalPaid = bills.filter(b => b.is_paid).reduce((s, b) => {
    if (b.frequency === 'quarterly') return s + b.amount / 3
    if (b.frequency === 'annual') return s + b.amount / 12
    return s + b.amount
  }, 0)
  const totalPending = totalMonthly - totalPaid
  const paidCount = bills.filter(b => b.is_paid).length
  const progressPct = bills.length > 0 ? Math.round((paidCount / bills.length) * 100) : 0

  return (
    <div className="min-h-screen bg-brand-dark pb-24 safe-top page-transition">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-gray-900 text-xl font-black mb-4">Facturas & Recibos</h1>

        {/* Summary card */}
        <div className="card rounded-3xl p-5 mb-3 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-brand-muted text-xs mb-0.5">Total mensual</p>
              <p className="text-gray-900 text-3xl font-black">{formatCurrency(totalMonthly)}</p>
            </div>
            <div className="text-right">
              <p className="text-brand-muted text-xs mb-0.5">{paidCount}/{bills.length} pagadas</p>
              <p className="text-brand-green font-bold text-sm">{progressPct}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full mb-3" style={{ background: '#E2E8F0' }}>
            <div className="h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #00C896, #00A67C)' }} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)' }}>
              <p className="text-brand-muted text-xs mb-0.5">Pagado</p>
              <p className="text-brand-green font-bold text-sm">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-brand-muted text-xs mb-0.5">Pendiente</p>
              <p className="text-red-500 font-bold text-sm">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {[['all','Todas'],['pending','Pendientes'],['paid','Pagadas']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: filter === val ? '#00C896' : '#F1F5F9',
                color: filter === val ? '#FFFFFF' : '#6B7280',
                border: `1px solid ${filter === val ? '#00C896' : '#E2E8F0'}`,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bills list */}
      <div className="px-5 space-y-3">
        {loading ? (
          <p className="text-brand-muted text-center py-8">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-800 font-semibold">
              {filter === 'all' ? 'Sin facturas registradas' : filter === 'paid' ? 'Ninguna pagada aún' : '¡Todo pagado! 🎉'}
            </p>
            <p className="text-brand-muted text-sm mt-1">
              {filter === 'all' && 'Agrega tus recibos fijos del mes'}
            </p>
          </div>
        ) : (
          filtered.map(bill => {
            const cat = getCatById(bill.category)
            const badge = getDueBadge(bill.due_day)
            return (
              <div key={bill.id}
                className="card rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: bill.is_paid ? 'rgba(0,200,150,0.04)' : '#FFFFFF',
                  borderColor: bill.is_paid ? 'rgba(0,200,150,0.25)' : '#E2E8F0',
                  opacity: bill.is_paid ? 0.8 : 1,
                }}>

                {/* Category icon */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: `${cat.color}20` }}>
                  {cat.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm truncate ${bill.is_paid ? 'line-through text-brand-muted' : 'text-gray-900'}`}>
                      {bill.name}
                    </p>
                    {!bill.is_paid && bill.due_day <= new Date().getDate() + 3 && (
                      <AlertCircle size={13} color="#F59E0B" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-brand-muted text-xs truncate">{bill.company || cat.name}</p>
                    <span className="text-brand-muted text-xs">·</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0 mr-1">
                  <p className="text-gray-900 font-bold">{formatCurrency(bill.amount)}</p>
                  <p className="text-brand-muted text-xs">{FREQUENCY_LABELS[bill.frequency] || 'Mensual'}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => togglePaid(bill)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: bill.is_paid ? 'rgba(0,200,150,0.15)' : '#F1F5F9',
                      border: `1.5px solid ${bill.is_paid ? '#00C896' : '#E2E8F0'}`,
                    }}>
                    <Check size={14} color={bill.is_paid ? '#00C896' : '#9CA3AF'} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => openEdit(bill)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: '#F1F5F9' }}>
                    <Pencil size={13} color="#6B7280" />
                  </button>
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.08)' }}>
                    <Trash2 size={13} color="#EF4444" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40"
        style={{ background: '#00C896', boxShadow: '0 4px 16px rgba(0,200,150,0.4)' }}>
        <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </button>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full rounded-t-3xl flex flex-col"
            style={{ background: '#FFFFFF', maxHeight: '92vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>

            {/* Header - always visible */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3"
              style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h2 className="text-gray-900 text-lg font-bold">
                {editBill ? 'Editar factura' : 'Nueva factura'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#F1F5F9' }}>
                <X size={18} color="#6B7280" />
              </button>
            </div>

            {/* Scrollable form content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form id="add-bill-form" onSubmit={handleSave} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Nombre del servicio *</label>
                  <input className="input-dark" placeholder="Ej: Netflix, Claro, Arriendo..."
                    value={name} onChange={e => setName(e.target.value)} required />
                </div>

                {/* Company */}
                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Empresa / Proveedor</label>
                  <input className="input-dark" placeholder="Ej: Claro, EPM, Bancolombia..."
                    value={company} onChange={e => setCompany(e.target.value)} />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Monto *</label>
                  <input className="input-dark text-2xl font-bold" type="number"
                    placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
                    inputMode="decimal" required />
                </div>

                {/* Category */}
                <div>
                  <label className="text-brand-muted text-sm mb-2 block">Categoría</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BILL_CATEGORIES.map(cat => (
                      <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                        style={{
                          background: category === cat.id ? `${cat.color}15` : '#F8FAFC',
                          borderColor: category === cat.id ? cat.color : '#E2E8F0',
                        }}>
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-xs text-brand-muted truncate w-full text-center">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due day + Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-brand-muted text-sm mb-1 block">Día de pago</label>
                    <input className="input-dark" type="number" min={1} max={31}
                      value={dueDay} onChange={e => setDueDay(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-brand-muted text-sm mb-1 block">Frecuencia</label>
                    <div className="relative">
                      <select className="input-dark appearance-none pr-8"
                        value={frequency} onChange={e => setFrequency(e.target.value)}>
                        <option value="monthly">Mensual</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="annual">Anual</option>
                      </select>
                      <ChevronDown size={16} color="#6B7280"
                        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <label className="text-brand-muted text-sm mb-2 block">Método de pago</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: paymentMethod === m ? 'rgba(0,200,150,0.1)' : '#F8FAFC',
                          border: `1px solid ${paymentMethod === m ? '#00C896' : '#E2E8F0'}`,
                          color: paymentMethod === m ? '#00C896' : '#6B7280',
                        }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-brand-muted text-sm mb-1 block">Notas (opcional)</label>
                  <input className="input-dark" placeholder="Cuenta, referencia, contrato..."
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </form>
            </div>

            {/* Sticky save button - always visible at bottom */}
            <div className="px-6 py-4" style={{ borderTop: '1px solid #F1F5F9' }}>
              <button form="add-bill-form" className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editBill ? 'Guardar cambios' : 'Agregar factura +5 XP'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
