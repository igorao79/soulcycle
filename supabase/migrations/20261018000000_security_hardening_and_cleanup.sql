-- Security hardening + cleanup (audit 2026-10-18)
--
-- Found:
--  * profiles: RLS was OFF and anon had full DML -> anyone with the public key could grant themselves admin
--  * execute_admin_sql / direct_update_user_metadata ran for anonymous callers (NULL email comparison passes)
--  * admin_get_users returned auth.users (incl. password hashes) to everyone
--  * admin_* functions trusted user-editable raw_user_meta_data->>'role'
--  * handle_new_user copied role/perks from client-controlled signup metadata
--  * public_profiles view exposed every user's email from auth.users to anon
--  * site_settings had 1732 rows (client re-inserted it); .single() in eventService always failed
--  * duplicate policies/triggers, unused functions and indexes, missing FK indexes, per-row auth.uid() calls

begin;

-- 1. Dead / dangerous functions ------------------------------------------------
drop function if exists public.execute_admin_sql(text);
drop function if exists public.direct_update_user_metadata(uuid, text);
drop function if exists public.add_user_perk(uuid, text, uuid);
drop function if exists public.remove_user_perk(uuid, text, uuid);
drop function if exists public.update_profile_perks(uuid, jsonb);
drop function if exists public.set_active_perk(uuid, text);
drop function if exists public.sync_user_display_name(uuid, uuid, text);
drop function if exists public.sync_perks_to_auth_metadata();
drop function if exists public.sync_profile_displayname();
drop function if exists public.apply_early_user_if_enabled();
drop function if exists public.get_user_metadata(uuid);
drop function if exists public.admin_get_user_profiles();
drop function if exists public.admin_reset_password(uuid, text);
drop function if exists public.admin_update_user(uuid, jsonb);

-- STATUS (2026-10-18): everything EXCEPT destructive statements (DROP / DELETE, sections 1, the
-- "drop trigger/function _safe" part of 2, the policy rewrite in 7, sections 8 and the DROP INDEX
-- lines of 9) has been applied statement by statement. Those wait for explicit confirmation.
-- Also applied: is_admin() fixed ('admin' = ANY(perks) is invalid for jsonb and always raised):
--   create or replace function public.is_admin() returns boolean language plpgsql security definer
--   set search_path = public as $$ begin return exists (select 1 from public.profiles where id = auth.uid()
--   and (email = 'igoraor79@gmail.com' or active_perk = 'admin' or perks ? 'admin')); end; $$;

-- 2. Signup: single trigger, never trust client metadata for role/perks --------
drop trigger if exists on_auth_user_created_safe on auth.users;
drop function if exists public.handle_new_user_safe();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, avatar, role, perks, active_perk)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar',
    'user',
    '["user"]'::jsonb,
    'user'
  )
  on conflict (id) do nothing;
  -- the 'user' perk row is created by trigger_log_basic_perk on profiles
  return new;
end;
$$;

-- 3. Remaining functions: fixed search_path, correct privileges -----------------
alter function public.is_admin() set search_path = public;
alter function public.get_poll_results(uuid) set search_path = public;
alter function public.create_site_settings_if_not_exists() set search_path = public;
alter function public.admin_update_privileges(uuid, text[]) set search_path = public;
alter function public.log_privilege_changes() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;
alter function public.pin_post(uuid) set search_path = public;
alter function public.auto_assign_basic_perk() set search_path = public;
alter function public.log_user_basic_perk() set search_path = public;
alter function public.admin_update_user_metadata(uuid, text, text) set search_path = public;

-- admin_get_users: admin only, secrets stripped
create or replace function public.admin_get_users()
returns setof auth.users
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select (jsonb_populate_record(
            null::auth.users,
            to_jsonb(u) - 'encrypted_password' - 'confirmation_token' - 'recovery_token'
                        - 'email_change_token_new' - 'email_change_token_current'
                        - 'reauthentication_token' - 'phone_change_token'
          )).*
  from auth.users u
  order by u.created_at desc;
end;
$$;

-- site settings: one row, no CREATE TABLE at runtime
create or replace function public.create_site_settings_if_not_exists()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.site_settings (early_user_promotion)
  select false where not exists (select 1 from public.site_settings);
