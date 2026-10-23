import React, { useState } from 'react';
import { Player, MatchConfig } from '../types/fulbito';
import { generateWhatsAppMessage } from '../utils/whatsappHelpers';
import { X, Copy, Check, MessageSquare } from 'lucide-react';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  config: MatchConfig;
  costPerPerson: number;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  players,
  config,
  costPerPerson,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const messageText = generateWhatsAppMessage(players, config, costPerPerson);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Lista para WhatsApp
              </h2>
              <p className="text-xs text-zinc-400">
                Texto plano listo para pegar en el grupo
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

        {/* Content - WhatsApp bubble preview */}
        <div className="p-4 sm:p-5 bg-zinc-950/70">
          <div className="bg-[#121b22] border border-zinc-800/80 rounded-2xl p-4 shadow-inner">
            <pre className="text-xs sm:text-sm font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed select-all">
              {messageText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 flex items-center justify-between bg-zinc-900">
          <span className="text-xs text-zinc-500 font-mono">
            {messageText.split('\n').length} líneas
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Mensaje</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
