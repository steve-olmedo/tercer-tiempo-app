export type PaymentMethod = 'efectivo' | 'mercadopago';

export interface Player {
  id: string;
  name: string;
  isGuest?: boolean;
  initialBalance: number; // Saldo previo / seña anterior
  playedToday: boolean;   // ¿Jugó hoy? (Default true en import)
  paidToday: number;      // ¿Cuánto pagó hoy?
  vuelto?: number;        // Vuelto solicitado / pedido (ej: paga $10.000 con $2.000 vuelto -> neto $8.000)
  paymentMethod: PaymentMethod; // Efectivo o MercadoPago
  playsNextWeek: boolean; // ¿Juega el próximo viernes?
  orderIndex?: number;    // Posición exacta en la lista del mensaje de WhatsApp
}

export interface MatchConfig {
  pitchCost: number;       // Costo Total de la Cancha (ej: $96.000)
  depositPaid: number;     // Seña previa cancha (fija en complejo, ej: $10.000)
  fondoRecaudador?: number;// Fondo Recaudador (monto en custodia del recaudador)
  fondoEmi?: number;       // Retrocompatibilidad con datos anteriores
  recaudadorName?: string; // Nombre del recaudador (opcional, ej: "Emi" o "Recaudador")
  matchTitle: string;      // Título / encabezado
  pitchName: string;       // Nombre de la cancha (ej: "Fútbol 7")
  date: string;            // Fecha del partido
}

export type TacticalRole = 'ARQ' | 'DEF_IZQ' | 'DEF_CEN' | 'DEF_DER' | 'MED' | 'DEL_IZQ' | 'DEL_DER';

export interface TacticalSlot {
  index: number; // 0 to 6
  role: TacticalRole;
  label: string;
  shortLabel: string;
  x: number; // % 0-100
  y: number; // % 0-100
}

export const F7_POSITIONS: TacticalSlot[] = [
  { index: 0, role: 'ARQ', label: 'Arquero', shortLabel: 'ARQ', x: 50, y: 88 },
  { index: 1, role: 'DEF_IZQ', label: 'Defensor Izq', shortLabel: 'DEF', x: 20, y: 68 },
  { index: 2, role: 'DEF_CEN', label: 'Defensor Central', shortLabel: 'DEF', x: 50, y: 70 },
  { index: 3, role: 'DEF_DER', label: 'Defensor Der', shortLabel: 'DEF', x: 80, y: 68 },
  { index: 4, role: 'MED', label: 'Mediocampista', shortLabel: 'MED', x: 50, y: 46 },
  { index: 5, role: 'DEL_IZQ', label: 'Delantero Izq', shortLabel: 'DEL', x: 30, y: 22 },
  { index: 6, role: 'DEL_DER', label: 'Delantero Der', shortLabel: 'DEL', x: 70, y: 22 },
];

export interface TeamAssignment {
  blueTeam: string[];      // Player IDs (máx 7)
  orangeTeam: string[];    // Player IDs (máx 7)
}

export interface PlayerMatchSnapshot {
  playerId: string;
  name: string;
  isGuest?: boolean;
  initialBalance: number;
  playedToday: boolean;
  paidToday: number;
  vuelto?: number;
  netPaid?: number;
  paymentMethod: PaymentMethod;
  playsNextWeek: boolean;
  updatedBalance: number;
}

export interface MatchClosingRecord {
  id: string;
  date: string;
  timestamp: number;
  matchTitle: string;
  pitchCost: number;
  depositPaid: number;
  fondoRecaudador?: number;
  fondoEmi?: number;
  shortfallFromFund?: number; // Cuánto se sacó del Fondo Recaudador para pagar la cancha
  surplusToFund?: number;     // Cuánto sobró y fue al Fondo Recaudador
  costPerPerson: number;
  playedCount: number;
  cashTotal: number;
  mpTotal: number;
  totalCollected: number;
  playersSnapshot: PlayerMatchSnapshot[];
  notes?: string;
}
