# Aegis — Checklist de Empilhadeiras

Sistema web completo de checklist e inspeção de empilhadeiras, com duas
experiências (Operador e Administração), persistência real, autenticação,
controle de acesso por papel, montagem automática de checklist e histórico
rastreável por equipamento.

## Stack

- **Next.js 15** (App Router, Server Actions) + TypeScript
- **Prisma + PostgreSQL** (Neon ou qualquer Postgres gerenciado)
- **Auth.js (NextAuth v5)** — credenciais + bcrypt, sessão JWT com papel
  (`ADMIN` / `OPERADOR`), `middleware.ts` protegendo rotas por papel
- **Armazenamento de fotos** via S3-compatível (R2, S3, etc.) — obrigatório
  em produção, ver `.env.example`
- **Tailwind CSS** com a paleta e tipografia (Geist Sans, Sora, Inter) do
  briefing do produto

## Como rodar

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL/DIRECT_URL de um Postgres real
npx prisma migrate deploy
ADMIN_PASSWORD='sua-senha-forte' npm run seed
npm run dev
```

Acesse `http://localhost:3000`.

Para um ambiente de demonstração completo (operadores + 4 empilhadeiras de
exemplo), rode o seed com `SEED_DEMO_DATA=true` — nunca em produção.

## Deploy em produção

Antes de qualquer deploy, veja a auditoria de produção resumida abaixo.
Checklist mínimo:

1. **Banco de dados**: Postgres real (não SQLite). `DATABASE_URL` deve ser a
   connection string *pooled* (ex.: host `-pooler` do Neon); `DIRECT_URL` a
   direta, usada só por `prisma migrate deploy`. SQLite não funciona em
   ambientes serverless/multi-instância (Vercel etc.) — o arquivo não é
   compartilhado entre instâncias e é apagado a cada redeploy.
2. **Migrations**: `npm run build` já roda `prisma migrate deploy` antes do
   `next build`. Garanta que `DIRECT_URL` esteja disponível no ambiente de
   build.
3. **`AUTH_SECRET`**: gere um valor forte (`openssl rand -base64 32`) — nunca
   reaproveite o valor de desenvolvimento.
4. **`NEXTAUTH_URL`**: o domínio público real da aplicação.
5. **`AUTH_TRUST_HOST`**: deixe em `false` no Vercel (detectado
   automaticamente). Em qualquer outro host atrás de proxy reverso
   (Railway, Fly, Render, nginx próprio), defina `true`.
6. **Storage de fotos**: defina as cinco variáveis `S3_*` (endpoint, bucket,
   credenciais, URL pública). Sem isso, o upload de fotos de não
   conformidade falha em produção em vez de gravar silenciosamente em disco
   efêmero — é intencional, para nunca perder dados de forma silenciosa.
7. **`SHOW_DEMO_CREDENTIALS`**: deixe `false`/ausente. A página de login só
   mostra credenciais de demonstração quando essa flag é `"true"`.
8. **Seed de produção**: rode `ADMIN_PASSWORD='...' npm run seed` uma única
   vez contra o banco de produção (sem `SEED_DEMO_DATA`) para criar os dados
   de referência (tipos, checklist-base, regras de gravidade) e a conta
   admin inicial. Troque a senha assim que possível.

## Arquitetura

- `prisma/schema.prisma` — todas as entidades do domínio (usuários,
  empilhadeiras, tipos, energias, categorias/itens de checklist, regras
  condicionais, checklists, respostas, não conformidades, anexos,
  ocorrências de manutenção, trilha de auditoria).
- `src/lib/checklist-engine.ts` — monta o checklist de uma empilhadeira
  (base + tipo + energia + personalizações da empresa) e grava um
  **snapshot imutável** (`Checklist.templateSnapshot`) no momento em que a
  inspeção começa. Alterações futuras no template **não afetam**
  checklists já respondidos.
- `src/lib/status-engine.ts` — calcula o status do equipamento
  (LIBERADA / RESTRIÇÃO / BLOQUEADA) a partir de uma tabela configurável
  de gravidade → efeito (`SeverityRule`), não de uma regra fixa na UI.
- `src/lib/actions/*` — Server Actions com verificação de sessão/papel
  em todas as mutações (a UI nunca é a única barreira de segurança).
- `src/app/operador/*` — fluxo mobile-first: seleção de equipamento →
  checklist → registro de não conformidade (com foto e gravidade) →
  resultado.
- `src/app/admin/*` — dashboard, empilhadeiras (CRUD + histórico),
  checklists (lista + detalhe fiel ao snapshot), não conformidades,
  configuração do checklist-base (categorias/perguntas condicionais por
  tipo/energia).

## Limitações conhecidas / próximos passos

- As fotos das empilhadeiras usadas nesta entrega são ilustrações
  vetoriais placeholder (`src/components/ForkliftGraphic.tsx`) — nenhum
  arquivo de imagem real foi recebido nesta conversa. Substituir por
  `forklift.imageUrl` (já suportado no cadastro) assim que as fotos
  reais estiverem disponíveis.
- QR Code, assinatura digital, geolocalização, PWA/offline, PDF/Excel e
  múltiplas unidades foram deixados como pontos de extensão
  arquitetural (não implementados), conforme escopo definido.
- Não há tela de "trocar minha senha" para o admin — a rotação de senha do
  bootstrap precisa ser feita direto no banco (ou implementada como
  próximo passo) até que essa função exista na UI.
- A advisory de segurança do PostCSS (via dependência transitiva do
  Next.js 15) só é resolvida com upgrade para Next.js 16, uma mudança
  maior fora do escopo desta auditoria. O vetor de ataque é limitado
  (processamento de CSS em build-time, não uma rota exposta em runtime).
