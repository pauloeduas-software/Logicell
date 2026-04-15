# Logicell

**Logicell** é uma solução enterprise desenvolvida para resolver o caos logístico de dados não estruturados. Através de um motor de normalização inteligente, o sistema processa planilhas complexas, extrai 27 campos técnicos críticos e os disponibiliza em uma interface "Excel-Like" ultra-responsiva para gestão de cobrança e auditoria.

---

## Funcionalidades Principais

- **Workflow de Movimentação (Caixa de Entrada)**: Sistema de categorização estrita. A visão geral atua como uma "Caixa de Entrada" (itens não organizados). Ao mover para uma pasta, o item sai da visão geral, garantindo que cada operação pertença a apenas um local por vez.
- **Normalização Automatizada**: Padronização automática de nomes de agências para o formato "CIDADE - UF" e limpeza de espaços em branco (`trim`) em todas as buscas e filtros para evitar falhas de busca.
- **Integridade de Dados e Recuperação**: 
    - **Proteção MD5**: Registro de hash de arquivo para controle de importações.
    - **Prevenção de Duplicatas**: Bloqueio automático de registros repetidos baseado no CTRC Único.
    - **Modo Recuperação**: Permite re-upload de arquivos para restaurar itens deletados acidentalmente, inserindo apenas o que falta no banco.
- **Busca Universal e Avançada**: Motor de busca SQL puro que realiza correspondências `ILIKE` em todas as 27 colunas simultaneamente, com filtros paramétricos dedicados para Pagador, Remetente, Destinatário, Produto, Placa, Peso e Valores.
- **Edição Inline com Auditoria**: Altere qualquer dado diretamente na grade com rastreabilidade total de alterações no backend.
- **Dashboard de Business Intelligence**: Visualização em tempo real de faturamento por agência e volume por produto através de gráficos dinâmicos.
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
- **Runtime**: Bun / Node.js

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
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 3. Execução em Desenvolvimento
Para rodar API e Web simultaneamente:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/api`
