-- Acervo de livros: dados demonstrativos, públicos e editáveis por qualquer visitante.
-- Execute no SQL Editor de um projeto Supabase dedicado à atividade.

create table if not exists public.biblioteca_livros (
  id uuid primary key default gen_random_uuid(),
  titulo varchar(160) not null check (length(trim(titulo)) > 0),
  autor varchar(120) not null check (length(trim(autor)) > 0),
  genero varchar(60),
  ano_publicacao integer check (ano_publicacao between 1450 and 2100),
  situacao text not null default 'quero-ler'
    check (situacao in ('quero-ler', 'lendo', 'lido')),
  descricao varchar(1000),
  criado_em timestamptz not null default now(),
  constraint biblioteca_livros_titulo_autor_unique unique (titulo, autor)
);

alter table public.biblioteca_livros enable row level security;

-- O Data API exige GRANTs explícitos além das policies de RLS.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.biblioteca_livros to anon, authenticated;

drop policy if exists "Leitura publica de livros" on public.biblioteca_livros;
create policy "Leitura publica de livros"
on public.biblioteca_livros for select to anon, authenticated
using (true);

drop policy if exists "Inclusao publica de livros" on public.biblioteca_livros;
create policy "Inclusao publica de livros"
on public.biblioteca_livros for insert to anon, authenticated
with check (true);

drop policy if exists "Edicao publica de livros" on public.biblioteca_livros;
create policy "Edicao publica de livros"
on public.biblioteca_livros for update to anon, authenticated
using (true) with check (true);

drop policy if exists "Exclusao publica de livros" on public.biblioteca_livros;
create policy "Exclusao publica de livros"
on public.biblioteca_livros for delete to anon, authenticated
using (true);

insert into public.biblioteca_livros
  (titulo, autor, genero, ano_publicacao, situacao, descricao)
values
  ('Dom Casmurro', 'Machado de Assis', 'Romance', 1899, 'lido', 'Clássico da literatura brasileira.'),
  ('A Hora da Estrela', 'Clarice Lispector', 'Romance', 1977, 'quero-ler', null),
  ('O Cortiço', 'Aluísio Azevedo', 'Romance', 1890, 'lendo', null)
on conflict on constraint biblioteca_livros_titulo_autor_unique do nothing;