end;
$$;

-- trigger-only functions are not callable over REST
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_privilege_changes() from public, anon, authenticated;
revoke execute on function public.log_user_basic_perk() from public, anon, authenticated;
revoke execute on function public.auto_assign_basic_perk() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
-- admin RPCs: signed-in only (each one checks is_admin() itself)
revoke execute on function public.admin_get_users() from public, anon;
revoke execute on function public.admin_update_privileges(uuid, text[]) from public, anon;
revoke execute on function public.admin_update_user_metadata(uuid, text, text) from public, anon;
revoke execute on function public.pin_post(uuid) from public, anon;
revoke execute on function public.create_site_settings_if_not_exists() from public, anon;
grant execute on function public.admin_get_users() to authenticated;
grant execute on function public.admin_update_privileges(uuid, text[]) to authenticated;
grant execute on function public.admin_update_user_metadata(uuid, text, text) to authenticated;
grant execute on function public.pin_post(uuid) to authenticated;
grant execute on function public.create_site_settings_if_not_exists() to authenticated;

-- 4. profiles: RLS + guard against privilege escalation -------------------------
alter table public.profiles enable row level security;

drop policy if exists "Пользователи могут обновлять свои" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete to authenticated using (public.is_admin());

-- Non-admins may only change their cosmetic fields. Privileged columns are silently
-- reverted so existing client flows keep working instead of failing with errors.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  promo_active boolean;
begin
  if auth.role() in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.perks := '["user"]'::jsonb;
      new.active_perk := 'user';
      new.role := 'user';
      new.is_banned := false;
      new.ban_reason := null;
      new.ban_end_at := null;
      new.ban_admin_id := null;
      new.ban_admin_name := null;
    else
      new.id := old.id;
      new.email := old.email;
      new.role := old.role;

      select coalesce(bool_or(early_user_promotion), false) into promo_active from public.site_settings;

      -- perks: initialise an empty set, or self-grant early_user while that promotion is on
      if new.perks is distinct from old.perks
         and not (coalesce(old.perks, '[]'::jsonb) = '[]'::jsonb and new.perks = '["user"]'::jsonb)
         and not (promo_active and new.perks = coalesce(old.perks, '[]'::jsonb) || '["early_user"]'::jsonb
                  and not coalesce(old.perks, '[]'::jsonb) ? 'early_user') then
        new.perks := old.perks;
      end if;

      -- active perk: only one the user already owns
      if new.active_perk is distinct from old.active_perk
         and not (new.active_perk = 'user' or coalesce(new.perks, '[]'::jsonb) ? new.active_perk) then
        new.active_perk := old.active_perk;
      end if;

      -- bans: a user may only clear an already expired ban
      if (new.is_banned, new.ban_reason, new.ban_end_at, new.ban_admin_id, new.ban_admin_name)
         is distinct from (old.is_banned, old.ban_reason, old.ban_end_at, old.ban_admin_id, old.ban_admin_name) then
        if not (old.is_banned and not new.is_banned and new.ban_reason is null and new.ban_end_at is null
                and old.ban_end_at is not null and old.ban_end_at < now()) then
          new.is_banned := old.is_banned;
          new.ban_reason := old.ban_reason;
          new.ban_end_at := old.ban_end_at;
          new.ban_admin_id := old.ban_admin_id;
          new.ban_admin_name := old.ban_admin_name;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_profile_privileged_columns() from public, anon, authenticated;

drop trigger if exists a_protect_profile_privileged_columns on public.profiles;
create trigger a_protect_profile_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- perk changes are audited (the function existed but was never attached)
drop trigger if exists trigger_log_privilege_changes on public.profiles;
create trigger trigger_log_privilege_changes
  after update of perks on public.profiles
  for each row execute function public.log_privilege_changes();

-- 5. privilege_change_log: admin read only ---------------------------------------
alter table public.privilege_change_log enable row level security;
drop policy if exists "Admins can read privilege log" on public.privilege_change_log;
create policy "Admins can read privilege log" on public.privilege_change_log
  for select to authenticated using (public.is_admin());

