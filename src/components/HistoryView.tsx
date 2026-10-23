import React, { useState } from 'react';
import { MatchClosingRecord } from '../types/fulbito';
import { formatPesos } from '../utils/formatters';
import { generateMatchCSV, generateGoogleSheetsTSV, downloadCSVFile } from '../utils/csvExport';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Banknote,
  Smartphone,
  Trash2,
  Users,
  Database,
  ExternalLink,
} from 'lucide-react';

interface HistoryViewProps {
  history: MatchClosingRecord[];
  onDeleteRecord: (id: string) => void;
  onRecordCurrentMatch: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onDeleteRecord,
  onRecordCurrentMatch,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDownloadCSV = (record: MatchClosingRecord) => {
    const csv = generateMatchCSV(record);
    const dateFormatted = record.date.replace(/\//g, '-');
    downloadCSVFile(csv, `cierre-fulbito-${dateFormatted}.csv`);
  };

  const handleCopyTSV = async (record: MatchClosingRecord) => {
    const tsv = generateGoogleSheetsTSV(record);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadAllHistoryCSV = () => {
    if (history.length === 0) return;
    const allLines: string[] = [];
    allLines.push('HISTORIAL COMPLETO DE CIERRES - EL TERCER TIEMPO');
    allLines.push('');

    history.forEach((rec, idx) => {
      allLines.push(`--- CIERRE #${idx + 1} (${rec.date}) ---`);
      allLines.push(generateMatchCSV(rec));
      allLines.push('');
      allLines.push('--------------------------------------------------');
      allLines.push('');
    });

    downloadCSVFile('\uFEFF' + allLines.join('\r\n'), `historial-fulbito-completo.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Registro Histórico de Cierres de los Viernes</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
              {history.length} {history.length === 1 ? 'fecha' : 'fechas'}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Cada cierre guarda la foto financiera exacta: quién jugó, cuánto pagó, señas y arqueo de caja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleDownloadAllHistoryCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors border border-zinc-700/60"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Descargar Todo a Excel (.CSV)</span>
            </button>
          )}

          <button
            onClick={onRecordCurrentMatch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md"
          >
            <Calendar className="w-4 h-4 text-zinc-950" />
            <span>💾 Registrar Cierre del Viernes de Hoy</span>
          </button>
        </div>
      </div>

      {/* Cloud & Spreadsheet Integration Note */}
      <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-200">
              Exportación a Google Sheets o Base de Datos
            </h3>
            <p className="text-zinc-400 text-[11px]">
              Los cierres se almacenan en la memoria persistente del navegador y podés exportarlos con 1 click a <strong className="text-zinc-300">Google Sheets</strong> o <strong className="text-zinc-300">Excel</strong>. Si querés que se sincronice en la nube en tiempo real entre múltiples celulares con <strong className="text-zinc-300">Firebase Firestore</strong>, podés solicitarlo en cualquier momento.
            </p>
          </div>
        </div>
      </div>

      {/* History Records List */}
      {history.length === 0 ? (
        <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-zinc-600 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-300">
              Todavía no hay cierres registrados
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Cuando termines el partido de hoy y verifiques los pagos en la pestaña Finanzas, hacé clic en &quot;Registrar Cierre&quot; para guardar el historial.
            </p>
          </div>
          <button
            onClick={onRecordCurrentMatch}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
          >
            Guardar Cierre de Hoy Ahora
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => {
            const isExpanded = expandedId === record.id;
            const isCopied = copiedId === record.id;

            return (
              <div
                key={record.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden transition-all hover:border-zinc-700/80 shadow-sm"
              >
                {/* Header Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* Left: Date & Title */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {record.matchTitle}
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80">
                          {record.date}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {record.playedCount} jugaron • Cuota {formatPesos(record.costPerPerson)} c/u • Cancha {formatPesos(record.pitchCost)}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Cash summary metrics */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-zinc-400">Ef:</span>
                      <span className="font-semibold text-emerald-400">
                        {formatPesos(record.cashTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-zinc-400">MP:</span>
                      <span className="font-semibold text-sky-400">
                        {formatPesos(record.mpTotal)}
                      </span>
                    </div>

                    <div className="hidden sm:block border-l border-zinc-800 pl-4">
                      <span className="text-zinc-500">Total: </span>
                      <span className="font-bold text-white">
                        {formatPesos(record.totalCollected)}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    {/* Copy TSV for Google Sheets */}
                    <button
                      onClick={() => handleCopyTSV(record)}
                      title="Copiar datos tabulares para pegar directo en Google Sheets (Ctrl+V)"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="hidden sm:inline">Pegar en Sheets</span>
                        </>
                      )}
                    </button>

                    {/* Download CSV */}
                    <button
                      onClick={() => handleDownloadCSV(record)}
                      title="Descargar archivo .CSV compatible con Excel o Google Sheets"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>

                    {/* Expand Details */}
                    <button
                      onClick={() => toggleExpand(record.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title={isExpanded ? 'Ocultar jugadores' : 'Ver detalle de jugadores'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar el registro del ${record.date}?`)) {
                          onDeleteRecord(record.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Players Table */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/60 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-3 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-300">
                        Detalle individual de los jugadores en esta fecha
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        {record.playersSnapshot.length} jugadores registrados
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
                            <th className="py-2 px-2">Jugador</th>
                            <th className="py-2 px-2 text-center">¿Jugó?</th>
                            <th className="py-2 px-2 text-right">Cuota</th>
                            <th className="py-2 px-2 text-right">Pagó</th>
                            <th className="py-2 px-2 text-center">Método</th>
                            <th className="py-2 px-2 text-right">Saldo Prev.</th>
                            <th className="py-2 px-2 text-right">Saldo Nuevo</th>
                            <th className="py-2 px-2 text-center">¿Próx.?</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {record.playersSnapshot.map((p, idx) => (
                            <tr
                              key={idx}
                              className={p.playedToday ? 'text-zinc-200' : 'text-zinc-500'}
                            >
                              <td className="py-2 px-2 font-sans font-medium">
                                {idx + 1}. {p.name}
                                {p.isGuest && (
                                  <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400">
                                    Invitado
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center">
                                {p.playedToday ? (
                                  <span className="text-emerald-400 font-bold">✓</span>
                                ) : (
                                  <span className="text-zinc-600">-</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right">
                                {p.playedToday ? formatPesos(record.costPerPerson) : '$0'}
                              </td>
                              <td className="py-2 px-2 text-right text-emerald-400 font-semibold">
                                {formatPesos(p.paidToday)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span className="text-[10px] uppercase font-sans">
                                  {p.paymentMethod === 'mercadopago' ? 'MP' : 'Ef'}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right text-zinc-400">
                                {formatPesos(p.initialBalance)}
                              </td>
                              <td
                                className={`py-2 px-2 text-right font-bold ${
                                  p.updatedBalance > 0
                                    ? 'text-emerald-400'
                                    : p.updatedBalance < 0
                                    ? 'text-rose-400'
                                    : 'text-zinc-400'
                                }`}
                              >
                                {formatPesos(p.updatedBalance)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                {p.playsNextWeek ? (
                                  <span className="text-blue-400">✓</span>
                                ) : (
                                  <span className="text-zinc-600">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
