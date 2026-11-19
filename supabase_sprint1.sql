-- ============================================================
-- Sprint 1 — Migraciones SQL (referencia de lo ejecutado en Supabase)
-- Esta migración ya fue aplicada. No volver a ejecutar.
-- ============================================================

BEGIN;

-- Validación previa: asegura que ningún lead tenga estados incompatibles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM leads WHERE estado NOT IN (
      'Pendiente de contacto',
      'Recontactar en 48 hs',
      'Respondió - cotizar',
      'Cotización enviada',
      'Seguimiento cotización',
      'Ganado',
      'Perdido',
      'No interesado'
    )
  ) THEN
    RAISE EXCEPTION 'Existen leads con estados no permitidos. Revisar antes de continuar.';
  END IF;
END $$;


-- 1. Reemplazar CHECK de estado (elimina 'Mensaje 1 enviado')
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_estado_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_estado_check CHECK (estado IN (
    'Pendiente de contacto',
    'Recontactar en 48 hs',
    'Respondió - cotizar',
    'Cotización enviada',
    'Seguimiento cotización',
    'Ganado',
    'Perdido',
    'No interesado'
  ));


-- 2. Reemplazar CHECK de producto_categoria (agrega 'BPL')
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_producto_categoria_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_producto_categoria_check CHECK (
    producto_categoria IS NULL OR producto_categoria IN ('PWS', 'LPS', 'BBC', 'MCS', 'BPL', 'Otros')
  );


-- 3. Agregar columna proximo_contacto_manual
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS proximo_contacto_manual BOOLEAN NOT NULL DEFAULT false;


-- 4. Insertar template "Seguimiento de cotización"
-- La tabla templates solo tiene columnas id y body.
INSERT INTO templates (id, body)
VALUES (
  'seguimiento_cotizacion',
  E'Hola [Nombre], ¿cómo estás?\n\nTe escribo para hacer seguimiento de la cotización que te enviamos para [Producto].\n\n¿Pudiste revisarla? ¿Tenés alguna consulta sobre la propuesta o las condiciones de financiación?\n\nQuedamos a disposición.'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
