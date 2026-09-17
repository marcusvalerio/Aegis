# Aegis — Checklist de Empilhadeiras

Sistema web completo de checklist e inspeção de empilhadeiras, com duas
experiências (Operador e Administração), persistência real, autenticação,
controle de acesso por papel, montagem automática de checklist e histórico
rastreável por equipamento.

## Stack

- **Next.js 15** (App Router, Server Actions) + TypeScript
- **Prisma + SQLite** — persistência real; troque `DATABASE_URL` por um
  Postgres em produção sem alterar código de aplicação
- **Auth.js (NextAuth v5)** — credenciais + bcrypt, sessão JWT com papel
  (`ADMIN` / `OPERADOR`), `middleware.ts` protegendo rotas por papel
- **Tailwind CSS** com a paleta e tipografia (Geist Sans, Sora, Inter) do
  briefing do produto

## Como rodar

```bash
npm install
npx prisma migrate dev   # cria o banco SQLite local
npm run seed              # usuários, tipos, checklist-base e 4 empilhadeiras de exemplo
npm run dev
```

Acesse `http://localhost:3000`.

Credenciais de demonstração (senha `aegis123` para ambos):
- Admin: `admin@aegis.com`
- Operador: `operador@aegis.com`

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
- Banco local é SQLite (arquivo) — adequado para esta entrega; troque o
  `datasource` do Prisma para Postgres ao migrar para produção
  multi-instância.
