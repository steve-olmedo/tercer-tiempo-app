import React, { useState } from 'react';
import { parseWhatsAppList, ParsedWhatsAppItem } from '../utils/whatsappHelpers';
import { formatPesos } from '../utils/formatters';
import { TODAY_REFERENCE_TEXT } from '../data/defaultPlayers';
import { X, Sparkles, Check, AlertCircle, FileText } from 'lucide-react';

interface WhatsAppImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    title: string,
    playing: ParsedWhatsAppItem[],
    senas: ParsedWhatsAppItem[]
  ) => void;
}

export const WhatsAppImportModal: React.FC<WhatsAppImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [rawText, setRawText] = useState(TODAY_REFERENCE_TEXT);

  if (!isOpen) return null;

  const parsed = parseWhatsAppList(rawText);

  const handleApply = () => {
    onImport(parsed.title || 'Viernes 19hs - Señamos', parsed.playing, parsed.senas);
    onClose();
  };

  const handleLoadSample = () => {
    setRawText(TODAY_REFERENCE_TEXT);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Pegar lista de WhatsApp
              </h2>
              <p className="text-xs text-zinc-400">
                Pega el mensaje del grupo semanal para actualizar asistencia y saldos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Texto copiado de WhatsApp
            </label>
            <button
              onClick={handleLoadSample}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar ejemplo enviado hoy
            </button>
          </div>

          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Pega aquí el mensaje con la lista numerada y las señas..."
            className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-base sm:text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70"
          />

          {/* Real-time Parser Results Preview */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Elementos detectados en tiempo real
              </span>
              <span className="text-zinc-500 font-mono">
                {parsed.playing.length} en lista + {parsed.senas.length} señas
              </span>
            </div>

            {parsed.title && (
              <div className="text-xs text-zinc-400">
                <span className="text-zinc-500">Encabezado:</span>{' '}
                <span className="text-zinc-200 font-semibold">{parsed.title}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Playing list detected */}
              <div className="border border-zinc-800/70 rounded-lg p-2.5 bg-zinc-900/50">
                <span className="text-[11px] font-semibold text-emerald-400 block mb-1.5 uppercase tracking-wider">
                  Jugadores convocados ({parsed.playing.length})
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  {parsed.playing.length === 0 ? (
                    <span className="text-zinc-600 italic">Ninguno detectado</span>
                  ) : (
                    parsed.playing.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-0.5 border-b border-zinc-800/40"
                      >
                        <span className="text-zinc-300 truncate">
                          {idx + 1}. {item.name}
                        </span>
                        <span
                          className={`font-semibold ml-2 ${
                            item.amount > 0
                              ? 'text-emerald-400'
                              : item.amount < 0
                              ? 'text-rose-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          {formatPesos(item.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Señas detected */}
              <div className="border border-zinc-800/70 rounded-lg p-2.5 bg-zinc-900/50">
                <span className="text-[11px] font-semibold text-amber-400 block mb-1.5 uppercase tracking-wider">
                  Señas fuera de lista ({parsed.senas.length})
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  {parsed.senas.length === 0 ? (
                    <span className="text-zinc-600 italic">Ninguna detectada</span>
                  ) : (
                    parsed.senas.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-0.5 border-b border-zinc-800/40"
                      >
                        <span className="text-zinc-300 truncate">{item.name}</span>
                        <span
                          className={`font-semibold ml-2 ${
                            item.amount > 0
                              ? 'text-emerald-400'
                              : item.amount < 0
                              ? 'text-rose-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          {formatPesos(item.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={parsed.playing.length === 0 && parsed.senas.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-zinc-950 transition-all shadow-md"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Aplicar a la Lista</span>
          </button>
        </div>
      </div>
    </div>
  );
};
