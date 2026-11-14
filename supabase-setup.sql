-- Galeri Hari Guru SMK ARRAHMAN
-- Jalankan di Supabase Dashboard > SQL Editor.

create table if not exists public.galeri (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nama_pengirim text not null,
  ucapan text default '',
  image_url text not null,
  likes integer not null default 0
);

alter table public.galeri enable row level security;

drop policy if exists "Public can read gallery" on public.galeri;
create policy "Public can read gallery"
on public.galeri for select
to anon, authenticated
using (true);

drop policy if exists "Public can insert gallery" on public.galeri;
create policy "Public can insert gallery"
on public.galeri for insert
to anon, authenticated
with check (
  length(trim(nama_pengirim)) > 0
  and length(trim(image_url)) > 0
  and likes = 0
);

-- Atomic like/unlike update. The browser calls this RPC, not direct UPDATE.
create or replace function public.ubah_like_galeri(
  foto_id uuid,
  perubahan integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if perubahan not in (-1, 1) then
    raise exception 'Perubahan like hanya boleh -1 atau 1';
  end if;

  update public.galeri
  set likes = greatest(coalesce(likes, 0) + perubahan, 0)
  where id = foto_id;

  if not found then
    raise exception 'Foto tidak ditemukan';
  end if;
end;
$$;

revoke all on function public.ubah_like_galeri(uuid, integer) from public;
grant execute on function public.ubah_like_galeri(uuid, integer)
to anon, authenticated;

-- Tambahkan tabel ke publication realtime hanya jika belum terdaftar.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'galeri'
  ) then
    alter publication supabase_realtime add table public.galeri;
  end if;
end;
$$;

-- Storage bucket foto-acara harus dibuat melalui Dashboard > Storage.
-- Jadikan Public agar getPublicUrl() dapat menampilkan gambar.
drop policy if exists "Public can view foto acara" on storage.objects;
create policy "Public can view foto acara"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'foto-acara');

drop policy if exists "Public can upload foto acara" on storage.objects;
create policy "Public can upload foto acara"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'foto-acara');
