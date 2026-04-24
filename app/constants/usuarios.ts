/**
 * Mapeamento Hardcoded de Usuários
 * Controle centralizado de apelidos por e-mail para evitar que usuários alterem seus nomes.
 */
export const MAPA_USUARIOS: Record<string, string> = {
  "faturamento3@borgnotransportes.com.br": "Keystone Lima",
  "faturamento7@borgnotransportes.com.br": "Yasmin Tonete",
  "faturamento5@borgnotransportes.com.br": "Roberio Filho",
  "faturamento10@borgnotransportes.com.br": "Anna Martins",
  "faturamento6@borgnotransportes.com.br": "Alici Vieira",
  "faturamento4@borgnotransportes.com.br": "Bruno Silveira",
  "alexandre.ramos@borgnotransportes.com.br": "Alexandre Ramos",
  "admin.admin@borgnotransportes.com.br": "Administrador"
};

/**
 * Retorna o nome amigável do usuário com base no e-mail
 */
export function buscarNomeUsuario(email: string, metadataNome?: string): string {
  if (!email) return "Usuário";
  
  // 1. Prioridade Total: Mapa Hardcoded
  if (MAPA_USUARIOS[email.toLowerCase()]) {
    return MAPA_USUARIOS[email.toLowerCase()];
  }

  // 2. Backup: Metadata do Supabase ou E-mail
  return metadataNome || email;
}