-- 6. Views ------------------------------------------------------------------------
alter view public.public_profiles set (security_invoker = true);
revoke all on public.public_profiles from anon, authenticated;

create or replace view public.posts_with_metadata
with (security_invoker = true) as
select p.id, p.title, p.content, p.image_url, p.user_id, p.styling, p.poll_data, p.created_at,
       pr.display_name as author_name,
       pr.avatar as author_avatar,
       coalesce(pr.perks, '[]'::jsonb) as author_perks,
       coalesce(pr.active_perk, 'user') as author_active_perk,
       (select count(*) from public.post_likes pl where pl.post_id = p.id) as likes_count,
       (select count(*) from public.post_comments pc where pc.post_id = p.id) as comments_count
from public.posts p
left join public.profiles pr on p.user_id = pr.id;

-- 7. Policies: remove duplicates, evaluate auth.uid() once per query ---------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('poll_votes', 'posts', 'post_likes', 'post_comments', 'user_bans', 'site_settings', 'user_perks')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- posts
create policy "posts_select" on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "posts_update_own" on public.posts for update to authenticated
  using ((select auth.uid()) = user_id);
create policy "posts_update_admin" on public.posts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "posts_delete_own" on public.posts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- post_likes
create policy "post_likes_select" on public.post_likes for select using (true);
create policy "post_likes_insert" on public.post_likes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "post_likes_delete_own" on public.post_likes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- post_comments
create policy "post_comments_select" on public.post_comments for select using (true);
create policy "post_comments_insert" on public.post_comments for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "post_comments_update_own" on public.post_comments for update to authenticated
  using ((select auth.uid()) = user_id);
create policy "post_comments_delete_own" on public.post_comments for delete to authenticated
  using ((select auth.uid()) = user_id);

-- poll_votes
create policy "poll_votes_select" on public.poll_votes for select using (true);
create policy "poll_votes_insert" on public.poll_votes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "poll_votes_update_own" on public.poll_votes for update to authenticated
  using ((select auth.uid()) = user_id);
create policy "poll_votes_delete_own" on public.poll_votes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- user_bans (readable by everyone, as before: the ban screen needs it)
create policy "user_bans_select" on public.user_bans for select using (true);
create policy "user_bans_insert_admin" on public.user_bans for insert to authenticated
  with check (public.is_admin());
create policy "user_bans_update_admin" on public.user_bans for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "user_bans_delete_admin" on public.user_bans for delete to authenticated
  using (public.is_admin());

-- site_settings
create policy "site_settings_select" on public.site_settings for select using (true);
create policy "site_settings_insert_admin" on public.site_settings for insert to authenticated
  with check (public.is_admin());
create policy "site_settings_update_admin" on public.site_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "site_settings_delete_admin" on public.site_settings for delete to authenticated
  using (public.is_admin());

-- user_perks
create policy "user_perks_select" on public.user_perks for select using (true);
create policy "user_perks_insert_admin" on public.user_perks for insert to authenticated
  with check (public.is_admin());

-- 8. site_settings: keep the most recently updated row, enforce a single row -------
delete from public.site_settings
where id <> (select id from public.site_settings order by updated_at desc nulls last, id desc limit 1);

create unique index if not exists site_settings_singleton on public.site_settings ((true));

-- 9. Indexes -------------------------------------------------------------------------
create index if not exists idx_post_comments_user_id on public.post_comments (user_id);
create index if not exists idx_post_likes_user_id on public.post_likes (user_id);
create index if not exists idx_posts_user_id on public.posts (user_id);
create index if not exists idx_user_bans_admin_id on public.user_bans (admin_id);
create index if not exists idx_user_perks_user_id on public.user_perks (user_id);
create index if not exists idx_user_perks_granted_by on public.user_perks (granted_by);

drop index if exists public.idx_poll_votes_post_id;          -- covered by unique (post_id, user_id)
drop index if exists public.idx_post_comments_post_id_parent_id;
drop index if exists public.idx_user_bans_created_at;
drop index if exists public.idx_posts_has_styling;
drop index if exists public.idx_posts_has_poll;

-- 10. Table privileges: anon is read-only, nobody needs TRUNCATE/TRIGGER/REFERENCES ---
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

commit;
