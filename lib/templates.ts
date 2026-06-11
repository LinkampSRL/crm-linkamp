export const DEFAULT_TEMPLATES = {
  mensaje_1: `Hola [Nombre], ¿cómo estás?

Te escribo de Linkamp Precisión. Hace un tiempo nos habías consultado por la balanza portátil para pesaje por ejes.

Estamos retomando consultas anteriores porque durante junio y julio 2026 tenemos precio promocional y posibilidad de financiación de hasta 36 meses con BNA PyME y BNA Agro.

¿Querés que te pasemos la propuesta actualizada?`,

  mensaje_2: `Hola [Nombre], ¿cómo estás?

Te consulto nuevamente por la balanza portátil para pesaje por ejes.

Durante junio y julio tenemos condiciones especiales: precio promocional y financiación hasta 36 meses con BNA PyME / BNA Agro.

¿Te interesa que te enviemos la cotización actualizada?`,
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
