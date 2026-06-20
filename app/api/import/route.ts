import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import type { Lead, LeadOrigen, ProductoCategoria } from '@/lib/types'
import { PRODUCTO_CATEGORIAS, RESPONSABLES } from '@/lib/types'

const ORIGENES_VALIDOS = new Set<string>([
  'Meta', 'Web', 'WhatsApp', 'Referido', 'Agrofy',
  'Google Ads', 'Mercado Libre', 'Base histórica', 'Base de datos inicial', 'Otro',
])

const PRODUCTOS_VALIDOS = new Set<string>(PRODUCTO_CATEGORIAS)
const RESPONSABLES_VALIDOS = new Set<string>(RESPONSABLES)

function str(val: unknown): string {
  return String(val ?? '').trim()
}

function normalizeOrigen(raw: string): LeadOrigen {
  if (!raw) return 'Otro'
  if (ORIGENES_VALIDOS.has(raw)) return raw as LeadOrigen
  const found = Array.from(ORIGENES_VALIDOS).find(o => o.toLowerCase() === raw.toLowerCase())
  return (found as LeadOrigen) ?? 'Otro'
}

function normalizeProductoCategoria(raw: string): ProductoCategoria {
  if (!raw) return 'Otros'
  if (PRODUCTOS_VALIDOS.has(raw)) return raw as ProductoCategoria
  const found = Array.from(PRODUCTOS_VALIDOS).find(o => o.toLowerCase() === raw.toLowerCase())
  return (found as ProductoCategoria) ?? 'Otros'
}

function normalizeResponsable(raw: string): string | null {
  if (!raw) return null
  if (RESPONSABLES_VALIDOS.has(raw)) return raw
  const found = Array.from(RESPONSABLES_VALIDOS).find(r => r.toLowerCase() === raw.toLowerCase())
  return found ?? null
}

export async function POST(req: NextRequest) {
  const denied = requireAuth(req)
  if (denied) return denied

  const { rows } = await req.json() as { rows: Record<string, unknown>[] }

  const valid: Partial<Lead>[] = []
  const errors: string[] = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // fila 1 = encabezados

    const telefono = str(row.telefono ?? row.Telefono ?? row.TELEFONO ?? '')
    if (!telefono) {
      errors.push(`Fila ${rowNum}: sin teléfono`)
      return
    }

    const nombre = str(row.nombre ?? row.Nombre ?? row.NOMBRE ?? '')
    if (!nombre) {
      errors.push(`Fila ${rowNum}: sin nombre`)
      return
    }

    const origenRaw           = str(row.origen ?? row.Origen ?? row.ORIGEN ?? '')
    const productoCategoriaRaw = str(row.producto_categoria ?? row.ProductoCategoria ?? row.producto_cat ?? '')
    const responsableRaw      = str(row.responsable ?? row.Responsable ?? row.RESPONSABLE ?? '')

    valid.push({
      empresa:             str(row.empresa ?? row.Empresa ?? row.EMPRESA ?? '') || null,
      nombre,
      telefono,
      email:               str(row.email ?? row.Email ?? row.EMAIL ?? '') || null,
      ciudad_provincia:    str(row.ciudad_provincia ?? row.ciudad ?? row.Ciudad ?? row.CIUDAD ?? '') || null,
      producto_consultado: str(row.producto_consultado ?? row.producto ?? row.Producto ?? '') || null,
      producto_categoria:  normalizeProductoCategoria(productoCategoriaRaw),
      origen:              origenRaw ? normalizeOrigen(origenRaw) : null,
      fecha_ingreso:       str(row.fecha_ingreso ?? row.FechaIngreso ?? '') || new Date().toISOString().split('T')[0],
      estado:              'Pendiente de contacto',
      observaciones:       str(row.observaciones ?? row.Observaciones ?? '') || null,
      responsable:         normalizeResponsable(responsableRaw),
    })
  })

  if (valid.length === 0) {
    return NextResponse.json({ imported: 0, errors })
  }

  // Insertar en lotes para obtener errores individuales si los hubiera
  const BATCH = 100
  let imported = 0
  for (let i = 0; i < valid.length; i += BATCH) {
    const batch = valid.slice(i, i + BATCH)
    const { error } = await supabaseAdmin.from('leads').insert(batch)
    if (error) {
      errors.push(`Error al insertar filas ${i + 2}–${i + batch.length + 1}: ${error.message}`)
    } else {
      imported += batch.length
    }
  }

  return NextResponse.json({ imported, errors })
}
