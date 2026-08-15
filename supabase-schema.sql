-- ================================================
-- MyMoney GO — Schema de Base de Datos
-- Ejecuta esto en Supabase > SQL Editor
-- ================================================

-- TABLA: profiles (datos del usuario + gamificación)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  xp integer default 0,
  streak integer default 0,
  level integer default 1,
  last_active date,
  monthly_income numeric(12,2) default 0,
  onboarding_goal text,
  onboarding_income text,
  onboarding_challenge text,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Agregar monthly_income si la tabla ya existe
alter table profiles add column if not exists monthly_income numeric(12,2) default 0;

-- TABLA: transactions (ingresos y gastos)
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text check (type in ('income', 'expense')) not null,
  amount numeric(12,2) not null,
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamp with time zone default now()
);

-- TABLA: goals (metas de ahorro)
create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  emoji text default '🎯',
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) default 0,
  deadline date,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

-- TABLA: missions (misiones y retos)
create table if not exists missions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  xp_reward integer default 50,
  type text check (type in ('daily', 'weekly', 'achievement')) default 'daily',
  completed boolean default false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- TABLA: achievements (logros desbloqueados)
create table if not exists achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  badge text not null,
  name text not null,
  unlocked_at timestamp with time zone default now()
);

-- TABLA: bills (facturas y gastos recurrentes)
create table if not exists bills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  company text,
  amount numeric(12,2) not null,
  category text not null default 'other',
  due_day integer not null default 1,
  frequency text check (frequency in ('monthly', 'quarterly', 'annual')) default 'monthly',
  payment_method text default 'Débito',
  notes text,
  is_paid boolean default false,
  created_at timestamp with time zone default now()
);

-- TABLA: budgets (presupuestos mensuales por categoría)
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  month text not null,       -- formato 'YYYY-MM'
  category text not null,
  amount numeric(12,2) not null default 0,
  created_at timestamp with time zone default now(),
  unique(user_id, month, category)
);

-- ================================================
-- SEGURIDAD: Row Level Security (RLS)
-- ================================================

alter table profiles enable row level security;
alter table transactions enable row level security;
alter table goals enable row level security;
alter table missions enable row level security;
alter table achievements enable row level security;
alter table bills enable row level security;
alter table budgets enable row level security;

-- Políticas
create policy "Users can manage their own profile"
  on profiles for all using (auth.uid() = id);

create policy "Users can manage their own transactions"
  on transactions for all using (auth.uid() = user_id);

create policy "Users can manage their own goals"
  on goals for all using (auth.uid() = user_id);

create policy "Users can manage their own missions"
  on missions for all using (auth.uid() = user_id);

create policy "Users can manage their own achievements"
  on achievements for all using (auth.uid() = user_id);

create policy "Users can manage their own bills"
  on bills for all using (auth.uid() = user_id);

create policy "Users can manage their own budgets"
  on budgets for all using (auth.uid() = user_id);

-- ================================================
-- AUTO-CREAR PERFIL al registrarse
-- ================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
