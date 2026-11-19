-- ============================================================
-- Agrega 'Base de datos BBC' al CHECK constraint del campo origen
-- Ejecutar manualmente en Supabase. No modifica datos existentes.
-- ============================================================

BEGIN;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_origen_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_origen_check CHECK (
    origen IS NULL OR origen IN (
      'Meta', 'Web', 'WhatsApp', 'Referido', 'Agrofy',
      'Google Ads', 'Mercado Libre', 'Base histórica',
      'Base de datos inicial', 'Base de datos BBC', 'Otro'
    )
  );

COMMIT;
