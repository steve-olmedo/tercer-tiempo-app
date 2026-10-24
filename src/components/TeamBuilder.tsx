import React, { useState } from 'react';
import { Player, MatchConfig } from '../types/fulbito';
import { generateTeamsText } from '../utils/whatsappHelpers';
import { MatchPosterModal } from './MatchPosterModal';
import { TacticalPitchBoard } from './TacticalPitchBoard';
import {
  Users,
  Shuffle,
  RotateCcw,
  Copy,
  Check,
  ImageIcon,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  SquareDashedBottomCode,
  Info,
} from 'lucide-react';

interface TeamBuilderProps {
  players: Player[];
  config: MatchConfig;
  teams: { blueTeamIds: string[]; orangeTeamIds: string[] };
  onUpdateTeams: (teams: { blueTeamIds: string[]; orangeTeamIds: string[] }) => void;
  onUpdatePlayer: (player: Player) => void;
}

export const TeamBuilder: React.FC<TeamBuilderProps> = ({
  players,
  config,
  teams,
  onUpdateTeams,
  onUpdatePlayer,
}) => {
  const { blueTeamIds, orangeTeamIds } = teams;
  const [viewMode, setViewMode] = useState<'tactical' | 'columns'>('tactical');
  const [copiedText, setCopiedText] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'blue' | 'available' | 'orange' | null>(null);

  // Eligible pool: players who have "Juega próximo viernes" checked
  const nextWeekConfirmed = players.filter((p) => p.playsNextWeek);

  // Map IDs to Player objects
  const blueTeam = blueTeamIds
    .map((id) => players.find((p) => p.id === id) || null);

  const orangeTeam = orangeTeamIds
    .map((id) => players.find((p) => p.id === id) || null);

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
    const newOrange = orangeTeamIds.filter((id) => id !== playerId);
    const newBlue = blueTeamIds.includes(playerId) ? blueTeamIds : [...blueTeamIds, playerId];
    onUpdateTeams({ blueTeamIds: newBlue, orangeTeamIds: newOrange });
  };

  const moveToOrange = (playerId: string) => {
    if (orangeTeamIds.length >= 7) return;
    const newBlue = blueTeamIds.filter((id) => id !== playerId);
    const newOrange = orangeTeamIds.includes(playerId) ? orangeTeamIds : [...orangeTeamIds, playerId];
    onUpdateTeams({ blueTeamIds: newBlue, orangeTeamIds: newOrange });
  };

  const moveToAvailable = (playerId: string) => {
    const newBlue = blueTeamIds.filter((id) => id !== playerId);
    const newOrange = orangeTeamIds.filter((id) => id !== playerId);
    onUpdateTeams({ blueTeamIds: newBlue, orangeTeamIds: newOrange });
  };

  // Swap Positions inside Team (e.g. on tactical pitch board)
  const handleSwapBluePositions = (indexA: number, indexB: number) => {
    const copy = [...blueTeamIds];
    while (copy.length <= Math.max(indexA, indexB)) {
      copy.push('');
    }
    const temp = copy[indexA];
    copy[indexA] = copy[indexB];
    copy[indexB] = temp;
    onUpdateTeams({ blueTeamIds: copy, orangeTeamIds });
  };

  const handleSwapOrangePositions = (indexA: number, indexB: number) => {
    const copy = [...orangeTeamIds];
    while (copy.length <= Math.max(indexA, indexB)) {
      copy.push('');
    }
    const temp = copy[indexA];
    copy[indexA] = copy[indexB];
    copy[indexB] = temp;
    onUpdateTeams({ blueTeamIds, orangeTeamIds: copy });
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
    const allDraftPool = [...nextWeekConfirmed];
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

    onUpdateTeams({ blueTeamIds: blueIds, orangeTeamIds: orangeIds });
  };

  const handleClearTeams = () => {
    onUpdateTeams({ blueTeamIds: [], orangeTeamIds: [] });
  };

  const handleCopyFormations = async () => {
    const cleanBlue = blueTeam.filter(Boolean) as Player[];
    const cleanOrange = orangeTeam.filter(Boolean) as Player[];
    const text = generateTeamsText(cleanBlue, cleanOrange, config);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      // Fallback
    }
  };

  // Clean arrays for poster
  const cleanBluePlayers = blueTeam.filter(Boolean) as Player[];
  const cleanOrangePlayers = orangeTeam.filter(Boolean) as Player[];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>La Previa: Armado de Equipos</span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                7 vs 7
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            <span>Colaboración en vivo activa: los cambios de formación se reflejan en simultáneo en todos los celulares.</span>
          </p>
        </div>

        {/* Global Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('tactical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'tactical'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-green-400" />
              <span>Pizarra Táctica</span>
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'columns'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>Columnas</span>
            </button>
          </div>

          <button
            onClick={handleRandomShuffle}
            disabled={nextWeekConfirmed.length < 2}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors border border-zinc-800 disabled:opacity-50"
            title="Sortear equipos aleatoriamente de forma balanceada"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Sorteo</span>
          </button>

          <button
            onClick={handleClearTeams}
            disabled={blueTeamIds.length === 0 && orangeTeamIds.length === 0}
            className="p-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
            title="Vaciar equipos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyFormations}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors border border-zinc-800"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsPosterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-green-700 hover:bg-green-600 text-white transition-all shadow-sm"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Generar Pizarra</span>
          </button>
        </div>
      </div>

      {/* Available Players Tray when in Tactical View */}
      {viewMode === 'tactical' && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-zinc-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <span>Jugadores Disponibles ({availablePlayers.length})</span>
            </span>
            <span className="text-[11px] text-zinc-500">
              Usa los botones para sumarlos a cada equipo
            </span>
          </div>

          {availablePlayers.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-1">
              Todos los confirmados ya fueron asignados a un equipo.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availablePlayers.map((player) => (
                <div
                  key={player.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 shadow-sm"
                >
                  <span className="font-medium">{player.name}</span>
                  {player.isGuest && (
                    <span className="text-[9px] text-amber-500 font-bold">Invitado</span>
                  )}
                  <div className="flex items-center gap-1 ml-1 border-l border-zinc-800 pl-1.5">
                    <button
                      onClick={() => moveToBlue(player.id)}
                      disabled={cleanBluePlayers.length >= 7}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 hover:bg-blue-800 text-blue-200 disabled:opacity-30"
                      title="Sumar al Equipo Azul"
                    >
                      Azul
                    </button>
                    <button
                      onClick={() => moveToOrange(player.id)}
                      disabled={cleanOrangePlayers.length >= 7}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-900/60 hover:bg-orange-800 text-orange-200 disabled:opacity-30"
                      title="Sumar al Equipo Naranja"
                    >
                      Naranja
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: TACTICAL PITCH BOARDS (1-3-1-2) */}
      {viewMode === 'tactical' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blue Pitch Board */}
          <TacticalPitchBoard
            teamName="Equipo Azul"
            colorTheme="blue"
            players={blueTeam}
            onSwapPositions={handleSwapBluePositions}
          />

          {/* Orange Pitch Board */}
          <TacticalPitchBoard
            teamName="Equipo Naranja"
            colorTheme="orange"
            players={orangeTeam}
            onSwapPositions={handleSwapOrangePositions}
          />
        </div>
      ) : (
        /* VIEW 2: 3 COLUMNS DRAG & DROP WORKSPACE */
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
                <div className="w-5 h-5 rounded-full bg-blue-600 shadow-sm" />
                <div>
                  <h3 className="text-sm font-bold text-white">Equipo Azul</h3>
                  <span className="text-[11px] text-zinc-400">Pechera Azul</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                {cleanBluePlayers.length} / 7
              </span>
            </div>

            {/* Slots / Players */}
            <div className="space-y-2 flex-1 min-h-[320px]">
              {cleanBluePlayers.map((player, idx) => (
                <div
                  key={player.id}
                  draggable
                  onDragStart={() => handleDragStart(player.id)}
                  className="group flex items-center justify-between p-2.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-all cursor-grab active:cursor-grabbing shadow-sm"
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
                        <span className="text-[9px] text-amber-500">Invitado</span>
                      )}
                    </div>
                  </div>

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
                      disabled={cleanOrangePlayers.length >= 7}
                      title="Pasar a Equipo Naranja"
                      className="p-1 rounded text-orange-400 hover:bg-orange-950/50 disabled:opacity-30 text-[11px] flex items-center gap-0.5"
                    >
                      <span>Nar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {Array.from({ length: Math.max(0, 7 - cleanBluePlayers.length) }).map((_, i) => (
                <div
                  key={`empty-blue-${i}`}
                  className="h-10 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-center text-[11px] text-zinc-600 select-none"
                >
                  Slot {cleanBluePlayers.length + i + 1} libre
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
                ? 'border-green-600 ring-2 ring-green-600/20 bg-green-950/20'
                : 'border-zinc-800/90'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-zinc-400" />
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
                  <Check className="w-6 h-6 text-green-500 mb-1" />
                  <p className="text-xs font-medium text-zinc-300">
                    ¡Todos los confirmados asignados!
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
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {player.name}
                      </span>
                      {player.isGuest && (
                        <span className="text-[9px] text-amber-500 shrink-0">Invitado</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => moveToBlue(player.id)}
                        disabled={cleanBluePlayers.length >= 7}
                        className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-900 hover:bg-blue-900/60 text-blue-300 border border-zinc-800 disabled:opacity-30 transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Azul</span>
                      </button>

                      <button
                        onClick={() => moveToOrange(player.id)}
                        disabled={cleanOrangePlayers.length >= 7}
                        className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-900 hover:bg-orange-900/60 text-orange-300 border border-zinc-800 disabled:opacity-30 transition-colors"
                      >
                        <span>Naranja</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Unconfirmed section fallback */}
              {unconfirmedPlayers.length > 0 && availablePlayers.length < 14 && (
                <div className="pt-3 mt-3 border-t border-zinc-800/60">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Otros del grupo
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
                <div className="w-5 h-5 rounded-full bg-orange-600 shadow-sm" />
                <div>
                  <h3 className="text-sm font-bold text-white">Equipo Naranja</h3>
                  <span className="text-[11px] text-zinc-400">Pechera Naranja</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                {cleanOrangePlayers.length} / 7
              </span>
            </div>

            {/* Slots / Players */}
            <div className="space-y-2 flex-1 min-h-[320px]">
              {cleanOrangePlayers.map((player, idx) => (
                <div
                  key={player.id}
                  draggable
                  onDragStart={() => handleDragStart(player.id)}
                  className="group flex items-center justify-between p-2.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-all cursor-grab active:cursor-grabbing shadow-sm"
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
                        <span className="text-[9px] text-amber-500">Invitado</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => moveToBlue(player.id)}
                      disabled={cleanBluePlayers.length >= 7}
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

              {Array.from({ length: Math.max(0, 7 - cleanOrangePlayers.length) }).map((_, i) => (
                <div
                  key={`empty-orange-${i}`}
                  className="h-10 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-center text-[11px] text-zinc-600 select-none"
                >
                  Slot {cleanOrangePlayers.length + i + 1} libre
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
