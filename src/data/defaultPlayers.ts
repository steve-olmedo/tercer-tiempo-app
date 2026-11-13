import { Player, MatchConfig } from '../types/fulbito';

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  pitchCost: 96000,     // $96.000 costo total de la cancha (Fútbol 7)
  depositPaid: 0,
  fondoRecaudador: 0,   // Fondo Recaudador
  fondoEmi: 0,          // Retrocompatibilidad
  recaudadorName: 'Recaudador',
  matchTitle: 'Viernes 19hs',
  pitchName: 'Cancha Fútbol 7',
  date: new Date().toISOString().split('T')[0],
};

// Initial base list from Section 2 of Specification
export const INITIAL_BASE_PLAYERS: Player[] = [
  { id: '1', name: 'Javi', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 0 },
  { id: '2', name: 'Alan', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 1 },
  { id: '3', name: 'Mono', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 2 },
  { id: '4', name: 'Javi mono', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 3 },
  { id: '5', name: 'Nardi', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 4 },
  { id: '6', name: 'Capi', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 5 },
  { id: '7', name: 'Maui', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 6 },
  { id: '8', name: 'Santi L', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 7 },
  { id: '9', name: 'Marian', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 8 },
  { id: '10', name: 'Alessa', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 9 },
  { id: '11', name: 'Tío', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 10 },
  { id: '12', name: 'Balvi', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 11 },
  { id: '13', name: 'Steve', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 12 },
  { id: '14', name: 'Lori', initialBalance: 0, playedToday: true, paidToday: 0, vuelto: 0, paymentMethod: 'mercadopago', playsNextWeek: true, orderIndex: 13 },
];

// Preset based on today's reference provided by user
export const TODAY_REFERENCE_TEXT = `*Viernes 19hs*
1. Javi
2. Alan
3. Mono
4. Javi mono
5. Nardi
6. Capi
7. Maui
8. Santi L
9. Marian
10. Alessa
11. Tío
12. Balvi
13. Steve
14. Lori`;
