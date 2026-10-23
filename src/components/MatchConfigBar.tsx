import React from 'react';
import { MatchConfig } from '../types/fulbito';
import { formatPesos } from '../utils/formatters';
import { Landmark, Calendar, Users, DollarSign, CheckCheck, RefreshCw } from 'lucide-react';

interface MatchConfigBarProps {
  config: MatchConfig;
  onChangeConfig: (newConfig: MatchConfig) => void;
  playedCount: number;
  costPerPerson: number;
  onBulkPayExact: () => void;
  onBulkResetPaid: () => void;
  onSelectAllPlayedForNextWeek: () => void;
}

export const MatchConfigBar: React.FC<MatchConfigBarProps> = ({
  config,
  onChangeConfig,
  playedCount,
  costPerPerson,
  onBulkPayExact,
  onBulkResetPaid,
  onSelectAllPlayedForNextWeek,
}) => {
  const remainingPitchDebt = Math.max(0, config.pitchCost - config.depositPaid);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Row: Global Inputs & Calculation Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Costo Total de la Cancha */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-zinc-400" />
              Costo Total Cancha
            </span>
            <span className="text-[11px] text-zinc-500">Fútbol 7</span>
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
              className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              placeholder="42000"
            />
          </div>
        </div>

        {/* Seña Previa Entregada */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
              Seña Previa Entregada
            </span>
            <span className="text-[11px] text-zinc-500">Ya pagado al club</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">$</span>
            <input
              type="number"
              min="0"
              step="500"
              value={config.depositPaid || ''}
              onChange={(e) =>
                onChangeConfig({ ...config, depositPaid: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              placeholder="10000"
            />
          </div>
        </div>

        {/* Título / Encabezado de la lista */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            Día y Horario
          </label>
          <input
            type="text"
            value={config.matchTitle}
            onChange={(e) => onChangeConfig({ ...config, matchTitle: e.target.value })}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/70 transition-colors"
            placeholder="Viernes 19hs - Señamos"
          />
        </div>

        {/* Tarjeta de Cálculo: Costo por Persona */}
        <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Cuota de hoy ({playedCount} jugaron)
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold font-mono text-emerald-400">
              {formatPesos(costPerPerson)}
              <span className="text-xs font-normal text-zinc-400 ml-1">c/u</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Resta cancha: {formatPesos(remainingPitchDebt)}
            </div>
          </div>
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
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Todos los que jugaron pagaron cuota ({formatPesos(costPerPerson)})</span>
          </button>
          <button
            onClick={onSelectAllPlayedForNextWeek}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Repetir los 14 para prox. viernes</span>
          </button>
        </div>

        <button
          onClick={onBulkResetPaid}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Poner pagos de hoy en $0</span>
        </button>
      </div>
    </div>
  );
};
