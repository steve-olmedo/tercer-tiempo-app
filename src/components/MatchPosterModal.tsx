import React, { useEffect, useRef, useState } from 'react';
import { Player, MatchConfig } from '../types/fulbito';
import { X, Download, Copy, Check, Sparkles } from 'lucide-react';

interface MatchPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueTeam: Player[];
  orangeTeam: Player[];
  config: MatchConfig;
}

export const MatchPosterModal: React.FC<MatchPosterModalProps> = ({
  isOpen,
  onClose,
  blueTeam,
  orangeTeam,
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions: 1080 x 1920 (Instagram Story / WhatsApp vertical)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#09090b');
    bgGrad.addColorStop(0.5, '#0c0f17');
    bgGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle pitch center circle & lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 280, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Top Header Banner
    ctx.textAlign = 'center';

    // Badge "FÚTBOL 7"
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 120, 100, 240, 48, 24);
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('FÚTBOL 7 • LA PREVIA', W / 2, 132);

    // App Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 68px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('EL TERCER TIEMPO', W / 2, 220);

    // Subtitle / Date
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(config.matchTitle || 'Viernes 19:00 hs', W / 2, 275);

    // Teams Container Box
    const boxY = 350;
    const boxH = 1380;
    const colW = 460;
    const colLeftX = 60;
    const colRightX = W - colW - 60;

    // --- BLUE TEAM COLUMN ---
    // Column Header Box
    const blueGrad = ctx.createLinearGradient(colLeftX, boxY, colLeftX + colW, boxY + 80);
    blueGrad.addColorStop(0, '#1e3a8a');
    blueGrad.addColorStop(1, '#2563eb');
    ctx.fillStyle = blueGrad;
    ctx.beginPath();
    ctx.roundRect(colLeftX, boxY, colW, 90, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EQUIPO AZUL', colLeftX + colW / 2, boxY + 58);

    const roles = ['ARQ', 'DEF', 'DEF', 'DEF', 'MED', 'DEL', 'DEL'];

    // Blue Team Players (Up to 7 slots)
    ctx.textAlign = 'left';
    for (let i = 0; i < 7; i++) {
      const player = blueTeam[i];
      const slotY = boxY + 120 + i * 165;

      // Card Background
      ctx.fillStyle = player ? '#111827' : '#0f172a33';
      ctx.beginPath();
      ctx.roundRect(colLeftX, slotY, colW, 140, 16);
      ctx.fill();
      ctx.strokeStyle = player ? '#1e40af88' : '#1e293b44';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Number badge
      ctx.fillStyle = player ? '#1d4ed8' : '#334155';
      ctx.beginPath();
      ctx.roundRect(colLeftX + 24, slotY + 28, 68, 84, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 32px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, colLeftX + 58, slotY + 68);

      // Role tag inside number box
      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(roles[i], colLeftX + 58, slotY + 98);

      // Player Name
      ctx.textAlign = 'left';
      ctx.fillStyle = player ? '#f8fafc' : '#475569';
      ctx.font = player ? 'bold 34px "Plus Jakarta Sans", sans-serif' : 'italic 28px "Plus Jakarta Sans", sans-serif';
      const displayName = player ? player.name : '(Vacante)';
      ctx.fillText(displayName, colLeftX + 115, slotY + 80);
    }

    // --- VS BADGE in center ---
    const vsY = boxY + 580;
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(W / 2, vsY, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VS', W / 2, vsY + 11);

    // --- ORANGE TEAM COLUMN ---
    // Column Header Box
    const orangeGrad = ctx.createLinearGradient(colRightX, boxY, colRightX + colW, boxY + 80);
    orangeGrad.addColorStop(0, '#9a3412');
    orangeGrad.addColorStop(1, '#ea580c');
    ctx.fillStyle = orangeGrad;
    ctx.beginPath();
    ctx.roundRect(colRightX, boxY, colW, 90, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EQUIPO NARANJA', colRightX + colW / 2, boxY + 58);

    // Orange Team Players (Up to 7 slots)
    ctx.textAlign = 'left';
    for (let i = 0; i < 7; i++) {
      const player = orangeTeam[i];
      const slotY = boxY + 120 + i * 165;

      // Card Background
      ctx.fillStyle = player ? '#1c1917' : '#1c191733';
      ctx.beginPath();
      ctx.roundRect(colRightX, slotY, colW, 140, 16);
      ctx.fill();
      ctx.strokeStyle = player ? '#c2410c88' : '#29252444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Number badge
      ctx.fillStyle = player ? '#c2410c' : '#44403c';
      ctx.beginPath();
      ctx.roundRect(colRightX + 24, slotY + 28, 68, 84, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 32px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, colRightX + 58, slotY + 68);

      // Role tag inside number box
      ctx.fillStyle = '#fdba74';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(roles[i], colRightX + 58, slotY + 98);

      // Player Name
      ctx.textAlign = 'left';
      ctx.fillStyle = player ? '#f8fafc' : '#78716c';
      ctx.font = player ? 'bold 34px "Plus Jakarta Sans", sans-serif' : 'italic 28px "Plus Jakarta Sans", sans-serif';
      const displayName = player ? player.name : '(Vacante)';
      ctx.fillText(displayName, colRightX + 115, slotY + 80);
    }

    // Bottom Watermark / Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#52525b';
    ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Organizado con El Tercer Tiempo App', W / 2, 1850);

    // Update download URL
    try {
      const url = canvas.toDataURL('image/png');
      setDownloadUrl(url);
    } catch {
      // Ignored
    }
  }, [isOpen, blueTeam, orangeTeam, config]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `el-tercer-tiempo-formaciones-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2200);
      });
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Imagen para WhatsApp / Redes (9:16)
              </h2>
              <p className="text-xs text-zinc-400">
                Diseño vertical optimizado para celular y estados
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

        {/* Canvas Visual Preview */}
        <div className="p-4 overflow-y-auto flex-1 flex justify-center items-center bg-zinc-950">
          <div className="relative border border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-w-[280px] sm:max-w-[320px]">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
              style={{ maxHeight: '60vh' }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900">
          <button
            onClick={handleCopyImage}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            {copiedImage ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>¡Imagen copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Imagen</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
