import { z } from "zod";

/**
 * Esquema de Validação Unificado para Operações Logísticas
 * Representa as regras estritas de inserção e atualização no banco.
 */
export const OperacaoSchema = z.object({
  nm_agencia: z.string().min(1),
  dt_emissao_: z.date().nullable(),
  cd_pessoa_pagador: z.string().nullable().optional(),
  nm_pessoa_pagador: z.string().nullable().optional(),
  nr_cpf_cnpj_raiz: z.string().nullable().optional(),
  nr_cpf_cnpj_pagador: z.string().nullable().optional(),
  nr_ctrc: z.string().min(1),
  id_tipo_documento: z.string().nullable().optional(),
  nm_pessoa_remetente: z.string().nullable().optional(),
  nm_cidade_origem: z.string().nullable().optional(),
  ds_sigla_origem: z.string().nullable().optional(),
  nm_pessoa_destinatario: z.string().nullable().optional(),
  nm_cidade_destino: z.string().nullable().optional(),
  ds_sigla_destino: z.string().nullable().optional(),
  nm_produto: z.string().nullable().optional(),
  vl_peso: z.number().nullable().optional().default(0),
  vl_tarifa: z.number().nullable().optional().default(0),
  vl_total: z.number().nullable().optional().default(0),
  nr_nf: z.string().nullable().optional(),
  ds_placa: z.string().nullable().optional(),
  nm_pessoa_matriz: z.string().nullable().optional(),
  nr_contrato: z.string().nullable().optional(),
  nr_chave_acesso: z.string().nullable().optional(),
  nm_pessoa_usuario_lancamento: z.string().nullable().optional(),
  id_tipo_ctrc: z.string().nullable().optional(),
  nm_proprietario_posse_cavalo: z.string().nullable().optional(),
  nm_motorista: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  comentarios: z.string().nullable().optional(),
});

export type OperacaoType = z.infer<typeof OperacaoSchema>;
