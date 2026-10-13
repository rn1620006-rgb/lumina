-- LUMINA: base isolada (não executar em bases de outros projetos).
-- PostgreSQL 16+ | Executar UMA única vez na base exclusiva da LUMINA.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS lumina_early_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('cliente','profissional')),
  full_name varchar(120) NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
  email varchar(254) NOT NULL,
  city varchar(80) NOT NULL,
  category varchar(100),
  message varchar(750),
  privacy_accepted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','contactado','arquivado'))
);
CREATE UNIQUE INDEX IF NOT EXISTS lumina_early_access_unique_person
  ON lumina_early_access (lower(email),kind);
CREATE INDEX IF NOT EXISTS lumina_early_access_created_at
  ON lumina_early_access (created_at DESC);
CREATE TABLE IF NOT EXISTS lumina_early_access_attempts (
  ip_hash char(64) NOT NULL,
  request_day date NOT NULL DEFAULT current_date,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (ip_hash,request_day)
);
COMMENT ON TABLE lumina_early_access IS 'Interesse pré-lançamento da LUMINA. Dados pessoais: acesso exclusivamente pelo servidor.';
COMMENT ON TABLE lumina_early_access_attempts IS 'Contador diário antisspam: guarda apenas HMAC do IP, não o endereço original.';
COMMIT;
