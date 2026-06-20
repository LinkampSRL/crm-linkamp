-- ============================================================
-- CRM Linkamp — Migración incremental
-- Ejecutar en: Supabase > SQL Editor > New query
-- IMPORTANTE: No borra datos. Solo agrega el campo producto_categoria.
-- ============================================================

-- Agregar columna producto_categoria a la tabla leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS producto_categoria TEXT
  CHECK (producto_categoria IN ('PWS', 'LPS', 'BBC', 'MCS', 'Otros'));

-- Los leads existentes quedan con producto_categoria = NULL.
-- Al importar nuevos leads sin este campo se asigna 'Otros' por código.

-- Verificación:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'leads' AND column_name = 'producto_categoria';
