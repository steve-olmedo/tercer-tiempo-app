import React, { useState, useMemo } from 'react';
import { Player, MatchConfig, F7_POSITIONS, TacticalSlot } from '../types/fulbito';
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
  ArrowLeftRight,
  LayoutGrid,
  Search,
  Scale,
  Sparkles,
  Info,
  X,
  Plus,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  UserCheck,
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
  const { blueTeamIds = [], orangeTeamIds = [] } = teams;
  const [viewMode, setViewMode] = useState<'tactical' | 'columns'>('columns');
  const [mobileColTab, setMobileColTab] = useState<'all' | 'blue' | 'available' | 'orange'>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeSlotPicker, setActiveSlotPicker] = useState<{
    team: 'blue' | 'orange';
    slotIndex: number;
  } | null>(null);
  const [searchAvailable, setSearchAvailable] = useState('');
  const [showOtherGroupPlayers, setShowOtherGroupPlayers] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'blue' | 'available' | 'orange' | null>(null);

  // Normalize teams to 7-element arrays for position alignment
  const blueTeam = useMemo<(Player | null)[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const id = blueTeamIds[i];
      if (!id || id.trim() === '') return null;
      return players.find((p) => p.id === id) || null;
    });
  }, [blueTeamIds, players]);

  const orangeTeam = useMemo<(Player | null)[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const id = orangeTeamIds[i];
      if (!id || id.trim() === '') return null;
      return players.find((p) => p.id === id) || null;
    });
  }, [orangeTeamIds, players]);

  // Clean arrays of assigned players
  const cleanBluePlayers = useMemo(
    () => blueTeam.filter((p): p is Player => p !== null),
    [blueTeam]
  );
  const cleanOrangePlayers = useMemo(
    () => orangeTeam.filter((p): p is Player => p !== null),
    [orangeTeam]
  );

  // Set of assigned player IDs
  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    cleanBluePlayers.forEach((p) => ids.add(p.id));
    cleanOrangePlayers.forEach((p) => ids.add(p.id));
    return ids;
  }, [cleanBluePlayers, cleanOrangePlayers]);

  // Confirmed match pool (players marked as playing next week, or played today if next week is empty)
  const confirmedPool = useMemo(() => {
    const nextWeek = players.filter((p) => p.playsNextWeek);
    if (nextWeek.length > 0) return nextWeek;
    return players.filter((p) => p.playedToday);
  }, [players]);

  // Available confirmed players (not yet drafted to blue or orange)
  const availableConfirmedPlayers = useMemo(() => {
    return confirmedPool.filter((p) => !assignedIds.has(p.id));
  }, [confirmedPool, assignedIds]);

  // Other squad players in the group who aren't confirmed
  const otherSquadPlayers = useMemo(() => {
    const confirmedSet = new Set(confirmedPool.map((p) => p.id));
    return players.filter((p) => !assignedIds.has(p.id) && !confirmedSet.has(p.id));
  }, [players, assignedIds, confirmedPool]);

  // Filtered available players by search
  const filteredAvailable = useMemo(() => {
    const q = searchAvailable.trim().toLowerCase();
    if (!q) return availableConfirmedPlayers;
    return availableConfirmedPlayers.filter((p) => p.name.toLowerCase().includes(q));
  }, [availableConfirmedPlayers, searchAvailable]);

  const filteredOtherSquad = useMemo(() => {
    const q = searchAvailable.trim().toLowerCase();
    if (!q) return otherSquadPlayers;
    return otherSquadPlayers.filter((p) => p.name.toLowerCase().includes(q));
  }, [otherSquadPlayers, searchAvailable]);

  // Currently selected player object
  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerId) return null;
    return players.find((p) => p.id === selectedPlayerId) || null;
  }, [selectedPlayerId, players]);

  // Helper to determine where a player is currently located
  const getPlayerLocation = (playerId: string): 'blue' | 'orange' | 'available' => {
    if (cleanBluePlayers.some((p) => p.id === playerId)) return 'blue';
    if (cleanOrangePlayers.some((p) => p.id === playerId)) return 'orange';
    return 'available';
  };

  const selectedPlayerLocation = selectedPlayer ? getPlayerLocation(selectedPlayer.id) : null;


  // -------------------------------------------------------------
  // Move Operations (Safe, slot-preserving & length-limit guarded)
  // -------------------------------------------------------------
  const moveToBlue = (playerId: string, targetSlot?: number) => {
    const isAlreadyInBlue = cleanBluePlayers.some((p) => p.id === playerId);
    if (isAlreadyInBlue && targetSlot === undefined) return;
    if (cleanBluePlayers.length >= 7 && !isAlreadyInBlue) return; // Full

    // Remove from Orange
    const newOrange = orangeTeamIds.map((id) => (id === playerId ? '' : id));

    // Prepare Blue slots
    const newBlue = [...blueTeamIds];
    while (newBlue.length < 7) newBlue.push('');

    // Clear previous slot of this player in Blue
    for (let i = 0; i < 7; i++) {
      if (newBlue[i] === playerId) newBlue[i] = '';
    }

    if (targetSlot !== undefined && targetSlot >= 0 && targetSlot < 7) {
      newBlue[targetSlot] = playerId;
    } else {
      // Find first empty slot
      const emptyIdx = newBlue.findIndex((id) => !id || id.trim() === '');
      if (emptyIdx !== -1 && emptyIdx < 7) {
        newBlue[emptyIdx] = playerId;
      } else {
        newBlue[6] = playerId;
      }
    }

    onUpdateTeams({ blueTeamIds: newBlue, orangeTeamIds: newOrange });
    setSelectedPlayerId(null);
    setActiveSlotPicker(null);
  };

  const moveToOrange = (playerId: string, targetSlot?: number) => {
    const isAlreadyInOrange = cleanOrangePlayers.some((p) => p.id === playerId);
    if (isAlreadyInOrange && targetSlot === undefined) return;
    if (cleanOrangePlayers.length >= 7 && !isAlreadyInOrange) return; // Full

    // Remove from Blue
    const newBlue = blueTeamIds.map((id) => (id === playerId ? '' : id));

    // Prepare Orange slots
    const newOrange = [...orangeTeamIds];
    while (newOrange.length < 7) newOrange.push('');

    // Clear previous slot of this player in Orange
    for (let i = 0; i < 7; i++) {
      if (newOrange[i] === playerId) newOrange[i] = '';
    }

    if (targetSlot !== undefined && targetSlot >= 0 && targetSlot < 7) {
      newOrange[targetSlot] = playerId;
    } else {
      // Find first empty slot
      const emptyIdx = newOrange.findIndex((id) => !id || id.trim() === '');
      if (emptyIdx !== -1 && emptyIdx < 7) {
        newOrange[emptyIdx] = playerId;
      } else {
        newOrange[6] = playerId;
      }
    }

    onUpdateTeams({ blueTeamIds: newBlue, orangeTeamIds: newOrange });
    setSelectedPlayerId(null);
    setActiveSlotPicker(null);
  };

  const moveToAvailable = (playerId: string) => {
    const newBlue = blueTeamIds.map((id) => (id === playerId ? '' : id));
    const newOrange = orangeTeamIds.map((id) => (id === playerId ? '' : id));
    onUpdateTeams({ blueTeamIds: newBlue, orangeTeamIds: newOrange });
    if (selectedPlayerId === playerId) setSelectedPlayerId(null);
    setActiveSlotPicker(null);
  };

  const handleSwapPlayers = (idA: string, idB: string) => {
    const newBlue = [...blueTeamIds];
    while (newBlue.length < 7) newBlue.push('');
    const newOrange = [...orangeTeamIds];
    while (newOrange.length < 7) newOrange.push('');

    const idxBlueA = newBlue.indexOf(idA);
    const idxOrangeA = newOrange.indexOf(idA);
    const idxBlueB = newBlue.indexOf(idB);
    const idxOrangeB = newOrange.indexOf(idB);

    if (idxBlueA !== -1 && idxOrangeB !== -1) {
      newBlue[idxBlueA] = idB;
      newOrange[idxOrangeB] = idA;
    } else if (idxOrangeA !== -1 && idxBlueB !== -1) {
      newOrange[idxOrangeA] = idB;
      newBlue[idxBlueB] = idA;
    } else if (idxBlueA !== -1 && idxBlueB !== -1) {
      newBlue[idxBlueA] = idB;
      newBlue[idxBlueB] = idA;
    } else if (idxOrangeA !== -1 && idxOrangeB !== -1) {
      newOrange[idxOrangeA] = idB;
      newOrange[idxOrangeB] = idA;
    }

    onUpdateTeams({ blueTeamIds: newBlue, orangeTeamIds: newOrange });
    setSelectedPlayerId(null);
  };

  // Swap tactical pitch positions
  const handleSwapBluePositions = (indexA: number, indexB: number) => {
    const copy = [...blueTeamIds];
    while (copy.length < 7) copy.push('');
    const temp = copy[indexA] || '';
    copy[indexA] = copy[indexB] || '';
    copy[indexB] = temp;
    onUpdateTeams({ blueTeamIds: copy, orangeTeamIds });
  };

  const handleSwapOrangePositions = (indexA: number, indexB: number) => {
    const copy = [...orangeTeamIds];
    while (copy.length < 7) copy.push('');
    const temp = copy[indexA] || '';
    copy[indexA] = copy[indexB] || '';
    copy[indexB] = temp;
    onUpdateTeams({ blueTeamIds, orangeTeamIds: copy });
  };

  // Player card tap/selection handler
  const handlePlayerCardClick = (playerId: string) => {
    if (selectedPlayerId === null) {
      setSelectedPlayerId(playerId);
    } else if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
    } else {
      // If one player is assigned and another is also assigned, swap them!
      const locA = getPlayerLocation(selectedPlayerId);
      const locB = getPlayerLocation(playerId);

      if (locA !== 'available' && locB !== 'available') {
        handleSwapPlayers(selectedPlayerId, playerId);
      } else {
        setSelectedPlayerId(playerId);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (playerId: string) => {
    setDraggedPlayerId(playerId);
    setSelectedPlayerId(playerId);
  };

  const handleDragOver = (e: React.DragEvent, col: 'blue' | 'available' | 'orange') => {
    e.preventDefault();
    setDragOverColumn(col);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (col: 'blue' | 'available' | 'orange', targetSlot?: number) => {
    if (!draggedPlayerId) return;

    if (col === 'blue') {
      moveToBlue(draggedPlayerId, targetSlot);
    } else if (col === 'orange') {
      moveToOrange(draggedPlayerId, targetSlot);
    } else {
      moveToAvailable(draggedPlayerId);
    }

    setDraggedPlayerId(null);
    setDragOverColumn(null);
  };

  // Batch auto-distribution (7 y 7)
  const handleAutoDistribute = () => {
    const pool = [...confirmedPool];
    const blueIds: string[] = Array(7).fill('');
    const orangeIds: string[] = Array(7).fill('');

    let bIdx = 0;
    let oIdx = 0;

    pool.forEach((p, index) => {
      if (index % 2 === 0) {
        if (bIdx < 7) {
          blueIds[bIdx] = p.id;
          bIdx++;
        } else if (oIdx < 7) {
          orangeIds[oIdx] = p.id;
          oIdx++;
        }
      } else {
        if (oIdx < 7) {
          orangeIds[oIdx] = p.id;
          oIdx++;
        } else if (bIdx < 7) {
          blueIds[bIdx] = p.id;
          bIdx++;
        }
      }
    });

    onUpdateTeams({ blueTeamIds: blueIds, orangeTeamIds: orangeIds });
    setSelectedPlayerId(null);
  };

  // Random Shuffle (Sorteo)
  const handleRandomShuffle = () => {
    const pool = [...confirmedPool].sort(() => Math.random() - 0.5);
    const blueIds: string[] = Array(7).fill('');
    const orangeIds: string[] = Array(7).fill('');

    let bIdx = 0;
    let oIdx = 0;

    pool.forEach((p, index) => {
      if (index % 2 === 0) {
        if (bIdx < 7) {
          blueIds[bIdx] = p.id;
          bIdx++;
        } else if (oIdx < 7) {
          orangeIds[oIdx] = p.id;
          oIdx++;
        }
      } else {
        if (oIdx < 7) {
          orangeIds[oIdx] = p.id;
          oIdx++;
        } else if (bIdx < 7) {
          blueIds[bIdx] = p.id;
          bIdx++;
        }
      }
    });

    onUpdateTeams({ blueTeamIds: blueIds, orangeTeamIds: orangeIds });
    setSelectedPlayerId(null);
  };

  const handleClearTeams = () => {
    onUpdateTeams({ blueTeamIds: [], orangeTeamIds: [] });
    setSelectedPlayerId(null);
  };

  const handleCopyFormations = async () => {
    const text = generateTeamsText(cleanBluePlayers, cleanOrangePlayers, config);
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
      {/* ================= TOP BANNER & CONTROLS ================= */}
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
          {/* View Switcher: Columnas vs Pizarra */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'columns'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-zinc-300" />
              <span>Columnas</span>
            </button>
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
          </div>

          <button
            onClick={handleAutoDistribute}
            disabled={confirmedPool.length < 2}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors border border-zinc-800 disabled:opacity-50"
            title="Repartir 7 y 7 de forma balanceada"
          >
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Repartir 7 y 7</span>
          </button>

          <button
            onClick={handleRandomShuffle}
            disabled={confirmedPool.length < 2}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors border border-zinc-800 disabled:opacity-50"
            title="Sortear equipos aleatoriamente"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Sorteo</span>
          </button>

          <button
            onClick={handleClearTeams}
            disabled={cleanBluePlayers.length === 0 && cleanOrangePlayers.length === 0}
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

      {/* ================= SELECTION BANNER / HELPER ================= */}
      {selectedPlayer && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <div>
              <p className="text-xs text-amber-200">
                <span className="font-bold text-amber-100">{selectedPlayer.name}</span> seleccionado
              </p>
              <p className="text-[11px] text-amber-300/80">
                Toca cualquier columna o un slot libre para ubicarlo, o toca otro jugador para intercambiarlos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => moveToBlue(selectedPlayer.id)}
              disabled={cleanBluePlayers.length >= 7 && !cleanBluePlayers.some((p) => p.id === selectedPlayer.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all shadow-sm"
            >
              🔵 A Equipo Azul
            </button>
            <button
              onClick={() => moveToOrange(selectedPlayer.id)}
              disabled={cleanOrangePlayers.length >= 7 && !cleanOrangePlayers.some((p) => p.id === selectedPlayer.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 transition-all shadow-sm"
            >
              🟠 A Equipo Naranja
            </button>
            <button
              onClick={() => moveToAvailable(selectedPlayer.id)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
            >
              Disponibles
            </button>
            <button
              onClick={() => setSelectedPlayerId(null)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
              title="Cancelar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= VIEW 1: TACTICAL PITCH BOARD ================= */}
      {viewMode === 'tactical' ? (
        <div className="space-y-6">
          {/* Available Players Tray in Tactical Mode */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-zinc-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <span>Jugadores Disponibles ({availableConfirmedPlayers.length})</span>
              </span>
              <span className="text-[11px] text-zinc-400">
                Usa los botones para sumarlos directamente
              </span>
            </div>

            {availableConfirmedPlayers.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-1">
                Todos los confirmados ya fueron asignados a un equipo.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableConfirmedPlayers.map((player) => (
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
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/70 hover:bg-blue-800 text-blue-200 disabled:opacity-30 transition-colors"
                        title="Sumar al Equipo Azul"
                      >
                        Azul
                      </button>
                      <button
                        onClick={() => moveToOrange(player.id)}
                        disabled={cleanOrangePlayers.length >= 7}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-900/70 hover:bg-orange-800 text-orange-200 disabled:opacity-30 transition-colors"
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

          {/* Tactical Pitch Boards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TacticalPitchBoard
              teamName="Equipo Azul"
              colorTheme="blue"
              players={blueTeam}
              onSwapPositions={handleSwapBluePositions}
            />
            <TacticalPitchBoard
              teamName="Equipo Naranja"
              colorTheme="orange"
              players={orangeTeam}
              onSwapPositions={handleSwapOrangePositions}
            />
          </div>
        </div>
      ) : (
        /* ================= VIEW 2: 3 COLUMNS WORKSPACE ================= */
        <div className="space-y-4">
          {/* Mobile Column Segmented Control (Small screens only) */}
          <div className="flex lg:hidden items-center justify-between bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setMobileColTab('all')}
              className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-xl transition-all ${
                mobileColTab === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Ver Todo
            </button>
            <button
              onClick={() => setMobileColTab('blue')}
              className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
                mobileColTab === 'blue'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-400 hover:text-blue-300'
              }`}
            >
              <span>Azul</span>
              <span className="font-mono text-[10px] px-1 bg-black/30 rounded">
                {cleanBluePlayers.length}/7
              </span>
            </button>
            <button
              onClick={() => setMobileColTab('available')}
              className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
                mobileColTab === 'available'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>Libres</span>
              <span className="font-mono text-[10px] px-1 bg-black/30 rounded">
                {availableConfirmedPlayers.length}
              </span>
            </button>
            <button
              onClick={() => setMobileColTab('orange')}
              className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
                mobileColTab === 'orange'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-orange-400 hover:text-orange-300'
              }`}
            >
              <span>Naranja</span>
              <span className="font-mono text-[10px] px-1 bg-black/30 rounded">
                {cleanOrangePlayers.length}/7
              </span>
            </button>
          </div>

          {/* 3 COLUMNS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ================= COL 1: EQUIPO AZUL ================= */}
            <div
              onDragOver={(e) => handleDragOver(e, 'blue')}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop('blue')}
              onClick={() => {
                if (selectedPlayer && selectedPlayerLocation !== 'blue') {
                  moveToBlue(selectedPlayer.id);
                }
              }}
              className={`flex flex-col bg-zinc-900/70 border rounded-2xl p-4 transition-all ${
                mobileColTab !== 'all' && mobileColTab !== 'blue' ? 'hidden lg:flex' : ''
              } ${
                dragOverColumn === 'blue'
                  ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20'
                  : selectedPlayer && selectedPlayerLocation !== 'blue'
                  ? 'border-blue-500/60 ring-1 ring-blue-500/20'
                  : 'border-zinc-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-600 shadow-md ring-2 ring-blue-400/20" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Equipo Azul</h3>
                    <span className="text-[11px] text-zinc-400">Pechera Azul · 7 jugadores</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                      cleanBluePlayers.length === 7
                        ? 'bg-blue-900/60 text-blue-200 border-blue-700/60'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700/50'
                    }`}
                  >
                    {cleanBluePlayers.length} / 7
                  </span>
                </div>
              </div>

              {/* 7 Slots List */}
              <div className="space-y-2 flex-1 min-h-[380px]">
                {Array.from({ length: 7 }, (_, slotIdx) => {
                  const player = blueTeam[slotIdx];
                  const slotConfig = F7_POSITIONS[slotIdx];
                  const isSelected = player && selectedPlayerId === player.id;

                  if (player) {
                    return (
                      <div
                        key={player.id}
                        draggable
                        onDragStart={() => handleDragStart(player.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayerCardClick(player.id);
                        }}
                        className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-950/70 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.01]'
                            : 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800/90 hover:border-zinc-700 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-blue-950 border border-blue-800/70 flex items-center justify-center text-[10px] font-mono font-bold text-blue-300 shrink-0">
                            {slotIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white truncate">
                                {player.name}
                              </span>
                              {player.isGuest && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold shrink-0">
                                  Invitado
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              {slotConfig.label} ({slotConfig.shortLabel})
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToOrange(player.id);
                            }}
                            disabled={cleanOrangePlayers.length >= 7}
                            title="Pasar al Equipo Naranja"
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-950/60 hover:bg-orange-800/80 text-orange-200 border border-orange-800/60 disabled:opacity-30 transition-all flex items-center gap-0.5"
                          >
                            <span>Nar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToAvailable(player.id);
                            }}
                            title="Devolver a Disponibles"
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot
                  const isPickerOpen =
                    activeSlotPicker?.team === 'blue' && activeSlotPicker.slotIndex === slotIdx;

                  return (
                    <div key={`empty-blue-${slotIdx}`} className="relative">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedPlayer) {
                            moveToBlue(selectedPlayer.id, slotIdx);
                          } else {
                            setActiveSlotPicker(
                              isPickerOpen ? null : { team: 'blue', slotIndex: slotIdx }
                            );
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop('blue', slotIdx);
                        }}
                        className={`h-11 px-3 border border-dashed rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                          selectedPlayer
                            ? 'border-amber-400/80 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 animate-pulse'
                            : 'border-zinc-800/80 hover:border-blue-500/50 hover:bg-blue-950/10 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center font-mono text-[11px] text-zinc-600 font-bold">
                            {slotIdx + 1}
                          </span>
                          <span className="text-[11px]">
                            {selectedPlayer
                              ? `👉 Ubicar a ${selectedPlayer.name} aquí`
                              : `Slot ${slotIdx + 1} libre · ${slotConfig.label}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                          {slotConfig.shortLabel}
                        </span>
                      </div>

                      {/* Inline Slot Quick Picker */}
                      {isPickerOpen && availableConfirmedPlayers.length > 0 && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-12 left-0 right-0 z-40 bg-zinc-950 border border-blue-500/60 rounded-xl p-2.5 shadow-2xl animate-in fade-in"
                        >
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-[11px] text-zinc-400">
                            <span>Asignar a {slotConfig.label}:</span>
                            <button
                              onClick={() => setActiveSlotPicker(null)}
                              className="text-zinc-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {availableConfirmedPlayers.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => moveToBlue(p.id, slotIdx)}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-blue-950 hover:text-white flex items-center justify-between"
                              >
                                <span className="font-medium truncate">{p.name}</span>
                                <span className="text-[10px] text-blue-400 font-bold">+ Asignar</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= COL 2: DISPONIBLES (CENTRAL) ================= */}
            <div
              onDragOver={(e) => handleDragOver(e, 'available')}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop('available')}
              onClick={() => {
                if (selectedPlayer && selectedPlayerLocation !== 'available') {
                  moveToAvailable(selectedPlayer.id);
                }
              }}
              className={`flex flex-col bg-zinc-900/70 border rounded-2xl p-4 transition-all ${
                mobileColTab !== 'all' && mobileColTab !== 'available' ? 'hidden lg:flex' : ''
              } ${
                dragOverColumn === 'available'
                  ? 'border-green-500 ring-2 ring-green-500/30 bg-green-950/20'
                  : 'border-zinc-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Disponibles</h3>
                    <span className="text-[11px] text-zinc-400">Por asignar a un equipo</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                    {availableConfirmedPlayers.length}
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchAvailable}
                  onChange={(e) => setSearchAvailable(e.target.value)}
                  placeholder="Buscar jugador..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-600 transition-colors"
                />
                {searchAvailable && (
                  <button
                    onClick={() => setSearchAvailable('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* List of Available Players */}
              <div className="space-y-2 flex-1 min-h-[380px] max-h-[580px] overflow-y-auto pr-0.5">
                {filteredAvailable.length === 0 ? (
                  <div className="h-44 border border-dashed border-zinc-800/80 rounded-xl flex flex-col items-center justify-center text-center p-4">
                    <CheckCircle2 className="w-7 h-7 text-green-500 mb-2 opacity-80" />
                    <p className="text-xs font-semibold text-zinc-300">
                      ¡Todos los confirmados ya tienen equipo!
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Podés cambiar posiciones o mover jugadores entre columnas en cualquier momento.
                    </p>
                  </div>
                ) : (
                  filteredAvailable.map((player) => {
                    const isSelected = selectedPlayerId === player.id;

                    return (
                      <div
                        key={player.id}
                        draggable
                        onDragStart={() => handleDragStart(player.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayerCardClick(player.id);
                        }}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.01]'
                            : 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800/90 hover:border-zinc-700 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                          <span className="text-xs font-semibold text-zinc-100 truncate">
                            {player.name}
                          </span>
                          {player.isGuest && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold shrink-0">
                              Invitado
                            </span>
                          )}
                        </div>

                        {/* Direct 1-Tap Team Assignment Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToBlue(player.id);
                            }}
                            disabled={cleanBluePlayers.length >= 7}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 disabled:opacity-30 transition-all shadow-sm"
                            title="Asignar al Equipo Azul"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Azul</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToOrange(player.id);
                            }}
                            disabled={cleanOrangePlayers.length >= 7}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-900/60 hover:bg-orange-800 text-orange-200 border border-orange-700/60 disabled:opacity-30 transition-all shadow-sm"
                            title="Asignar al Equipo Naranja"
                          >
                            <span>Naranja</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Other Squad Players in the Group (Non-confirmed) */}
                {otherSquadPlayers.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-zinc-800/70">
                    <button
                      onClick={() => setShowOtherGroupPlayers(!showOtherGroupPlayers)}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 py-1"
                    >
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <span>Otros jugadores del grupo ({otherSquadPlayers.length})</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          showOtherGroupPlayers ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showOtherGroupPlayers && (
                      <div className="space-y-1.5 mt-2">
                        {filteredOtherSquad.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2 bg-zinc-950/60 rounded-xl border border-zinc-800/60 text-xs"
                          >
                            <span className="text-zinc-300 font-medium truncate">{player.name}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onUpdatePlayer({ ...player, playsNextWeek: true });
                                  moveToBlue(player.id);
                                }}
                                disabled={cleanBluePlayers.length >= 7}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 hover:bg-blue-900 disabled:opacity-30 border border-blue-900/60"
                              >
                                Azul
                              </button>
                              <button
                                onClick={() => {
                                  onUpdatePlayer({ ...player, playsNextWeek: true });
                                  moveToOrange(player.id);
                                }}
                                disabled={cleanOrangePlayers.length >= 7}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-300 hover:bg-orange-900 disabled:opacity-30 border border-orange-900/60"
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
              </div>
            </div>

            {/* ================= COL 3: EQUIPO NARANJA ================= */}
            <div
              onDragOver={(e) => handleDragOver(e, 'orange')}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop('orange')}
              onClick={() => {
                if (selectedPlayer && selectedPlayerLocation !== 'orange') {
                  moveToOrange(selectedPlayer.id);
                }
              }}
              className={`flex flex-col bg-zinc-900/70 border rounded-2xl p-4 transition-all ${
                mobileColTab !== 'all' && mobileColTab !== 'orange' ? 'hidden lg:flex' : ''
              } ${
                dragOverColumn === 'orange'
                  ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-950/20'
                  : selectedPlayer && selectedPlayerLocation !== 'orange'
                  ? 'border-orange-500/60 ring-1 ring-orange-500/20'
                  : 'border-zinc-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-orange-600 shadow-md ring-2 ring-orange-400/20" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Equipo Naranja</h3>
                    <span className="text-[11px] text-zinc-400">Pechera Naranja · 7 jugadores</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                      cleanOrangePlayers.length === 7
                        ? 'bg-orange-900/60 text-orange-200 border-orange-700/60'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700/50'
                    }`}
                  >
                    {cleanOrangePlayers.length} / 7
                  </span>
                </div>
              </div>

              {/* 7 Slots List */}
              <div className="space-y-2 flex-1 min-h-[380px]">
                {Array.from({ length: 7 }, (_, slotIdx) => {
                  const player = orangeTeam[slotIdx];
                  const slotConfig = F7_POSITIONS[slotIdx];
                  const isSelected = player && selectedPlayerId === player.id;

                  if (player) {
                    return (
                      <div
                        key={player.id}
                        draggable
                        onDragStart={() => handleDragStart(player.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayerCardClick(player.id);
                        }}
                        className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-950/70 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.01]'
                            : 'bg-zinc-950/80 hover:bg-zinc-900 border-zinc-800/90 hover:border-zinc-700 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-orange-950 border border-orange-800/70 flex items-center justify-center text-[10px] font-mono font-bold text-orange-300 shrink-0">
                            {slotIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white truncate">
                                {player.name}
                              </span>
                              {player.isGuest && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold shrink-0">
                                  Invitado
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              {slotConfig.label} ({slotConfig.shortLabel})
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToBlue(player.id);
                            }}
                            disabled={cleanBluePlayers.length >= 7}
                            title="Pasar al Equipo Azul"
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-950/60 hover:bg-blue-800/80 text-blue-200 border border-blue-800/60 disabled:opacity-30 transition-all flex items-center gap-0.5"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Azul</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToAvailable(player.id);
                            }}
                            title="Devolver a Disponibles"
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot
                  const isPickerOpen =
                    activeSlotPicker?.team === 'orange' && activeSlotPicker.slotIndex === slotIdx;

                  return (
                    <div key={`empty-orange-${slotIdx}`} className="relative">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedPlayer) {
                            moveToOrange(selectedPlayer.id, slotIdx);
                          } else {
                            setActiveSlotPicker(
                              isPickerOpen ? null : { team: 'orange', slotIndex: slotIdx }
                            );
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleDrop('orange', slotIdx);
                        }}
                        className={`h-11 px-3 border border-dashed rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer ${
                          selectedPlayer
                            ? 'border-amber-400/80 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 animate-pulse'
                            : 'border-zinc-800/80 hover:border-orange-500/50 hover:bg-orange-950/10 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center font-mono text-[11px] text-zinc-600 font-bold">
                            {slotIdx + 1}
                          </span>
                          <span className="text-[11px]">
                            {selectedPlayer
                              ? `👉 Ubicar a ${selectedPlayer.name} aquí`
                              : `Slot ${slotIdx + 1} libre · ${slotConfig.label}`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                          {slotConfig.shortLabel}
                        </span>
                      </div>

                      {/* Inline Slot Quick Picker */}
                      {isPickerOpen && availableConfirmedPlayers.length > 0 && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-12 left-0 right-0 z-40 bg-zinc-950 border border-orange-500/60 rounded-xl p-2.5 shadow-2xl animate-in fade-in"
                        >
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-[11px] text-zinc-400">
                            <span>Asignar a {slotConfig.label}:</span>
                            <button
                              onClick={() => setActiveSlotPicker(null)}
                              className="text-zinc-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {availableConfirmedPlayers.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => moveToOrange(p.id, slotIdx)}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-orange-950 hover:text-white flex items-center justify-between"
                              >
                                <span className="font-medium truncate">{p.name}</span>
                                <span className="text-[10px] text-orange-400 font-bold">+ Asignar</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STICKY MOBILE/DESKTOP SELECTION BAR ================= */}
      {selectedPlayer && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-auto z-50 bg-zinc-900/95 backdrop-blur-md border border-amber-500/60 shadow-2xl rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div>
              <span className="text-[10px] text-zinc-400 block leading-none">
                Jugador seleccionado:
              </span>
              <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                {selectedPlayer.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => moveToBlue(selectedPlayer.id)}
              disabled={cleanBluePlayers.length >= 7 && !cleanBluePlayers.some((p) => p.id === selectedPlayer.id)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all shadow-md flex items-center gap-1"
            >
              <span>🔵 Azul</span>
            </button>
            <button
              onClick={() => moveToOrange(selectedPlayer.id)}
              disabled={cleanOrangePlayers.length >= 7 && !cleanOrangePlayers.some((p) => p.id === selectedPlayer.id)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 transition-all shadow-md flex items-center gap-1"
            >
              <span>🟠 Naranja</span>
            </button>
            <button
              onClick={() => moveToAvailable(selectedPlayer.id)}
              className="px-2 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
            >
              Libres
            </button>
            <button
              onClick={() => setSelectedPlayerId(null)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
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
