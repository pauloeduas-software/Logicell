/**
 * Utilitários para parse e sanitização de dados vitais antes de chegarem ao Banco de Dados.
 */

export class DateParser {
  /**
   * Converte uma string de data (frequentemente em formatos brasileiros)
   * para um objeto Date seguro para o banco de dados.
   * @param valor String com a data (ex: "26/12/2026")
   * @returns Date object ou null em caso de falha.
   */
  static parseDataBrasileiraSegura(valor: string | Date | null | undefined): Date | null {
    if (!valor) return null;
    
    // Se já for um objeto Date, validamos sua integridade e retornamos
    if (valor instanceof Date) {
      return isNaN(valor.getTime()) ? null : valor;
    }
    
    if (typeof valor !== 'string') return null;

    const str = valor.trim();
    let dataFinal: Date | null = null;

    // Regex para formatos: DD/MM/YYYY, DD/MM/YY, DD/MM
    const regexBR = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/;
    const match = str.match(regexBR);

    if (match) {
      const dia = parseInt(match[1], 10);
      const mes = parseInt(match[2], 10) - 1; // Meses em JS são 0-11
      let ano = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
      
      // Trata anos com 2 dígitos (ex: "26" -> "2026")
      if (ano < 100) ano += 2000; 
      
      const d = new Date(ano, mes, dia);
      if (!isNaN(d.getTime())) dataFinal = d;
    }

    // Fallback de segurança para formato ISO ou Americano se o BR falhar
    if (!dataFinal) {
      const fallback = new Date(str);
      if (!isNaN(fallback.getTime())) dataFinal = fallback;
    }

    return dataFinal;
  }
}
