CREATE ROLE app_user
  LOGIN
  PASSWORD 'app_user_pwd'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOBYPASSRLS;

-- Schema
GRANT USAGE ON SCHEMA public TO app_user;

-- Tablas
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.concentraciones,
  public.country,
  public.destination,
  public.documentos,
  public.estudios,
  public.estudios_pozos,
  public.muestras,
  public.parametros_fisico_quimicos,
  public.pozos,
  public.products,
  public.sustancias
TO app_user;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;