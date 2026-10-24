import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Player, MatchConfig } from '../types/fulbito';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  ArrowUpDown,
  Palette,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface MatchPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueTeam: (Player | null)[];
  orangeTeam: (Player | null)[];
  config: MatchConfig;
}

type BoardTheme = 'turf' | 'chalkboard';

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
  const [sharedSuccess, setSharedSuccess] = useState(false);
  const [invertedSides, setInvertedSides] = useState(false);
  const [theme, setTheme] = useState<BoardTheme>('turf');

  // Roles for F7 formation (1-3-1-2)
  const ROLE_LABELS = ['ARQ', 'DEF', 'DEF', 'DEF', 'MED', 'DEL', 'DEL'];

  const renderPoster = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution: 1080 x 1920 (9:16 Instagram Story / WhatsApp Status)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Determine which team is on which half
    const topTeam = invertedSides ? orangeTeam : blueTeam;
    const bottomTeam = invertedSides ? blueTeam : orangeTeam;
    const topTeamName = invertedSides ? 'EQUIPO NARANJA' : 'EQUIPO AZUL';
    const bottomTeamName = invertedSides ? 'EQUIPO AZUL' : 'EQUIPO NARANJA';
    const topTeamColor = invertedSides ? 'orange' : 'blue';
    const bottomTeamColor = invertedSides ? 'blue' : 'orange';

    // ==========================================
    // 1. OUTER STADIUM / CHALKBOARD BACKGROUND
    // ==========================================
    const isChalkboard = theme === 'chalkboard';

    if (isChalkboard) {
      // Dark slate chalkboard gradient
      const slateGrad = ctx.createLinearGradient(0, 0, 0, H);
      slateGrad.addColorStop(0, '#0c1a14');
      slateGrad.addColorStop(0.5, '#0e231b');
      slateGrad.addColorStop(1, '#0c1a14');
      ctx.fillStyle = slateGrad;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Stadium turf night gradient
      const stadiumGrad = ctx.createLinearGradient(0, 0, 0, H);
      stadiumGrad.addColorStop(0, '#041309');
      stadiumGrad.addColorStop(0.5, '#071d0e');
      stadiumGrad.addColorStop(1, '#041309');
      ctx.fillStyle = stadiumGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // ==========================================
    // 2. HEADER BANNER (Y: 0 to 180)
    // ==========================================
    ctx.textAlign = 'center';

    // Top Tag Badge
    ctx.fillStyle = isChalkboard ? '#152b22' : '#0c2e17';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 170, 36, 340, 38, 19);
    ctx.fill();
    ctx.strokeStyle = isChalkboard ? '#264e3e' : '#10b98144';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚡ PIZARRA TÁCTICA • FÚTBOL 7', W / 2, 61);

    // Main App Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 50px "Plus Jakarta Sans", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;
    ctx.fillText('EL TERCER TIEMPO', W / 2, 114);
    ctx.shadowColor = 'transparent';

    // Subtitle / Date / Time (Ends cleanly at Y=152, well above top goal at Y=184)
    const dateText = config.matchTitle || config.date || 'Viernes 19:00 hs';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`📅 ${dateText}  •  Cancha F7`, W / 2, 152);

    // ==========================================
    // 3. FULL SOCCER PITCH (CANCHA COMPLETA)
    // ==========================================
    // Pitch bounds
    const pitchLeft = 60;
    const pitchRight = W - 60;
    const pitchTop = 210;
    const pitchBottom = 1730;
    const pitchWidth = pitchRight - pitchLeft; // 960 px
    const pitchHeight = pitchBottom - pitchTop; // 1520 px
    const pitchMidY = (pitchTop + pitchBottom) / 2; // 970 px
    const pitchMidX = W / 2; // 540 px

    // Pitch turf / surface
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pitchLeft, pitchTop, pitchWidth, pitchHeight, 20);
    ctx.clip();

    // Turf mowing stripes (12 horizontal alternating lawn bands)
    const stripeCount = 12;
    const stripeH = pitchHeight / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
      const stripeY = pitchTop + i * stripeH;
      if (isChalkboard) {
        ctx.fillStyle = i % 2 === 0 ? '#10281e' : '#0d2219';
      } else {
        ctx.fillStyle = i % 2 === 0 ? '#0f381c' : '#0b2e16';
      }
      ctx.fillRect(pitchLeft, stripeY, pitchWidth, stripeH);
    }

    // Subtle pitch lighting gradient (radial from center)
    const turfLight = ctx.createRadialGradient(
      pitchMidX,
      pitchMidY,
      80,
      pitchMidX,
      pitchMidY,
      pitchHeight / 1.4
    );
    turfLight.addColorStop(0, 'rgba(255,255,255,0.06)');
    turfLight.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = turfLight;
    ctx.fillRect(pitchLeft, pitchTop, pitchWidth, pitchHeight);

    ctx.restore();

    // Pitch chalk lines setup
    ctx.strokeStyle = isChalkboard ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer Pitch Boundary
    ctx.beginPath();
    ctx.roundRect(pitchLeft, pitchTop, pitchWidth, pitchHeight, 20);
    ctx.stroke();

    // Halfway Line
    ctx.beginPath();
    ctx.moveTo(pitchLeft, pitchMidY);
    ctx.lineTo(pitchRight, pitchMidY);
    ctx.stroke();

    // Center Circle (Radius: 110px)
    ctx.beginPath();
    ctx.arc(pitchMidX, pitchMidY, 110, 0, Math.PI * 2);
    ctx.stroke();

    // Center Kickoff Spot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pitchMidX, pitchMidY, 5, 0, Math.PI * 2);
    ctx.fill();

    // 4 Corner Arcs (Radius: 32px)
    // Top-Left
    ctx.beginPath();
    ctx.arc(pitchLeft, pitchTop, 32, 0, Math.PI / 2);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.arc(pitchRight, pitchTop, 32, Math.PI / 2, Math.PI);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.arc(pitchLeft, pitchBottom, 32, (Math.PI * 3) / 2, Math.PI * 2);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.arc(pitchRight, pitchBottom, 32, Math.PI, (Math.PI * 3) / 2);
    ctx.stroke();

    // ==========================================
    // TOP HALF MARKINGS (Penalty Box & Goal)
    // ==========================================
    // Top Goal Frame (From Y=184 to 210, doesn't touch subtitle at Y=152)
    const goalW = 200;
    const goalDepth = 26;
    const goalX = pitchMidX - goalW / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(goalX, pitchTop - goalDepth, goalW, goalDepth);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(goalX, pitchTop - goalDepth, goalW, goalDepth);

    // Goal Net Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    for (let gx = goalX + 20; gx < goalX + goalW; gx += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, pitchTop - goalDepth);
      ctx.lineTo(gx, pitchTop);
      ctx.stroke();
    }

    // Top Penalty Area (Área grande)
    const penW = 480;
    const penH = 240;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.strokeRect(pitchMidX - penW / 2, pitchTop, penW, penH);

    // Top Goal Area (Área chica)
    const goalAreaW = 220;
    const goalAreaH = 70;
    ctx.strokeRect(pitchMidX - goalAreaW / 2, pitchTop, goalAreaW, goalAreaH);

    // Top Penalty Spot
    const topPenSpotY = pitchTop + 215;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pitchMidX, topPenSpotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Top Penalty Arc (Medialuna)
    ctx.beginPath();
    ctx.arc(pitchMidX, topPenSpotY, 75, 0.65, Math.PI - 0.65);
    ctx.stroke();

    // ==========================================
    // BOTTOM HALF MARKINGS (Penalty Box & Goal)
    // ==========================================
    // Bottom Goal Frame (From Y=1730 to 1756, doesn't touch footer card at Y=1782)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(goalX, pitchBottom, goalW, goalDepth);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(goalX, pitchBottom, goalW, goalDepth);

    // Net Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    for (let gx = goalX + 20; gx < goalX + goalW; gx += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, pitchBottom);
      ctx.lineTo(gx, pitchBottom + goalDepth);
      ctx.stroke();
    }

    // Bottom Penalty Area (Área grande)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.strokeRect(pitchMidX - penW / 2, pitchBottom - penH, penW, penH);

    // Bottom Goal Area (Área chica)
    ctx.strokeRect(pitchMidX - goalAreaW / 2, pitchBottom - goalAreaH, goalAreaW, goalAreaH);

    // Bottom Penalty Spot
    const botPenSpotY = pitchBottom - 215;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pitchMidX, botPenSpotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Bottom Penalty Arc (Medialuna)
    ctx.beginPath();
    ctx.arc(pitchMidX, botPenSpotY, 75, Math.PI + 0.65, Math.PI * 2 - 0.65);
    ctx.stroke();

    // ==========================================
    // 4. TEAM BADGES AT EACH HALF
    // ==========================================
    // TOP TEAM BADGE (Inside top goal mouth, cleanly above GK)
    const topBadgeY = pitchTop + 16;
    const isTopBlue = topTeamColor === 'blue';
    ctx.fillStyle = isTopBlue ? 'rgba(30, 58, 138, 0.92)' : 'rgba(154, 52, 18, 0.92)';
    ctx.beginPath();
    ctx.roundRect(pitchMidX - 150, topBadgeY, 300, 38, 12);
    ctx.fill();
    ctx.strokeStyle = isTopBlue ? '#60a5fa' : '#fb923c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${isTopBlue ? '🔵' : '🟠'} ${topTeamName}`, pitchMidX, topBadgeY + 25);

    // BOTTOM TEAM BADGE (Inside bottom goal mouth, cleanly below GK token & GK pill)
    const botBadgeY = pitchBottom - 54;
    const isBotBlue = bottomTeamColor === 'blue';
    ctx.fillStyle = isBotBlue ? 'rgba(30, 58, 138, 0.92)' : 'rgba(154, 52, 18, 0.92)';
    ctx.beginPath();
    ctx.roundRect(pitchMidX - 150, botBadgeY, 300, 38, 12);
    ctx.fill();
    ctx.strokeStyle = isBotBlue ? '#60a5fa' : '#fb923c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${isBotBlue ? '🔵' : '🟠'} ${bottomTeamName}`, pitchMidX, botBadgeY + 25);

    // ==========================================
    // 5. CENTER CIRCLE "VS" BADGE
    // ==========================================
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(pitchMidX, pitchMidY, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VS', pitchMidX, pitchMidY + 8);

    // Tactical direction arrows in center circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('▼ ATAQUE ▼', pitchMidX, pitchMidY - 48);
    ctx.fillText('▲ ATAQUE ▲', pitchMidX, pitchMidY + 58);

    // ==========================================
    // 6. DRAW 14 PLAYERS (7 TOP HALF, 7 BOTTOM HALF)
    // ==========================================
    // TOP HALF POSITIONS (Attacking downwards: GK, DEF, MED, DEL)
    // 0: ARQ, 1: DEF_IZQ, 2: DEF_CEN, 3: DEF_DER, 4: MED, 5: DEL_IZQ, 6: DEL_DER
    const topSlots = [
      { x: pitchMidX, y: pitchTop + 125, role: 'ARQ', pillPos: 'below' as const }, // 0: GK
      { x: pitchMidX - 280, y: pitchTop + 340, role: 'DEF', pillPos: 'below' as const }, // 1: DEF_IZQ
      { x: pitchMidX, y: pitchTop + 340, role: 'DEF', pillPos: 'below' as const }, // 2: DEF_CEN
      { x: pitchMidX + 280, y: pitchTop + 340, role: 'DEF', pillPos: 'below' as const }, // 3: DEF_DER
      { x: pitchMidX, y: pitchTop + 505, role: 'MED', pillPos: 'below' as const }, // 4: MED
      { x: pitchMidX - 180, y: pitchTop + 645, role: 'DEL', pillPos: 'below' as const }, // 5: DEL_IZQ
      { x: pitchMidX + 180, y: pitchTop + 645, role: 'DEL', pillPos: 'below' as const }, // 6: DEL_DER
    ];

    // BOTTOM HALF POSITIONS (Attacking upwards: mirror of top)
    // CRITICAL: Bottom GK has pillPos: 'above' so it points up towards field and NEVER clashes with botBadgeY!
    const bottomSlots = [
      { x: pitchMidX, y: pitchBottom - 125, role: 'ARQ', pillPos: 'above' as const }, // 0: GK (pill above!)
      { x: pitchMidX - 280, y: pitchBottom - 340, role: 'DEF', pillPos: 'below' as const }, // 1: DEF_IZQ
      { x: pitchMidX, y: pitchBottom - 340, role: 'DEF', pillPos: 'below' as const }, // 2: DEF_CEN
      { x: pitchMidX + 280, y: pitchBottom - 340, role: 'DEF', pillPos: 'below' as const }, // 3: DEF_DER
      { x: pitchMidX, y: pitchBottom - 505, role: 'MED', pillPos: 'below' as const }, // 4: MED
      { x: pitchMidX - 180, y: pitchBottom - 645, role: 'DEL', pillPos: 'below' as const }, // 5: DEL_IZQ
      { x: pitchMidX + 180, y: pitchBottom - 645, role: 'DEL', pillPos: 'below' as const }, // 6: DEL_DER
    ];

    // Function to draw an individual player token + name pill
    const drawPlayerToken = (
      player: Player | null | undefined,
      slotIndex: number,
      x: number,
      y: number,
      role: string,
      teamColor: 'blue' | 'orange',
      isGoalkeeper: boolean,
      pillPosition: 'above' | 'below' = 'below'
    ) => {
      ctx.save();

      const tokenRadius = 32;

      // 1. Disc Drop Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 5;

      // 2. Token Circle Fill
      ctx.beginPath();
      ctx.arc(x, y, tokenRadius, 0, Math.PI * 2);

      if (!player) {
        // Vacant slot
        ctx.fillStyle = 'rgba(24, 24, 27, 0.88)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Active Player Token
        const grad = ctx.createLinearGradient(x - tokenRadius, y - tokenRadius, x + tokenRadius, y + tokenRadius);
        if (isGoalkeeper) {
          // Distinctive Goalkeeper Jersey (Amber / Gold)
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(1, '#b45309');
        } else if (teamColor === 'blue') {
          // Blue Team
          grad.addColorStop(0, '#3b82f6');
          grad.addColorStop(1, '#1d4ed8');
        } else {
          // Orange Team
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(1, '#c2410c');
        }

        ctx.fillStyle = grad;
        ctx.fill();

        // White border ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.shadowColor = 'transparent';

      // 3. Number & Role on Token
      ctx.textAlign = 'center';
      if (player) {
        // Player slot number (1 to 7)
        ctx.fillStyle = isGoalkeeper ? '#000000' : '#ffffff';
        ctx.font = '800 22px "JetBrains Mono", monospace';
        ctx.fillText(`${slotIndex + 1}`, x, y + 2);

        // Role subscript inside disc
        ctx.fillStyle = isGoalkeeper ? '#3d2001' : '#e0e7ff';
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(role, x, y + 17);
      } else {
        ctx.fillStyle = '#a1a1aa';
        ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('+', x, y + 7);
      }

      // 4. Name Pill Badge
      const pillW = 154;
      const pillH = 32;
      const pillX = x - pillW / 2;
      const pillY = pillPosition === 'above'
        ? y - tokenRadius - 6 - pillH
        : y + tokenRadius + 6;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      // Card Background
      ctx.fillStyle = player ? 'rgba(9, 13, 20, 0.94)' : 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 8);
      ctx.fill();

      // Card Border with team tint
      ctx.strokeStyle = player
        ? teamColor === 'blue'
          ? 'rgba(96, 165, 250, 0.55)'
          : 'rgba(251, 146, 60, 0.55)'
        : 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowColor = 'transparent';

      // Player Name Text
      ctx.fillStyle = player ? '#ffffff' : '#94a3b8';
      ctx.font = player ? 'bold 15px "Plus Jakarta Sans", sans-serif' : 'italic 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';

      let displayName = player ? player.name : `(Libre)`;
      if (displayName.length > 13) {
        displayName = displayName.substring(0, 12) + '…';
      }
      ctx.fillText(displayName, x, pillY + 21);

      ctx.restore();
    };

    // Draw Top Team (7 players)
    topSlots.forEach((slot, index) => {
      const player = topTeam[index] || null;
      drawPlayerToken(
        player,
        index,
        slot.x,
        slot.y,
        slot.role,
        topTeamColor,
        slot.role === 'ARQ',
        slot.pillPos
      );
    });

    // Draw Bottom Team (7 players)
    bottomSlots.forEach((slot, index) => {
      const player = bottomTeam[index] || null;
      drawPlayerToken(
        player,
        index,
        slot.x,
        slot.y,
        slot.role,
        bottomTeamColor,
        slot.role === 'ARQ',
        slot.pillPos
      );
    });

    // ==========================================
    // 7. FOOTER SUMMARY (Y: 1780 to 1920)
    // ==========================================
    ctx.textAlign = 'center';

    // Summary badge / match cost info
    const footerCardY = 1782;
    const footerCardH = 42;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 250, footerCardY, 500, footerCardH, 21);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const costPerPerson = config.pitchCost ? Math.round(config.pitchCost / 14 / 100) * 100 : 6900;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.fillText(
      `Cancha $${(config.pitchCost || 96000).toLocaleString('es-AR')} • $${costPerPerson.toLocaleString('es-AR')} c/u`,
      W / 2,
      footerCardY + 27
    );

    // App Watermark (Well spaced from footer card and canvas bottom)
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚽ Pizarra generada con la App El Tercer Tiempo', W / 2, 1865);

    // Update download URL
    try {
      const url = canvas.toDataURL('image/png');
      setDownloadUrl(url);
    } catch {
      // Ignored
    }
  }, [blueTeam, orangeTeam, config, invertedSides, theme]);

  useEffect(() => {
    if (isOpen) {
      renderPoster();
    }
  }, [isOpen, renderPoster]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `pizarra-futbol7-${Date.now()}.png`;
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

  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'pizarra-futbol7.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Pizarra Fútbol 7 - El Tercer Tiempo',
            text: '⚽ Pizarra táctica de las formaciones para este viernes',
          });
          setSharedSuccess(true);
          setTimeout(() => setSharedSuccess(false), 2500);
        } else {
          // If native files share not supported, copy image
          handleCopyImage();
        }
      });
    } catch {
      // User cancelled or not supported
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Pizarra de Fútbol (Cancha Completa)</span>
                <span className="text-[10px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                  7 vs 7
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                14 jugadores posicionados en la cancha completa
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

        {/* Toolbar Controls */}
        <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 text-xs">
          {/* Theme switcher */}
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setTheme('turf')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                theme === 'turf'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌱 Césped
            </button>
            <button
              onClick={() => setTheme('chalkboard')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                theme === 'chalkboard'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📝 Pizarra
            </button>
          </div>

          {/* Swap sides */}
          <button
            onClick={() => setInvertedSides((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors font-medium"
            title="Invertir lados de los equipos en la cancha"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Invertir Lados</span>
          </button>
        </div>

        {/* Canvas Visual Preview */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 flex justify-center items-center bg-zinc-950">
          <div className="relative border-2 border-emerald-950/60 rounded-xl overflow-hidden shadow-2xl max-w-[280px] sm:max-w-[340px]">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block select-none"
              style={{ maxHeight: '58vh' }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-900">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              {copiedImage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            {canNativeShare && (
              <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800 transition-colors"
                title="Compartir directo a WhatsApp"
              >
                {sharedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Enviado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md active:scale-95"
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
