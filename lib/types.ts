export type LeadEstado =
  | 'Pendiente de contacto'
  | 'Recontactar en 48 hs'
  | 'Respondió - cotizar'
  | 'Cotización enviada'
  | 'Seguimiento cotización'
  | 'Ganado'
  | 'Perdido'
  | 'No interesado'

export type MarcaComercial = 'Linkamp' | 'Pampera'
export const MARCAS: MarcaComercial[] = ['Linkamp', 'Pampera']

export type ProductoCategoria =
  | 'PWS' | 'LPS' | 'BBC' | 'MCS' | 'BPL' | 'Celdas de carga' | 'Otros'
  | 'Pampera 40' | 'Pampera 65' | 'Pampera 80'

export const PRODUCTO_CATEGORIAS_LINKAMP: ProductoCategoria[] = [
  'PWS', 'LPS', 'BBC', 'MCS', 'BPL', 'Celdas de carga', 'Otros',
]
export const PRODUCTO_CATEGORIAS_PAMPERA: ProductoCategoria[] = [
  'Pampera 40', 'Pampera 65', 'Pampera 80',
]
// Unión completa para validaciones en API/import
export const PRODUCTO_CATEGORIAS: ProductoCategoria[] = [
  ...PRODUCTO_CATEGORIAS_LINKAMP,
  ...PRODUCTO_CATEGORIAS_PAMPERA,
]

export function categoriasParaMarca(marca: MarcaComercial): ProductoCategoria[] {
  return marca === 'Pampera' ? PRODUCTO_CATEGORIAS_PAMPERA : PRODUCTO_CATEGORIAS_LINKAMP
}

export function isCategoriaCompatible(
  marca: MarcaComercial,
  categoria: ProductoCategoria | null | undefined
): boolean {
  if (!categoria) return true
  return categoriasParaMarca(marca).includes(categoria)
}

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
  | 'Base de datos BBC'
  | 'Otro'

export interface Lead {
  id: string
  marca_comercial: MarcaComercial
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
  proximo_contacto_manual: boolean
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
