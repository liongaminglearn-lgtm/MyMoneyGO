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
  }).format(amount || 0)
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

// XP thresholds: level → required cumulative XP
const LEVEL_THRESHOLDS = [
  0,    // 1
  100,  // 2
  300,  // 3
  600,  // 4
  1000, // 5
  1500, // 6
  2100, // 7
  2800, // 8
  3600, // 9
  4500, // 10
  5500, // 11
  6600, // 12
  7800, // 13
  9100, // 14
  10500, // 15
  12000, // 16
  13600, // 17
  15300, // 18
  17100, // 19
  19000, // 20
]

const LEVEL_NAMES = [
  'Principiante', 'Ahorrador', 'Explorador', 'Aventurero', 'Estratega',
  'Experto', 'Maestro', 'Campeón', 'Leyenda', 'Élite',
  'Supremo', 'Titán', 'Oráculo', 'Mago', 'Sabio',
  'Guardián', 'Héroe', 'Mítico', 'Legendario', 'Maestro Financiero',
]

export function calculateLevel(xp) {
  let level = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
    else break
  }
  const next = LEVEL_THRESHOLDS[level] || null
  return { level, name: LEVEL_NAMES[level - 1] || 'Maestro Financiero', next }
}

export function getLevelProgress(xp) {
  const { level, next } = calculateLevel(xp)
  const prev = LEVEL_THRESHOLDS[level - 1] || 0
  if (!next) return 100
  return Math.round(((xp - prev) / (next - prev)) * 100)
}

export const CATEGORIES = [
  // Gastos
  { id: 'housing',       name: 'Vivienda',          icon: '🏠', color: '#6366F1' },
  { id: 'food',          name: 'Comida',             icon: '🍔', color: '#F97316' },
  { id: 'transport',     name: 'Transporte',         icon: '🚗', color: '#3B82F6' },
  { id: 'utilities',     name: 'Servicios',          icon: '💡', color: '#14B8A6' },
  { id: 'health',        name: 'Salud',              icon: '💊', color: '#EF4444' },
  { id: 'entertainment', name: 'Ocio',               icon: '🎮', color: '#8B5CF6' },
  { id: 'education',     name: 'Educación',          icon: '📚', color: '#EC4899' },
  { id: 'clothing',      name: 'Ropa',               icon: '👕', color: '#F59E0B' },
  { id: 'subscriptions', name: 'Suscripciones',      icon: '📱', color: '#7C3AED' },
  { id: 'credit_card',   name: 'Tarjeta de Crédito', icon: '💳', color: '#DC2626' },
  { id: 'debt',          name: 'Deudas',             icon: '⚔️', color: '#B91C1C' },
  { id: 'savings',       name: 'Ahorro',             icon: '💰', color: '#22C55E' },
  { id: 'other',         name: 'Otros',              icon: '📦', color: '#6B7280' },
  // Ingresos
  { id: 'salary',        name: 'Salario',            icon: '💼', color: '#22C55E' },
  { id: 'freelance',     name: 'Freelance',          icon: '💻', color: '#06B6D4' },
  // Legacy aliases
  { id: 'shopping',      name: 'Compras',            icon: '🛍️', color: '#F59E0B' },
  { id: 'home',          name: 'Hogar',              icon: '🏡', color: '#6366F1' },
]

export const SUBCATEGORIES = {
  housing:       ['Arriendo', 'Hipoteca', 'Administración', 'Reparaciones'],
  food:          ['Mercado', 'Restaurante', 'Domicilios', 'Cafetería'],
  transport:     ['Gasolina', 'Taxi / Uber', 'Transporte público', 'Parqueadero'],
  utilities:     ['Teléfono', 'Internet', 'Electricidad', 'Agua / Gas'],
  health:        ['Médico', 'Medicamentos', 'Gym / Deporte', 'Odontología'],
  entertainment: ['Cine / Teatro', 'Salidas', 'Videojuegos', 'Hobbies'],
  education:     ['Cursos', 'Libros', 'Universidad', 'Certificaciones'],
  clothing:      ['Ropa', 'Zapatos', 'Accesorios', 'Deportiva'],
  subscriptions: ['Netflix', 'Spotify', 'YouTube Premium', 'Amazon Prime'],
  credit_card:   ['Pago mínimo', 'Pago total', 'Cuotas', 'Intereses'],
  debt:          ['Préstamo banco', 'Préstamo personal', 'Cuota vehículo'],
  savings:       ['Fondo emergencia', 'Ahorro viaje', 'Inversión', 'CDT'],
  salary:        ['Salario base', 'Bonos', 'Comisiones', 'Horas extra'],
  freelance:     ['Proyecto', 'Consultoría', 'Diseño', 'Desarrollo'],
  other:         [],
}

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'other')
}
