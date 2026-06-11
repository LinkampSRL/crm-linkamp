import { supabase } from './supabase'
import type { LeadEstado } from './types'

export async function recordHistory(
  leadId: string,
  estadoAnterior: LeadEstado | null,
  estadoNuevo: LeadEstado,
  observacion?: string
) {
  await supabase.from('lead_history').insert({
    lead_id:         leadId,
    fecha:           new Date().toISOString(),
    estado_anterior: estadoAnterior,
    estado_nuevo:    estadoNuevo,
    observacion:     observacion || null,
  })
}
