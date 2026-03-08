# Catalogo Digital

Catalogo publico em Next.js para exibicao de produtos de atacado, separado da loja principal e sem qualquer elemento de venda. A interface mostra apenas foto principal, nome e tamanhos disponiveis.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Route Handlers no servidor
- Pronto para deploy na Vercel

## Estrutura

```text
app/
  api/
    catalogo/route.ts
    categorias/route.ts
  globals.css
  layout.tsx
  loading.tsx
  page.tsx
components/
  catalog/
lib/
services/
  facilzap/
scripts/
  facilzap-probe.mjs
types/
```

## Variaveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```bash
FACILZAP_TOKEN=seu_token_aqui
FACILZAP_API_BASE_URL=https://api.facilzap.app.br
```

Arquivo de exemplo:

- `.env.example`

Pontos exatos para configurar:

- Local: `.env.local` na raiz do projeto
- Vercel: `Project Settings > Environment Variables`

O token nunca deve ser enviado ao frontend. Toda chamada autenticada fica em `services/facilzap/client.ts`.

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Configure as variaveis em `.env.local`.

3. Execute a Fase 0 para validar o payload real da FacilZap:

```bash
npm run facilzap:probe
```

Os samples serao salvos em `tmp/facilzap-samples/`.

4. Suba o projeto:

```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000).

## Como funciona

- `app/page.tsx` faz SSR e chama o service da FacilZap diretamente.
- `app/api/catalogo/route.ts` expone produtos normalizados para uso futuro no cliente.
- `app/api/categorias/route.ts` expone categorias normalizadas.
- `services/facilzap/catalog.ts` faz merge de categorias, produtos e variacoes, com normalizacao defensiva.
- `services/facilzap/client.ts` concentra Bearer Token, timeout, retry, logs e paginacao.

## Regras implementadas

- Nao mostra preco
- Nao mostra quantidade por tamanho
- Nao mostra carrinho, checkout ou botoes de compra
- Nao mostra WhatsApp
- Nao mostra dados comerciais da loja original
- Produto sem imagem usa placeholder neutro
- Produto sem tamanhos validos oculta a linha de tamanhos
- Tamanhos sao deduplicados, limpos e ordenados
- Novos produtos entram automaticamente via revalidacao server-side

## Endpoints da FacilZap usados

Validados na referencia de lojistas:

- `GET /categorias`
- `GET /produtos`
- `GET /variacoes`

Referencias oficiais:

- [Introducao](https://docs.facilzap.app.br/)
- [Referencia da API](https://docs.facilzap.app.br/referencia-api)
- [Swagger lojista](https://api.facilzap.app.br/docs/lojista/v1#/)

## Deploy na Vercel

1. Crie um projeto novo na Vercel apontando para este repositorio.
2. Defina as mesmas variaveis de ambiente no painel.
3. Rode o primeiro deploy.
4. Verifique se a rota publica carregou o catalogo corretamente.

## Nome do projeto e URL

O nome base do projeto ja esta configurado como `catalogodigital` no `package.json`.

Na Vercel:

1. Tente criar o projeto com o nome `catalogodigital`.
2. Se o slug estiver ocupado, use um fallback como `catalogodigital-app`.
3. Se quiser, renomeie depois em `Project Settings > General`.

A URL final da Vercel depende da disponibilidade do slug no momento da publicacao.

## Validacao

Comandos principais:

```bash
npm run lint
npm run build
```
