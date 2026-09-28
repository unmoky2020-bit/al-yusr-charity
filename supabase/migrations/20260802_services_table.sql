-- =====================================================
-- Al-Yusr: Services Table Migration
-- Run this in Supabase SQL Editor
-- =====================================================
create table if not exists public.services (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  program_slug   text,
  sector         text not null default 'general',
  hero           text,
  badge_ar       text not null default '',
  badge_en       text not null default '',
  title_ar       text not null default '',
  title_en       text not null default '',
  intro_ar       text not null default '',
  intro_en       text not null default '',
  seo_title_ar   text,
  seo_title_en   text,
  seo_desc_ar    text,
  seo_desc_en    text,
  bullets_ar     jsonb default '[]'::jsonb,
  bullets_en     jsonb default '[]'::jsonb,
  stats          jsonb default '[]'::jsonb,
  features       jsonb default '[]'::jsonb,
  tiers          jsonb default '[]'::jsonb,
  related        jsonb default '[]'::jsonb,
  active         boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services for each row execute procedure public.set_updated_at();
alter table public.services enable row level security;
drop policy if exists "public_read_active_services" on public.services;
create policy "public_read_active_services" on public.services for select using (active = true);
drop policy if exists "admin_all_services" on public.services;
create policy "admin_all_services" on public.services for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create index if not exists services_slug_idx on public.services (slug);
create index if not exists services_sector_idx on public.services (sector);
create index if not exists services_sort_idx on public.services (sort_order);
