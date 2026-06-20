import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { buildFlowUpdate } from '@/lib/flow'
import type { LeadEstado } from '@/lib/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = requireAuth(req)
  if (denied) return denied

  const { id } = params

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const body = await req.json()

  // Obtener estado actual para detectar cambio (sin confiar en el cliente)
  const { data: current, error: fetchError } = await supabaseAdmin
    .from('leads')
    .select('estado')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  // Whitelist de campos actualizables
  const allowed: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const FIELDS = [
    'empresa','nombre','telefono','email','ciudad_provincia',
    'producto_consultado','producto_categoria','origen','fecha_ingreso',
    'estado','ultimo_contacto','proximo_contacto','observaciones','responsable',
  ]
  for (const f of FIELDS) {
    if (f in body) allowed[f] = body[f]
  }

  // Si hay cambio de estado, aplicar lógica de flujo automático
  let update = allowed
  if (body.estado && body.estado !== current.estado) {
    const flowUpdate = buildFlowUpdate(body.estado as LeadEstado)
    update = { ...allowed, ...flowUpdate }
  }

  const { error: updateError } = await supabaseAdmin
    .from('leads')
    .update(update)
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Registrar historial si el estado cambió
  if (body.estado && body.estado !== current.estado) {
    await supabaseAdmin.from('lead_history').insert({
      lead_id:         id,
      fecha:           new Date().toISOString(),
      estado_anterior: current.estado,
      estado_nuevo:    body.estado,
      observacion:     body.observaciones || null,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const denied = requireAuth(req)
  if (denied) return denied

  const { id } = params

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  // lead_history se elimina en cascada (ON DELETE CASCADE en el schema)
  const { error } = await supabaseAdmin
    .from('leads')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
