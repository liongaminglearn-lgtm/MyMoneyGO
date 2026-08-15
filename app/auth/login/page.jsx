'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/supabase'
import { Eye, EyeOff, DollarSign } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col safe-top">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-10 px-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-green flex items-center justify-center mb-4 glow-green">
          <DollarSign size={32} color="#FFFFFF" strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-black text-gray-900">MyMoney <span className="text-brand-green">GO</span></h1>
        <p className="text-brand-muted text-sm mt-1">Tu dinero. Tus metas. Tu futuro.</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Bienvenido de vuelta 👋</h2>

        <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="••••••••"
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-brand-muted text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" className="text-brand-green font-semibold">
            Crear cuenta gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
