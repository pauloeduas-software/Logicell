# 🚛 Logicell

[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?logo=react-router)](https://reactrouter.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

O **Logicell** é uma plataforma full-stack para gerenciamento de operações logísticas. O sistema centraliza o processamento de planilhas complexas (CTes, Notas Fiscais), organização em pastas e análise de faturamento através de um Dashboard executivo.

---

## ✨ Funcionalidades Principais

- **📦 Importação Inteligente (Excel):** Mapeamento de colunas de planilhas xls e xlsx.
- **🛡️ Integridade de Dados:** Prevenção de duplicatas via chave única composta (Agência, CTe, NF, Valor, Data) e MD5 de arquivo.
- **📂 Organização por Pastas:** Sistema 1:N para mover operações entre pastas personalizadas ou manter na Caixa de Entrada.
- **🔍 Busca Universal (Google-style):** Motor de busca SQL bruto que varre todos os 29 campos simultaneamente.
- **📊 Dashboard Executivo:** Gráficos interativos (Recharts) de faturamento por agência e distribuição por produto.
- **🛠️ Edição Inline:** Atualização rápida de Status (11 opções) e Observações diretamente na tabela.
- **🚨 Feedback Centralizado:** Modais de confirmação e Toasts elegantes para todas as operações críticas.
- **🔄 Modo de Recuperação:** Permite re-importar dados excluídos sem gerar duplicatas no banco.

---

## 🛠️ Tech Stack

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework** | React Router v7 (Framework Mode) |
| **Runtime** | Node.js (Compatível com Bun) |
| **Linguagem** | TypeScript |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Prisma |
| **Estilização** | Tailwind CSS |
| **Gráficos** | Recharts |
| **Ícones** | Lucide React |

---

## 📂 Estrutura do Projeto

```text
├── app/
│   ├── routes/        # Rotas Full-stack (Dashboard, Inbox, Pastas)
│   ├── services/      # Lógica de Negócio (Busca Universal, Excel Parsing)
│   ├── components/    # Componentes UI Reutilizáveis
│   ├── root.tsx       # Estrutura global, Modais e Toasts
│   └── entry.client/server.tsx # Pontos de entrada do Framework
├── prisma/
│   ├── schema.prisma  # Modelagem de dados (Operacao, Pasta, Importacao)
│   └── migrations/    # Histórico de evolução do banco de dados
├── public/            # Ativos estáticos
└── .env               # Configurações de Banco de Dados
```

---

## 🏁 Primeiros Passos

### Pré-requisitos
- **Node.js** v20 ou superior.
- Instância do **PostgreSQL** rodando.

### Instalação e Execução

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz com sua string de conexão:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/logistica_db"
   ```

3. **Preparar o Banco de Dados**
   ```bash
   npm run generate
   npm run migrate
   ```

4. **Iniciar em Desenvolvimento**
   ```bash
   npm run dev
   ```

---

## 📋 Mapeamento de Dados (29 Colunas Técnicas)

O sistema processa e exibe:
Agência, Emissão, Código, Cliente, CNPJ Raiz, CNPJ Pagador, CTe, Status, Observação, Tipo Doc, Remetente, Origem, UF Origem, Destinatário, Destino, UF Destino, Produto, Peso, Tarifa, Total R$, NF, Placa, Matriz, Contrato, Chave de Acesso, Usuário, Tipo CTe, Proprietário e Motorista.
