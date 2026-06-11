import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import type { Lead, LeadOrigen } from '@/lib/types'

const ORIGENES_VALIDOS = new Set<string>([
  'Meta', 'Web', 'WhatsApp', 'Referido', 'Agrofy',
  'Google Ads', 'Mercado Libre', 'Base histórica', 'Base de datos inicial', 'Otro',
])

function str(val: unknown): string {
  return String(val ?? '').trim()
}

function normalizeOrigen(raw: string): LeadOrigen {
  if (!raw) return 'Otro'
  if (ORIGENES_VALIDOS.has(raw)) return raw as LeadOrigen
  // Intentar match case-insensitive
  const found = Array.from(ORIGENES_VALIDOS).find(o => o.toLowerCase() === raw.toLowerCase())
  return (found as LeadOrigen) ?? 'Otro'
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

    const origenRaw = str(row.origen ?? row.Origen ?? row.ORIGEN ?? '')

    valid.push({
      empresa:             str(row.empresa ?? row.Empresa ?? row.EMPRESA ?? '') || null,
      nombre,
      telefono,
      email:               str(row.email ?? row.Email ?? row.EMAIL ?? '') || null,
      ciudad_provincia:    str(row.ciudad_provincia ?? row.ciudad ?? row.Ciudad ?? row.CIUDAD ?? '') || null,
      producto_consultado: str(row.producto_consultado ?? row.producto ?? row.Producto ?? '') || null,
      origen:              origenRaw ? normalizeOrigen(origenRaw) : null,
      fecha_ingreso:       str(row.fecha_ingreso ?? row.FechaIngreso ?? '') || new Date().toISOString().split('T')[0],
      estado:              'Pendiente de contacto',
      observaciones:       str(row.observaciones ?? row.Observaciones ?? '') || null,
      responsable:         str(row.responsable ?? row.Responsable ?? '') || null,
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
