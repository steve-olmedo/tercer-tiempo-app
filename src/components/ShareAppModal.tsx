import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, Globe, Smartphone, ShieldCheck } from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  // The shared preview URL provided in the environment
  const sharedUrl = 'https://ais-pre-qfw46vgcj5lb44jqh7z6fi-45091760941.us-east5.run.app';

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `⚽ *El Tercer Tiempo - Gestión de Fulbito*\nEntrá a ver los saldos, arqueo y formaciones del partido acá:\n${sharedUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Compartir con el Equipo
              </h2>
              <p className="text-xs text-zinc-400">
                Link público accesible para todos los jugadores
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
        <div className="p-4 sm:p-5 space-y-4">
          {/* Link Container */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Enlace de la Aplicación (Compartido)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 transition-colors shrink-0 flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action: Share on WhatsApp directly */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#25D366] hover:bg-[#20ba5a] text-zinc-950 flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Smartphone className="w-4 h-4 text-zinc-950" />
            <span>Compartir por WhatsApp al Grupo</span>
          </button>

          {/* Hosting Information Info Card */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>¿Dónde está hosteada la app?</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              La aplicación corre en la nube de <strong className="text-zinc-200">Google Cloud Run (us-east5)</strong> con conexión HTTPS segura y permanente, optimizada para celulares y computadoras. No requiere que nadie instale nada en su teléfono.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Siempre online y accesible desde cualquier navegador</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end bg-zinc-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
