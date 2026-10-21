alter table public.usage_events add column if not exists resolution text;

grant insert on public.generations to authenticated;
drop policy if exists "own gen insert" on public.generations;
create policy "own gen insert" on public.generations for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own generation files write" on storage.objects;
create policy "own generation files write" on storage.objects for insert to authenticated with check (bucket_id = 'generations' and (storage.foldername(name))[1] = auth.uid()::text);