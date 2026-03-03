create extension if not exists "pgcrypto";

create table if not exists elderly_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  room_no text,
  gender text,
  birth_date date,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  medical_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists care_reports (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elderly_profiles(id) on delete cascade,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  audio_path text,
  transcription_raw text,
  report_structured jsonb,
  report_text text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists timeline_events (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references elderly_profiles(id) on delete cascade,
  event_type text not null,
  title text not null,
  detail text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_elderly_profiles_updated_at on elderly_profiles (updated_at desc);
create index if not exists idx_care_reports_elder_created on care_reports (elder_id, created_at desc);
create index if not exists idx_care_reports_status on care_reports (status);
create index if not exists idx_timeline_events_elder_occurred on timeline_events (elder_id, occurred_at desc);

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_elderly_profiles on elderly_profiles;
create trigger trg_touch_elderly_profiles
before update on elderly_profiles
for each row execute function touch_updated_at();

drop trigger if exists trg_touch_care_reports on care_reports;
create trigger trg_touch_care_reports
before update on care_reports
for each row execute function touch_updated_at();

-- Seed rows for quick MVP validation
insert into elderly_profiles (id, full_name, room_no, gender, birth_date, risk_level, medical_notes)
values
  ('11111111-1111-1111-1111-111111111111', '陈美玲', 'A-302', '女', '1941-06-12', 'medium', '高血压，需按时服药'),
  ('22222222-2222-2222-2222-222222222222', '李志强', 'B-108', '男', '1938-11-04', 'high', 'COPD，夜间血氧重点观察')
on conflict (id) do nothing;
