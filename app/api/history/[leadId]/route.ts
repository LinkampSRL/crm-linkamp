import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const denied = requireAuth(req)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('lead_history')
    .select('*')
    .eq('lead_id', params.leadId)
    .order('fecha', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
