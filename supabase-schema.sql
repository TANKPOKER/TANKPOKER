-- ============================================================
-- TANK — schéma Supabase v1
-- À exécuter tel quel dans l'éditeur SQL de Supabase.
-- Comptes : gérés par Supabase Auth (email + mot de passe).
-- Ce schéma crée le profil public, les mains, les réactions,
-- les commentaires, les abonnements, et les règles d'accès.
-- ============================================================

-- ---------- profils publics, liés aux comptes ----------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  handle     text not null check (handle ~ '^[A-Za-z0-9_]{3,20}$'),
  name       text not null default '',
  stakes     text not null default '',
  bio        text not null default '' check (length(bio) <= 280),
  created_at timestamptz not null default now()
);
-- unicité du pseudo, insensible à la casse
create unique index profiles_handle_key on public.profiles (lower(handle));

-- Le profil est créé par un déclencheur à l'inscription : le client ne peut
-- pas l'insérer lui-même car, avec la confirmation d'email activée, il n'a
-- pas encore de session au moment du sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  h text;
begin
  -- Pseudo choisi à l'inscription email ; pour Google/Apple (OAuth), dérivé du
  -- nom du compte puis du début de l'email. Nettoyé, borné, avec repli neutre.
  h := coalesce(new.raw_user_meta_data->>'handle',
                new.raw_user_meta_data->>'preferred_username',
                new.raw_user_meta_data->>'full_name',
                new.raw_user_meta_data->>'name',
                split_part(coalesce(new.email,''), '@', 1));
  h := left(regexp_replace(coalesce(h,''), '[^A-Za-z0-9_]', '_', 'g'), 20);
  if h !~ '^[A-Za-z0-9_]{3,20}$' then
    h := 'joueur_' || left(replace(new.id::text,'-',''), 6);
  end if;
  begin
    insert into public.profiles (id, handle, name) values (new.id, h, h);
  exception when unique_violation then
    -- pseudo déjà pris : suffixe déterministe plutôt qu'un échec d'inscription
    insert into public.profiles (id, handle, name)
    values (new.id, left(h, 14) || '_' || left(replace(new.id::text,'-',''), 4), h);
  end;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- mains ----------
-- Le déroulé complet (cfg, actions, board, showdown, winners, alive) vit en
-- jsonb : c'est le format que le moteur client rejoue tel quel. Les colonnes
-- extraites servent aux listes et aux classements sans ouvrir le payload.
create table public.hands (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  question   text not null check (length(question) between 1 and 140),
  payload    jsonb not null,
  pot_final  numeric(10,2) not null check (pot_final > 0),
  invested   numeric(10,2) not null check (invested >= 0),
  result     numeric(10,2) not null,
  won        boolean not null,
  end_reason text not null check (end_reason in ('fold','showdown')),
  tags       text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index hands_created_idx on public.hands (created_at desc);
create index hands_author_idx  on public.hands (author_id, created_at desc);
create index hands_tags_idx    on public.hands using gin (tags);

-- ---------- réactions : un avis par joueur et par main ----------
create table public.reactions (
  hand_id    uuid not null references public.hands(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('like','dislike')),
  created_at timestamptz not null default now(),
  primary key (hand_id, profile_id)
);

-- ---------- commentaires, ancrés à une street ----------
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  hand_id    uuid not null references public.hands(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  street     text not null check (street in ('preflop','flop','turn','river')),
  body       text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_hand_idx on public.comments (hand_id, created_at);

-- ---------- abonnements ----------
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint no_self_follow check (follower_id <> followed_id)
);

-- ============================================================
-- Sécurité au niveau des lignes : tout le monde lit,
-- chacun n'écrit que sous sa propre identité.
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.hands     enable row level security;
alter table public.reactions enable row level security;
alter table public.comments  enable row level security;
alter table public.follows   enable row level security;

create policy profiles_read   on public.profiles  for select using (true);
create policy profiles_update on public.profiles  for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy hands_read   on public.hands for select using (true);
create policy hands_insert on public.hands for insert
  with check (author_id = auth.uid());
create policy hands_delete on public.hands for delete
  using (author_id = auth.uid());

create policy reactions_read   on public.reactions for select using (true);
create policy reactions_write  on public.reactions for insert
  with check (profile_id = auth.uid());
create policy reactions_update on public.reactions for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy reactions_delete on public.reactions for delete
  using (profile_id = auth.uid());

create policy comments_read   on public.comments for select using (true);
create policy comments_insert on public.comments for insert
  with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete
  using (author_id = auth.uid());

create policy follows_read   on public.follows for select using (true);
create policy follows_insert on public.follows for insert
  with check (follower_id = auth.uid());
create policy follows_delete on public.follows for delete
  using (follower_id = auth.uid());
