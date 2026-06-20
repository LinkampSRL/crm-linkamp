import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const denied = requireAuth(req)
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 4999)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const denied = requireAuth(req)
  if (denied) return denied

  const body = await req.json()

  // Whitelist explícita — nunca spread del body completo
  const payload = {
    empresa:             body.empresa             ?? null,
    nombre:              body.nombre,
    telefono:            body.telefono,
    email:               body.email               ?? null,
    ciudad_provincia:    body.ciudad_provincia     ?? null,
    producto_consultado: body.producto_consultado  ?? null,
    producto_categoria:  body.producto_categoria   ?? null,
    origen:              body.origen               ?? null,
    fecha_ingreso:       body.fecha_ingreso        || new Date().toISOString().split('T')[0],
    estado:              body.estado               || 'Pendiente de contacto',
    ultimo_contacto:     body.ultimo_contacto      ?? null,
    proximo_contacto:    body.proximo_contacto     ?? null,
    observaciones:       body.observaciones        ?? null,
    responsable:         body.responsable          ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
