import React, { useState } from 'react';
import { Player } from '../types/fulbito';
import { X, UserPlus, Check } from 'lucide-react';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  onAddPlayer,
}) => {
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [isGuest, setIsGuest] = useState(true);
  const [playedToday, setPlayedToday] = useState(true);
  const [playsNextWeek, setPlaysNextWeek] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddPlayer({
      name: name.trim(),
      isGuest,
      initialBalance: Number(initialBalance) || 0,
      playedToday,
      paidToday: 0,
      paymentMethod: 'mercadopago',
      playsNextWeek,
    });

    setName('');
    setInitialBalance(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Agregar Jugador / Invitado
              </h2>
              <p className="text-xs text-zinc-400">
                Sumar a la lista de asistencia o finanzas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Nombre o Apodo *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Agus amigo mono, Lucas, Rodri..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Saldo Inicial / Seña previa ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
                $
              </span>
              <input
                type="number"
                step="100"
                value={initialBalance === 0 ? '' : initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value) || 0)}
                placeholder="0 (o negativo si debe, ej: -300)"
                className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-base sm:text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Pon número positivo si tiene saldo a favor, o negativo si debe plata anterior.
            </p>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={isGuest}
                onChange={(e) => setIsGuest(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 accent-emerald-500"
              />
              <span>Marcar como invitado temporal</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={playedToday}
                onChange={(e) => setPlayedToday(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 accent-emerald-500"
              />
              <span>Jugó hoy (se le descuenta cuota del partido)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={playsNextWeek}
                onChange={(e) => setPlaysNextWeek(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-blue-500 accent-blue-500"
              />
              <span>Juega el próximo viernes (aparece en lista de WhatsApp y Equipos)</span>
            </label>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-50 transition-all shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Agregar Jugador</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
