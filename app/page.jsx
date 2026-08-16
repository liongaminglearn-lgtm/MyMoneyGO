'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9FAFB' }}>
      <div className="text-center">
        <div className="text-5xl mb-3 animate-bounce">🎮</div>
        <div className="text-2xl font-black" style={{ color: '#111827' }}>MyMoney <span style={{ color: '#22C55E' }}>GO</span></div>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }} className="animate-pulse">Cargando tu aventura...</p>
      </div>
    </div>
  )
}
