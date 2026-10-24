import React, { useState } from 'react';
import { Player, MatchConfig } from '../types/fulbito';
import { calculateUpdatedBalance, generateWhatsAppMessage } from '../utils/whatsappHelpers';
import { formatPesos } from '../utils/formatters';
import {
  Banknote,
  Smartphone,
  Wallet,
  ArrowUpRight,
  Share2,
  Check,
  ChevronUp,
  ChevronDown,
  Info,
  Building2,
} from 'lucide-react';

interface CashClosingBarProps {
  players: Player[];
  config: MatchConfig;
  costPerPerson: number;
  onOpenWhatsAppPreview: () => void;
  onRecordClosing: () => void;
}

export const CashClosingBar: React.FC<CashClosingBarProps> = ({
  players,
  config,
  costPerPerson,
  onOpenWhatsAppPreview,
  onRecordClosing,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Math calculations with Vuelto and Fondo Recaudador
  const playedPlayers = players.filter((p) => p.playedToday);
  const playedCount = playedPlayers.length;

  const cashTotal = players.reduce(
    (acc, p) => (p.paymentMethod === 'efectivo' ? acc + (p.paidToday - (p.vuelto || 0)) : acc),
    0
  );

  const mpTotal = players.reduce(
    (acc, p) => (p.paymentMethod === 'mercadopago' ? acc + (p.paidToday - (p.vuelto || 0)) : acc),
    0
  );

  const totalVueltos = players.reduce((acc, p) => acc + (p.vuelto || 0), 0);
  const totalCollected = cashTotal + mpTotal;
  const courtCost = config.pitchCost || 96000;
  const fondoRecaudador = config.fondoRecaudador ?? config.fondoEmi ?? 0;

  // Shortfall & Surplus for the court payment
  const shortfall = Math.max(0, courtCost - totalCollected);
  const surplus = Math.max(0, totalCollected - courtCost);
  const newFondoRecaudador = fondoRecaudador + surplus - shortfall;

  // Next week stats
  const nextWeekCount = players.filter((p) => p.playsNextWeek).length;

  // Group balances sum
  const groupUpdatedBalances = players.reduce(
    (acc, p) => acc + calculateUpdatedBalance(p, costPerPerson),
    0
  );

  const handleCopyWhatsApp = async () => {
    const text = generateWhatsAppMessage(players, config, costPerPerson);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      onOpenWhatsAppPreview();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 shadow-2xl">
      {/* Expandable detailed drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-zinc-800/80 bg-zinc-900/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom duration-200">
          {/* Card 1: Cuota & Jugaron */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">
              Desglose de Cuota (Redondeo $100)
            </span>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {formatPesos(costPerPerson)}{' '}
              <span className="text-xs font-normal text-zinc-400">x persona</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Cancha: {formatPesos(courtCost)} / {playedCount} jugaron
            </p>
          </div>

          {/* Card 2: Pago Cancha Hoy */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">
              Pago Cancha Viernes
            </span>
            <div className="text-lg font-bold font-mono text-zinc-200">
              {formatPesos(courtCost)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Seña previa cancha: {formatPesos(config.depositPaid)} (fija en complejo)
            </p>
          </div>

          {/* Card 3: Fondo Recaudador & Pago Cancha */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-zinc-400">
                Fondo Recaudador
              </span>
              {totalVueltos > 0 && (
                <span className="text-[10px] font-bold text-amber-400 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  Vueltos: {formatPesos(totalVueltos)}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-lg font-bold font-mono text-amber-400">
                {formatPesos(newFondoRecaudador)}
              </div>
              {shortfall > 0 && (
                <span className="text-xs font-mono text-rose-400 font-semibold">
                  (-{formatPesos(shortfall)} saca p/ cancha)
                </span>
              )}
              {surplus > 0 && (
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  (+{formatPesos(surplus)} sobrante ingresa)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {shortfall > 0
                ? `Recaudador cubre $${formatPesos(shortfall)} del fondo para pagar la cancha`
                : surplus > 0
                ? `Sobrante de $${formatPesos(surplus)} se suma al fondo`
                : 'Recaudación de hoy cubre exacto la cancha'}
            </p>
          </div>

          {/* Card 4: Saldo Acumulado del Grupo */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-400 block mb-1">
              Bolsa Neta de Señas (Grupo)
            </span>
            <div
              className={`text-lg font-bold font-mono ${
                groupUpdatedBalances >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPesos(groupUpdatedBalances)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {nextWeekCount} confirmados para el próximo viernes
            </p>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Summary Metrics */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
            {/* Toggle Drawer button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1 text-xs"
              title="Ver detalle del arqueo de caja"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Ocultar detalle</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Ver detalle</span>
                </>
              )}
            </button>

            {/* Efectivo en mano */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-500">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block leading-none font-medium">
                  Efectivo en mano
                </span>
                <span className="text-sm font-bold font-mono text-green-500">
                  {formatPesos(cashTotal)}
                </span>
              </div>
            </div>

            {/* MercadoPago */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block leading-none font-medium">
                  MercadoPago
                </span>
                <span className="text-sm font-bold font-mono text-blue-400">
                  {formatPesos(mpTotal)}
                </span>
              </div>
            </div>

            {/* Total Recaudado vs Cancha & Fondo Recaudador */}
            <div className="hidden lg:flex items-center gap-2 border-l border-zinc-800 pl-6">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block leading-none font-medium">
                  Recaudado Hoy
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-white">
                    {formatPesos(totalCollected)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    / Cancha {formatPesos(courtCost)}
                  </span>
                  {shortfall > 0 && (
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded border border-rose-400/20">
                      Fondo cubre -{formatPesos(shortfall)}
                    </span>
                  )}
                  {surplus > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                      +{formatPesos(surplus)} a Fondo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: WhatsApp Export & Save Closing Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onRecordClosing}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-colors flex items-center gap-1.5"
              title="Guardar una foto histórica del cierre de este viernes en el historial y exportar a Sheets/Excel"
            >
              <span>💾</span>
              <span className="hidden sm:inline">Guardar Cierre</span>
            </button>

            <button
              onClick={onOpenWhatsAppPreview}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              title="Previsualizar el mensaje de WhatsApp"
            >
              Previsualizar
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-green-700 hover:bg-green-600 text-white transition-all shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-white" />
                  <span>Copiar WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
