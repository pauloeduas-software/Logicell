# Logicell

**Logicell** é uma solução enterprise desenvolvida para resolver o caos logístico de dados não estruturados. Através de um motor de normalização inteligente, o sistema processa planilhas complexas, extrai 27 campos técnicos críticos e os disponibiliza em uma interface "Excel-Like" ultra-responsiva para gestão de cobrança e auditoria.

---

## Funcionalidades Principais

- **Normalização Automatizada**: Ignora ruídos de cabeçalho (Linha 1) e promove nomes técnicos da Linha 2 automaticamente.
- **Dashboard de Business Intelligence**: Visualização em tempo real de faturamento por agência e volume por produto através de gráficos dinâmicos.
- **Workflow de Seleção (Worklist)**: Sistema de marcação persistente no banco de dados para separação de lotes de trabalho.
- **Edição Inline com Auditoria**: Altere qualquer dado diretamente na grade com rastreabilidade total de alterações no backend.
- **Filtros Híbridos**: Busca universal via texto e filtros paramétricos (Peso, Valor Total, CTRC, Placa).
- **Design Adaptativo**: Interface moderna com suporte completo a Modo Escuro e Modo Claro.

---

## Arquitetura do Sistema

O projeto adota o padrão **Monorepo** com **Workspaces**, garantindo coesão entre as camadas e facilidade de manutenção.

### Estrutura de Pastas
```text
.
├── apps/
│   ├── web/          # Application Layer (React + Vite + Tailwind)
│   └── api/          # Service Layer (Node.js + Express + Prisma)
├── package.json      # Workspace Manifest & Root Scripts
└── README.md         # Documentação Principal
```

### Stack Tecnológica
- **Linguagem**: TypeScript
- **Frontend**: React, Tailwind CSS, Recharts, Lucide
- **Backend**: Node.js, Express, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Runtime**: Bun

---

## Guia de Início Rápido

### Pré-requisitos
- **Runtime**: Bun >= 1.0.0 ou Node.js >= 18
- **Database**: Instância do PostgreSQL ativa

### 1. Preparação do Ambiente
Navegue até `apps/api/` e configure o arquivo `.env`:
```bash
cp apps/api/.env.example apps/api/.env
```
Edite o `.env` com suas credenciais:
```env
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/logicell_db"
PORT=3000
```

### 2. Instalação e Migração
Na raiz do projeto, execute os comandos de bootstrap:
```bash
bun install
bun run prisma:generate
bun run prisma:migrate
```

### 3. Execução em Desenvolvimento
Para rodar API e Web simultaneamente:
```bash
bun run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/api`
