import React, { useState } from 'react';
import { Player, MatchConfig } from '../types/fulbito';
import { generateWhatsAppMessage } from '../utils/whatsappHelpers';
import { X, Copy, Check, MessageSquare, Save } from 'lucide-react';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  config: MatchConfig;
  costPerPerson: number;
  isClosingFlow?: boolean;
  onConfirmClosing?: () => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  players,
  config,
  costPerPerson,
  isClosingFlow = false,
  onConfirmClosing,
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

  const handleCopyAndConfirm = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
    } catch {
      // Ignore clipboard error if blocked
    }
    if (onConfirmClosing) {
      onConfirmClosing();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isClosingFlow
                  ? 'Antes de cerrar: Copiá para WhatsApp'
                  : 'Lista para WhatsApp'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isClosingFlow
                  ? 'Copiá el mensaje con los saldos actualizados; la lista actual se mantendrá intacta'
                  : 'Texto plano listo para pegar en el grupo'}
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
        <div className="p-4 sm:p-5 bg-zinc-950/70 overflow-y-auto flex-1 space-y-3">
          {isClosingFlow && (
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200 leading-relaxed">
              Al confirmar el cierre se guarda la foto financiera en el <strong>Historial</strong> y <strong>tu lista de Finanzas queda tal como está</strong> (no se borra).
            </div>
          )}
          <div className="bg-[#121b22] border border-zinc-800/80 rounded-2xl p-4 shadow-inner">
            <pre className="text-xs sm:text-sm font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed select-all">
              {messageText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-900">
          <span className="text-xs text-zinc-500 font-mono">
            {messageText.split('\n').length} líneas
          </span>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {isClosingFlow ? 'Cancelar' : 'Cerrar'}
            </button>
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isClosingFlow
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md'
              }`}
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
            {isClosingFlow && onConfirmClosing && (
              <button
                onClick={handleCopyAndConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Copiar y Guardar Cierre</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
