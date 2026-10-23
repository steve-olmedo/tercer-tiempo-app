import React from 'react';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Share2, 
  ClipboardPaste, 
  RotateCcw, 
  Sparkles,
  UserPlus
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'finanzas' | 'equipos' | 'historial';
  setActiveTab: (tab: 'finanzas' | 'equipos' | 'historial') => void;
  playedCount: number;
  nextWeekCount: number;
  historyCount: number;
  onOpenImportModal: () => void;
  onLoadTodayReference: () => void;
  onResetToDefaults: () => void;
  onOpenAddPlayerModal: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  playedCount,
  nextWeekCount,
  historyCount,
  onOpenImportModal,
  onLoadTodayReference,
  onResetToDefaults,
  onOpenAddPlayerModal,
  onOpenShareModal,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ROW 1: Pelota y Tercer Tiempo (Top Line) */}
        <div className="flex items-center justify-between h-14 border-b border-zinc-800/60 gap-2">
          {/* Brand: Pelota + Tercer Tiempo */}
          <div className="flex items-center gap-2.5">
            <span className="text-xl leading-none select-none" role="img" aria-label="pelota">
              ⚽
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                Tercer Tiempo
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 tracking-wider">
                F7
              </span>
            </div>
          </div>

          {/* Quick Utility Actions in Top Row */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenShareModal}
              title="Compartir enlace con el grupo"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-300" />
              <span>Compartir</span>
            </button>

            <button
              onClick={onOpenAddPlayerModal}
              title="Sumar jugador o invitado"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-green-700 hover:bg-green-600 text-white transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">+ Invitado</span>
            </button>

            <button
              onClick={onResetToDefaults}
              title="Restablecer valores"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ROW 2: Tabs (Finanzas, Equipos, Historial) y demás opciones abajo */}
        <div className="flex items-center justify-between py-2 overflow-x-auto no-scrollbar gap-2">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80 shrink-0">
            <button
              onClick={() => setActiveTab('finanzas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'finanzas'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-green-500" />
              <span>Finanzas</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-950 text-zinc-400 ml-0.5">
                {playedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('equipos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'equipos'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Equipos</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-950 text-zinc-400 ml-0.5">
                {nextWeekCount}/14
              </span>
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'historial'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Historial</span>
              {historyCount > 0 && (
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-950 text-zinc-400 ml-0.5">
                  {historyCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick auxiliary options (Pegar WA & Lista de hoy) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenImportModal}
              title="Pegar lista de WhatsApp"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Pegar WhatsApp</span>
              <span className="sm:hidden">Pegar</span>
            </button>

            <button
              onClick={onLoadTodayReference}
              title="Cargar la lista y saldos de referencia de hoy"
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-zinc-500" />
              <span>Lista de hoy</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
