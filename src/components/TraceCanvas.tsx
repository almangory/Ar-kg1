import React, { useRef, useState, useEffect } from "react";
import { Letter } from "../types";
import { audio } from "../utils/audio";
import { Award, Eraser, RotateCcw, Sparkles, Volume2 } from "lucide-react";

interface TraceCanvasProps {
  letter: Letter;
  onSuccess: () => void;
}

export default function TraceCanvas({ letter, onSuccess }: TraceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#f43f5e"); // Default to beautiful rose-500
  const [brushSize, setBrushSize] = useState(16);
  const [brushMode, setBrushMode] = useState<"normal" | "rainbow">("normal");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [starsAwarded, setStarsAwarded] = useState(false);

  // Rainbow brush hues helper
  const hueRef = useRef(0);

  // Quick drawing colors suitable for kids
  const kidColors = [
    { name: "أحمر", hex: "#f43f5e" }, // Rose 500
    { name: "برتقالي", hex: "#f97316" }, // Orange 500
    { name: "أصفر", hex: "#eab308" }, // Yellow 500
    { name: "أخضر", hex: "#22c55e" }, // Green 500
    { name: "أزرق", hex: "#3b82f6" }, // Blue 500
    { name: "بنفسجي", hex: "#a855f7" }, // Purple 500
    { name: "وردي", hex: "#ec4899" }, // Pink 500
  ];

  // Initialize Canvas & redraw background letter
  useEffect(() => {
    initCanvas();
    // Reinitialize on window resize
    const handleResize = () => {
      initCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [letter]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Make canvas responsive
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 400;
    canvas.height = rect?.height || 400;

    // Reset drawing state
    setHasDrawn(false);
    setStarsAwarded(false);

    // Draw background guide letter
    drawLetterGuide(ctx, canvas.width, canvas.height);
  };

  const drawLetterGuide = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Grid lines for standard copybook feel (فطور كراسة الكتابة)
    ctx.strokeStyle = "rgba(226, 232, 240, 0.8)"; // slate-200
    ctx.lineWidth = 2;

    // Horizontal notebook baseline
    const baselineY = height * 0.65;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(width, baselineY);
    ctx.stroke();

    // Dotted guide line above
    ctx.strokeStyle = "rgba(203, 213, 225, 0.4)"; // slate-300
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.35);
    ctx.lineTo(width, height * 0.35);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw faint guide letter in the center
    ctx.font = `bold ${Math.min(width, height) * 0.45}px "Cairo", "Tajawal", "Changa", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Faint dotted tracing outline
    ctx.strokeStyle = "rgba(226, 232, 240, 0.9)";
    ctx.fillStyle = "rgba(241, 245, 249, 0.9)"; // very faint filled
    ctx.shadowBlur = 0;

    const x = width / 2;
    const y = height * 0.48;

    // Draw filled letter guide
    ctx.fillText(letter.char, x, y);

    // Draw dashed path outline of the letter for easier tracing
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)"; // slate-400 dashed
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.strokeText(letter.char, x, y);
    ctx.setLineDash([]); // Reset
  };

  // Coordinates helper for mouse and touch
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);

    // Draw a single dot on click
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);

    // Stroke style based on brushMode
    if (brushMode === "rainbow") {
      hueRef.current = (hueRef.current + 3) % 360;
      ctx.strokeStyle = `hsl(${hueRef.current}, 95%, 60%)`;
    } else {
      ctx.strokeStyle = brushColor;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Starry sparkles brush effect in rainbow mode
    if (brushMode === "rainbow" && Math.random() > 0.7) {
      drawStarSparkle(ctx, coords.x, coords.y);
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const drawStarSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = `hsl(${(hueRef.current + 180) % 360}, 100%, 75%)`;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(
        x + Math.sin((i * Math.PI * 4) / 5) * 8,
        y + Math.cos((i * Math.PI * 4) / 5) * 8
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Small cartoon swoosh pop sound
    audio.playPopSound();
    drawLetterGuide(ctx, canvas.width, canvas.height);
  };

  const handleFinish = () => {
    if (!hasDrawn || starsAwarded) return;

    // Success sound effects!
    audio.playStarSound();
    setStarsAwarded(true);

    // Call on success to reward the child with stars
    onSuccess();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[32px] border-r-4 border-b-4 border-sky-300 border-2 overflow-hidden shadow-xl select-none" id="tracing-card">
      {/* Header Controls */}
      <div className="bg-sky-50 px-6 py-4 flex flex-wrap gap-4 justify-between items-center border-b-2 border-sky-100" id="canvas-header">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500 text-white p-2.5 rounded-2xl shadow-sm">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-xl font-black font-sans text-sky-950">لعبة تتبع وكتابة حرف ({letter.char})</h3>
            <p className="text-xs text-sky-700 font-sans">امسك القلم السحري وارسم الحرف فوق الخط المنقط!</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Pronounce letter */}
          <button
            onClick={() => audio.speakArabic(`اُكْتُبْ مَعِي حَرْفْ الـ ${letter.name}`)}
            className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border-2 border-b-4 border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer"
            title="انطق تعليمات الحرف"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* Eraser / Reset */}
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-700 bg-white border-2 border-b-4 border-slate-300 hover:bg-slate-50 transition-colors shadow-sm font-sans font-bold cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>تنظيف اللوحة</span>
          </button>
        </div>
      </div>

      {/* Canvas Area with Letter Guide */}
      <div className="flex-1 relative min-h-[300px] bg-slate-50/50 cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full block touch-none"
        />

        {/* Floating guidance label */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-sans text-slate-500 shadow-sm border border-slate-100 pointer-events-none">
          ✍️ ارسم بإصبعك أو الماوس
        </div>

        {/* Award Stars Celebration Overlay */}
        {starsAwarded && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center text-center p-6 animate-fade-in z-10">
            <div className="bg-amber-100 border-4 border-amber-300 rounded-full p-6 text-amber-500 mb-4 animate-bounce">
              <Award className="w-16 h-16" />
            </div>
            <h4 className="text-3xl font-extrabold font-sans text-slate-800 mb-2">ممتاز يا بطل! 🌟</h4>
            <p className="text-lg text-slate-600 font-sans mb-6 max-w-sm">
              لقد كتبت حرف <span className="text-rose-500 font-bold">({letter.char})</span> بخط جميل وحصلت على <span className="text-amber-500 font-bold">+10 نجوم</span>!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStarsAwarded(false);
                  initCanvas();
                }}
                className="px-6 py-3 rounded-2xl bg-white border-2 border-b-4 border-slate-300 hover:bg-slate-50 text-slate-700 font-sans font-bold transition-all cursor-pointer"
              >
                رسم من جديد 🔄
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls panel */}
      <div className="bg-slate-50 p-5 border-t-2 border-slate-100 flex flex-col md:flex-row gap-5 items-center justify-between" id="canvas-footer">
        {/* Kid-friendly color selector */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-sm font-bold font-sans text-slate-600 text-right md:text-right block w-full">🎨 اختر لون قلمك السحري:</label>
          <div className="flex flex-wrap gap-2.5">
            {kidColors.map((color) => (
              <button
                key={color.hex}
                onClick={() => {
                  setBrushColor(color.hex);
                  setBrushMode("normal");
                  audio.playPopSound();
                }}
                style={{ backgroundColor: color.hex }}
                className={`w-9 h-9 rounded-full transition-all active:scale-90 shadow-md cursor-pointer ${
                  brushColor === color.hex && brushMode === "normal"
                    ? "scale-125 ring-4 ring-offset-2 ring-slate-400"
                    : "hover:scale-110"
                }`}
                title={color.name}
              />
            ))}

            {/* Rainbow Sparkles brush option */}
            <button
              onClick={() => {
                setBrushMode("rainbow");
                audio.playPopSound();
              }}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold font-sans shadow-md border cursor-pointer bg-gradient-to-r from-rose-500 via-yellow-500 to-cyan-500 text-white transition-all active:scale-90 ${
                brushMode === "rainbow"
                  ? "scale-110 ring-4 ring-offset-2 ring-violet-400"
                  : "hover:scale-105"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>قلم قوس قزح</span>
            </button>
          </div>
        </div>

        {/* Brush size slider */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-sm font-bold font-sans text-slate-600 block w-full text-right">✏️ سمك القلم:</label>
          <div className="flex items-center gap-3">
            <div className="bg-slate-300 rounded-full" style={{ width: brushSize, height: brushSize }} />
            <input
              type="range"
              min="8"
              max="32"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* Submit Drawing Button */}
        <button
          onClick={handleFinish}
          disabled={!hasDrawn || starsAwarded}
          className={`w-full md:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-2.5 text-lg font-black font-sans text-white transition-all shadow-md cursor-pointer active:scale-95 ${
            !hasDrawn || starsAwarded
              ? "bg-slate-300 cursor-not-allowed opacity-60"
              : "bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          <Award className="w-6 h-6" />
          <span>أنهيت الكتابة! 🥳</span>
        </button>
      </div>
    </div>
  );
}
