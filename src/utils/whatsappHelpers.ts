import { Player, MatchConfig } from '../types/fulbito';
import { formatPesos, parsePesosInput } from './formatters';

export interface ParsedWhatsAppItem {
  name: string;
  amount: number;
  isNumbered: boolean; // if true, was in the 1..14 list
}

export function parseWhatsAppList(text: string): {
  title?: string;
  playing: ParsedWhatsAppItem[];
  senas: ParsedWhatsAppItem[];
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let title = '';
  const playing: ParsedWhatsAppItem[] = [];
  const senas: ParsedWhatsAppItem[] = [];

  let inSenasSection = false;

  for (const line of lines) {
    // Check if specifically the Señas section header (e.g., "*Señas:*", "*Señas*", "Señas:", "Senas:")
    // Must NOT match titles like "*Viernes 19hs - Señamos*"
    const isSenasHeader = /^\s*\*?\s*(?:señas?|senas?)\s*:?\s*\*?\s*$/i.test(line);
    if (isSenasHeader) {
      inSenasSection = true;
      continue;
    }

    // Match title if at start and not yet found
    if (!inSenasSection && (line.startsWith('*') || line.toLowerCase().includes('viernes') || line.toLowerCase().includes('partido') || line.toLowerCase().includes('fútbol') || line.toLowerCase().includes('futbol'))) {
      // If it has a list number (like "1. Javi"), it is a player, not the title!
      const isNumberedPlayer = /^\s*(\d+)[\.\-\)]\s*/.test(line);
      if (!isNumberedPlayer) {
        if (!title) {
          title = line.replace(/\*/g, '').trim();
        }
        continue;
      }
    }

    // Parse amount from end or within the line
    // Pattern matches: "$2400", "$ 2.400", "$-6.700", "$- 6.700", "-$300", "-300", "$1.000"
    const amountRegex = /((?:\$?\s*-\s*\$?\s*|-\s*\$?\s*|\$\s*)\d[\d\.\,]*)$/i;
    const matchAmount = line.match(amountRegex);

    let amount = 0;
    let namePart = line;

    if (matchAmount) {
      const rawAmountStr = matchAmount[1];
      const isNegative = rawAmountStr.includes('-');
      const numOnly = parsePesosInput(rawAmountStr);
      amount = isNegative ? -Math.abs(numOnly) : Math.abs(numOnly);
      namePart = line.substring(0, line.lastIndexOf(matchAmount[1])).trim();
    }

    // Remove leading numbering like "1.", "14 -", "1)"
    const numberRegex = /^\s*(\d+)[\.\-\)]\s*(.*)$/;
    const numMatch = namePart.match(numberRegex);

    let cleanName = namePart;
    let isNumbered = false;

    if (numMatch) {
      isNumbered = true;
      cleanName = numMatch[2].trim();
    }

    cleanName = cleanName.replace(/\*/g, '').trim();

    if (!cleanName) continue;

    if (inSenasSection) {
      senas.push({ name: cleanName, amount, isNumbered: false });
    } else {
      playing.push({ name: cleanName, amount, isNumbered });
    }
  }

  return { title, playing, senas };
}

/**
 * Calculates cost per player for today's match,
 * rounded to the nearest multiple of 100 pesos:
 * e.g. $96.000 / 14 = 6857.14 -> 6900
 */
export function calculateCostPerPerson(pitchCost: number, playedCount: number): number {
  const count = playedCount > 0 ? playedCount : 14;
  return Math.round((pitchCost / count) / 100) * 100;
}

/**
 * Calculates how much a player needs to put today:
 * 6900 - seña previa (saldo anterior).
 * If the player has positive deposit >= cost, they put $0.
 * If the player has debt (< 0), they must pay cost + their debt.
 * If the player didn't play today, they owe $0 for this match.
 */
export function calculateAmountDueToday(player: Player, costPerPerson: number): number {
  if (!player.playedToday) return 0;
  return Math.max(0, costPerPerson - (player.initialBalance || 0));
}

/**
 * Calculates updated balance for next week:
 * Saldo anterior - Costo de hoy (si jugó) + (Pagó hoy - Vuelto pedido)
 * Ej: Cuota $6.900, tenía seña $2.000 -> pone $4.900 -> nuevo saldo $0.
 * Ej: Cuota $6.900, pone $10.000 y pide $2.000 de vuelto (neto $8.000) -> queda $1.100 a favor.
 */
export function calculateUpdatedBalance(
  player: Player,
  costPerPerson: number
): number {
  const matchDeduction = player.playedToday ? costPerPerson : 0;
  const netPaid = (player.paidToday || 0) - (player.vuelto || 0);
  return (player.initialBalance || 0) - matchDeduction + netPaid;
}

/**
 * Generates the WhatsApp copy text according to specification:
 * *Viernes 19hs - Señamos*
 * 1. Javi $2400
 * 2. Mo
 * ...
 * *Señas:*
 * Nardi $500
 */
export function generateWhatsAppMessage(
  players: Player[],
  config: MatchConfig,
  costPerPerson: number
): string {
  // Players who checked "Juega el próximo viernes", sorted by WhatsApp pasted order
  const nextWeekPlayers = [...players]
    .filter((p) => p.playsNextWeek)
    .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999));

  // Players who are NOT playing next week but have an updated balance != 0
  const nonPlayingWithBalance = [...players]
    .filter((p) => {
      if (p.playsNextWeek) return false;
      const updated = calculateUpdatedBalance(p, costPerPerson);
      return updated !== 0;
    })
    .sort((a, b) => (a.orderIndex ?? 9999) - (b.orderIndex ?? 9999));

  const header = `*${config.matchTitle || 'Viernes 19hs - Señamos'}*`;

  const numberedList = nextWeekPlayers
    .map((p, idx) => {
      const updatedBalance = calculateUpdatedBalance(p, costPerPerson);
      if (updatedBalance === 0) {
        return `${idx + 1}. ${p.name}`;
      }
      return `${idx + 1}. ${p.name} ${formatPesos(updatedBalance)}`;
    })
    .join('\n');

  let senasSection = '';
  if (nonPlayingWithBalance.length > 0) {
    const senasLines = nonPlayingWithBalance
      .map((p) => {
        const updatedBalance = calculateUpdatedBalance(p, costPerPerson);
        return `${p.name} ${formatPesos(updatedBalance)}`;
      })
      .join('\n');

    senasSection = `\n\n*Señas:*\n${senasLines}`;
  }

  return `${header}\n${numberedList}${senasSection}`;
}

/**
 * Generates WhatsApp formations text for Module 2:
 * 🔵 Equipo Azul: [Nombres] vs 🟠 Equipo Naranja: [Nombres]
 */
export function generateTeamsText(
  blueTeam: Player[],
  orangeTeam: Player[],
  config: MatchConfig
): string {
  const blueNames = blueTeam.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
  const orangeNames = orangeTeam.map((p, i) => `${i + 1}. ${p.name}`).join('\n');

  return `⚽ *${config.matchTitle || 'PARTIDO FÚTBOL 7'}*

🔵 *Equipo Azul* (${blueTeam.length}/7):
${blueNames || '(Sin jugadores asignados)'}

vs

🟠 *Equipo Naranja* (${orangeTeam.length}/7):
${orangeNames || '(Sin jugadores asignados)'}`;
}
