export const DEFAULT_TEMPLATES: Record<string, string> = {
  // ── Linkamp ───────────────────────────────────────────────
  linkamp_mensaje_1: `Hola [Nombre], ¿cómo estás?

Te escribo de Linkamp Precisión. Hace un tiempo nos habías consultado por [Producto].

Estamos retomando consultas anteriores y nos gustaría acercarte una propuesta actualizada.

¿Querés que te la enviemos?`,

  linkamp_mensaje_2: `Hola [Nombre], ¿cómo estás?

Te consulto nuevamente por [Producto].

¿Seguís evaluando la opción? ¿Te interesa que te enviemos la cotización actualizada?`,

  linkamp_seguimiento_cotizacion: `Hola [Nombre], ¿cómo estás?

Te escribo para hacer seguimiento de la cotización que te enviamos para [Producto].

¿Pudiste revisarla? ¿Tenés alguna consulta sobre la propuesta o las condiciones?

Quedamos a disposición.`,

  // ── Pampera ───────────────────────────────────────────────
  pampera_mensaje_1: `Hola [Nombre], ¿cómo estás?

Te escribo de Pampera. Hace un tiempo nos habías consultado por [Producto].

Estamos retomando consultas anteriores y nos gustaría acercarte información actualizada sobre los modelos disponibles y las condiciones de financiación.

¿Querés que te enviemos la propuesta?`,

  pampera_mensaje_2: `Hola [Nombre], ¿cómo estás?

Te consulto nuevamente por [Producto] de Pampera.

¿Seguís evaluando la opción? Contamos con condiciones especiales de financiación. ¿Te interesa que te enviemos la cotización actualizada?`,

  pampera_seguimiento_cotizacion: `Hola [Nombre], ¿cómo estás?

Te escribo para hacer seguimiento de la cotización que te enviamos para [Producto].

¿Pudiste revisarla? ¿Tenés alguna consulta sobre las especificaciones o las condiciones de financiación?

Quedamos a disposición.`,

  // ── Legacy (conservados como respaldo) ────────────────────
  mensaje_1:              `Hola [Nombre], ¿cómo estás?\n\nTe escribo de Linkamp Precisión. Hace un tiempo nos habías consultado por [Producto].\n\nEstamos retomando consultas anteriores y nos gustaría acercarte una propuesta actualizada.\n\n¿Querés que te la enviemos?`,
  mensaje_2:              `Hola [Nombre], ¿cómo estás?\n\nTe consulto nuevamente por [Producto].\n\n¿Seguís evaluando la opción? ¿Te interesa que te enviemos la cotización actualizada?`,
  seguimiento_cotizacion: `Hola [Nombre], ¿cómo estás?\n\nTe escribo para hacer seguimiento de la cotización que te enviamos para [Producto].\n\n¿Pudiste revisarla? ¿Tenés alguna consulta sobre la propuesta o las condiciones?\n\nQuedamos a disposición.`,
}

export const TEMPLATE_LABELS: Record<string, string> = {
  linkamp_mensaje_1:              'Linkamp — Mensaje 1 (Primer contacto)',
  linkamp_mensaje_2:              'Linkamp — Mensaje 2 (Recontacto)',
  linkamp_seguimiento_cotizacion: 'Linkamp — Seguimiento de cotización',
  pampera_mensaje_1:              'Pampera — Mensaje 1 (Primer contacto)',
  pampera_mensaje_2:              'Pampera — Mensaje 2 (Recontacto)',
  pampera_seguimiento_cotizacion: 'Pampera — Seguimiento de cotización',
}

// IDs activos por marca y estado
export function templateIdForLead(
  marca: 'Linkamp' | 'Pampera',
  estado: string
): string {
  const prefix = marca === 'Pampera' ? 'pampera' : 'linkamp'
  if (estado === 'Recontactar en 48 hs') return `${prefix}_mensaje_2`
  if (estado === 'Cotización enviada' || estado === 'Seguimiento cotización') return `${prefix}_seguimiento_cotizacion`
  return `${prefix}_mensaje_1`
}

export function applyTemplate(
  template: string,
  vars: { nombre?: string; empresa?: string; producto?: string; telefono?: string }
): string {
  return template
    .replace(/\[Nombre\]/g, vars.nombre || '')
    .replace(/\[Empresa\]/g, vars.empresa || '')
    .replace(/\[Producto\]/g, vars.producto || '')
    .replace(/\[Telefono\]/g, vars.telefono || '')
}
