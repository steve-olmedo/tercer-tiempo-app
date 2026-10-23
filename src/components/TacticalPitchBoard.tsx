import React, { useState } from 'react';
import { Player, F7_POSITIONS, TacticalSlot } from '../types/fulbito';
import { ArrowLeftRight, Check, RotateCcw, Shield, Sparkles } from 'lucide-react';

interface TacticalPitchBoardProps {
  teamName: 'Equipo Azul' | 'Equipo Naranja';
  colorTheme: 'blue' | 'orange';
  players: (Player | null)[]; // exactly 7 elements (index 0..6)
  onSwapPositions: (indexA: number, indexB: number) => void;
  onSelectSlotToAssign?: (slotIndex: number) => void;
}

export const TacticalPitchBoard: React.FC<TacticalPitchBoardProps> = ({
  teamName,
  colorTheme,
  players,
  onSwapPositions,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    if (selectedSlotIndex === null) {
      // First click: select slot
      setSelectedSlotIndex(index);
    } else if (selectedSlotIndex === index) {
      // Clicked same slot: deselect
      setSelectedSlotIndex(null);
    } else {
      // Second click: perform swap!
      onSwapPositions(selectedSlotIndex, index);
      setSelectedSlotIndex(null);
    }
  };

  const isBlue = colorTheme === 'blue';

  return (
    <div className="flex flex-col bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-3 sm:px-4 sm:py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full ${
              isBlue ? 'bg-blue-600' : 'bg-orange-600'
            }`}
          />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Pizarra: {teamName}
          </h3>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
            1 - 3 - 1 - 2
          </span>
        </div>

        {selectedSlotIndex !== null ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Toca otra posición para intercambiar</span>
            <button
              onClick={() => setSelectedSlotIndex(null)}
              className="ml-1 text-[11px] underline text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Toca 2 posiciones para intercambiarlas
          </span>
        )}
      </div>

      {/* CANCHA VERDE TÁCTICA (PITCH) */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[4/5] max-h-[520px] bg-gradient-to-b from-green-950 via-emerald-950 to-green-950 overflow-hidden border-t border-b border-green-900/60 select-none">
        {/* Grass Texture Pattern & Pitch Markings */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Pitch Outer Border */}
        <div className="absolute inset-3 border-2 border-white/20 rounded-lg pointer-events-none" />

        {/* Halfway Line & Center Circle */}
        <div className="absolute top-0 left-3 right-3 h-0.5 bg-white/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />

        {/* Penalty Area (Bottom) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-64 h-28 border-t-2 border-l-2 border-r-2 border-white/20 rounded-t-lg pointer-events-none" />
        {/* Goal Area */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-12 border-t-2 border-l-2 border-r-2 border-white/20 pointer-events-none" />
        {/* Penalty Spot */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/40 rounded-full pointer-events-none" />

        {/* Tactical Positions (1 - 3 - 1 - 2) */}
        {F7_POSITIONS.map((slot) => {
          const player = players[slot.index] || null;
          const isSelected = selectedSlotIndex === slot.index;

          return (
            <div
              key={slot.index}
              onClick={() => handleSlotClick(slot.index)}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute cursor-pointer flex flex-col items-center transition-all duration-150 z-10 group ${
                isSelected ? 'scale-110 z-20' : 'hover:scale-105'
              }`}
            >
              {/* Jersey / Circle Badge */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center font-bold text-xs shadow-md border-2 transition-all ${
                  isSelected
                    ? 'ring-4 ring-amber-400 border-white bg-amber-500 text-black scale-105'
                    : player
                    ? isBlue
                      ? 'bg-blue-600 border-white text-white hover:border-blue-300'
                      : 'bg-orange-600 border-white text-white hover:border-orange-300'
                    : 'bg-zinc-900/90 border-dashed border-zinc-600 text-zinc-500'
                }`}
              >
                <span className="text-[11px] font-mono leading-none font-extrabold">
                  {player ? slot.index + 1 : '+'}
                </span>
                <span className="text-[8px] font-bold uppercase leading-none opacity-90 mt-0.5">
                  {slot.shortLabel}
                </span>
              </div>

              {/* Player Name Pill */}
              <div
                className={`mt-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold whitespace-nowrap shadow-sm border max-w-[110px] truncate text-center ${
                  isSelected
                    ? 'bg-amber-400 text-black border-amber-300 font-bold'
                    : player
                    ? 'bg-zinc-950/90 text-white border-zinc-700'
                    : 'bg-zinc-900/70 text-zinc-500 border-dashed border-zinc-700/60'
                }`}
              >
                {player ? player.name : `(${slot.label})`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info & Formation Legend */}
      <div className="p-3 bg-zinc-950 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 font-mono">
            <span className="text-zinc-200 font-bold">1</span> ARQ
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 font-mono">
            <span className="text-zinc-200 font-bold">3</span> DEF
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 font-mono">
            <span className="text-zinc-200 font-bold">1</span> MED
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 font-mono">
            <span className="text-zinc-200 font-bold">2</span> DEL
          </span>
        </div>

        <span className="text-[10px] text-zinc-500 font-medium">
          Esquema clásico Fútbol 7
        </span>
      </div>
    </div>
  );
};
