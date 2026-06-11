import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = requireAuth(req)
  if (denied) return denied

  const { body: bodyText } = await req.json() as { body: string }
  const { error } = await supabaseAdmin
    .from('templates')
    .upsert({ id: params.id, body: bodyText }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
