# Acervo

Um catálogo de livros com visual editorial e CRUD completo, criado em HTML, CSS e JavaScript e conectado ao Supabase.

**Site:** https://lcs-ds.github.io/acervo-livros/

## Funcionalidades

- Cadastro, consulta, edição e exclusão de livros.
- Capas tipográficas, detalhes de cada obra e notas de leitura.
- Busca por título ou autor e filtros por status.
- Resumo de leituras e layout adaptado para celular.

## Banco de dados

O projeto usa a tabela `public.biblioteca_livros`. O arquivo `schema.sql` cria a tabela, os GRANTs, as quatro policies de RLS e três registros de exemplo.

Esta atividade permite acesso público ao CRUD. Qualquer visitante pode alterar os livros. Use somente dados demonstrativos. O frontend contém apenas a chave pública publishable, nunca a chave secret ou service_role.

Para configurar outro projeto, execute `schema.sql` no SQL Editor do Supabase e substitua a URL e a chave pública em `config.js`.

## Execução local

Sirva a pasta do projeto com um servidor estático, por exemplo:

```sh
python -m http.server 8000
```

Abra http://localhost:8000. Não há dependências para instalar nem etapa de build.

## Publicação

GitHub Pages publica a raiz da branch `main`. O arquivo `.nojekyll` mantém a publicação estática. Novos commits nessa branch atualizam o site automaticamente.

## Estrutura

| Arquivo | Função |
| --- | --- |
| `index.html` | Estrutura e formulários |
| `styles.css` | Identidade visual e layout responsivo |
| `app.js` | Interface e operações pela Data API |
| `config.js` | URL e chave pública Supabase |
| `schema.sql` | Estrutura do banco e policies |

As capas são composições gráficas do próprio site e não reproduzem capas de edições comerciais.
