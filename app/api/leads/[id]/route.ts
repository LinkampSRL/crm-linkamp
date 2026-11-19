import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { buildFlowUpdate, calcProximoContacto } from '@/lib/flow'
import type { LeadEstado, MarcaComercial, ProductoCategoria } from '@/lib/types'
import { isCategoriaCompatible } from '@/lib/types'

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

  // Obtener estado actual, flag de fecha manual y marca
  const { data: current, error: fetchError } = await supabaseAdmin
    .from('leads')
    .select('estado, proximo_contacto_manual, marca_comercial, producto_categoria')
    .eq('id', id)
    .single()

  if (fetchError) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  // Validar compatibilidad marca / producto_categoria con los valores resultantes
  const marcaPatch = (body.marca_comercial ?? current.marca_comercial ?? 'Linkamp') as MarcaComercial
  const catPatch   = ('producto_categoria' in body ? body.producto_categoria : current.producto_categoria) as ProductoCategoria | null
  if (catPatch && !isCategoriaCompatible(marcaPatch, catPatch)) {
    return NextResponse.json(
      { error: `La categoría "${catPatch}" no es válida para la marca "${marcaPatch}".` },
      { status: 400 }
    )
  }

  // Whitelist de campos actualizables
  const allowed: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const FIELDS = [
    'marca_comercial',
    'empresa','nombre','telefono','email','ciudad_provincia',
    'producto_consultado','producto_categoria','origen','fecha_ingreso',
    'estado','ultimo_contacto','proximo_contacto','proximo_contacto_manual',
    'observaciones','responsable',
  ]
  for (const f of FIELDS) {
    if (f in body) allowed[f] = body[f]
  }

  // Si hay cambio de estado, aplicar lógica de flujo automático.
  // Si el lead tiene fecha manual activa, preservar proximo_contacto existente.
  let update = allowed
  const estadoFinal = (body.estado as LeadEstado | undefined) ?? current.estado
  if (body.estado && body.estado !== current.estado) {
    const flowUpdate = buildFlowUpdate(body.estado as LeadEstado)
    const hasManualDate = current.proximo_contacto_manual === true
    if (hasManualDate) {
      // Aplicar flow pero sin sobreescribir proximo_contacto
      const { proximo_contacto: _skip, ...flowWithoutDate } = flowUpdate
      update = { ...allowed, ...flowWithoutDate }
    } else {
      update = { ...allowed, ...flowUpdate }
    }
  } else if (body.proximo_contacto_manual === false && current.proximo_contacto_manual === true) {
    // El usuario borró la fecha manual: recalcular proximo_contacto según estado actual
    update = {
      ...allowed,
      proximo_contacto:        calcProximoContacto(estadoFinal),
      proximo_contacto_manual: false,
    }
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
