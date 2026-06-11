-- ============================================================
-- CRM Linkamp — Migración RLS
-- Ejecutar en: Supabase > SQL Editor > New query
-- IMPORTANTE: Ejecutar DESPUÉS de supabase_schema.sql
-- ============================================================

-- ── 1. Habilitar RLS en las tres tablas ─────────────────────
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- ── 2. Eliminar cualquier política previa (si se re-ejecuta) ─
DROP POLICY IF EXISTS anon_no_access_leads        ON leads;
DROP POLICY IF EXISTS anon_no_access_templates    ON templates;
DROP POLICY IF EXISTS anon_no_access_lead_history ON lead_history;

-- ── 3. Políticas explícitas de denegación para anon ─────────
-- Aunque RLS habilitado sin políticas ya bloquea anon,
-- las políticas explícitas documentan la intención.

CREATE POLICY anon_no_access_leads ON leads
  FOR ALL TO anon USING (false);

CREATE POLICY anon_no_access_templates ON templates
  FOR ALL TO anon USING (false);

CREATE POLICY anon_no_access_lead_history ON lead_history
  FOR ALL TO anon USING (false);

-- ── 4. La service_role bypassa RLS automáticamente ──────────
-- No se necesitan políticas para service_role.
-- La clave SUPABASE_SERVICE_ROLE_KEY (solo servidor) tiene
-- acceso completo independientemente de RLS.

-- ── Verificación ────────────────────────────────────────────
-- Después de ejecutar, corroborar con:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('leads', 'templates', 'lead_history');
-- Debe mostrar rowsecurity = true en las tres tablas.
