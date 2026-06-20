export type LeadEstado =
  | 'Pendiente de contacto'
  | 'Mensaje 1 enviado'
  | 'Recontactar en 48 hs'
  | 'Respondió - cotizar'
  | 'Cotización enviada'
  | 'Seguimiento cotización'
  | 'Ganado'
  | 'Perdido'
  | 'No interesado'

export type ProductoCategoria = 'PWS' | 'LPS' | 'BBC' | 'MCS' | 'Otros'

export const PRODUCTO_CATEGORIAS: ProductoCategoria[] = ['PWS', 'LPS', 'BBC', 'MCS', 'Otros']

export const RESPONSABLES = ['Sol', 'Martín', 'Cristian', 'Andrés', 'Thomas'] as const
export type Responsable = typeof RESPONSABLES[number]

export type LeadOrigen =
  | 'Meta'
  | 'Web'
  | 'WhatsApp'
  | 'Referido'
  | 'Agrofy'
  | 'Google Ads'
  | 'Mercado Libre'
  | 'Base histórica'
  | 'Base de datos inicial'
  | 'Otro'

export interface Lead {
  id: string
  empresa: string | null
  nombre: string
  telefono: string
  email: string | null
  ciudad_provincia: string | null
  producto_consultado: string | null
  producto_categoria: ProductoCategoria | null
  origen: LeadOrigen | null
  fecha_ingreso: string
  estado: LeadEstado
  ultimo_contacto: string | null
  proximo_contacto: string | null
  observaciones: string | null
  responsable: string | null
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  body: string
}

export interface LeadHistory {
  id: string
  lead_id: string
  fecha: string
  estado_anterior: LeadEstado | null
  estado_nuevo: LeadEstado
  observacion: string | null
}
