import type { LeadEstado } from './types'

interface FlowUpdate {
  estado: LeadEstado
  ultimo_contacto?: string
  proximo_contacto?: string | null
  updated_at: string
}

// Devuelve la fecha calendario de un timestamp ISO en zona Argentina (UTC-3).
// Ej: "2026-11-20T12:00:00Z" → "2026-11-20"
//     "2026-11-20T02:30:00Z" → "2026-11-19" (23:30 ART del 19/11)
export function isoToARTCalendarDate(iso: string): string {
  const artMs = new Date(iso).getTime() - 3 * 60 * 60 * 1000
  return new Date(artMs).toISOString().slice(0, 10)
}

// Devuelve la fecha calendario de hoy en Argentina (YYYY-MM-DD).
export function todayARTDate(): string {
  return isoToARTCalendarDate(new Date().toISOString())
}

// Calcula el timestamp del inicio del día N días después de hoy en Argentina.
// Se guarda a las 03:00 UTC = 00:00 ART.
// Ej: contacto el 18/11 a las 16:30 ART → nextARTDate(2) = "2026-11-20T03:00:00Z"
function nextARTDate(daysAhead: number): string {
  const artNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000)
  return new Date(Date.UTC(
    artNow.getUTCFullYear(),
    artNow.getUTCMonth(),
    artNow.getUTCDate() + daysAhead,
    3, 0, 0, 0,  // 03:00 UTC = 00:00 ART
  )).toISOString()
}

const ESTADOS_CERRADOS = new Set<LeadEstado>(['Ganado', 'Perdido', 'No interesado'])

// Determina si un lead debe aparecer en "Contactar hoy".
// Compara la fecha calendario ART del proximo_contacto contra hoyART (YYYY-MM-DD),
// de modo que un timestamp guardado a cualquier hora del día 20/11 aparezca
// durante todo el 20/11 desde las 00:00 ART.
export function shouldContactarHoy(
  lead: { estado: LeadEstado; proximo_contacto: string | null },
  hoyART: string = todayARTDate()
): boolean {
  if (ESTADOS_CERRADOS.has(lead.estado)) return false
  if (lead.estado === 'Pendiente de contacto') return true
  if (!lead.proximo_contacto) return false
  return isoToARTCalendarDate(lead.proximo_contacto) <= hoyART
}

// Milisegundos hasta la próxima medianoche ART (03:00 UTC).
// Usado para programar el auto-refresh del filtro al cambiar el día.
export function msUntilMidnightART(): number {
  const now = new Date()
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    3, 0, 0, 0,
  ))
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next.getTime() - now.getTime()
}

// Devuelve solo el proximo_contacto que correspondería al estado dado,
// sin modificar estado ni ultimo_contacto. Usado al limpiar fecha manual.
export function calcProximoContacto(estado: LeadEstado): string | null {
  switch (estado) {
    case 'Recontactar en 48 hs':
    case 'Cotización enviada':
    case 'Seguimiento cotización':
      return nextARTDate(2)
    default:
      return null
  }
}

export function buildFlowUpdate(newEstado: LeadEstado): FlowUpdate {
  const nowISO = new Date().toISOString()

  const base: FlowUpdate = {
    estado: newEstado,
    updated_at: nowISO,
  }

  switch (newEstado) {
    case 'Recontactar en 48 hs':
      return {
        ...base,
        ultimo_contacto:  nowISO,
        proximo_contacto: nextARTDate(2),
      }

    case 'Cotización enviada':
      return {
        ...base,
        ultimo_contacto:  nowISO,
        proximo_contacto: nextARTDate(2),
      }

    case 'Seguimiento cotización':
      return {
        ...base,
        ultimo_contacto:  nowISO,
        proximo_contacto: nextARTDate(2),
      }

    case 'Respondió - cotizar':
      return {
        ...base,
        ultimo_contacto:  nowISO,
        proximo_contacto: null,
      }

    case 'Ganado':
    case 'Perdido':
    case 'No interesado':
      return {
        ...base,
        ultimo_contacto:  nowISO,
        proximo_contacto: null,
      }

    default:
      return base
  }
}
