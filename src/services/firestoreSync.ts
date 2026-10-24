import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Player, MatchConfig, MatchClosingRecord } from '../types/fulbito';
import { INITIAL_BASE_PLAYERS, DEFAULT_MATCH_CONFIG } from '../data/defaultPlayers';

const CONFIG_DOC_PATH = 'config/current';
const PLAYERS_COLL_PATH = 'players';
const HISTORY_COLL_PATH = 'history';

/**
 * Initializes and seeds Firestore with base data if empty.
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  try {
    const playersSnap = await getDocs(collection(db, PLAYERS_COLL_PATH));
    if (playersSnap.empty) {
      console.log('Seeding initial players to Firestore...');
      const batch = writeBatch(db);

      // Seed config
      const configRef = doc(db, 'config', 'current');
      batch.set(configRef, DEFAULT_MATCH_CONFIG);

      // Seed players
      INITIAL_BASE_PLAYERS.forEach((player) => {
        const playerRef = doc(db, PLAYERS_COLL_PATH, player.id);
        batch.set(playerRef, player);
      });

      await batch.commit();
      return true;
    }
    return false;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, 'seeding');
    } catch (e) {
      console.warn('Seeding note:', e);
    }
    return false;
  }
}

/**
 * Subscribes to real-time updates for match configuration.
 */
export function subscribeToMatchConfig(
  onUpdate: (config: MatchConfig) => void
): () => void {
  return onSnapshot(
    doc(db, 'config', 'current'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as MatchConfig);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, CONFIG_DOC_PATH);
      } catch (e) {
        console.error('MatchConfig subscription error:', e);
      }
    }
  );
}

/**
 * Subscribes to real-time updates for players.
 */
export function subscribeToPlayers(
  onUpdate: (players: Player[]) => void
): () => void {
  return onSnapshot(
    collection(db, PLAYERS_COLL_PATH),
    (snapshot) => {
      const list: Player[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Player);
      });
      // Sort by orderIndex first so pasted WhatsApp sequence is preserved across all devices
      list.sort((a, b) => {
        const ordA = a.orderIndex !== undefined ? a.orderIndex : 9999;
        const ordB = b.orderIndex !== undefined ? b.orderIndex : 9999;
        if (ordA !== ordB) return ordA - ordB;
        const numA = Number(a.id);
        const numB = Number(b.id);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.name.localeCompare(b.name);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, PLAYERS_COLL_PATH);
      } catch (e) {
        console.error('Players subscription error:', e);
      }
    }
  );
}

/**
 * Subscribes to real-time updates for history records.
 */
export function subscribeToHistory(
  onUpdate: (records: MatchClosingRecord[]) => void
): () => void {
  return onSnapshot(
    collection(db, HISTORY_COLL_PATH),
    (snapshot) => {
      const list: MatchClosingRecord[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as MatchClosingRecord);
      });
      // Sort by timestamp desc
      list.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, HISTORY_COLL_PATH);
      } catch (e) {
        console.error('History subscription error:', e);
      }
    }
  );
}

/**
 * Saves current match config to Firestore.
 */
export async function saveMatchConfigToCloud(config: MatchConfig): Promise<void> {
  try {
    await setDoc(doc(db, 'config', 'current'), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CONFIG_DOC_PATH);
  }
}

/**
 * Saves or updates a single player in Firestore.
 */
export async function savePlayerToCloud(player: Player): Promise<void> {
  try {
    const { id, ...data } = player;
    await setDoc(doc(db, PLAYERS_COLL_PATH, id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PLAYERS_COLL_PATH}/${player.id}`);
  }
}

/**
 * Saves all players in batch to Firestore.
 */
export async function saveAllPlayersToCloud(players: Player[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    players.forEach((player) => {
      const { id, ...data } = player;
      const ref = doc(db, PLAYERS_COLL_PATH, id);
      batch.set(ref, data, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PLAYERS_COLL_PATH);
  }
}

/**
 * Atomically replaces the active players list in Firestore with the newly imported WhatsApp list,
 * deleting any players no longer present, updating all players in exact order,
 * and optionally updating match configuration in a single batch.
 */
export async function replacePlayersInCloud(
  updatedPlayers: Player[],
  newConfig?: Partial<MatchConfig>
): Promise<void> {
  try {
    const playersSnap = await getDocs(collection(db, PLAYERS_COLL_PATH));
    const newIds = new Set(updatedPlayers.map((p) => p.id));
    const batch = writeBatch(db);

    // 1. Delete all existing player documents not in the new list
    playersSnap.forEach((docSnap) => {
      if (!newIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
      }
    });

    // 2. Set all players in the new list
    updatedPlayers.forEach((player) => {
      const { id, ...data } = player;
      const ref = doc(db, PLAYERS_COLL_PATH, id);
      batch.set(ref, data);
    });

    // 3. Update match config if provided
    if (newConfig) {
      const configRef = doc(db, 'config', 'current');
      batch.set(configRef, newConfig, { merge: true });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PLAYERS_COLL_PATH);
    throw error;
  }
}

/**
 * Deletes a player from Firestore.
 */
export async function deletePlayerFromCloud(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PLAYERS_COLL_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PLAYERS_COLL_PATH}/${id}`);
  }
}

/**
 * Saves a weekly match closing record to Firestore.
 */
export async function saveClosingRecordToCloud(record: MatchClosingRecord): Promise<void> {
  try {
    await setDoc(doc(db, HISTORY_COLL_PATH, record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${HISTORY_COLL_PATH}/${record.id}`);
  }
}

/**
 * Deletes a match closing record from Firestore.
 */
export async function deleteClosingRecordFromCloud(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, HISTORY_COLL_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${HISTORY_COLL_PATH}/${id}`);
  }
}

const TEAMS_DOC_PATH = 'teams/current';

/**
 * Subscribes to real-time collaborative team formation updates.
 */
export function subscribeToTeams(
  onUpdate: (teams: { blueTeamIds: string[]; orangeTeamIds: string[] }) => void
): () => void {
  return onSnapshot(
    doc(db, 'teams', 'current'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          blueTeamIds: Array.isArray(data.blueTeamIds) ? data.blueTeamIds : [],
          orangeTeamIds: Array.isArray(data.orangeTeamIds) ? data.orangeTeamIds : [],
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, TEAMS_DOC_PATH);
      } catch (e) {
        console.error('Teams subscription error:', e);
      }
    }
  );
}

/**
 * Saves team formations in real-time to Firestore for multi-device collaboration.
 */
export async function saveTeamsToCloud(teams: {
  blueTeamIds: string[];
  orangeTeamIds: string[];
}): Promise<void> {
  try {
    await setDoc(doc(db, 'teams', 'current'), {
      blueTeamIds: teams.blueTeamIds,
      orangeTeamIds: teams.orangeTeamIds,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, TEAMS_DOC_PATH);
  }
}

