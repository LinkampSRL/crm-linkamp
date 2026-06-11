import { NextRequest, NextResponse } from 'next/server'

export function requireAuth(req: NextRequest): NextResponse | null {
  const auth = req.cookies.get('crm_auth')?.value
  if (auth !== 'ok') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return null
}
