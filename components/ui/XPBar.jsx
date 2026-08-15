'use client'
import { calculateLevel, getLevelProgress } from '@/lib/utils'

export default function XPBar({ xp = 0 }) {
  const { level, name, next } = calculateLevel(xp)
  const progress = getLevelProgress(xp)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,200,150,0.12)', color: '#00C896' }}>
            Nivel {level}
          </span>
          <span className="text-gray-800 text-sm font-semibold">{name}</span>
        </div>
        <span className="text-brand-muted text-xs">{xp} XP</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#E2E8F0' }}>
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00C896, #00E5B0)' }}
        />
      </div>
      {next && (
        <p className="text-brand-muted text-xs mt-1 text-right">{next - xp} XP para el siguiente nivel</p>
      )}
    </div>
  )
}
