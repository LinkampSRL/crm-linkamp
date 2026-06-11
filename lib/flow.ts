import { addHours, addDays } from 'date-fns'
import type { LeadEstado } from './types'

interface FlowUpdate {
  estado: LeadEstado
  ultimo_contacto?: string
  proximo_contacto?: string | null
  updated_at: string
}

export function buildFlowUpdate(newEstado: LeadEstado): FlowUpdate {
  const now = new Date()
  const nowISO = now.toISOString()

  const base: FlowUpdate = {
    estado: newEstado,
    updated_at: nowISO,
  }

  switch (newEstado) {
    case 'Mensaje 1 enviado':
      return {
        ...base,
        ultimo_contacto: nowISO,
        proximo_contacto: addHours(now, 48).toISOString(),
      }

    case 'Recontactar en 48 hs':
      return {
        ...base,
        ultimo_contacto: nowISO,
        proximo_contacto: addHours(now, 48).toISOString(),
      }

    case 'Cotización enviada':
      return {
        ...base,
        ultimo_contacto: nowISO,
        proximo_contacto: addDays(now, 3).toISOString(),
      }

    case 'Seguimiento cotización':
      return {
        ...base,
        ultimo_contacto: nowISO,
        proximo_contacto: addDays(now, 3).toISOString(),
      }

    case 'Respondió - cotizar':
      return {
        ...base,
        ultimo_contacto: nowISO,
        proximo_contacto: null,
      }

    case 'Ganado':
    case 'Perdido':
    case 'No interesado':
      return {
        ...base,
        ultimo_contacto: nowISO,
        proximo_contacto: null,
      }

    default:
      return base
  }
}
