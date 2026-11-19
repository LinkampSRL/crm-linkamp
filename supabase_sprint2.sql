-- ============================================================
-- Sprint 2 — Migraciones SQL para ejecutar manualmente en Supabase
-- Ejecutar en orden. Ninguna sentencia elimina datos existentes.
-- Los 626 leads existentes quedan asociados a Linkamp por el DEFAULT.
-- ============================================================

BEGIN;

-- ── 1. Columna marca_comercial ────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS marca_comercial TEXT NOT NULL DEFAULT 'Linkamp';

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_marca_comercial_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_marca_comercial_check
  CHECK (marca_comercial IN ('Linkamp', 'Pampera'));


-- ── 2. Ampliar CHECK de producto_categoria ────────────────────
-- Agrega: Celdas de carga (Linkamp), Pampera 40, Pampera 65, Pampera 80
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_producto_categoria_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_producto_categoria_check CHECK (
    producto_categoria IS NULL OR producto_categoria IN (
      'PWS', 'LPS', 'BBC', 'MCS', 'BPL', 'Celdas de carga', 'Otros',
      'Pampera 40', 'Pampera 65', 'Pampera 80'
    )
  );


-- ── 3. Templates nuevos con prefijo de marca (textos genéricos) ─
-- Se crean solo si no existen. Editables desde /crm/plantillas.

-- Linkamp — Primer contacto
INSERT INTO templates (id, body)
VALUES (
  'linkamp_mensaje_1',
  E'Hola [Nombre], ¿cómo estás?\n\nTe escribo de Linkamp Precisión. Hace un tiempo nos habías consultado por [Producto].\n\nEstamos retomando consultas anteriores y nos gustaría acercarte una propuesta actualizada.\n\n¿Querés que te la enviemos?'
)
ON CONFLICT (id) DO NOTHING;

-- Linkamp — Recontacto
INSERT INTO templates (id, body)
VALUES (
  'linkamp_mensaje_2',
  E'Hola [Nombre], ¿cómo estás?\n\nTe consulto nuevamente por [Producto].\n\n¿Seguís evaluando la opción? ¿Te interesa que te enviemos la cotización actualizada?'
)
ON CONFLICT (id) DO NOTHING;

-- Linkamp — Seguimiento de cotización
INSERT INTO templates (id, body)
VALUES (
  'linkamp_seguimiento_cotizacion',
  E'Hola [Nombre], ¿cómo estás?\n\nTe escribo para hacer seguimiento de la cotización que te enviamos para [Producto].\n\n¿Pudiste revisarla? ¿Tenés alguna consulta sobre la propuesta o las condiciones?\n\nQuedamos a disposición.'
)
ON CONFLICT (id) DO NOTHING;

-- Pampera — Primer contacto
INSERT INTO templates (id, body)
VALUES (
  'pampera_mensaje_1',
  E'Hola [Nombre], ¿cómo estás?\n\nTe escribo de Pampera. Hace un tiempo nos habías consultado por [Producto].\n\nEstamos retomando consultas anteriores y nos gustaría acercarte información actualizada sobre los modelos disponibles y las condiciones de financiación.\n\n¿Querés que te enviemos la propuesta?'
)
ON CONFLICT (id) DO NOTHING;

-- Pampera — Recontacto
INSERT INTO templates (id, body)
VALUES (
  'pampera_mensaje_2',
  E'Hola [Nombre], ¿cómo estás?\n\nTe consulto nuevamente por [Producto] de Pampera.\n\n¿Seguís evaluando la opción? Contamos con condiciones especiales de financiación. ¿Te interesa que te enviemos la cotización actualizada?'
)
ON CONFLICT (id) DO NOTHING;

-- Pampera — Seguimiento de cotización
INSERT INTO templates (id, body)
VALUES (
  'pampera_seguimiento_cotizacion',
  E'Hola [Nombre], ¿cómo estás?\n\nTe escribo para hacer seguimiento de la cotización que te enviamos para [Producto].\n\n¿Pudiste revisarla? ¿Tenés alguna consulta sobre las especificaciones o las condiciones de financiación?\n\nQuedamos a disposición.'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
