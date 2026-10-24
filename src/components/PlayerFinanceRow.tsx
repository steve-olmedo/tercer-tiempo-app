import React from 'react';
import { Player, PaymentMethod } from '../types/fulbito';
import { calculateUpdatedBalance, calculateAmountDueToday } from '../utils/whatsappHelpers';
import { formatPesos } from '../utils/formatters';
import { Banknote, Smartphone, Trash2, ArrowRight } from 'lucide-react';

interface PlayerFinanceRowProps {
  player: Player;
  costPerPerson: number;
  index: number;
  onUpdate: (updated: Player) => void;
  onRemoveGuest?: (id: string) => void;
}

export const PlayerFinanceRow: React.FC<PlayerFinanceRowProps> = ({
  player,
  costPerPerson,
  index,
  onUpdate,
  onRemoveGuest,
}) => {
  const updatedBalance = calculateUpdatedBalance(player, costPerPerson);
  const amountDueToday = calculateAmountDueToday(player, costPerPerson);

  const handlePlayedChange = (checked: boolean) => {
    onUpdate({
      ...player,
      playedToday: checked,
    });
  };

  const handlePaidChange = (amount: number) => {
    onUpdate({
      ...player,
      paidToday: Math.max(0, amount),
    });
  };

  const handleVueltoChange = (amount: number) => {
    onUpdate({
      ...player,
      vuelto: Math.max(0, amount),
    });
  };

  const handlePaymentMethodToggle = () => {
    const nextMethod: PaymentMethod =
      player.paymentMethod === 'mercadopago' ? 'efectivo' : 'mercadopago';
    onUpdate({
      ...player,
      paymentMethod: nextMethod,
    });
  };

  const handlePlaysNextWeekChange = (checked: boolean) => {
    onUpdate({
      ...player,
      playsNextWeek: checked,
    });
  };

  // Exacto pone lo que corresponde pagar hoy (6900 - seña previa)
  const handlePayExactMatch = () => {
    onUpdate({
      ...player,
      paidToday: amountDueToday,
      vuelto: 0,
    });
  };

  return (
    <div
      className={`group flex flex-col md:flex-row items-stretch md:items-center justify-between p-3.5 sm:px-4 sm:py-3 rounded-xl border transition-all ${
        player.playedToday
          ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
          : 'bg-zinc-950/40 border-zinc-900/80 opacity-75 hover:opacity-100 hover:border-zinc-800'
      }`}
    >
      {/* Col 1: Player Name, Index & Initial Balance + Amount Due Today */}
      <div className="flex items-center gap-3 min-w-[210px] mb-2 md:mb-0">
        <span className="w-6 text-center text-xs font-mono text-zinc-500 font-semibold">
          {index + 1}.
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-100">
              {player.name}
            </span>
            {player.isGuest && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Invitado
              </span>
            )}
            {onRemoveGuest && player.isGuest && (
              <button
                onClick={() => onRemoveGuest(player.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity p-0.5"
                title="Eliminar invitado"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="text-zinc-500 text-[11px]">Seña previa:</span>
            <span
              className={`font-mono text-xs font-semibold ${
                player.initialBalance > 0
                  ? 'text-green-500'
                  : player.initialBalance < 0
                  ? 'text-red-400'
                  : 'text-zinc-400'
              }`}
            >
              {formatPesos(player.initialBalance)}
            </span>

            {player.playedToday && (
              <span className="text-[11px] text-zinc-400 font-mono">
                • Pone hoy:{' '}
                <strong className={amountDueToday > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-medium'}>
                  {formatPesos(amountDueToday)}
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:items-center gap-3 sm:gap-4 flex-1 justify-end">
        {/* Checkbox: ¿Jugó hoy? */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={player.playedToday}
              onChange={(e) => handlePlayedChange(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-green-600 focus:ring-green-600 cursor-pointer accent-green-600"
            />
            <span className="text-xs font-medium text-zinc-300 md:hidden">
              Jugó hoy
            </span>
          </label>
          <span
            className={`hidden md:inline-block text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
              player.playedToday
                ? 'bg-zinc-800 text-green-400 border border-zinc-700'
                : 'bg-zinc-900 text-zinc-500'
            }`}
          >
            {player.playedToday ? `-${formatPesos(costPerPerson)}` : '$0'}
          </span>
        </div>

        {/* Input: ¿Cuánto pagó hoy? y Vuelto */}
        <div className="flex flex-col gap-1 min-w-[140px] sm:min-w-[165px]">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">
                $
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={player.paidToday === 0 ? '' : player.paidToday}
                onChange={(e) => handlePaidChange(Number(e.target.value) || 0)}
                placeholder="Pagó"
                title="Monto que entregó o transfirió el jugador"
                className="w-full pl-6 pr-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-base sm:text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-green-600"
              />
            </div>
            {player.playedToday && (
              <button
                onClick={handlePayExactMatch}
                title={`Pagar lo correspondiente hoy: ${formatPesos(amountDueToday)} (${formatPesos(costPerPerson)} - seña)`}
                className="px-1.5 py-1 text-[10px] font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700 whitespace-nowrap"
              >
                Exacto
              </button>
            )}
          </div>

          {/* Vuelto Input */}
          <div className="flex items-center gap-1">
            <div className="relative flex-1">
              <span className="text-[10px] text-zinc-500 font-semibold absolute left-2 top-1/2 -translate-y-1/2">
                Vuelto:
              </span>
              <span className="absolute left-13 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">
                $
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={player.vuelto === 0 || !player.vuelto ? '' : player.vuelto}
                onChange={(e) => handleVueltoChange(Number(e.target.value) || 0)}
                placeholder="0"
                title="Monto de vuelto pedido / a devolver"
                className="w-full pl-16 pr-2 py-1 bg-zinc-950/70 border border-zinc-800/80 rounded-lg text-base sm:text-xs font-mono text-amber-400 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/70"
              />
            </div>
          </div>

          {(player.vuelto || 0) > 0 && (
            <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between px-0.5">
              <span>Neto pagado:</span>
              <span className="text-emerald-400 font-semibold">
                {formatPesos(player.paidToday - (player.vuelto || 0))}
              </span>
            </div>
          )}
        </div>

        {/* Toggle: Método de Pago (Efectivo / MercadoPago) */}
        <div>
          <button
            onClick={handlePaymentMethodToggle}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border w-full sm:w-auto ${
              player.paymentMethod === 'mercadopago'
                ? 'bg-zinc-900 border-blue-900/80 text-blue-300 hover:bg-blue-950/40'
                : 'bg-zinc-900 border-green-900/80 text-green-300 hover:bg-green-950/40'
            }`}
            title={`Método: ${
              player.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Efectivo'
            }`}
          >
            {player.paymentMethod === 'mercadopago' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>MP</span>
              </>
            ) : (
              <>
                <Banknote className="w-3.5 h-3.5 text-green-400" />
                <span>Efectivo</span>
              </>
            )}
          </button>
        </div>

        {/* Checkbox: ¿Juega próximo viernes? */}
        <div className="flex items-center gap-2 justify-end sm:justify-center">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={player.playsNextWeek}
              onChange={(e) => handlePlaysNextWeekChange(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-600 cursor-pointer accent-blue-600"
            />
            <span className="text-xs font-medium text-zinc-300 md:hidden">
              Prox. Viernes
            </span>
          </label>
          <span
            className={`hidden md:inline-flex text-[11px] px-2 py-0.5 rounded font-medium ${
              player.playsNextWeek
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                : 'text-zinc-600'
            }`}
          >
            {player.playsNextWeek ? 'Confirmado' : 'No juega'}
          </span>
        </div>

        {/* Saldo Resultante para la próxima semana */}
        <div className="col-span-2 sm:col-span-4 md:col-auto flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/50 md:min-w-[130px]">
          <span className="text-xs text-zinc-500 md:hidden flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Saldo nuevo:
          </span>
          <div className="text-right">
            <span
              className={`font-mono text-sm font-bold block ${
                updatedBalance > 0
                  ? 'text-green-500'
                  : updatedBalance < 0
                  ? 'text-red-400'
                  : 'text-zinc-400'
              }`}
            >
              {formatPesos(updatedBalance)}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
              {updatedBalance > 0
                ? 'A favor'
                : updatedBalance < 0
                ? 'Debe'
                : 'Al día'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
