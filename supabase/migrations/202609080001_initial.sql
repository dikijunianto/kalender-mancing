-- Fishing Calendar schema. Apply in a Supabase PostgreSQL database.
begin;
create table public.areas (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 description text not null, latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180), timezone text not null default 'Asia/Jakarta',
 marine_zone_name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.species (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, scientific_name text,
 description text not null, habitat text not null, min_depth numeric not null check(min_depth>=0), max_depth numeric not null,
 preferred_temperature_min numeric not null, preferred_temperature_max numeric not null,
 techniques jsonb not null default '[]', bait jsonb not null default '[]', image_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(max_depth>=min_depth), check(preferred_temperature_max>=preferred_temperature_min)
);
create table public.species_seasonality (
 id uuid primary key default gen_random_uuid(), species_id uuid not null references public.species(id),
 area_id uuid not null references public.areas(id), month integer not null check(month between 1 and 12),
 score integer not null check(score between 0 and 100), notes text,
 source_type text not null check(source_type in ('EDITORIAL','COMMUNITY','VERIFIED')),
 unique(species_id,area_id,month)
);
create table public.marine_forecasts (
 id uuid primary key default gen_random_uuid(), area_id uuid not null references public.areas(id),
 forecast_time timestamptz not null, weather_condition integer, temperature numeric, sea_surface_temperature numeric,
 wind_speed numeric check(wind_speed>=0), wind_direction numeric check(wind_direction between 0 and 360),
 wave_height numeric check(wave_height>=0), wave_period numeric, current_speed numeric, current_direction numeric,
 precipitation numeric, precipitation_probability numeric check(precipitation_probability between 0 and 100),
 cloud_cover numeric, visibility numeric, source text not null, raw_data jsonb not null default '{}',
 fetched_at timestamptz not null, created_at timestamptz not null default now(), unique(area_id,forecast_time,source)
);
create table public.tide_forecasts (
 id uuid primary key default gen_random_uuid(), area_id uuid not null references public.areas(id),
 timestamp timestamptz not null, height numeric not null, type text not null check(type in ('HIGH','LOW','NORMAL')),
 source text not null, unique(area_id,timestamp,source)
);
create table public.moon_data (
 id uuid primary key default gen_random_uuid(), date date not null, area_id uuid not null references public.areas(id),
 moon_phase numeric not null check(moon_phase between 0 and 1), illumination numeric not null check(illumination between 0 and 100),
 moonrise timestamptz, moonset timestamptz, created_at timestamptz not null default now(), unique(date,area_id)
);
create table public.forecast_cache (
 area_id uuid not null references public.areas(id), date date not null, payload jsonb not null,
 fetched_at timestamptz not null, primary key(area_id,date)
);
create table public.fishing_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 area_id uuid not null references public.areas(id), species_id uuid not null references public.species(id), date date not null,
 spot_name text check(char_length(spot_name)<=120), catch_count integer not null check(catch_count between 0 and 10000),
 weight numeric check(weight between 0 and 10000), strike_time time, technique text not null check(char_length(technique) between 1 and 100),
 bait text check(char_length(bait)<=100), depth numeric check(depth between 0 and 2000), notes text check(char_length(notes)<=2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index fishing_logs_user_date on public.fishing_logs(user_id,date desc);
create index marine_forecasts_area_time on public.marine_forecasts(area_id,forecast_time);
create index tide_forecasts_area_time on public.tide_forecasts(area_id,timestamp);
create function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
create trigger areas_updated before update on public.areas for each row execute function public.set_updated_at();
create trigger species_updated before update on public.species for each row execute function public.set_updated_at();
create trigger fishing_logs_updated before update on public.fishing_logs for each row execute function public.set_updated_at();
alter table public.areas enable row level security;
alter table public.species enable row level security;
alter table public.species_seasonality enable row level security;
alter table public.marine_forecasts enable row level security;
alter table public.tide_forecasts enable row level security;
alter table public.moon_data enable row level security;
alter table public.forecast_cache enable row level security;
alter table public.fishing_logs enable row level security;
create policy "Public areas" on public.areas for select using(true);
create policy "Public species" on public.species for select using(true);
create policy "Public editorial seasonality" on public.species_seasonality for select using(true);
create policy "Public marine forecasts" on public.marine_forecasts for select using(true);
create policy "Public tides" on public.tide_forecasts for select using(true);
create policy "Public moon" on public.moon_data for select using(true);
create policy "Users read own logs" on public.fishing_logs for select to authenticated using((select auth.uid())=user_id);
create policy "Users create own logs" on public.fishing_logs for insert to authenticated with check((select auth.uid())=user_id);
create policy "Users update own logs" on public.fishing_logs for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "Users delete own logs" on public.fishing_logs for delete to authenticated using((select auth.uid())=user_id);
grant select on public.areas,public.species,public.species_seasonality,public.marine_forecasts,public.tide_forecasts,public.moon_data to anon,authenticated;
grant select,insert,update,delete on public.fishing_logs to authenticated;
grant all on all tables in schema public to service_role;
-- forecast_cache intentionally has no public policies. Only the server service role can use it.
commit;
