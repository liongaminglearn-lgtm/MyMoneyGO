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

  return <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #22C55E 0%, #16A34A 100%)' }} />
}
