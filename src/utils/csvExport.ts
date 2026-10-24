import { MatchClosingRecord } from '../types/fulbito';

/**
 * Generates CSV content with UTF-8 BOM so Excel and Google Sheets open Spanish accents and pesos characters correctly.
 */
export function generateMatchCSV(record: MatchClosingRecord): string {
  const lines: string[] = [];

  // Metadata headers
  lines.push(`REGISTRO DE CIERRE FINANCIERO - EL TERCER TIEMPO`);
  lines.push(`Fecha;${record.date}`);
  lines.push(`Partido;${record.matchTitle}`);
  lines.push(`Costo Total Cancha;$${record.pitchCost}`);
  lines.push(`Seña Previa Cancha (Fija Complejo);$${record.depositPaid}`);
  const fondoVal = record.fondoRecaudador ?? record.fondoEmi ?? 0;
  if (fondoVal > 0) {
    lines.push(`Fondo Recaudador;$${fondoVal}`);
  }
  if (record.shortfallFromFund) {
    lines.push(`Aporte Sacado del Fondo Cancha;-$${record.shortfallFromFund}`);
  }
  if (record.surplusToFund) {
    lines.push(`Sobrante Ingresado al Fondo;+$${record.surplusToFund}`);
  }
  lines.push(`Costo Por Persona (Redondeo 100);$${record.costPerPerson}`);
  lines.push(`Jugadores que jugaron;${record.playedCount}`);
  lines.push(`Total Efectivo en Mano;$${record.cashTotal}`);
  lines.push(`Total MercadoPago;$${record.mpTotal}`);
  lines.push(`Total Recaudado Hoy;$${record.totalCollected}`);
  lines.push('');

  // Table header
  lines.push(
    'N°;Jugador;Tipo;¿Jugó Hoy?;Cuota;Pagó Hoy;Vuelto;Neto Pagado;Método;Saldo Anterior;Saldo Nuevo;¿Juega Próx.?'
  );

  record.playersSnapshot.forEach((p, idx) => {
    const cost = p.playedToday ? record.costPerPerson : 0;
    const vuelto = p.vuelto || 0;
    const netPaid = p.paidToday - vuelto;
    lines.push(
      [
        idx + 1,
        `"${p.name}"`,
        p.isGuest ? 'Invitado' : 'Base',
        p.playedToday ? 'SÍ' : 'NO',
        `$${cost}`,
        `$${p.paidToday}`,
        `$${vuelto}`,
        `$${netPaid}`,
        p.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Efectivo',
        `$${p.initialBalance}`,
        `$${p.updatedBalance}`,
        p.playsNextWeek ? 'SÍ' : 'NO',
      ].join(';')
    );
  });

  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Generates Tab-Separated Values (TSV) formatted for instant pasting into Google Sheets (Ctrl+V)
 */
export function generateGoogleSheetsTSV(record: MatchClosingRecord): string {
  const lines: string[] = [];

  const fondoVal = record.fondoRecaudador ?? record.fondoEmi ?? 0;
  lines.push(`PARTIDO: ${record.matchTitle}\tFECHA: ${record.date}`);
  lines.push(`Costo Cancha: $${record.pitchCost}\tSeña Cancha: $${record.depositPaid}${fondoVal ? `\tFondo Recaudador: $${fondoVal}` : ''}${record.shortfallFromFund ? `\tAporte Fondo: -$${record.shortfallFromFund}` : ''}\tCuota: $${record.costPerPerson}`);
  lines.push(`Efectivo: $${record.cashTotal}\tMercadoPago: $${record.mpTotal}\tRecaudado: $${record.totalCollected}\tJugaron: ${record.playedCount}`);
  lines.push('');
  lines.push('N°\tJugador\tTipo\t¿Jugó?\tCuota\tPagó\tVuelto\tNeto\tMétodo\tSaldo Anterior\tSaldo Nuevo\t¿Próx. Viernes?');

  record.playersSnapshot.forEach((p, idx) => {
    const cost = p.playedToday ? record.costPerPerson : 0;
    const vuelto = p.vuelto || 0;
    const netPaid = p.paidToday - vuelto;
    lines.push(
      [
        idx + 1,
        p.name,
        p.isGuest ? 'Invitado' : 'Base',
        p.playedToday ? 'Sí' : 'No',
        cost,
        p.paidToday,
        vuelto,
        netPaid,
        p.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Efectivo',
        p.initialBalance,
        p.updatedBalance,
        p.playsNextWeek ? 'Sí' : 'No',
      ].join('\t')
    );
  });

  return lines.join('\n');
}

export function downloadCSVFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
