import type { LeadEstado } from './types'

interface FlowUpdate {
  estado: LeadEstado
  ultimo_contacto?: string
  proximo_contacto?: string | null
  updated_at: string
}

// Calcula la fecha de próximo contacto como "daysAhead días calendario
// a partir de hoy, a las 09:00 en Argentina (ART = UTC-3, sin DST)".
// Ejemplo: miércoles 11:00 ART + 2 días → viernes 09:00 ART (= 12:00 UTC).
function nextARTDate(daysAhead: number): string {
  const nowUTC = new Date()
  // Hora actual en ART (UTC-3)
  const artNow = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000)

  // Fecha objetivo en ART: año, mes, día + daysAhead
  const target = new Date(Date.UTC(
    artNow.getUTCFullYear(),
    artNow.getUTCMonth(),
    artNow.getUTCDate() + daysAhead,
    12, 0, 0, 0,  // 12:00 UTC = 09:00 ART
  ))

  return target.toISOString()
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
