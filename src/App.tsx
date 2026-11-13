import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, MatchConfig, MatchClosingRecord, PlayerMatchSnapshot, MPReceipt } from './types/fulbito';
import {
  INITIAL_BASE_PLAYERS,
  DEFAULT_MATCH_CONFIG,
  TODAY_REFERENCE_TEXT,
} from './data/defaultPlayers';
import {
  parseWhatsAppList,
  ParsedWhatsAppItem,
  calculateCostPerPerson,
  calculateUpdatedBalance,
  calculateAmountDueToday,
} from './utils/whatsappHelpers';
import { formatPesos } from './utils/formatters';
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
import { MPReceiptModal } from './components/MPReceiptModal';
import { PlayerReceiptPortal } from './components/PlayerReceiptPortal';
import {
  seedFirestoreIfEmpty,
  subscribeToMatchConfig,
  subscribeToPlayers,
  subscribeToHistory,
  subscribeToTeams,
  subscribeToReceipts,
  saveReceiptToCloud,
  deleteReceiptFromCloud,
  subscribeToAliases,
  saveAliasesToCloud,
  saveMatchConfigToCloud,
  savePlayerToCloud,
  saveAllPlayersToCloud,
  replacePlayersInCloud,
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

const getLocalDateISO = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [isClosingPreviewMode, setIsClosingPreviewMode] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptModalPlayerId, setReceiptModalPlayerId] = useState<string | null>(null);

  const isPlayerReceiptMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    return (
      params.get('modo') === 'comprobante' ||
      params.has('comprobante') ||
      params.has('pago') ||
      hash.includes('comprobante')
    );
  }, []);

  // Mercado Pago Receipts & Aliases
  const [receipts, setReceipts] = useState<MPReceipt[]>([]);
  const [aliasMap, setAliasMap] = useState<Record<string, string>>({});

  const [isCloudReady, setIsCloudReady] = useState(false);
  const [hasCloudConfig, setHasCloudConfig] = useState(false);
  const [hasCloudPlayers, setHasCloudPlayers] = useState(false);
  const autoRolledSessionRef = useRef<string | null>(null);
  const [teams, setTeams] = useState<{ blueTeamIds: string[]; orangeTeamIds: string[] }>({
    blueTeamIds: [],
    orangeTeamIds: [],
  });

  // Firestore Real-Time Subscriptions
  useEffect(() => {
    // 1. Immediately attach real-time snapshot listeners
    const unsubConfig = subscribeToMatchConfig((cloudConfig) => {
      setConfig(cloudConfig);
      setHasCloudConfig(true);
      setIsCloudReady(true);
    });

    const unsubPlayers = subscribeToPlayers((cloudPlayers) => {
      setPlayers(cloudPlayers);
      setHasCloudPlayers(true);
      setIsCloudReady(true);
    });

    const unsubHistory = subscribeToHistory((cloudHistory) => {
      setHistory(cloudHistory);
    });

    const unsubTeams = subscribeToTeams((cloudTeams) => {
      setTeams(cloudTeams);
    });

    const unsubReceipts = subscribeToReceipts((cloudReceipts) => {
      setReceipts(cloudReceipts);
    });

    const unsubAliases = subscribeToAliases((cloudAliases) => {
      setAliasMap(cloudAliases);
    });

    // 2. In background, verify if database needs initial seeding
    seedFirestoreIfEmpty()
      .then(() => {
        setIsCloudReady(true);
      })
      .catch((err) => {
        console.warn('Firestore initial check:', err);
        setIsCloudReady(true);
      });

    return () => {
      unsubConfig();
      unsubPlayers();
      unsubHistory();
      unsubTeams();
      unsubReceipts();
      unsubAliases();
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
    return calculateCostPerPerson(config.pitchCost, playedCount);
  }, [config.pitchCost, playedCount]);

  const activeSessionId = config.currentSessionId || 'default';

  const activeReceipts = useMemo(
    () => receipts.filter((r) => (r.sessionId || 'default') === activeSessionId),
    [receipts, activeSessionId]
  );

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
      orderIndex: players.length,
      vuelto: 0,
    };
    setPlayers((prev) => [...prev, newPlayer]);
    savePlayerToCloud(newPlayer).catch(() => {});
    showToast(`"${newPlayer.name}" agregado a la lista`);
  };

  const handleConfigChange = (newConfig: MatchConfig) => {
    const cleanConfig = { ...newConfig };
    // If the organizer manually edits fondoRecaudador/fondoEmi, drop stale pendingFondoRecaudador
    if (
      cleanConfig.pendingFondoRecaudador !== undefined &&
      (newConfig.fondoRecaudador !== config.fondoRecaudador ||
        newConfig.fondoEmi !== config.fondoEmi)
    ) {
      delete cleanConfig.pendingFondoRecaudador;
    }
    setConfig(cleanConfig);
    saveMatchConfigToCloud(cleanConfig).catch(() => {});
  };

  const handleUpdateTeams = (newTeams: { blueTeamIds: string[]; orangeTeamIds: string[] }) => {
    setTeams(newTeams);
    saveTeamsToCloud(newTeams).catch(() => {});
  };

  // --- Mercado Pago Receipt Handlers ---
  const handleSaveReceipt = (
    newReceipt: MPReceipt,
    autoCredit: boolean,
    saveAlias?: { senderName: string; playerId: string }
  ) => {
    const receiptWithSession: MPReceipt = {
      ...newReceipt,
      sessionId: newReceipt.sessionId || activeSessionId,
    };

    // 1. Save receipt to Firestore
    saveReceiptToCloud(receiptWithSession).catch(() => {});
    setReceipts((prev) => [receiptWithSession, ...prev.filter((r) => r.id !== receiptWithSession.id)]);

    // 2. Auto-credit payment if enabled
    if (autoCredit) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === receiptWithSession.playerId) {
            const updated: Player = {
              ...p,
              paidToday: (p.paidToday || 0) + receiptWithSession.amount,
              paymentMethod: 'mercadopago',
              receiptCount: (p.receiptCount || 0) + 1,
            };
            savePlayerToCloud(updated).catch(() => {});
            return updated;
          }
          return p;
        })
      );
    }

    // 3. Save alias if requested
    if (saveAlias) {
      const updatedAliases = {
        ...aliasMap,
        [saveAlias.senderName]: saveAlias.playerId,
      };
      setAliasMap(updatedAliases);
      saveAliasesToCloud(updatedAliases).catch(() => {});
    }

    showToast(`Comprobante acreditado a "${newReceipt.playerName}"`);
  };

  const handleDeleteReceipt = (receiptId: string, revertAmount: boolean) => {
    const r = receipts.find((x) => x.id === receiptId);
    if (!r) return;

    deleteReceiptFromCloud(receiptId).catch(() => {});
    setReceipts((prev) => prev.filter((x) => x.id !== receiptId));

    if (revertAmount) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === r.playerId) {
            const updated: Player = {
              ...p,
              paidToday: Math.max(0, (p.paidToday || 0) - r.amount),
              receiptCount: Math.max(0, (p.receiptCount || 1) - 1),
            };
            savePlayerToCloud(updated).catch(() => {});
            return updated;
          }
          return p;
        })
      );
    }
    showToast('Comprobante eliminado');
  };

  const handleOpenReceiptModalForPlayer = (playerId: string) => {
    setReceiptModalPlayerId(playerId);
    setIsReceiptModalOpen(true);
  };

  // --- Bulk Actions ---
  const handleBulkPayExact = () => {
    const updated = players.map((p) => {
      if (!p.playedToday) return p;
      return {
        ...p,
        paidToday: calculateAmountDueToday(p, costPerPerson),
        vuelto: 0,
      };
    });
    setPlayers(updated);
    saveAllPlayersToCloud(updated).catch(() => {});
    showToast(`Marcado pago de cuota exacta (${formatPesos(costPerPerson)}) para los ${playedCount} que jugaron`);
  };

  const handleBulkResetPaid = () => {
    const updated = players.map((p) => ({
      ...p,
      paidToday: 0,
      vuelto: 0,
    }));
    setPlayers(updated);
    saveAllPlayersToCloud(updated).catch(() => {});

    if (config.pendingFondoRecaudador !== undefined) {
      const { pendingFondoRecaudador, ...restConfig } = config;
      const promotedConfig: MatchConfig = {
        ...restConfig,
        fondoRecaudador: pendingFondoRecaudador,
        fondoEmi: pendingFondoRecaudador,
      };
      setConfig(promotedConfig);
      saveMatchConfigToCloud(promotedConfig).catch(() => {});
    }

    showToast('Pagos y vueltos de hoy restablecidos a $0');
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

  // --- Start New Weekly Collection (Manual or Automatic Next Friday) ---
  const handleStartNewCollection = (isAuto = false) => {
    const todayISO = getLocalDateISO();
    const newSessionId = isAuto ? `session-${todayISO}` : `session-${Date.now()}`;
    const { pendingFondoRecaudador, ...restConfig } = config;
    const promotedFondo =
      pendingFondoRecaudador !== undefined
        ? pendingFondoRecaudador
        : config.fondoRecaudador ?? config.fondoEmi ?? 0;

    const nextConfig: MatchConfig = {
      ...restConfig,
      fondoRecaudador: promotedFondo,
      fondoEmi: promotedFondo,
      date: todayISO,
      currentSessionId: newSessionId,
      currentSessionDate: todayISO,
      currentSessionClosed: false,
    };

    const advancedPlayers: Player[] = players.map((p) => ({
      ...p,
      initialBalance: calculateUpdatedBalance(p, costPerPerson),
      paidToday: 0,
      vuelto: 0,
      receiptCount: 0,
      playedToday: p.playsNextWeek,
    }));

    setConfig(nextConfig);
    setPlayers(advancedPlayers);

    replacePlayersInCloud(advancedPlayers, nextConfig, true)
      .then(() => {
        showToast(
          isAuto
            ? '✨ ¡Nuevo viernes! Se inició automáticamente una nueva recolección.'
            : '✨ ¡Nueva recolección iniciada! Los comprobantes anteriores quedaron archivados.'
        );
      })
      .catch(() => {
        showToast('Nueva recolección iniciada localmente (error al sincronizar)');
      });
  };

  // Automatic rollover to a new collection when the next Friday/week arrives after a saved closing
  useEffect(() => {
    if (!hasCloudConfig || !hasCloudPlayers) return;
    if (!config.currentSessionClosed || !config.lastClosedAt) return;

    const todayISO = getLocalDateISO();
    const closedDateISO =
      config.currentSessionDate || getLocalDateISO(new Date(config.lastClosedAt));
    const daysElapsed = (Date.now() - config.lastClosedAt) / (1000 * 60 * 60 * 24);
    const isNewFriday = new Date().getDay() === 5 && todayISO > closedDateISO;

    if (todayISO > closedDateISO && (daysElapsed >= 5 || (isNewFriday && daysElapsed >= 3))) {
      const sessionKey = config.currentSessionId || 'default';
      if (autoRolledSessionRef.current === sessionKey) return;
      autoRolledSessionRef.current = sessionKey;
      handleStartNewCollection(true);
    }
  }, [
    hasCloudConfig,
    hasCloudPlayers,
    config.currentSessionClosed,
    config.lastClosedAt,
    config.currentSessionDate,
    config.currentSessionId,
  ]);

  // --- Record Friday Closing Snapshot ---
  const handleRequestClosing = () => {
    setIsClosingPreviewMode(true);
    setIsPreviewModalOpen(true);
  };

  const handleConfirmClosing = () => {
    const cashTotal = players.reduce(
      (acc, p) => (p.paymentMethod === 'efectivo' ? acc + (p.paidToday - (p.vuelto || 0)) : acc),
      0
    );
    const mpTotal = players.reduce(
      (acc, p) => (p.paymentMethod === 'mercadopago' ? acc + (p.paidToday - (p.vuelto || 0)) : acc),
      0
    );
    const totalCollected = cashTotal + mpTotal;
    const courtCost = config.pitchCost || 96000;
    const currentFondo = config.fondoRecaudador ?? config.fondoEmi ?? 0;
    const shortfall = Math.max(0, courtCost - totalCollected);
    const surplus = Math.max(0, totalCollected - courtCost);
    const updatedFondo = currentFondo + surplus - shortfall;

    const snapshots: PlayerMatchSnapshot[] = players.map((p) => {
      const netPaid = (p.paidToday || 0) - (p.vuelto || 0);
      const updated = calculateUpdatedBalance(p, costPerPerson);
      return {
        playerId: p.id,
        name: p.name,
        isGuest: p.isGuest,
        initialBalance: p.initialBalance,
        playedToday: p.playedToday,
        paidToday: p.paidToday,
        vuelto: p.vuelto || 0,
        netPaid,
        paymentMethod: p.paymentMethod,
        playsNextWeek: p.playsNextWeek,
        updatedBalance: updated,
      };
    });

    const todayISO = getLocalDateISO();
    const newRecord: MatchClosingRecord = {
      id: `closing-${Date.now()}`,
      sessionId: activeSessionId,
      date: config.date || new Date().toLocaleDateString('es-AR'),
      timestamp: Date.now(),
      matchTitle: config.matchTitle || 'Partido de los Viernes',
      pitchCost: config.pitchCost,
      depositPaid: config.depositPaid,
      fondoRecaudador: currentFondo,
      fondoEmi: currentFondo,
      shortfallFromFund: shortfall,
      surplusToFund: surplus,
      costPerPerson,
      playedCount,
      cashTotal,
      mpTotal,
      totalCollected,
      playersSnapshot: snapshots,
    };

    setHistory((prev) => [newRecord, ...prev]);
    saveClosingRecordToCloud(newRecord).catch(() => {});

    // Store updated Fondo as pending & mark current Friday session closed (keeps list intact until next Friday / manual reset)
    const updatedConfig: MatchConfig = {
      ...config,
      pendingFondoRecaudador: updatedFondo,
      currentSessionId: activeSessionId,
      currentSessionDate: config.currentSessionDate || todayISO,
      currentSessionClosed: true,
      lastClosedAt: Date.now(),
    };
    setConfig(updatedConfig);
    saveMatchConfigToCloud(updatedConfig).catch(() => {});

    // Keep the players list and active tab intact as requested
    showToast('💾 ¡Cierre guardado en Historial! La lista actual se mantuvo intacta.');
  };

  const handleDeleteHistoryRecord = (id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
    deleteClosingRecordFromCloud(id).catch(() => {});
    showToast('Registro eliminado del historial');
  };

  // --- Load Today Reference (From user prompt) ---
  const handleLoadTodayReference = () => {
    const parsed = parseWhatsAppList(TODAY_REFERENCE_TEXT);
    applyParsedData(parsed.title || 'Viernes 19hs', parsed.playing, parsed.senas);
    showToast('¡Lista de hoy cargada con éxito!');
  };

  // Helper to apply parsed items to players (strictly ordered, defaults playedToday & playsNextWeek to true)
  const applyParsedData = (
    title: string,
    playing: ParsedWhatsAppItem[],
    senas: ParsedWhatsAppItem[]
  ) => {
    const newTitle = title || config.matchTitle || 'Viernes 19hs';
    const todayISO = getLocalDateISO();
    const startingNewAfterClosing = Boolean(config.currentSessionClosed);
    const targetSessionId = startingNewAfterClosing
      ? `session-${Date.now()}`
      : activeSessionId;

    const { pendingFondoRecaudador, ...restConfig } = config;
    const promotedFondo =
      pendingFondoRecaudador !== undefined
        ? pendingFondoRecaudador
        : config.fondoRecaudador ?? config.fondoEmi ?? 0;

    const nextConfig: MatchConfig = {
      ...restConfig,
      matchTitle: newTitle,
      fondoRecaudador: promotedFondo,
      fondoEmi: promotedFondo,
      currentSessionId: targetSessionId,
      currentSessionDate: startingNewAfterClosing
        ? todayISO
        : config.currentSessionDate || todayISO,
      currentSessionClosed: false,
      ...(startingNewAfterClosing ? { date: todayISO } : {}),
    };
    setConfig(nextConfig);

    // Reconstruct list in exact WhatsApp pasted order
    const updatedList: Player[] = [];
    const usedIds = new Set<string>();

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s\-_]/g, '');

    const getPreservedPayment = (
      match: Player | undefined,
      normItem: string,
      playerId: string
    ) => {
      // If the previous Friday was already closed, start clean for the new Friday
      if (startingNewAfterClosing) {
        return {
          paidToday: 0,
          vuelto: 0,
          paymentMethod: match?.paymentMethod || ('mercadopago' as const),
          receiptCount: 0,
        };
      }

      // Same active Friday: preserve payments & receipts already loaded!
      const matchingReceipts = activeReceipts.filter(
        (r) => r.playerId === playerId || normalize(r.playerName) === normItem
      );
      const receiptsSum = matchingReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

      if (match) {
        const hasExistingPayment = (match.paidToday || 0) > 0 || (match.vuelto || 0) > 0;
        const paidToday = hasExistingPayment ? match.paidToday : receiptsSum;
        const receiptCount = Math.max(match.receiptCount || 0, matchingReceipts.length);
        const paymentMethod =
          hasExistingPayment
            ? match.paymentMethod
            : matchingReceipts.length > 0
            ? ('mercadopago' as const)
            : match.paymentMethod;
        return {
          paidToday,
          vuelto: match.vuelto || 0,
          paymentMethod,
          receiptCount,
        };
      }

      return {
        paidToday: receiptsSum,
        vuelto: 0,
        paymentMethod: 'mercadopago' as const,
        receiptCount: matchingReceipts.length,
      };
    };

    // 1. Process playing items (1..14) - in exact sequence, default playedToday=true & playsNextWeek=true
    playing.forEach((item, index) => {
      const normItem = normalize(item.name);
      // Try exact match first
      let match = players.find(
        (p) => !usedIds.has(p.id) && normalize(p.name) === normItem
      );
      // Fallback to substring matching
      if (!match) {
        match = players.find(
          (p) =>
            !usedIds.has(p.id) &&
            (normItem.includes(normalize(p.name)) || normalize(p.name).includes(normItem))
        );
      }

      if (match) {
        usedIds.add(match.id);
        const preserved = getPreservedPayment(match, normItem, match.id);
        updatedList.push({
          ...match,
          name: match.name,
          initialBalance: item.amount,
          playedToday: true,
          playsNextWeek: true,
          paidToday: preserved.paidToday,
          vuelto: preserved.vuelto,
          paymentMethod: preserved.paymentMethod,
          receiptCount: preserved.receiptCount,
          orderIndex: index,
        });
      } else {
        const newId = `guest-${index}-${Date.now()}`;
        usedIds.add(newId);
        const preserved = getPreservedPayment(undefined, normItem, newId);
        updatedList.push({
          id: newId,
          name: item.name,
          isGuest: true,
          initialBalance: item.amount,
          playedToday: true,
          playsNextWeek: true,
          paidToday: preserved.paidToday,
          vuelto: preserved.vuelto,
          paymentMethod: preserved.paymentMethod,
          receiptCount: preserved.receiptCount,
          orderIndex: index,
        });
      }
    });

    // 2. Process senas (not playing in this match) - in exact sequence
    senas.forEach((item, senaIndex) => {
      const normItem = normalize(item.name);
      let match = players.find(
        (p) => !usedIds.has(p.id) && normalize(p.name) === normItem
      );
      if (!match) {
        match = players.find(
          (p) =>
            !usedIds.has(p.id) &&
            (normItem.includes(normalize(p.name)) || normalize(p.name).includes(normItem))
        );
      }
      const orderIdx = playing.length + senaIndex;

      if (match) {
        usedIds.add(match.id);
        const preserved = getPreservedPayment(match, normItem, match.id);
        updatedList.push({
          ...match,
          initialBalance: item.amount,
          playedToday: false,
          playsNextWeek: false,
          paidToday: preserved.paidToday,
          vuelto: preserved.vuelto,
          paymentMethod: preserved.paymentMethod,
          receiptCount: preserved.receiptCount,
          orderIndex: orderIdx,
        });
      } else {
        const newId = `sena-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        usedIds.add(newId);
        const preserved = getPreservedPayment(undefined, normItem, newId);
        updatedList.push({
          id: newId,
          name: item.name,
          initialBalance: item.amount,
          playedToday: false,
          playsNextWeek: false,
          paidToday: preserved.paidToday,
          vuelto: preserved.vuelto,
          paymentMethod: preserved.paymentMethod,
          receiptCount: preserved.receiptCount,
          orderIndex: orderIdx,
        });
      }
    });

    // Update local state immediately for instant feedback
    setPlayers(updatedList);

    // Atomically replace in Firestore so all other devices receive the exact list instantly
    replacePlayersInCloud(updatedList, nextConfig, true)
      .then(() => {
        if (!startingNewAfterClosing && activeReceipts.length > 0) {
          showToast('¡Lista actualizada! Los comprobantes y pagos cargados hoy se conservaron.');
        } else {
          showToast('¡Lista sincronizada en tiempo real con todos los dispositivos!');
        }
      })
      .catch((err) => {
        console.error('Error sincronizando con Firestore:', err);
        showToast('Lista aplicada (error al guardar en Firestore)');
      });
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

  if (isPlayerReceiptMode) {
    return (
      <PlayerReceiptPortal
        players={players}
        config={config}
        costPerPerson={costPerPerson}
        receipts={activeReceipts}
        aliasMap={aliasMap}
        isCloudReady={isCloudReady}
        onSaveReceipt={handleSaveReceipt}
      />
    );
  }

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
        receiptCount={activeReceipts.length}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenReceiptModal={() => {
          setReceiptModalPlayerId(null);
          setIsReceiptModalOpen(true);
        }}
        onLoadTodayReference={handleLoadTodayReference}
        onResetToDefaults={handleResetToDefaults}
        onOpenAddPlayerModal={() => setIsAddPlayerModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Cloud Status subtle pill under header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 w-full flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isCloudReady ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`} />
          <span className="font-medium text-zinc-300">
            {isCloudReady ? 'Base en la nube conectada (Sincronización en vivo)' : 'Conectando con Firestore...'}
          </span>
        </div>
        <span className="hidden sm:inline text-zinc-500">
          Los cambios se sincronizan en simultáneo entre dispositivos
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
              receiptCount={activeReceipts.length}
              onOpenReceiptModal={() => {
                setReceiptModalPlayerId(null);
                setIsReceiptModalOpen(true);
              }}
              onBulkPayExact={handleBulkPayExact}
              onBulkResetPaid={handleBulkResetPaid}
              onSelectAllPlayedForNextWeek={handleSelectAllPlayedForNextWeek}
              onStartNewCollection={() => handleStartNewCollection(false)}
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
                    className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-base sm:text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
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
                <span className="w-40 text-center">Pagó / Vuelto</span>
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
                    onOpenReceiptModalForPlayer={handleOpenReceiptModalForPlayer}
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
            receipts={receipts}
            onDeleteRecord={handleDeleteHistoryRecord}
            onRecordCurrentMatch={handleRequestClosing}
          />
        )}
      </main>

      {/* Module 1 Smart Closing Bottom Bar (Visible on Finanzas tab) */}
      {activeTab === 'finanzas' && (
        <CashClosingBar
          players={players}
          config={config}
          costPerPerson={costPerPerson}
          onOpenWhatsAppPreview={() => {
            setIsClosingPreviewMode(false);
            setIsPreviewModalOpen(true);
          }}
          onRecordClosing={handleRequestClosing}
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
        onClose={() => {
          setIsPreviewModalOpen(false);
          setIsClosingPreviewMode(false);
        }}
        players={players}
        config={config}
        costPerPerson={costPerPerson}
        isClosingFlow={isClosingPreviewMode}
        onConfirmClosing={handleConfirmClosing}
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

      <MPReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        players={players}
        costPerPerson={costPerPerson}
        initialPlayerId={receiptModalPlayerId}
        receipts={activeReceipts}
        aliasMap={aliasMap}
        onSaveReceipt={handleSaveReceipt}
        onDeleteReceipt={handleDeleteReceipt}
      />
    </div>
  );
}
