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
        router.push('/auth/login')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl font-black text-brand-green mb-2">$</div>
        <div className="text-2xl font-black text-gray-900">MyMoney <span className="text-brand-green">GO</span></div>
        <p className="text-brand-muted text-sm mt-2">Cargando...</p>
      </div>
    </div>
  )
}
