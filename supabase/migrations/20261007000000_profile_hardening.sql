-- Profile hardening. Apply in the Supabase SQL editor after 20261003000000_portal_workflow.sql.
-- 1. Sign-up metadata is client-supplied: bound the stored name (the portal caps edits at 100 chars too)
--    and store the email lowercased so the studio's "link project to account" lookup always matches.
-- 2. Keep profiles.email in step when a user changes their sign-in email.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    nullif(left(btrim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '[[:cntrl:]]', '', 'g')), 100), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = lower(coalesce(new.email, '')) where id = new.id;
  return new;
end $$;
revoke all on function public.handle_user_email_change() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Existing rows: normalise once.
update public.profiles set email = lower(email) where email <> lower(email);
