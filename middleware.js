import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Raíz: redirect según auth
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(user ? '/dashboard' : '/onboarding', request.url)
    )
  }

  // Onboarding: si ya está logueado → dashboard
  if (pathname === '/onboarding' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Rutas privadas sin sesión → login
  const privateRoutes = ['/dashboard', '/budget', '/missions', '/goals', '/profile', '/coach', '/transactions', '/bills', '/debt-dungeon']
  if (privateRoutes.some(r => pathname.startsWith(r)) && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/onboarding', '/dashboard/:path*', '/budget/:path*', '/missions/:path*', '/goals/:path*', '/profile/:path*', '/coach/:path*', '/transactions/:path*', '/bills/:path*', '/debt-dungeon/:path*'],
}
