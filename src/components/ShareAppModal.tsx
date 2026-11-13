import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Receipt,
  Lock,
} from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ isOpen, onClose }) => {
  const [copiedTarget, setCopiedTarget] = useState<'receipts' | 'admin' | null>(null);

  const sharedUrl = (() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      const origin = window.location.origin;
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return 'https://tercer-tiempo.ai.studio';
      }
      return origin.replace('://ais-dev-', '://ais-pre-');
    }
    return 'https://tercer-tiempo.ai.studio';
  })();
  const receiptsUrl = `${sharedUrl}/?modo=comprobante`;

  if (!isOpen) return null;

  const handleCopy = async (url: string, target: 'receipts' | 'admin') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTarget(target);
      setTimeout(() => setCopiedTarget(null), 2200);
    } catch {
      // Fallback
    }
  };

  const handleShareReceiptsWhatsApp = () => {
    const text = encodeURIComponent(
      `⚽ *El Tercer Tiempo - Comprobantes Mercado Pago*\nSi transferiste la cancha, subí la captura y elegí tu nombre acá para que se te acredite automático:\n${receiptsUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareAdminWhatsApp = () => {
    const text = encodeURIComponent(
      `⚽ *El Tercer Tiempo - Panel Organizadores*\nArmado de equipos, finanzas y cierres en tiempo real:\n${sharedUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Compartir Enlaces
              </h2>
              <p className="text-xs text-zinc-400">
                Link separado para jugadores (comprobantes) y organizadores
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
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* 1. Link SOLO Comprobantes (Para el grupo de jugadores) */}
          <div className="bg-sky-950/20 border border-sky-800/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-sky-300">
                    1. Link para Jugadores (Solo Comprobantes MP)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Muestra únicamente el formulario para subir captura y elegir su nombre. Sin pestañas de finanzas ni edición.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={receiptsUrl}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-sky-200 select-all focus:outline-none"
              />
              <button
                onClick={() => handleCopy(receiptsUrl, 'receipts')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-zinc-950 transition-colors shrink-0 flex items-center gap-1.5"
              >
                {copiedTarget === 'receipts' ? (
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

            <button
              onClick={handleShareReceiptsWhatsApp}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-[#25D366] hover:bg-[#20ba5a] text-zinc-950 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-zinc-950" />
              <span>Enviar link de Comprobantes al Grupo</span>
            </button>
          </div>

          {/* 2. Link Completo (Para Organizadores) */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-100">
                  2. Link para Organizadores (App Completa)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Acceso completo a Finanzas, Equipos, Pizarra, Historial y Configuración.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 select-all focus:outline-none"
              />
              <button
                onClick={() => handleCopy(sharedUrl, 'admin')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 transition-colors shrink-0 flex items-center gap-1.5"
              >
                {copiedTarget === 'admin' ? (
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

            <button
              onClick={handleShareAdminWhatsApp}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Compartir App Completa a Organizadores</span>
            </button>
          </div>

          {/* Security Note */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Sobre el acceso de edición</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              El enlace <strong className="text-zinc-200">?modo=comprobante</strong> oculta las pestañas de administración para evitar toques accidentales. Si más adelante querés bloquear estrictamente la edición para que solo entren organizadores autorizados con su cuenta de Google, se puede activar en segundos.
            </p>
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
