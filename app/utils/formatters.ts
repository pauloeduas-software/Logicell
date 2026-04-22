/**
 * Utilitários de formatação de dados para a UI brasileira.
 */

export const formatarMoeda = (val: any) => {
  if (val === null || val === undefined) return "-";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
};

export const formatarData = (val: any) => {
  if (!val) return "-";
  // Usamos UTC para evitar discrepâncias de fuso horário em datas puras (YYYY-MM-DD)
  return new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const formatarNumero = (val: any) => {
  if (val === null || val === undefined) return "-";
  return new Intl.NumberFormat('pt-BR').format(Number(val));
};
