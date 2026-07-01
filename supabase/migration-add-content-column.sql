-- Migration: añadir columna content a generations
-- Ejecutar en Supabase Dashboard → SQL Editor

alter table if exists public.generations
  add column if not exists content text;
