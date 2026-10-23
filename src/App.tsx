import React, { useState, useEffect, useMemo } from 'react';
import { Player, MatchConfig, MatchClosingRecord, PlayerMatchSnapshot } from './types/fulbito';
import {
  INITIAL_BASE_PLAYERS,
  DEFAULT_MATCH_CONFIG,
  TODAY_REFERENCE_TEXT,
} from './data/defaultPlayers';
import { parseWhatsAppList, ParsedWhatsAppItem } from './utils/whatsappHelpers';
import { Header } from './components/Header';
import { MatchConfigBar } from './components/MatchConfigBar';
import { PlayerFinanceRow } from './components/PlayerFinanceRow';
import { CashClosingBar } from './components/CashClosingBar';
import { TeamBuilder } from './components/TeamBuilder';
import { HistoryView } from './components/HistoryView';
import { ShareAppModal } from './components/ShareAppModal';
import { WhatsAppImportModal } from './components/WhatsAppImportModal';
import { WhatsAppPreviewModal } from './components/WhatsAppPreviewModal';
import { AddPlayerModal } from './components/AddPlayerModal';
import {
  seedFirestoreIfEmpty,
  subscribeToMatchConfig,
  subscribeToPlayers,
  subscribeToHistory,
  subscribeToTeams,
  saveMatchConfigToCloud,
  savePlayerToCloud,
  saveAllPlayersToCloud,
  deletePlayerFromCloud,
  saveClosingRecordToCloud,
  deleteClosingRecordFromCloud,
  saveTeamsToCloud,
} from './services/firestoreSync';
import {
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const STORAGE_KEY_PLAYERS = 'el-tercer-tiempo-players-v1';
const STORAGE_KEY_CONFIG = 'el-tercer-tiempo-config-v1';
const STORAGE_KEY_HISTORY = 'el-tercer-tiempo-history-v1';

export default function App() {
  // --- Persistent State ---
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_BASE_PLAYERS;
  });

  const [config, setConfig] = useState<MatchConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_MATCH_CONFIG;
  });

  const [history, setHistory] = useState<MatchClosingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'finanzas' | 'equipos' | 'historial'>('finanzas');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'played' | 'nextWeek' | 'withBalance'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [isCloudReady, setIsCloudReady] = useState(false);
  const [teams, setTeams] = useState<{ blueTeamIds: string[]; orangeTeamIds: string[] }>({
    blueTeamIds: [],
    orangeTeamIds: [],
  });

  // Firestore Real-Time Subscriptions
  useEffect(() => {
    let unsubConfig = () => {};
    let unsubPlayers = () => {};
    let unsubHistory = () => {};
    let unsubTeams = () => {};

    const initCloud = async () => {
      try {
        await seedFirestoreIfEmpty();
        setIsCloudReady(true);

        unsubConfig = subscribeToMatchConfig((cloudConfig) => {
          setConfig(cloudConfig);
        });

        unsubPlayers = subscribeToPlayers((cloudPlayers) => {
          if (cloudPlayers.length > 0) {
            setPlayers(cloudPlayers);
          }
        });

        unsubHistory = subscribeToHistory((cloudHistory) => {
          setHistory(cloudHistory);
        });

        unsubTeams = subscribeToTeams((cloudTeams) => {
          setTeams(cloudTeams);
        });
      } catch (err) {
        console.error('Error connecting to Firestore:', err);
      }
    };

    initCloud();

    return () => {
      unsubConfig();
      unsubPlayers();
      unsubHistory();
      unsubTeams();
    };
  }, []);

  // Save to localStorage as fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
    } catch {
      // Ignored
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch {
      // Ignored
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // Ignored
    }
  }, [history]);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Calculations ---
  const playedPlayers = useMemo(
    () => players.filter((p) => p.playedToday),
    [players]
  );
  const playedCount = playedPlayers.length;

  const nextWeekPlayers = useMemo(
    () => players.filter((p) => p.playsNextWeek),
    [players]
  );
  const nextWeekCount = nextWeekPlayers.length;

  const costPerPerson = useMemo(() => {
    if (playedCount === 0) return 0;
    return Math.round(config.pitchCost / playedCount);
  }, [config.pitchCost, playedCount]);

  // --- Player handlers ---
  const handleUpdatePlayer = (updated: Player) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    savePlayerToCloud(updated).catch(() => {});
  };

  const handleRemoveGuest = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    deletePlayerFromCloud(id).catch(() => {});
    showToast('Invitado eliminado');
  };

  const handleAddPlayer = (newPlayerData: Omit<Player, 'id'>) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setPlayers((prev) => [newPlayer, ...prev]);
    savePlayerToCloud(newPlayer).catch(() => {});
    showToast(`"${newPlayer.name}" agregado a la lista`);
  };

  const handleConfigChange = (newConfig: MatchConfig) => {
    setConfig(newConfig);
    saveMatchConfigToCloud(newConfig).catch(() => {});
  };

  const handleUpdateTeams = (newTeams: { blueTeamIds: string[]; orangeTeamIds: string[] }) => {
    setTeams(newTeams);
    saveTeamsToCloud(newTeams).catch(() => {});
  };

  // --- Bulk Actions ---
  const handleBulkPayExact = () => {
    const updated = players.map((p) => {
      if (!p.playedToday) return p;
      return {
        ...p,
        paidToday: costPerPerson,
      };
    });
    setPlayers(updated);
    saveAllPlayersToCloud(updated).catch(() => {});
    showToast(`Marcado pago exacto (${costPerPerson}) para los ${playedCount} jugadores`);
  };

  const handleBulkResetPaid = () => {
    const updated = players.map((p) => ({
      ...p,
      paidToday: 0,
    }));
    setPlayers(updated);
    saveAllPlayersToCloud(updated).catch(() => {});
    showToast('Pagos de hoy restablecidos a $0');
  };

  const handleSelectAllPlayedForNextWeek = () => {
    const updated = players.map((p) => ({
      ...p,
      playsNextWeek: p.playedToday,
    }));
    setPlayers(updated);
    saveAllPlayersToCloud(updated).catch(() => {});
    showToast('Los 14 que jugaron hoy quedaron anotados para el próximo viernes');
  };

  // --- Record Friday Closing Snapshot ---
  const handleRecordCurrentMatch = () => {
    const cashTotal = players.reduce(
      (acc, p) => (p.paymentMethod === 'efectivo' ? acc + p.paidToday : acc),
      0
    );
    const mpTotal = players.reduce(
      (acc, p) => (p.paymentMethod === 'mercadopago' ? acc + p.paidToday : acc),
      0
    );
    const totalCollected = cashTotal + mpTotal;

    const snapshots: PlayerMatchSnapshot[] = players.map((p) => {
      const updated = p.initialBalance - (p.playedToday ? costPerPerson : 0) + p.paidToday;
      return {
        playerId: p.id,
        name: p.name,
        isGuest: p.isGuest,
        initialBalance: p.initialBalance,
        playedToday: p.playedToday,
        paidToday: p.paidToday,
        paymentMethod: p.paymentMethod,
        playsNextWeek: p.playsNextWeek,
        updatedBalance: updated,
      };
    });

    const newRecord: MatchClosingRecord = {
      id: `closing-${Date.now()}`,
      date: config.date || new Date().toLocaleDateString('es-AR'),
      timestamp: Date.now(),
      matchTitle: config.matchTitle || 'Viernes 19hs - Señamos',
      pitchCost: config.pitchCost,
      depositPaid: config.depositPaid,
      costPerPerson,
      playedCount,
      cashTotal,
      mpTotal,
      totalCollected,
      playersSnapshot: snapshots,
    };

    setHistory((prev) => [newRecord, ...prev]);
    saveClosingRecordToCloud(newRecord).catch(() => {});

    // Advance balances for next week
    const advancedPlayers = players.map((p) => {
      const newBal = p.initialBalance - (p.playedToday ? costPerPerson : 0) + p.paidToday;
      return {
        ...p,
        initialBalance: newBal,
        paidToday: 0,
        playedToday: p.playsNextWeek,
      };
    });
    setPlayers(advancedPlayers);
    saveAllPlayersToCloud(advancedPlayers).catch(() => {});

    showToast('💾 ¡Cierre del viernes guardado en Firestore y saldos avanzados!');
    setActiveTab('historial');
  };

  const handleDeleteHistoryRecord = (id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
    deleteClosingRecordFromCloud(id).catch(() => {});
    showToast('Registro eliminado del historial');
  };

  // --- Load Today Reference (From user prompt) ---
  const handleLoadTodayReference = () => {
    const parsed = parseWhatsAppList(TODAY_REFERENCE_TEXT);
    applyParsedData(parsed.title || 'Viernes 19hs - Señamos', parsed.playing, parsed.senas);
    showToast('¡Lista de hoy cargada con éxito!');
  };

  // Helper to apply parsed items to players
  const applyParsedData = (
    title: string,
    playing: ParsedWhatsAppItem[],
    senas: ParsedWhatsAppItem[]
  ) => {
    setConfig((prev) => ({
      ...prev,
      matchTitle: title || prev.matchTitle,
    }));

    // Reconstruct list
    const updatedList: Player[] = [];
    const usedIds = new Set<string>();

    const normalize = (str: string) =>
      str.toLowerCase().replace(/[\s\-_]/g, '');

    // 1. Process playing items (1..14)
    playing.forEach((item, index) => {
      // Find matching player in existing list
      const normItem = normalize(item.name);
      const match = players.find(
        (p) => !usedIds.has(p.id) && (normalize(p.name) === normItem || normItem.includes(normalize(p.name)))
      );

      if (match) {
        usedIds.add(match.id);
        updatedList.push({
          ...match,
          name: match.name,
          initialBalance: item.amount,
          playedToday: true,
          playsNextWeek: true,
          paidToday: 0,
        });
      } else {
        // Create new player / guest
        const newId = `guest-${index}-${Date.now()}`;
        usedIds.add(newId);
        updatedList.push({
          id: newId,
          name: item.name,
          isGuest: true,
          initialBalance: item.amount,
          playedToday: true,
          playsNextWeek: true,
          paidToday: 0,
          paymentMethod: 'mercadopago',
        });
      }
    });

    // 2. Process senas (not playing)
    senas.forEach((item) => {
      const normItem = normalize(item.name);
      const match = players.find(
        (p) => !usedIds.has(p.id) && (normalize(p.name) === normItem || normItem.includes(normalize(p.name)))
      );

      if (match) {
        usedIds.add(match.id);
        updatedList.push({
          ...match,
          initialBalance: item.amount,
          playedToday: false,
          playsNextWeek: false,
          paidToday: 0,
        });
      } else {
        const newId = `sena-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        usedIds.add(newId);
        updatedList.push({
          id: newId,
          name: item.name,
          initialBalance: item.amount,
          playedToday: false,
          playsNextWeek: false,
          paidToday: 0,
          paymentMethod: 'mercadopago',
        });
      }
    });

    // 3. Keep remaining known players who weren't in the message
    players.forEach((p) => {
      if (!usedIds.has(p.id)) {
        updatedList.push({
          ...p,
          playedToday: false,
          playsNextWeek: false,
          paidToday: 0,
        });
      }
    });

    setPlayers(updatedList);
    saveAllPlayersToCloud(updatedList).catch(() => {});
    saveMatchConfigToCloud({ ...config, matchTitle: title || config.matchTitle }).catch(() => {});
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Seguro que deseas reiniciar a los valores base iniciales?')) {
      setPlayers(INITIAL_BASE_PLAYERS);
      setConfig(DEFAULT_MATCH_CONFIG);
      saveAllPlayersToCloud(INITIAL_BASE_PLAYERS).catch(() => {});
      saveMatchConfigToCloud(DEFAULT_MATCH_CONFIG).catch(() => {});
      localStorage.removeItem(STORAGE_KEY_PLAYERS);
      localStorage.removeItem(STORAGE_KEY_CONFIG);
      showToast('Valores restablecidos a la lista base');
    }
  };

  // --- Filtering of Players in List ---
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        if (!p.name.toLowerCase().includes(query)) return false;
      }

      // Filter Mode
      if (filterMode === 'played') return p.playedToday;
      if (filterMode === 'nextWeek') return p.playsNextWeek;
      if (filterMode === 'withBalance') {
        const bal = p.initialBalance - (p.playedToday ? costPerPerson : 0) + p.paidToday;
        return bal !== 0;
      }

      return true;
    });
  }, [players, searchQuery, filterMode, costPerPerson]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 bg-zinc-900 border border-zinc-700 text-zinc-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playedCount={playedCount}
        nextWeekCount={nextWeekCount}
        historyCount={history.length}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onLoadTodayReference={handleLoadTodayReference}
        onResetToDefaults={handleResetToDefaults}
        onOpenAddPlayerModal={() => setIsAddPlayerModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Cloud Status subtle pill under header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 w-full flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium text-zinc-400">
            {isCloudReady ? 'Base de datos en la nube (Firestore activa)' : 'Conectando con Firestore...'}
          </span>
        </div>
        <span className="hidden sm:inline text-zinc-600">
          Los cambios se sincronizan en vivo entre celulares
        </span>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full flex-1">
        {activeTab === 'finanzas' ? (
          <div className="space-y-6">
            {/* Match Configuration Card */}
            <MatchConfigBar
              config={config}
              onChangeConfig={handleConfigChange}
              playedCount={playedCount}
              costPerPerson={costPerPerson}
              onBulkPayExact={handleBulkPayExact}
              onBulkResetPaid={handleBulkResetPaid}
              onSelectAllPlayedForNextWeek={handleSelectAllPlayedForNextWeek}
            />

            {/* List Controls: Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar jugador..."
                    className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <span className="text-zinc-500 text-[11px] font-medium mr-1 hidden md:inline">
                  Ver:
                </span>
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterMode === 'all'
                      ? 'bg-zinc-800 text-white border border-zinc-700/80'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Todos ({players.length})
                </button>
                <button
                  onClick={() => setFilterMode('played')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterMode === 'played'
                      ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/80'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Jugaron hoy ({playedCount})
                </button>
                <button
                  onClick={() => setFilterMode('nextWeek')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterMode === 'nextWeek'
                      ? 'bg-zinc-800 text-blue-400 border border-zinc-700/80'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Próx. Viernes ({nextWeekCount})
                </button>
                <button
                  onClick={() => setFilterMode('withBalance')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterMode === 'withBalance'
                      ? 'bg-zinc-800 text-amber-400 border border-zinc-700/80'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Con Saldo
                </button>
              </div>
            </div>

            {/* Players Table / List Header */}
            <div className="hidden md:flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80">
              <div className="min-w-[200px]">Jugador & Saldo Anterior</div>
              <div className="flex items-center gap-4 flex-1 justify-end">
                <span className="w-24 text-center">¿Jugó Hoy?</span>
                <span className="w-36 text-center">¿Cuánto Pagó?</span>
                <span className="w-24 text-center">Método</span>
                <span className="w-28 text-center">Próx. Viernes</span>
                <span className="w-32 text-right">Saldo Resultante</span>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-2">
              {filteredPlayers.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center">
                  <p className="text-sm text-zinc-400">
                    No se encontraron jugadores con los filtros seleccionados.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterMode('all');
                    }}
                    className="mt-2 text-xs text-emerald-400 hover:underline"
                  >
                    Restablecer filtros
                  </button>
                </div>
              ) : (
                filteredPlayers.map((player, idx) => (
                  <PlayerFinanceRow
                    key={player.id}
                    player={player}
                    index={idx}
                    costPerPerson={costPerPerson}
                    onUpdate={handleUpdatePlayer}
                    onRemoveGuest={handleRemoveGuest}
                  />
                ))
              )}
            </div>

            {/* Add Player Bottom Trigger */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setIsAddPlayerModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                <span>+ Agregar otro jugador o invitado</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'equipos' ? (
          /* Module 2: Team Builder */
          <TeamBuilder
            players={players}
            config={config}
            teams={teams}
            onUpdateTeams={handleUpdateTeams}
            onUpdatePlayer={handleUpdatePlayer}
          />
        ) : (
          /* Module 3: History & Spreadsheet Export */
          <HistoryView
            history={history}
            onDeleteRecord={handleDeleteHistoryRecord}
            onRecordCurrentMatch={handleRecordCurrentMatch}
          />
        )}
      </main>

      {/* Module 1 Smart Closing Bottom Bar (Visible on Finanzas tab) */}
      {activeTab === 'finanzas' && (
        <CashClosingBar
          players={players}
          config={config}
          costPerPerson={costPerPerson}
          onOpenWhatsAppPreview={() => setIsPreviewModalOpen(true)}
          onRecordClosing={handleRecordCurrentMatch}
        />
      )}

      {/* Modals */}
      <WhatsAppImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={applyParsedData}
      />

      <WhatsAppPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        players={players}
        config={config}
        costPerPerson={costPerPerson}
      />

      <AddPlayerModal
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        onAddPlayer={handleAddPlayer}
      />

      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
