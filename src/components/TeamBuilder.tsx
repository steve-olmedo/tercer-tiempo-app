import React, { useState } from 'react';
import { Player, MatchConfig } from '../types/fulbito';
import { generateTeamsText } from '../utils/whatsappHelpers';
import { MatchPosterModal } from './MatchPosterModal';
import {
  Users,
  Shuffle,
  RotateCcw,
  Copy,
  Check,
  ImageIcon,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Info,
  Shield,
} from 'lucide-react';

interface TeamBuilderProps {
  players: Player[];
  config: MatchConfig;
  onUpdatePlayer: (player: Player) => void;
}

export const TeamBuilder: React.FC<TeamBuilderProps> = ({
  players,
  config,
  onUpdatePlayer,
}) => {
  // State for assigned player IDs
  const [blueTeamIds, setBlueTeamIds] = useState<string[]>([]);
  const [orangeTeamIds, setOrangeTeamIds] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'blue' | 'available' | 'orange' | null>(null);

  // Eligible pool: players who have "Juega próximo viernes" checked
  const nextWeekConfirmed = players.filter((p) => p.playsNextWeek);

  // Map IDs to Player objects
  const blueTeam = blueTeamIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  const orangeTeam = orangeTeamIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  // Available players = confirmed for next week not yet in blue or orange
  const availablePlayers = nextWeekConfirmed.filter(
    (p) => !blueTeamIds.includes(p.id) && !orangeTeamIds.includes(p.id)
  );

  // Non-confirmed pool (just in case they need to draft someone who wasn't checked)
  const unconfirmedPlayers = players.filter(
    (p) => !p.playsNextWeek && !blueTeamIds.includes(p.id) && !orangeTeamIds.includes(p.id)
  );

  // Move functions
  const moveToBlue = (playerId: string) => {
    if (blueTeamIds.length >= 7) return;
    setOrangeTeamIds((prev) => prev.filter((id) => id !== playerId));
    setBlueTeamIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
  };

  const moveToOrange = (playerId: string) => {
    if (orangeTeamIds.length >= 7) return;
    setBlueTeamIds((prev) => prev.filter((id) => id !== playerId));
    setOrangeTeamIds((prev) => (prev.includes(playerId) ? prev : [...prev, playerId]));
  };

  const moveToAvailable = (playerId: string) => {
    setBlueTeamIds((prev) => prev.filter((id) => id !== playerId));
    setOrangeTeamIds((prev) => prev.filter((id) => id !== playerId));
  };

  // Drag and Drop handlers
  const handleDragStart = (playerId: string) => {
    setDraggedPlayerId(playerId);
  };

  const handleDragOver = (e: React.DragEvent, col: 'blue' | 'available' | 'orange') => {
    e.preventDefault();
    setDragOverColumn(col);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (col: 'blue' | 'available' | 'orange') => {
    if (!draggedPlayerId) return;

    if (col === 'blue') {
      moveToBlue(draggedPlayerId);
    } else if (col === 'orange') {
      moveToOrange(draggedPlayerId);
    } else {
      moveToAvailable(draggedPlayerId);
    }

    setDraggedPlayerId(null);
    setDragOverColumn(null);
  };

  // Random Shuffle (Sorteo)
  const handleRandomShuffle = () => {
    // Collect all candidates
    const allDraftPool = [...nextWeekConfirmed];
    // Fisher-Yates shuffle
    const shuffled = [...allDraftPool].sort(() => Math.random() - 0.5);

    const blueIds: string[] = [];
    const orangeIds: string[] = [];

    shuffled.forEach((p, index) => {
      if (index % 2 === 0) {
        if (blueIds.length < 7) blueIds.push(p.id);
        else if (orangeIds.length < 7) orangeIds.push(p.id);
      } else {
        if (orangeIds.length < 7) orangeIds.push(p.id);
        else if (blueIds.length < 7) blueIds.push(p.id);
      }
    });

    setBlueTeamIds(blueIds);
    setOrangeTeamIds(orangeIds);
  };

  // Clear Teams
  const handleClearTeams = () => {
    setBlueTeamIds([]);
    setOrangeTeamIds([]);
  };

  // Copy Formations Text
  const handleCopyFormations = async () => {
    const text = generateTeamsText(blueTeam, orangeTeam, config);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>La Previa: Armado de Equipos</span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-normal">
                Fútbol 7 (7 vs 7)
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            {nextWeekConfirmed.length} confirmados para el próximo viernes. Arrastra o usa las flechas para armar los equipos.
          </p>
        </div>

        {/* Global actions: Shuffle, Reset, Copy Text, Generate Image */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRandomShuffle}
            disabled={nextWeekConfirmed.length < 2}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors border border-zinc-700/60 disabled:opacity-50"
            title="Sortear equipos aleatoriamente de forma balanceada"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Sorteo Aleatorio</span>
          </button>

          <button
            onClick={handleClearTeams}
            disabled={blueTeamIds.length === 0 && orangeTeamIds.length === 0}
            className="p-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700 transition-colors disabled:opacity-40"
            title="Vaciar equipos y devolver todos a disponibles"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyFormations}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors border border-zinc-800"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>¡Formaciones copiadas!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsPosterModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Generar Imagen (Celular)</span>
          </button>
        </div>
      </div>

      {/* Notice if less than 14 players */}
      {nextWeekConfirmed.length < 14 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Hay {nextWeekConfirmed.length} confirmados. Faltan {14 - nextWeekConfirmed.length} para completar los 14 de Fútbol 7.
            </span>
          </div>
          <span className="text-[11px] text-amber-400/80">
            Marca más jugadores en la pestaña Finanzas
          </span>
        </div>
      )}

      {/* 3 COLUMNS DRAG & DROP WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ================= COL 1: EQUIPO AZUL (MAX 7) ================= */}
        <div
          onDragOver={(e) => handleDragOver(e, 'blue')}
          onDragLeave={handleDragLeave}
          onDrop={() => handleDrop('blue')}
          className={`flex flex-col bg-zinc-900/60 border rounded-2xl p-4 transition-all ${
            dragOverColumn === 'blue'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-950/20'
              : 'border-zinc-800/90'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-blue-600/50">
                🔵
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Equipo Azul</h3>
                <span className="text-[11px] text-zinc-400">Pechera Azul</span>
              </div>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                blueTeam.length === 7
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
              }`}
            >
              {blueTeam.length} / 7
            </span>
          </div>

          {/* Slots / Players */}
          <div className="space-y-2 flex-1 min-h-[320px]">
            {blueTeam.map((player, idx) => (
              <div
                key={player.id}
                draggable
                onDragStart={() => handleDragStart(player.id)}
                className="group flex items-center justify-between p-2.5 bg-zinc-950/80 hover:bg-zinc-900 border border-blue-900/40 hover:border-blue-600/60 rounded-xl transition-all cursor-grab active:cursor-grabbing shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-center text-xs font-mono text-blue-400 font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 block">
                      {player.name}
                    </span>
                    {player.isGuest && (
                      <span className="text-[9px] text-amber-400">Invitado</span>
                    )}
                  </div>
                </div>

                {/* Quick Shift buttons */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={() => moveToAvailable(player.id)}
                    title="Devolver a Disponibles"
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 text-[11px]"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => moveToOrange(player.id)}
                    disabled={orangeTeam.length >= 7}
                    title="Pasar a Equipo Naranja"
                    className="p-1 rounded text-orange-400 hover:bg-orange-950/50 disabled:opacity-30 text-[11px] flex items-center gap-0.5"
                  >
                    <span>Nar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, 7 - blueTeam.length) }).map((_, i) => (
              <div
                key={`empty-blue-${i}`}
                className="h-10 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-center text-[11px] text-zinc-600 select-none"
              >
                Slot {blueTeam.length + i + 1} libre
              </div>
            ))}
          </div>
        </div>

        {/* ================= COL 2: DISPONIBLES (CENTRAL) ================= */}
        <div
          onDragOver={(e) => handleDragOver(e, 'available')}
          onDragLeave={handleDragLeave}
          onDrop={() => handleDrop('available')}
          className={`flex flex-col bg-zinc-900/60 border rounded-2xl p-4 transition-all ${
            dragOverColumn === 'available'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/20'
              : 'border-zinc-800/90'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Disponibles</h3>
                <span className="text-[11px] text-zinc-400">Por asignar a un equipo</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/50">
              {availablePlayers.length}
            </span>
          </div>

          {/* List of Available Players */}
          <div className="space-y-2 flex-1 min-h-[320px] max-h-[560px] overflow-y-auto pr-1">
            {availablePlayers.length === 0 ? (
              <div className="h-44 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
                <Check className="w-6 h-6 text-emerald-400 mb-1" />
                <p className="text-xs font-medium text-zinc-300">
                  ¡Todos los confirmados asignados!
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Los 14 jugadores ya están en Azul y Naranja
                </p>
              </div>
            ) : (
              availablePlayers.map((player) => (
                <div
                  key={player.id}
                  draggable
                  onDragStart={() => handleDragStart(player.id)}
                  className="group flex items-center justify-between p-2.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl transition-all cursor-grab active:cursor-grabbing shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {player.name}
                    </span>
                    {player.isGuest && (
                      <span className="text-[9px] text-amber-400 shrink-0">Invitado</span>
                    )}
                  </div>

                  {/* Directional buttons for tap on mobile */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => moveToBlue(player.id)}
                      disabled={blueTeam.length >= 7}
                      title="Asignar al Equipo Azul"
                      className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/50 disabled:opacity-30 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Azul</span>
                    </button>

                    <button
                      onClick={() => moveToOrange(player.id)}
                      disabled={orangeTeam.length >= 7}
                      title="Asignar al Equipo Naranja"
                      className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold bg-orange-950/60 hover:bg-orange-900/60 text-orange-300 border border-orange-800/50 disabled:opacity-30 transition-colors"
                    >
                      <span>Naranja</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Extra unconfirmed players section (accordion-like fallback) */}
            {unconfirmedPlayers.length > 0 && availablePlayers.length < 14 && (
              <div className="pt-3 mt-3 border-t border-zinc-800/60">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Otros del grupo (No confirmados aún)
                </span>
                <div className="space-y-1">
                  {unconfirmedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-1.5 px-2 bg-zinc-950/40 rounded-lg text-xs opacity-75 hover:opacity-100"
                    >
                      <span className="text-zinc-400 text-xs">{player.name}</span>
                      <button
                        onClick={() => {
                          onUpdatePlayer({ ...player, playsNextWeek: true });
                          moveToAvailable(player.id);
                        }}
                        className="text-[10px] text-zinc-300 hover:text-white bg-zinc-800 px-1.5 py-0.5 rounded"
                      >
                        + Sumar a lista
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= COL 3: EQUIPO NARANJA (MAX 7) ================= */}
        <div
          onDragOver={(e) => handleDragOver(e, 'orange')}
          onDragLeave={handleDragLeave}
          onDrop={() => handleDrop('orange')}
          className={`flex flex-col bg-zinc-900/60 border rounded-2xl p-4 transition-all ${
            dragOverColumn === 'orange'
              ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-950/20'
              : 'border-zinc-800/90'
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-orange-600/50">
                🟠
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Equipo Naranja</h3>
                <span className="text-[11px] text-zinc-400">Pechera Naranja</span>
              </div>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                orangeTeam.length === 7
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
              }`}
            >
              {orangeTeam.length} / 7
            </span>
          </div>

          {/* Slots / Players */}
          <div className="space-y-2 flex-1 min-h-[320px]">
            {orangeTeam.map((player, idx) => (
              <div
                key={player.id}
                draggable
                onDragStart={() => handleDragStart(player.id)}
                className="group flex items-center justify-between p-2.5 bg-zinc-950/80 hover:bg-zinc-900 border border-orange-900/40 hover:border-orange-600/60 rounded-xl transition-all cursor-grab active:cursor-grabbing shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-center text-xs font-mono text-orange-400 font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-zinc-100 block">
                      {player.name}
                    </span>
                    {player.isGuest && (
                      <span className="text-[9px] text-amber-400">Invitado</span>
                    )}
                  </div>
                </div>

                {/* Quick Shift buttons */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={() => moveToBlue(player.id)}
                    disabled={blueTeam.length >= 7}
                    title="Pasar a Equipo Azul"
                    className="p-1 rounded text-blue-400 hover:bg-blue-950/50 disabled:opacity-30 text-[11px] flex items-center gap-0.5"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Azul</span>
                  </button>
                  <button
                    onClick={() => moveToAvailable(player.id)}
                    title="Devolver a Disponibles"
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 text-[11px]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, 7 - orangeTeam.length) }).map((_, i) => (
              <div
                key={`empty-orange-${i}`}
                className="h-10 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-center text-[11px] text-zinc-600 select-none"
              >
                Slot {orangeTeam.length + i + 1} libre
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match Poster Export Modal */}
      <MatchPosterModal
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        blueTeam={blueTeam}
        orangeTeam={orangeTeam}
        config={config}
      />
    </div>
  );
};
