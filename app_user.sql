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
GRANT USAGE ON SCHEMA dwh TO app_user;


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
  public.sustancias,
  public.reportes,
  public.reporte_configuraciones,
  public.parametros_muestras
TO app_user;

-- Permisos de uso en los schemas
GRANT USAGE ON SCHEMA public, staging, intermediate, dwh, marts TO app_user;

-- SELECT en todas las tablas/vistas de cada schema
GRANT SELECT ON ALL TABLES IN SCHEMA staging TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA intermediate TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA dwh TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA marts TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_user;

-- Para objetos que cree dbt en el futuro (post-deploy)
ALTER DEFAULT PRIVILEGES IN SCHEMA staging GRANT SELECT ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA intermediate GRANT SELECT ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA dwh GRANT SELECT ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA marts GRANT SELECT ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_user;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;