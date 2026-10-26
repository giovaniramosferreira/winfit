-- Preparation only. Apply through a reviewed Supabase migration; not executed by the client.
-- Private rows and object access. Do not make the bucket public or add service_role to a client.
create table if not exists public.winfit_meals (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  local_time time not null,
  meal_type text not null check (length(trim(meal_type)) between 1 and 200),
  revision bigint not null default 1 check(revision > 0),
  deleted_at timestamptz,
  unique(id,user_id)
);
create table if not exists public.winfit_meal_items (
  id uuid primary key,
  meal_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 200),
  grams numeric check(grams > 0 and grams <> 'NaN'::numeric and grams <> 'Infinity'::numeric),
  kcal numeric check(kcal >= 0 and kcal <> 'NaN'::numeric and kcal <> 'Infinity'::numeric),
  provenance jsonb,
  foreign key (meal_id,user_id) references public.winfit_meals(id,user_id) on delete cascade
);
create table if not exists public.winfit_meal_photos (
  id uuid primary key,
  meal_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  object_path text not null unique,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer not null check(byte_size > 0 and byte_size <= 5242880),
  storage_consent_at timestamptz not null,
  analysis_consent_at timestamptz,
  analysis_destination text,
  foreign key (meal_id,user_id) references public.winfit_meals(id,user_id) on delete cascade,
  check(object_path ~ ('^' || user_id::text || '/[a-zA-Z0-9_-]+\.(jpg|png|webp)$')),
  check(analysis_consent_at is null or (analysis_destination is not null and length(trim(analysis_destination)) > 0))
);
alter table public.winfit_meals enable row level security;
alter table public.winfit_meal_items enable row level security;
alter table public.winfit_meal_photos enable row level security;
drop policy if exists "winfit own meals" on public.winfit_meals;
create policy "winfit own meals" on public.winfit_meals for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "winfit own meal items" on public.winfit_meal_items;
create policy "winfit own meal items" on public.winfit_meal_items for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "winfit own meal photos" on public.winfit_meal_photos;
create policy "winfit own meal photos" on public.winfit_meal_photos for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
grant select,insert,update,delete on public.winfit_meals,public.winfit_meal_items,public.winfit_meal_photos to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('winfit-meals-private','winfit-meals-private',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- Unique paths are immutable: deliberately no UPDATE policy.
drop policy if exists "winfit own photo read" on storage.objects;
create policy "winfit own photo read" on storage.objects for select to authenticated using(bucket_id='winfit-meals-private' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "winfit own photo insert" on storage.objects;
create policy "winfit own photo insert" on storage.objects for insert to authenticated with check(bucket_id='winfit-meals-private' and (storage.foldername(name))[1]=auth.uid()::text and name ~ ('^' || auth.uid()::text || '/[a-zA-Z0-9_-]+\.(jpg|png|webp)$'));
drop policy if exists "winfit own photo delete" on storage.objects;
create policy "winfit own photo delete" on storage.objects for delete to authenticated using(bucket_id='winfit-meals-private' and (storage.foldername(name))[1]=auth.uid()::text);
-- RLS does not expire issued signed URLs. Backend must verify owner before issuing one,
-- pass expiresIn=60, never cache it in the diary, and delete the object to revoke future reads.
-- Account deletion must explicitly remove storage objects before deleting auth.users;
-- deleting metadata rows alone does not remove the bytes in Supabase Storage.
