-- CreateTable
CREATE TABLE "Operacao" (
    "id" SERIAL NOT NULL,
    "nm_agencia" TEXT,
    "dt_emissao" TIMESTAMP(3),
    "cd_pessoa_pagador" TEXT,
    "nm_pessoa_pagador" TEXT,
    "nr_cpf_cnpj_raiz" TEXT,
    "nr_cpf_cnpj_pagador" TEXT,
    "nr_ctrc" TEXT,
    "id_tipo_documento" TEXT,
    "nm_pessoa_remetente" TEXT,
    "nm_cidade_origem" TEXT,
    "ds_sigla_origem" TEXT,
    "nm_pessoa_destinatario" TEXT,
    "nm_cidade_destino" TEXT,
    "ds_sigla_destino" TEXT,
    "nm_produto" TEXT,
    "vl_peso" DECIMAL(18,4),
    "vl_tarifa" DECIMAL(18,2),
    "vl_total" DECIMAL(18,2),
    "nr_nf" TEXT,
    "ds_placa" TEXT,
    "nm_pessoa_matriz" TEXT,
    "nr_contrato" TEXT,
    "nr_chave_acesso" TEXT,
    "nm_pessoa_usuario_lancamento" TEXT,
    "id_tipo_ctrc" TEXT,
    "nm_proprietario_posse_cavalo" TEXT,
    "nm_motorista" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Operacao_nm_agencia_idx" ON "Operacao"("nm_agencia");

-- CreateIndex
CREATE INDEX "Operacao_nm_produto_idx" ON "Operacao"("nm_produto");

-- CreateIndex
CREATE INDEX "Operacao_nm_motorista_idx" ON "Operacao"("nm_motorista");
