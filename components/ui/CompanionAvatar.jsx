'use client'

export const COMPANIONS = {
  sparky: {
    name: 'Sparky',
    emoji: '⚡',
    avatar: '🐱',
    color: '#FBBF24',
    gradient: 'linear-gradient(135deg, #FDE68A, #FBBF24)',
    specialty: 'Ahorro',
    desc: 'Experto en optimizar cada peso que ahorras',
    tip: 'Ahorra el 20% de tus ingresos cada mes',
  },
  nova: {
    name: 'Nova',
    emoji: '🦊',
    avatar: '🦊',
    color: '#F97316',
    gradient: 'linear-gradient(135deg, #FED7AA, #F97316)',
    specialty: 'Estrategia',
    desc: 'Domina el juego financiero con inteligencia',
    tip: 'Elimina deudas de mayor a menor tasa de interés',
  },
  vault: {
    name: 'Vault',
    emoji: '🐢',
    avatar: '🐢',
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #A5F3FC, #06B6D4)',
    specialty: 'Estabilidad',
    desc: 'Construye bases financieras sólidas y duraderas',
    tip: 'Mantén un fondo de emergencia de 3-6 meses',
  },
}

export default function CompanionAvatar({ companionId = 'nova', size = 64, showGlow = false }) {
  const c = COMPANIONS[companionId] || COMPANIONS.nova
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: c.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.45,
      flexShrink: 0,
      boxShadow: showGlow ? `0 0 20px ${c.color}60, 0 4px 12px ${c.color}40` : '0 2px 8px rgba(0,0,0,0.12)',
      border: '3px solid rgba(255,255,255,0.8)',
    }}>
      {c.avatar}
    </div>
  )
}
