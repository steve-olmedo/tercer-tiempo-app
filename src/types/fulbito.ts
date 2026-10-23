export type PaymentMethod = 'efectivo' | 'mercadopago';

export interface Player {
  id: string;
  name: string;
  isGuest?: boolean;
  initialBalance: number; // Saldo previo / seña anterior
  playedToday: boolean;   // ¿Jugó hoy?
  paidToday: number;      // ¿Cuánto pagó hoy?
  paymentMethod: PaymentMethod; // Efectivo o MercadoPago
  playsNextWeek: boolean; // ¿Juega el próximo viernes?
}

export interface MatchConfig {
  pitchCost: number;       // Costo Total de la Cancha (ej: $42.000)
  depositPaid: number;     // Seña Previa Entregada (ej: $10.000)
  matchTitle: string;      // Título / horario (ej: "Viernes 19hs - Señamos")
  pitchName: string;       // Nombre de la cancha (ej: "Fútbol 7")
  date: string;            // Fecha del partido
}

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
  costPerPerson: number;
  playedCount: number;
  cashTotal: number;
  mpTotal: number;
  totalCollected: number;
  playersSnapshot: PlayerMatchSnapshot[];
  notes?: string;
}
