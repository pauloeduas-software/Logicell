# 🚛 Logicell

[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?logo=react-router)](https://reactrouter.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?logo=supabase)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Zod](https://img.shields.io/badge/Zod-Validation-3068b7?logo=zod)](https://zod.dev)

O **Logicell** é uma plataforma corporativa premium para gerenciamento de operações logísticas. O sistema centraliza o processamento de planilhas complexas, organização em pastas, filtros avançados em Kanban e análise financeira avançada através de um Dashboard de alta densidade (Compact Premier).

---

## ✨ Funcionalidades Principais

- **🔐 Autenticação Segura (Supabase):** Sistema de login corporativo com proteção de rotas via Server-Side Auth.
- **📦 Importação Inteligente (Excel):** Mapeamento automático e tolerante a falhas de 29 colunas técnicas com múltiplos *aliases*. Validação estrita de dados em tempo real utilizando Zod e feedback claro para o usuário sobre linhas inconsistentes.
- **🛡️ Integridade de Dados e Prevenção:** Bloqueio robusto de duplicatas via chave única composta e verificação MD5 do arquivo base. Validação automatizada para pastas com nomes idênticos e operações já existentes.
- **📂 Workflow em Pastas e Kanban:** Gerenciamento dinâmico de itens transitando entre a Caixa de Entrada e Pastas personalizadas. Integração nativa com exibição em Kanban para visualização clara de status e progresso das aprovações.
- **🔍 Busca Universal Avançada:** Sistema de pesquisa integrado e otimizado cobrindo atributos chaves em todas as listagens: *ID da operação, Agência, Filial, Lote, Placa, CT-e, Nota Fiscal (NF), entre outros*.
- **🕵️ Sistema de Auditoria & Rastreabilidade Premium:** Registro forense de operações mantendo o contexto (Agência, CTe, NF, Valor, Emissão) acessível mesmo depois da exclusão lógica ou física do item. Interface unificada para ações individuais e em lote.
- **📊 Dashboard com Analytics em Modais:** Painéis estratégicos destacando a Geografia do Fluxo e a Fila de Importação renderizados em modais dedicados, preservando espaço nobre da interface para dados acionáveis.
- **🛠️ Edição Inline Premium:** Edição interativa diretamente nas células da tabela. Validação local, formatação automática (`R$`, Numérico, Data), seleção suspensa para "Status" e salvamento assíncrono com feedback visual silencioso (sem recarregar a página).

---

## 🛠️ Tech Stack

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework** | React Router v7 (Framework Mode) |
| **Auth & Backend** | Supabase (SSR Auth & Storage) |
| **Linguagem** | TypeScript |
| **Validação** | Zod |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Prisma |
| **Estilização** | Tailwind CSS (Utilitários avançados, twMerge, clsx) |
| **Componentes e Ícones**| Recharts (Gráficos), Lucide React (Ícones) |

---

## 📂 Estrutura Arquitetural

```text
├── app/
│   ├── components/    # Componentes Premium reutilizáveis (Ex: EditableCell)
│   ├── context/       # Provedores de Estado e AuthProvider (Supabase Context)
│   ├── routes/        # Rotas Full-stack via React Router v7 (Dashboard, Inbox, Login, Pastas)
│   ├── services/      # SSR Services (Supabase, Operação, Sessão)
│   ├── utils/         # Helpers p/ parser Excel, formatações (Data, Moeda) e DateParser
│   ├── root.tsx       # Layout Global e UI Context
│   └── entry.server.tsx
├── prisma/
│   ├── schema.prisma  # Modelagem ORM (Operacao, Pasta, Auditoria, Importacao)
│   └── migrations/    # Versionamento do Banco de Dados
├── .env.example       # Template de Variáveis de Ambiente
└── bun.lock           # Gerenciamento determinístico de pacotes do Bun
```

---

## 🏁 Primeiros Passos

### Pré-requisitos
- Projeto e chaves criadas no **[Supabase](https://supabase.com/)**.
- Banco de Dados PostgreSQL configurado.

### Instalação e Execução

1. **Instale as dependências**
   ```bash
   bun install
   ```

2. **Configure o Ambiente**
   Crie ou renomeie o arquivo `.env` baseando-se no `.env.example` e declare suas variáveis correspondentes de acesso ao Supabase (URL e chaves) e Banco de Dados (`DATABASE_URL`).

3. **Gere os Tipos e Migre o Banco de Dados**
   ```bash
   bun run generate
   bun run migrate
   ```

4. **Inicie o Servidor de Desenvolvimento**
   ```bash
   bun run dev
   ```

---

## 📋 Mapeamento de Dados e Negócio

### As 29 Colunas Técnicas Processadas
O utilitário remoto `ExcelParser` reconhece automaticamente as seguintes informações: 

`Agência`, `Emissão`, `Código`, `Cliente`, `CNPJ Raiz`, `CNPJ Pagador`, `CT-e / CTRC`, `Status`, `Observação`, `Tipo Doc`, `Remetente`, `Origem`, `UF Origem`, `Destinatário`, `Destino`, `UF Destino`, `Produto`, `Peso`, `Tarifa`, `Total R$`, `NF`, `Placa`, `Matriz`, `Contrato`, `Chave de Acesso`, `Usuário Lançamento`, `Tipo CT-e`, `Proprietário` e `Motorista`.

O sistema converte os dados brutos realizando tratativas proativas (como remover espaços da nomenclatura de agências) e tipagem rigorosa na interpretação utilizando **Zod**, assegurando estabilidade na criação das tuplas no banco de dados.

