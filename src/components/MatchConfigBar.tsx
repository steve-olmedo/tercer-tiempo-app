import React, { useState } from 'react';
import { MatchConfig } from '../types/fulbito';
import { formatPesos } from '../utils/formatters';
import {
  Landmark,
  Users,
  DollarSign,
  CheckCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface MatchConfigBarProps {
  config: MatchConfig;
  onChangeConfig: (newConfig: MatchConfig) => void;
  playedCount: number;
  costPerPerson: number;
  receiptCount?: number;
  onOpenReceiptModal?: () => void;
  onBulkPayExact: () => void;
  onBulkResetPaid: () => void;
  onSelectAllPlayedForNextWeek: () => void;
  onStartNewCollection: () => void;
}

export const MatchConfigBar: React.FC<MatchConfigBarProps> = ({
  config,
  onChangeConfig,
  playedCount,
  costPerPerson,
  receiptCount = 0,
  onOpenReceiptModal,
  onBulkPayExact,
  onBulkResetPaid,
  onSelectAllPlayedForNextWeek,
  onStartNewCollection,
}) => {
  const [confirmNewCollection, setConfirmNewCollection] = useState(false);
  const currentFondoRecaudador = config.fondoRecaudador ?? config.fondoEmi ?? 0;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Post-closing status banner */}
      {config.currentSessionClosed && (
        <div className="bg-emerald-950/35 border border-emerald-700/50 rounded-xl px-3.5 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Cierre de esta fecha guardado.</strong> Al próximo viernes se inicia una nueva recolección automáticamente (o podés iniciarla ahora).
            </span>
          </div>
          <button
            type="button"
            onClick={onStartNewCollection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shrink-0 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Iniciar Nueva Recolección</span>
          </button>
        </div>
      )}

      {/* Top Row: Global Inputs & Calculation Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Costo Total de la Cancha */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-zinc-400" />
              Costo Cancha Hoy
            </span>
            <span className="text-[11px] text-zinc-500">A pagar complejo</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">$</span>
            <input
              type="number"
              min="0"
              step="500"
              value={config.pitchCost || ''}
              onChange={(e) =>
                onChangeConfig({ ...config, pitchCost: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-base sm:text-sm font-mono text-zinc-100 focus:outline-none focus:border-green-600 transition-colors"
              placeholder="96000"
            />
          </div>
        </div>

        {/* Fondo Recaudador */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Fondo Recaudador
            </span>
            <span className="text-[11px] text-zinc-500">Pozo acumulado</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">$</span>
            <input
              type="number"
              min="0"
              step="500"
              value={currentFondoRecaudador || ''}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value) || 0);
                onChangeConfig({ ...config, fondoRecaudador: val, fondoEmi: val });
              }}
              className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-base sm:text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="0"
            />
          </div>
        </div>

        {/* Tarjeta de Cálculo: Costo por Persona */}
        <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-zinc-300" />
              Cuota de hoy ({playedCount} jugaron)
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono text-green-500">
              {formatPesos(costPerPerson)}
              <span className="text-xs font-normal text-zinc-400 ml-1">c/u</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono text-right">
              <div>Cancha: {formatPesos(config.pitchCost)}</div>
              {currentFondoRecaudador > 0 && (
                <div className="text-amber-400/90">Fondo: {formatPesos(currentFondoRecaudador)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Tarjeta / Botón Rápido: Comprobantes Mercado Pago */}
        <div className="bg-gradient-to-br from-sky-950/30 to-zinc-950 border border-sky-900/40 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
              <span>📱</span> Comprobantes MP
            </span>
            {receiptCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                {receiptCount} de esta fecha
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
            Subir captura y acreditar a jugador
          </p>
          {onOpenReceiptModal && (
            <button
              onClick={onOpenReceiptModal}
              className="mt-2 w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors text-center shadow-sm"
            >
              + Subir Comprobante MP
            </button>
          )}
        </div>
      </div>

      {/* Bottom Actions Row: Quick bulk operations */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-zinc-500 font-medium text-[11px] uppercase tracking-wider">
            Acciones rápidas:
          </span>
          <button
            onClick={onBulkPayExact}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-green-500" />
            <span>Todos los que jugaron pagaron cuota exacta ({formatPesos(costPerPerson)})</span>
          </button>
          <button
            onClick={onSelectAllPlayedForNextWeek}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Repetir los 14 para prox. viernes</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {confirmNewCollection ? (
            <div className="inline-flex items-center gap-1.5 bg-zinc-950 border border-amber-700/60 rounded-lg px-2 py-1">
              <span className="text-[11px] text-amber-300 font-medium">
                ¿Archivar comprobantes y empezar nuevo viernes?
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmNewCollection(false);
                  onStartNewCollection();
                }}
                className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px]"
              >
                Sí, iniciar
              </button>
              <button
                type="button"
                onClick={() => setConfirmNewCollection(false)}
                className="px-2 py-0.5 rounded text-zinc-400 hover:text-white text-[11px]"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (config.currentSessionClosed) {
                  onStartNewCollection();
                } else {
                  setConfirmNewCollection(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 transition-colors font-medium"
              title="Archiva los comprobantes actuales, avanza los saldos al próximo viernes e inicia una recolección limpia"
            >
              <Sparkles className="w-3 h-3" />
              <span>Nueva Recolección (Nuevo Viernes)</span>
            </button>
          )}

          <button
            onClick={onBulkResetPaid}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Poner pagos de hoy en $0</span>
          </button>
        </div>
      </div>
    </div>
  );
};
