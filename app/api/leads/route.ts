import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import type { MarcaComercial, ProductoCategoria } from '@/lib/types'
import { isCategoriaCompatible } from '@/lib/types'

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

  // Validar compatibilidad marca / producto_categoria
  const marcaPost = (body.marca_comercial || 'Linkamp') as MarcaComercial
  const catPost   = body.producto_categoria as ProductoCategoria | null | undefined
  if (catPost && !isCategoriaCompatible(marcaPost, catPost)) {
    return NextResponse.json(
      { error: `La categoría "${catPost}" no es válida para la marca "${marcaPost}".` },
      { status: 400 }
    )
  }

  // Whitelist explícita — nunca spread del body completo
  const payload = {
    marca_comercial:          marcaPost,
    empresa:                  body.empresa                  ?? null,
    nombre:                   body.nombre,
    telefono:                 body.telefono,
    email:                    body.email                    ?? null,
    ciudad_provincia:         body.ciudad_provincia         ?? null,
    producto_consultado:      body.producto_consultado      ?? null,
    producto_categoria:       catPost ?? null,
    origen:                   body.origen                   ?? null,
    fecha_ingreso:            body.fecha_ingreso            || new Date().toISOString().split('T')[0],
    estado:                   body.estado                   || 'Pendiente de contacto',
    ultimo_contacto:          body.ultimo_contacto          ?? null,
    proximo_contacto:         body.proximo_contacto         ?? null,
    proximo_contacto_manual:  body.proximo_contacto_manual  ?? false,
    observaciones:            body.observaciones            ?? null,
    responsable:              body.responsable              ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
