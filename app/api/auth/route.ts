import { NextRequest, NextResponse } from 'next/server'

const COOKIE  = 'crm_auth'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 días

// Rate limiting en memoria — simple, suficiente para V1 de usuario único
const WINDOW_MS   = 10 * 60 * 1000 // 10 minutos
const MAX_ATTEMPTS = 5

interface RateEntry { count: number; resetAt: number }
const rateLimitMap = new Map<string, RateEntry>()

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function checkRateLimit(ip: string): boolean {
  const now  = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true // permitido
  }

  entry.count++
  if (entry.count > MAX_ATTEMPTS) return false // bloqueado
  return true
}

function clearRateLimit(ip: string) {
  rateLimitMap.delete(ip)
}

export async function POST(req: NextRequest) {
  const ip = getIP(req)

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá 10 minutos.' },
      { status: 429 }
    )
  }

  const { password } = await req.json()

  if (password !== process.env.CRM_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  clearRateLimit(ip) // login exitoso — resetear contador

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   MAX_AGE,
    path:     '/',
    secure:   process.env.NODE_ENV === 'production',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE)
  return res
}
