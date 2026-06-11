import type { LeadEstado } from './types'

export const ESTADOS: LeadEstado[] = [
  'Pendiente de contacto',
  'Mensaje 1 enviado',
  'Recontactar en 48 hs',
  'Respondió - cotizar',
  'Cotización enviada',
  'Seguimiento cotización',
  'Ganado',
  'Perdido',
  'No interesado',
]

export const ESTADO_COLOR: Record<LeadEstado, string> = {
  'Pendiente de contacto':  'bg-gray-100 text-gray-700',
  'Mensaje 1 enviado':      'bg-yellow-100 text-yellow-800',
  'Recontactar en 48 hs':   'bg-yellow-100 text-yellow-800',
  'Respondió - cotizar':    'bg-green-100 text-green-800',
  'Cotización enviada':     'bg-yellow-100 text-yellow-800',
  'Seguimiento cotización': 'bg-yellow-100 text-yellow-800',
  'Ganado':                 'bg-green-200 text-green-900',
  'Perdido':                'bg-red-100 text-red-700',
  'No interesado':          'bg-red-100 text-red-700',
}

export const ESTADO_DOT: Record<LeadEstado, string> = {
  'Pendiente de contacto':  'bg-gray-400',
  'Mensaje 1 enviado':      'bg-yellow-400',
  'Recontactar en 48 hs':   'bg-yellow-400',
  'Respondió - cotizar':    'bg-green-500',
  'Cotización enviada':     'bg-yellow-500',
  'Seguimiento cotización': 'bg-yellow-500',
  'Ganado':                 'bg-green-600',
  'Perdido':                'bg-red-500',
  'No interesado':          'bg-red-500',
}
