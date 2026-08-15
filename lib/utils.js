import { clsx } from 'clsx'

export function cn(...inputs) {
  return clsx(inputs)
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })
}

export function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthName(monthStr) {
  const [year, month] = monthStr.split('-')
  return new Date(year, month - 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })
}

export function calculateLevel(xp) {
  if (xp < 100) return { level: 1, name: 'Principiante', next: 100 }
  if (xp < 300) return { level: 2, name: 'Ahorrador', next: 300 }
  if (xp < 600) return { level: 3, name: 'Experto', next: 600 }
  if (xp < 1000) return { level: 4, name: 'Maestro', next: 1000 }
  return { level: 5, name: 'Maestro Financiero', next: null }
}

export function getLevelProgress(xp) {
  const { level, next } = calculateLevel(xp)
  const thresholds = [0, 100, 300, 600, 1000]
  const prev = thresholds[level - 1] || 0
  if (!next) return 100
  return Math.round(((xp - prev) / (next - prev)) * 100)
}

export const CATEGORIES = [
  { id: 'food', name: 'Comida', icon: '🍔', color: '#FF6B6B' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎮', color: '#A78BFA' },
  { id: 'health', name: 'Salud', icon: '💊', color: '#34D399' },
  { id: 'education', name: 'Educación', icon: '📚', color: '#60A5FA' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: '#F59E0B' },
  { id: 'home', name: 'Hogar', icon: '🏠', color: '#EC4899' },
  { id: 'salary', name: 'Salario', icon: '💼', color: '#00C896' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#00C896' },
  { id: 'other', name: 'Otro', icon: '📦', color: '#6B7280' },
]

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}
