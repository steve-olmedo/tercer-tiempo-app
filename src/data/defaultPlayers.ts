import { Player, MatchConfig } from '../types/fulbito';

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  pitchCost: 42000,     // $42.000 costo total de la cancha (Fútbol 7)
  depositPaid: 10000,    // $10.000 seña entregada previamente a la cancha
  matchTitle: 'Viernes 19hs - Señamos',
  pitchName: 'Cancha Fútbol 7',
  date: new Date().toISOString().split('T')[0],
};

// Initial base list from Section 2 of Specification
export const INITIAL_BASE_PLAYERS: Player[] = [
  { id: '1', name: 'Javi', initialBalance: 6300, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '2', name: 'Alan', initialBalance: 0, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '3', name: 'Mono', initialBalance: 1800, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '4', name: 'Javi mono', initialBalance: 200, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '5', name: 'Nardi', initialBalance: 500, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: false },
  { id: '6', name: 'Capi', initialBalance: 1000, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '7', name: 'Maui', initialBalance: 0, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '8', name: 'Santi L', initialBalance: -6700, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '9', name: 'Marian', initialBalance: 0, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '10', name: 'Alessa', initialBalance: 600, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '11', name: 'Tío', initialBalance: 200, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '12', name: 'Balvi', initialBalance: 6300, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '13', name: 'Steve', initialBalance: 7800, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  { id: '14', name: 'Lori', initialBalance: 900, playedToday: true, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: true },
  // Remaining players (not played today by default)
  { id: '15', name: 'Gattu', initialBalance: 0, playedToday: false, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: false },
  { id: '16', name: 'Juli', initialBalance: 1800, playedToday: false, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: false },
  { id: '17', name: 'Night', initialBalance: 600, playedToday: false, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: false },
  { id: '18', name: 'Fierro', initialBalance: 1900, playedToday: false, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: false },
  { id: '19', name: 'Mati G', initialBalance: -300, playedToday: false, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: false },
  { id: '20', name: 'Marian 2', initialBalance: 3800, playedToday: false, paidToday: 0, paymentMethod: 'mercadopago', playsNextWeek: false },
];

// Preset based on today's reference provided by user
export const TODAY_REFERENCE_TEXT = `*Viernes 19hs - Señamos*
1. Javi $2400 
2. Mo
3. Mono $900 
4. Javi mono $300 
5. Gattu
6. Capi $1.000 
7. Night $600
8. Santi L $- 6.700 
9. Marian $2900 
10. Alessa $700 
11. Tío $200 
12. Balvi $6300
13. Steve $7.800 
14. Agus amigo mono

*Señas:*
Nardi $500
Fierro $1.900
Mati G -$300
Juli lora $1800`;
