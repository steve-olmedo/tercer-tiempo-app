import React, { useState, useRef, useEffect } from 'react';
import { Player, MPReceipt } from '../types/fulbito';
import { formatPesos } from '../utils/formatters';
import {
  X,
  Upload,
  Camera,
  Smartphone,
  Check,
  Search,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  FileText,
  User,
  ZoomIn,
} from 'lucide-react';

interface MPReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  costPerPerson: number;
  initialPlayerId?: string | null;
  receipts: MPReceipt[];
  aliasMap: Record<string, string>; // normalized senderName -> playerId
  onSaveReceipt: (
    receipt: MPReceipt,
    autoCredit: boolean,
    saveAlias?: { senderName: string; playerId: string }
  ) => void;
  onDeleteReceipt: (receiptId: string, revertAmount: boolean) => void;
}

export const MPReceiptModal: React.FC<MPReceiptModalProps> = ({
  isOpen,
  onClose,
  players,
  costPerPerson,
  initialPlayerId,
  receipts,
  aliasMap,
  onSaveReceipt,
  onDeleteReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('upload');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [amount, setAmount] = useState<number>(costPerPerson || 6900);
  const [senderName, setSenderName] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoCredit, setAutoCredit] = useState<boolean>(true);
  const [rememberAlias, setRememberAlias] = useState<boolean>(true);
  const [viewingReceipt, setViewingReceipt] = useState<MPReceipt | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Normalize string for alias matching
  const cleanStr = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  // Reset or preset when opened
  useEffect(() => {
    if (isOpen) {
      if (initialPlayerId) {
        setSelectedPlayerId(initialPlayerId);
        const p = players.find((x) => x.id === initialPlayerId);
        if (p) {
          const due = Math.max(0, costPerPerson - (p.initialBalance || 0));
          setAmount(due > 0 ? due : costPerPerson);
        }
      } else if (!selectedPlayerId && players.length > 0) {
        const firstPlayed = players.find((p) => p.playedToday);
        if (firstPlayed) setSelectedPlayerId(firstPlayed.id);
      }
    }
  }, [isOpen, initialPlayerId, costPerPerson]);

  // When costPerPerson changes and amount was default, update
  useEffect(() => {
    if (costPerPerson > 0 && amount === 0) {
      setAmount(costPerPerson);
    }
  }, [costPerPerson]);

  // Suggest player when senderName matches known alias
  useEffect(() => {
    if (senderName.trim()) {
      const cleaned = cleanStr(senderName);
      if (aliasMap[cleaned]) {
        setSelectedPlayerId(aliasMap[cleaned]);
      }
    }
  }, [senderName, aliasMap]);

  if (!isOpen) return null;

  // Compress and convert image to lightweight base64
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

  const handleConfirmUpload = () => {
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

    onSaveReceipt(newReceipt, autoCredit, aliasToSave);

    // Reset fields
    setPreviewImage(null);
    setSenderName('');
    setActiveTab('list');
  };

  // Filter players by name or nickname
  const filteredPlayers = players.filter((p) => {
    if (!searchQuery) return true;
    return cleanStr(p.name).includes(cleanStr(searchQuery));
  });

  const totalReceiptsAmount = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Comprobantes Mercado Pago
              </h2>
              <p className="text-xs text-zinc-400">
                Subí capturas y acreditá directamente al jugador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 px-5 pt-2.5 bg-zinc-900/30 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Comprobante</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Comprobantes Subidos</span>
            {receipts.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                {receipts.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'upload' ? (
            <>
              {/* Image Uploader */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Captura de pantalla o Foto del comprobante</span>
                  {previewImage && (
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Quitar imagen
                    </button>
                  )}
                </label>

                {previewImage ? (
                  <div className="relative rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900/80 p-2 flex items-center gap-3">
                    <img
                      src={previewImage}
                      alt="Comprobante Mercado Pago"
                      className="w-20 h-24 object-cover rounded-lg border border-zinc-800"
                    />
                    <div className="flex-1 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Captura lista</span>
                      </div>
                      <p className="text-zinc-400 text-[11px]">
                        Comprobante adjuntado para registro y verificación.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-sky-400 hover:underline inline-block mt-1"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 rounded-xl p-4 sm:p-6 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-200">
                        Tocá para seleccionar captura de Mercado Pago
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Arrastrá el archivo o sacale foto desde el celular
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
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

              {/* Amount Transferred */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Monto transferido</span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Cuota del día: {formatPesos(costPerPerson)}
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
                    className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-base font-mono font-bold text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="6900"
                  />
                </div>

                {/* Quick amount presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAmount(costPerPerson)}
                    className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-sky-400 border border-sky-500/20 transition-colors"
                  >
                    Cuota: {formatPesos(costPerPerson)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(7000)}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    $7.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(10000)}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    $10.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(costPerPerson * 2)}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    x2: {formatPesos(costPerPerson * 2)}
                  </button>
                </div>
              </div>

              {/* Titular MP / Sender Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Nombre del Titular en Mercado Pago (Opcional)</span>
                  <span className="text-[11px] text-zinc-500">Mapeo de apodos</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ej: Juan Perez, Maria Gomez..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Si transfiere con otro nombre o cuenta de un familiar, podés anotarlo acá para que la app lo recuerde automáticamente.
                </p>
              </div>

              {/* Player Selector (With Nicknames & Search) */}
              <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>¿A qué jugador se le acredita?</span>
                  </label>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {filteredPlayers.length} en lista
                  </span>
                </div>

                {/* Filter / Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o apodo..."
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Players Grid / List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {filteredPlayers.map((p) => {
                    const isSelected = p.id === selectedPlayerId;
                    const due = Math.max(0, costPerPerson - (p.initialBalance || 0));

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlayerId(p.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all border ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500/60 shadow-sm'
                            : 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? 'bg-sky-500 text-white'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {isSelected ? <Check className="w-3 h-3" /> : (p.orderIndex !== undefined ? p.orderIndex + 1 : '•')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-semibold ${
                                  isSelected ? 'text-sky-300 font-bold' : 'text-zinc-200'
                                }`}
                              >
                                {p.name}
                              </span>
                              {p.isGuest && (
                                <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  invitado
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {p.paidToday > 0 ? (
                                <span className="text-emerald-400">
                                  Ya puso {formatPesos(p.paidToday)}
                                </span>
                              ) : (
                                <span>Pone hoy: {formatPesos(due)}</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 px-2 py-0.5 rounded bg-sky-500/20">
                            Seleccionado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkboxes: Auto-credit & Remember Alias */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCredit}
                    onChange={(e) => setAutoCredit(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-500"
                  />
                  <span>
                    Acreditar automáticamente{' '}
                    <strong className="text-emerald-400 font-mono">
                      {formatPesos(amount)}
                    </strong>{' '}
                    como pago por Mercado Pago
                  </span>
                </label>

                {senderName.trim() && (
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberAlias}
                      onChange={(e) => setRememberAlias(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-500"
                    />
                    <span>
                      Recordar que el titular &quot;{senderName.trim()}&quot; corresponde a este jugador
                    </span>
                  </label>
                )}
              </div>
            </>
          ) : (
            /* Tab: List of Uploaded Receipts */
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div>
                  <span className="text-xs text-zinc-400">Total Acreditado por MP</span>
                  <div className="text-lg font-mono font-bold text-emerald-400">
                    {formatPesos(totalReceiptsAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400">Comprobantes</span>
                  <div className="text-lg font-mono font-bold text-zinc-200">
                    {receipts.length}
                  </div>
                </div>
              </div>

              {receipts.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-300">
                    No hay comprobantes subidos todavía
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    Cuando los pibes transfieran o te manden capturas, subilas acá para acreditarles al instante.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir primer comprobante</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {receipts.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3 group hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {r.imageUrl ? (
                          <div
                            onClick={() => setViewingReceipt(r)}
                            className="relative w-12 h-14 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 cursor-pointer group-hover:border-sky-500 transition-colors shrink-0"
                            title="Tocar para ampliar comprobante"
                          >
                            <img
                              src={r.imageUrl}
                              alt="Comprobante"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-14 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                            <Smartphone className="w-5 h-5" />
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
                          {r.senderName && (
                            <p className="text-[11px] text-zinc-400">
                              Titular MP: <span className="text-zinc-200">{r.senderName}</span>
                            </p>
                          )}
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(r.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            hs
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {r.imageUrl && (
                          <button
                            onClick={() => setViewingReceipt(r)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Ver imagen completa"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar comprobante de ${r.playerName}? ¿Querés restar los ${formatPesos(
                                  r.amount
                                )} del jugador?`
                              )
                            ) {
                              onDeleteReceipt(r.id, true);
                            }
                          }}
                          className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                          title="Eliminar comprobante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'upload' && (
          <div className="px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmUpload}
              disabled={!selectedPlayerId || amount <= 0 || isProcessingImage}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar y Acreditar Pago</span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Overlay */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="relative max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-100">
                  Comprobante: {viewingReceipt.playerName} ({formatPesos(viewingReceipt.amount)})
                </h4>
                {viewingReceipt.senderName && (
                  <p className="text-[11px] text-zinc-400">
                    Titular: {viewingReceipt.senderName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex-1 overflow-auto flex items-center justify-center bg-black">
              {viewingReceipt.imageUrl ? (
                <img
                  src={viewingReceipt.imageUrl}
                  alt="Comprobante completo"
                  className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <p className="text-xs text-zinc-500">Sin imagen adjunta</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
