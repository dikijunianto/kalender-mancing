create table if not exists forecast_cache (
  area_id uuid not null,
  date date not null,
  payload jsonb not null,
  fetched_at timestamptz not null,
  primary key (area_id, date)
);
