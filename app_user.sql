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

GRANT select on  
  dwh.fact_cruce_concentraciones_pfq, 
  dwh.fact_concentraciones_agua, 
  dwh.fact_parametros_fq,
  dwh.dim_muestras,
  dwh.dim_pozos,
  dwh.dim_sustancias
to app_user;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;