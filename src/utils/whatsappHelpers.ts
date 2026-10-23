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
    // Check if header / title
    if (line.startsWith('*') && (line.toLowerCase().includes('seña') || line.toLowerCase().includes('senas') || line.toLowerCase().includes('señas:'))) {
      inSenasSection = true;
      continue;
    }
    if (!inSenasSection && (line.startsWith('*') || line.toLowerCase().includes('viernes') || line.toLowerCase().includes('partido'))) {
      if (!title) {
        title = line.replace(/\*/g, '').trim();
      }
      continue;
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
 * Calculates updated balance for next week:
 * Saldo anterior - Costo de hoy (si jugó) + Pagó hoy
 */
export function calculateUpdatedBalance(
  player: Player,
  costPerPerson: number
): number {
  const matchDeduction = player.playedToday ? costPerPerson : 0;
  return player.initialBalance - matchDeduction + player.paidToday;
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
  // Players who checked "Juega el próximo viernes"
  const nextWeekPlayers = players.filter((p) => p.playsNextWeek);

  // Players who are NOT playing next week but have an updated balance != 0
  const nonPlayingWithBalance = players.filter((p) => {
    if (p.playsNextWeek) return false;
    const updated = calculateUpdatedBalance(p, costPerPerson);
    return updated !== 0;
  });

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
