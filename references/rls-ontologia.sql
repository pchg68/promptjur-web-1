-- =============================================================================
-- RLS — Ontologia Jurídica (JurisOS / PromptJur)
-- Visibilidade por status: PUBLICADO para todos; RASCUNHO/REVISAO só developer/admin.
--
-- ESCOPO: estas policies protegem o acesso DIRETO via Supabase/PostgREST e
-- qualquer role que NÃO tenha BYPASSRLS. Para que o Prisma também as respeite,
-- conecte com um role sem BYPASSRLS e mantenha FORCE ROW LEVEL SECURITY
-- (ver runbook, Fase 4). O filtro primário da aplicação continua no tRPC.
-- =============================================================================

-- Papel do usuário a partir do claim do JWT. Ajustar o nome do claim ('app_role')
-- ao que o JurisOS efetivamente emite.
create or replace function public.app_role() returns text
language sql stable as $$
  select coalesce(
    current_setting('request.jwt.claims', true)::jsonb ->> 'app_role',
    'anon'
  );
$$;

-- ----------------------------------------------------------------------------
-- Tabelas COM coluna "status": "TipoPeca", "Instituto", "Tese", "Precedente"
-- SELECT: PUBLICADO para qualquer um; rascunhos só para developer/administrator.
-- WRITE: somente developer/administrator.
-- ----------------------------------------------------------------------------

-- TipoPeca
alter table "TipoPeca" enable row level security;
alter table "TipoPeca" force row level security;
create policy "tipopeca_select" on "TipoPeca" for select
  using ("status" = 'PUBLICADO' or public.app_role() in ('developer','administrator'));
create policy "tipopeca_write" on "TipoPeca" for all
  using (public.app_role() in ('developer','administrator'))
  with check (public.app_role() in ('developer','administrator'));

-- Instituto
alter table "Instituto" enable row level security;
alter table "Instituto" force row level security;
create policy "instituto_select" on "Instituto" for select
  using ("status" = 'PUBLICADO' or public.app_role() in ('developer','administrator'));
create policy "instituto_write" on "Instituto" for all
  using (public.app_role() in ('developer','administrator'))
  with check (public.app_role() in ('developer','administrator'));

-- Tese
alter table "Tese" enable row level security;
alter table "Tese" force row level security;
create policy "tese_select" on "Tese" for select
  using ("status" = 'PUBLICADO' or public.app_role() in ('developer','administrator'));
create policy "tese_write" on "Tese" for all
  using (public.app_role() in ('developer','administrator'))
  with check (public.app_role() in ('developer','administrator'));

-- Precedente
alter table "Precedente" enable row level security;
alter table "Precedente" force row level security;
create policy "precedente_select" on "Precedente" for select
  using ("status" = 'PUBLICADO' or public.app_role() in ('developer','administrator'));
create policy "precedente_write" on "Precedente" for all
  using (public.app_role() in ('developer','administrator'))
  with check (public.app_role() in ('developer','administrator'));

-- ----------------------------------------------------------------------------
-- Tabelas SEM "status" (visibilidade deriva do pai). Leitura liberada a quem
-- estiver autenticado; escrita só developer/administrator.
--   "AreaDireito", "Dispositivo", "RequisitoLegal",
--   "TesePeca", "TeseDispositivo", "TesePrecedente", "InstitutoDispositivo"
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'AreaDireito','Dispositivo','RequisitoLegal',
    'TesePeca','TeseDispositivo','TesePrecedente','InstitutoDispositivo'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('alter table %I force row level security;', t);
    execute format($f$create policy %I on %I for select using (public.app_role() <> 'anon');$f$, t||'_select', t);
    execute format($f$create policy %I on %I for all
        using (public.app_role() in ('developer','administrator'))
        with check (public.app_role() in ('developer','administrator'));$f$, t||'_write', t);
  end loop;
end $$;

-- Rollback das policies (se necessário):
--   drop policy "tipopeca_select" on "TipoPeca"; ... etc.
--   alter table "TipoPeca" disable row level security; ... etc.
