'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp, supabase, updateProfile } from '@/lib/supabase'
import { Eye, EyeOff, DollarSign } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')

    const { data, error } = await signUp(email, password, name)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      if (data.user) {
        const INCOME_MAP = {
          'lt500': 400, '500-1500': 1000, '1500-3000': 2250,
          '3000-5000': 4000, 'gt5000': 6000,
        }
        let quizData = {}
        try {
          const raw = localStorage.getItem('mmg_quiz')
          if (raw) quizData = JSON.parse(raw)
        } catch {}

        await supabase.from('profiles').insert([{
          id: data.user.id,
          name,
          email,
          xp: 50,
          streak: 0,
          level: 1,
          coins: 100,
          companion_id: quizData.companion || 'nova',
          monthly_income: INCOME_MAP[quizData.income] || 0,
          primary_goal: quizData.goal || 'control',
          onboarding_complete: true,
        }])
        localStorage.removeItem('mmg_quiz')
      }
      router.push('/paywall')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col safe-top">
      <div className="flex flex-col items-center pt-12 pb-8 px-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-green flex items-center justify-center mb-4 glow-green">
          <DollarSign size={32} color="#FFFFFF" strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-black text-gray-900">MyMoney <span className="text-brand-green">GO</span></h1>
        <p className="text-brand-muted text-sm mt-1">Empieza gratis hoy 🚀</p>
      </div>

      <div className="flex-1 px-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Crea tu cuenta</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm text-brand-muted mb-1 block">Tu nombre</label>
            <input
              className="input-dark"
              type="text"
              placeholder="¿Cómo te llamas?"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-brand-muted mb-1 block">Email</label>
            <input
              className="input-dark"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-brand-muted mb-1 block">Contraseña</label>
            <div className="relative">
              <input
                className="input-dark pr-12"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-brand-muted"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className="text-center text-brand-muted text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-brand-green font-semibold">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
