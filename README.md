# 🚛 Logicell

[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?logo=react-router)](https://reactrouter.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io)
[![Bun](https://img.shields.io/badge/Bun-Runtime-f9f1e1?logo=bun)](https://bun.sh)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

O **Logicell** é uma plataforma corporativa premium para gerenciamento de operações logísticas. O sistema centraliza o processamento de planilhas complexas, organização em pastas, e análise financeira avançada através de um Dashboard de alta densidade (Compact Premier).

---

- ✨ Funcionalidades Principais

- **🔐 Autenticação Segura (Supabase):** Sistema de login corporativo com proteção de rotas via Server-Side Auth.
- **📦 Importação Inteligente (Excel):** Mapeamento automático de colunas de planilhas xls e xlsx para o banco de dados com tratamento de erros.
- **🛡️ Integridade de Dados:** Prevenção de duplicatas via chave única composta e MD5 de arquivo.
- **📂 Organização por Pastas:** Gerenciamento dinâmico de itens entre pastas personalizadas ou Caixa de Entrada com validações de duplicidade.
- **🕵️ Sistema de Auditoria & Rastreabilidade Premium:** Registro completo com "Business Key" (Agência, CTe, NF, Valor, Emissão) que garante a identificação de itens mesmo após a exclusão.
- **📊 Dashboard com Analytics em Modais:** Novas visões de Geografia do Fluxo e Fila de Importação em modais dedicados, limpando o layout principal.
- **🛡️ Estabilidade e UX:** Tratamento de erros para nomes de pastas duplicados e interface de auditoria sincronizada entre ações individuais e em lote.
- **🛠️ Edição Inline Premium:** Atualização rápida de dados via tabela com feedback visual silencioso e gravação assíncrona.

---

## 🛠️ Tech Stack

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework** | React Router v7 (Framework Mode) |
| **Auth & Backend** | Supabase (SSR Auth & Storage) |
| **Linguagem** | TypeScript |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Prisma |
| **Runtime** | Bun v1.3+ |
| **Estilização** | Tailwind CSS (Design Premium) |

---

## 📂 Estrutura do Projeto

```text
├── app/
│   ├── context/       # AuthProvider (Supabase Context)
│   ├── routes/        # Rotas Full-stack (Dashboard, Inbox, Login)
│   ├── services/      # SSR Services (Supabase, Operação, Sessão)
│   ├── root.tsx       # Layout Global e UI Context
│   └── entry.server.tsx
├── prisma/
│   ├── schema.prisma  # Modelagem (Operacao, Pasta, Auditoria, Importacao)
│   └── migrations/    # Evolução do Banco
├── .env.example       # Template de ambiente
└── bun.lock           # Lockfile de dependências
```

---

## 🏁 Primeiros Passos

### Pré-requisitos
- **Bun** instalado.
- Projeto no **Supabase** configurado.

### Instalação e Execução

1. **Instalar dependências**
   ```bash
   bun install
   ```

2. **Configurar Variáveis de Ambiente**
   Crie um `.env` com base no `.env.example`:
   ```env
   DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SESSION_SECRET="sua-chave-secreta"
   ```

3. **Migrar o Banco de Dados**
   ```bash
   bun x prisma migrate dev
   ```

4. **Iniciar em Desenvolvimento**
   ```bash
   bun run dev
   ```

---

## 📋 Mapeamento de Dados (29 Colunas Técnicas)

Agência, Emissão, Código, Cliente, CNPJ Raiz, CNPJ Pagador, CTe, Status, Observação, Tipo Doc, Remetente, Origem, UF Origem, Destinatário, Destino, UF Destino, Produto, Peso, Tarifa, Total R$, NF, Placa, Matriz, Contrato, Chave de Acesso, Usuário, Tipo CTe, Proprietário e Motorista.

