import React, { useState, useRef, useEffect } from 'react';
import { Player, MatchConfig, MPReceipt } from '../types/fulbito';
import { formatPesos } from '../utils/formatters';
import {
  Upload,
  Camera,
  Smartphone,
  Check,
  Search,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  User,
  ZoomIn,
  X,
} from 'lucide-react';

interface PlayerReceiptPortalProps {
  players: Player[];
  config: MatchConfig;
  costPerPerson: number;
  receipts: MPReceipt[];
  aliasMap: Record<string, string>;
  isCloudReady: boolean;
  onSaveReceipt: (
    receipt: MPReceipt,
    autoCredit: boolean,
    saveAlias?: { senderName: string; playerId: string }
  ) => void;
}

export const PlayerReceiptPortal: React.FC<PlayerReceiptPortalProps> = ({
  players,
  config,
  costPerPerson,
  receipts,
  aliasMap,
  isCloudReady,
  onSaveReceipt,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(costPerPerson || 6900);
  const [senderName, setSenderName] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rememberAlias, setRememberAlias] = useState<boolean>(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<MPReceipt | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<MPReceipt | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const cleanStr = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  useEffect(() => {
    if (costPerPerson > 0 && (amount === 0 || amount === 6900)) {
      setAmount(costPerPerson);
    }
  }, [costPerPerson]);

  useEffect(() => {
    if (senderName.trim()) {
      const cleaned = cleanStr(senderName);
      if (aliasMap[cleaned]) {
        setSelectedPlayerId(aliasMap[cleaned]);
      }
    }
  }, [senderName, aliasMap]);

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayerId(player.id);
    const due = Math.max(0, costPerPerson - (player.initialBalance || 0) - (player.paidToday || 0));
    if (due > 0) {
      setAmount(due);
    } else {
      setAmount(costPerPerson);
    }
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          setPreviewImage(compressed);
        }
        setIsProcessingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return;
    const player = players.find((p) => p.id === selectedPlayerId);
    if (!player) return;

    const newReceipt: MPReceipt = {
      id: `rcp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      playerId: selectedPlayerId,
      playerName: player.name,
      amount: Number(amount) || costPerPerson,
      senderName: senderName.trim() || undefined,
      imageUrl: previewImage || undefined,
      timestamp: Date.now(),
    };

    const aliasToSave =
      rememberAlias && senderName.trim()
        ? { senderName: cleanStr(senderName), playerId: selectedPlayerId }
        : undefined;

    onSaveReceipt(newReceipt, true, aliasToSave);
    setSubmittedReceipt(newReceipt);
    setPreviewImage(null);
    setSenderName('');
    setSelectedPlayerId('');
  };

  const playedPlayers = players.filter((p) => p.playedToday);
  const filteredPlayers = (playedPlayers.length > 0 ? playedPlayers : players).filter((p) => {
    if (!searchQuery) return true;
    return cleanStr(p.name).includes(cleanStr(searchQuery));
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Compact Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl leading-none select-none" role="img" aria-label="pelota">
              ⚽
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black tracking-tight text-white uppercase">
                Tercer Tiempo
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Comprobantes MP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudReady ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="hidden xs:inline">{isCloudReady ? 'En línea' : 'Conectando...'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto w-full px-4 py-5 space-y-5 flex-1">
        {/* Match Summary Banner */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-zinc-400 block">
              {config.matchTitle || 'Partido de los Viernes'}
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              Cuota: {formatPesos(costPerPerson)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-zinc-400 block">Comprobantes hoy</span>
            <span className="text-base font-bold font-mono text-sky-400">
              {receipts.length} subidos
            </span>
          </div>
        </div>

        {/* Success Confirmation Card */}
        {submittedReceipt && (
          <div className="bg-emerald-950/40 border border-emerald-700/60 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-emerald-300">
                  ¡Comprobante acreditado!
                </h2>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Se sumaron{' '}
                  <strong className="font-mono text-white">
                    {formatPesos(submittedReceipt.amount)}
                  </strong>{' '}
                  a <strong className="text-white">{submittedReceipt.playerName}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmittedReceipt(null)}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Subir otro comprobante
            </button>
          </div>
        )}

        {/* Upload Form */}
        {!submittedReceipt && (
          <form
            onSubmit={handleConfirmUpload}
            className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white">
                  Subí tu comprobante de Mercado Pago
                </h1>
                <p className="text-xs text-zinc-400">
                  Adjuntá la captura, elegí tu nombre de la lista y listo
                </p>
              </div>
            </div>

            {/* 1. Image Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>1. Captura o Foto del comprobante</span>
                {previewImage && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Quitar imagen
                  </button>
                )}
              </label>

              {previewImage ? (
                <div className="relative rounded-xl border border-zinc-700 overflow-hidden bg-zinc-950/80 p-2.5 flex items-center gap-3">
                  <img
                    src={previewImage}
                    alt="Comprobante Mercado Pago"
                    className="w-20 h-24 object-cover rounded-lg border border-zinc-800"
                  />
                  <div className="flex-1 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Captura cargada</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Lista para enviar al organizador.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-sky-400 hover:underline inline-block mt-1"
                    >
                      Cambiar imagen
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-sky-500/50 bg-zinc-950/60 rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                      Tocá para subir la captura de Mercado Pago
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Opcional: podés elegir de tu galería o sacar foto
                    </p>
                  </div>
                  <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Galería</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Cámara</span>
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* 2. Player Selector */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>2. ¿Quién sos en la lista?</span>
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {filteredPlayers.length} jugadores
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscá tu nombre o apodo..."
                  className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {filteredPlayers.map((p) => {
                  const isSelected = p.id === selectedPlayerId;
                  const netPaid = (p.paidToday || 0) - (p.vuelto || 0);
                  const due = Math.max(0, costPerPerson - (p.initialBalance || 0) - netPaid);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlayer(p)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500/70 shadow-sm'
                          : 'bg-zinc-950/70 hover:bg-zinc-900 border-zinc-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            isSelected
                              ? 'bg-sky-500 text-white'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : p.orderIndex !== undefined ? (
                            p.orderIndex + 1
                          ) : (
                            '•'
                          )}
                        </div>
                        <div>
                          <span
                            className={`text-sm font-semibold block ${
                              isSelected ? 'text-sky-300' : 'text-zinc-200'
                            }`}
                          >
                            {p.name}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {netPaid > 0 ? (
                              <span className="text-emerald-400">
                                Ya acreditado: {formatPesos(netPaid)}
                              </span>
                            ) : (
                              <span>Falta pagar: {formatPesos(due)}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 px-2 py-0.5 rounded bg-sky-500/20">
                          Elegido
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Amount & Titular */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>3. Monto transferido</span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Cuota: {formatPesos(costPerPerson)}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-base font-mono font-bold text-zinc-100 focus:outline-none focus:border-sky-500"
                  placeholder="6900"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAmount(costPerPerson)}
                  className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sky-400 border border-sky-500/20"
                >
                  Cuota: {formatPesos(costPerPerson)}
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(7000)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                >
                  $7.000
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(costPerPerson * 2)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                >
                  x2: {formatPesos(costPerPerson * 2)}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Nombre del Titular en MP (Opcional)</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Si transferís desde otra cuenta, anotá el titular..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-base sm:text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500"
              />
              {senderName.trim() && (
                <label className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={rememberAlias}
                    onChange={(e) => setRememberAlias(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 accent-sky-500"
                  />
                  <span>Recordar titular para próximos partidos</span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedPlayerId || amount <= 0 || isProcessingImage}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Enviar Comprobante ({formatPesos(amount)})</span>
            </button>
          </form>
        )}

        {/* Read-only list of uploaded receipts today */}
        <section className="space-y-2.5 pb-8">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Comprobantes enviados hoy ({receipts.length})</span>
            </h2>
          </div>

          {receipts.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 text-center text-xs text-zinc-500">
              Todavía no se subieron comprobantes hoy.
            </div>
          ) : (
            <div className="space-y-2">
              {receipts.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    {r.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(r)}
                        className="relative w-10 h-12 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 shrink-0"
                        title="Ampliar comprobante"
                      >
                        <img
                          src={r.imageUrl}
                          alt="Comprobante"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-10 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-100">
                          {r.playerName}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatPesos(r.amount)}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {new Date(r.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        hs • Acreditado
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Recibido
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Lightbox */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="relative max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-100">
                {viewingReceipt.playerName} ({formatPesos(viewingReceipt.amount)})
              </span>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex-1 overflow-auto flex items-center justify-center bg-black">
              {viewingReceipt.imageUrl && (
                <img
                  src={viewingReceipt.imageUrl}
                  alt="Comprobante"
                  className="max-h-[75vh] w-auto object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
