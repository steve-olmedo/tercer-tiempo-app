import React from 'react';
import { 
  Users, 
  DollarSign, 
  ClipboardPaste, 
  RotateCcw, 
  Sparkles,
  ShieldAlert,
  Calendar,
  CheckCircle2
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
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-sm">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  El Tercer Tiempo
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60 uppercase tracking-wider">
                  Fútbol 7
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Organización financiera, arqueo de caja y armado de equipos
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('finanzas')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'finanzas'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Finanzas</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                playedCount === 14 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {playedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('equipos')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'equipos'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Equipos</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                nextWeekCount === 14 
                  ? 'bg-emerald-500/20 text-emerald-300' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {nextWeekCount}/14
              </span>
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'historial'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Historial</span>
              {historyCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-400">
                  {historyCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenShareModal}
              title="Compartir link público con el equipo"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Compartir</span>
            </button>

            <button
              onClick={onLoadTodayReference}
              title="Cargar la lista de referencia con los saldos enviados hoy"
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition-colors"
            >
              <span>Lista de hoy</span>
            </button>

            <button
              onClick={onOpenImportModal}
              title="Pegar texto de WhatsApp"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">Pegar WA</span>
            </button>

            <button
              onClick={onOpenAddPlayerModal}
              title="Sumar jugador o invitado"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-white transition-colors"
            >
              <span className="font-bold text-sm leading-none">+</span>
              <span className="hidden sm:inline">Invitado</span>
            </button>

            <button
              onClick={onResetToDefaults}
              title="Restablecer valores por defecto"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-transparent hover:border-zinc-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
