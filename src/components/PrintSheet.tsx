import React, { useState, useRef, useEffect } from "react";
import { Letter } from "../types";
import { ARABIC_LETTERS } from "../data/letters";
import { Printer, Sparkles, BookOpen, RotateCcw, Award, CheckCircle, Palette, Brush, Eye } from "lucide-react";
import { audio } from "../utils/audio";

interface PrintSheetProps {
  onUpdateStars?: (stars: number) => void;
}

export default function PrintSheet({ onUpdateStars }: PrintSheetProps) {
  const [selectedLetter, setSelectedLetter] = useState<Letter>(ARABIC_LETTERS[0]);
  const [isInteractive, setIsInteractive] = useState(false);
  const [activeColor, setActiveColor] = useState("#3b82f6"); // Default blue
  const [brushSize, setBrushSize] = useState(24);
  const [isLetterColored, setIsLetterColored] = useState(false);
  const [isTraceDone, setIsTraceDone] = useState(false);
  const [sheetSolved, setSheetSolved] = useState(false);
  const [studentName, setStudentName] = useState("");

  // Canvases Refs
  const colorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const traceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw states
  const isColoring = useRef(false);
  const isTracing = useRef(false);

  const colors = [
    { name: "أحمر", hex: "#ef4444" },
    { name: "برتقالي", hex: "#f97316" },
    { name: "أصفر", hex: "#eab308" },
    { name: "أخضر", hex: "#22c55e" },
    { name: "أزرق", hex: "#3b82f6" },
    { name: "بنفسجي", hex: "#a855f7" },
    { name: "وردي", hex: "#ec4899" },
    { name: "بني", hex: "#78350f" }
  ];

  // Initialize/Clear Coloring Canvas
  const initColorCanvas = () => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset and clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background hollow letter (with high definition font size)
    ctx.font = "bold 230px 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw hollow letter text guide
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 26;
    ctx.strokeText(selectedLetter.char, canvas.width / 2, canvas.height / 2);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 5;
    ctx.setLineDash([8, 8]);
    ctx.strokeText(selectedLetter.char, canvas.width / 2, canvas.height / 2);
    ctx.setLineDash([]); // Reset dash

    setIsLetterColored(false);
  };

  // Initialize/Clear Tracing Canvas
  const initTraceCanvas = () => {
    const canvas = traceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset and clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw baseline
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, canvas.height - 45);
    ctx.lineTo(canvas.width - 15, canvas.height - 45);
    ctx.stroke();

    // Draw 5 dotted letters as guides
    ctx.font = "bold 85px 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    
    const count = 5;
    const spacing = canvas.width / (count + 1);

    for (let i = 1; i <= count; i++) {
      const x = spacing * i;
      const y = canvas.height - 40;

      // Draw dotted text outline
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeText(selectedLetter.char, x, y);

      // Simple small arrow or dot for start direction (proportional to larger font size)
      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.arc(x + 18, y - 65, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.setLineDash([]); // Reset
    setIsTraceDone(false);
  };

  // Trigger initialization when isInteractive toggles or selected letter changes
  useEffect(() => {
    if (isInteractive) {
      setTimeout(() => {
        initColorCanvas();
        initTraceCanvas();
        setSheetSolved(false);
      }, 100);
    }
  }, [isInteractive, selectedLetter]);

  const handlePrint = () => {
    audio.playStarSound();
    window.print();
  };

  // Get mouse/touch coordinates relative to canvas WITH scaling for different CSS viewport widths
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height
      };
    } else {
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height
      };
    }
  };

  // --- DRAW HANDLERS FOR COLORING CANVAS ---
  const startColoring = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isColoring.current = true;
    const coords = getCoords(e, canvas);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setIsLetterColored(true);
  };

  const drawColoring = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isColoring.current) return;
    e.preventDefault();
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopColoring = () => {
    isColoring.current = false;
  };

  // --- DRAW HANDLERS FOR TRACING CANVAS ---
  const startTracing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = traceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isTracing.current = true;
    const coords = getCoords(e, canvas);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = "#4f46e5"; // Use royal purple/blue for pen writing
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setIsTraceDone(true);
  };

  const drawTracing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isTracing.current) return;
    e.preventDefault();
    const canvas = traceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopTracing = () => {
    isTracing.current = false;
  };

  // Submit & Reward
  const handleSolveComplete = () => {
    if (!isLetterColored || !isTraceDone) {
      audio.playBuzzerSound();
      audio.speakArabic("تأكد من تلوين الحرف وكتابته بشكل كامل يا بطل!");
      return;
    }

    setSheetSolved(true);
    audio.playCheerSound();
    audio.playStarSound();

    // Unlock stars if hook provided
    if (onUpdateStars) {
      onUpdateStars(30); // Award +30 stars for digital worksheets!
    }

    audio.speakArabic(`أَحْسَنْتَ عَمَلًا رَائِعًا يَا ${studentName || "بَطَلْ"}! لَقَدْ حَلَلْتَ وَرَقَةَ عَمَلِ حَرْفِ الْـ ${selectedLetter.name} وَحَصَلْتَ عَلَى ثَلَاثِينَ نَجْمَةً مُمَيَّزَة!`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 bg-gradient-to-b from-purple-50/50 to-pink-50/30" id="printsheets-section">
      
      {/* Sidebar Selector */}
      <div className="w-full lg:w-1/3 bg-white p-5 rounded-3xl border-4 border-purple-100 shadow-md no-print" id="print-sidebar">
        <div className="flex items-center gap-2.5 mb-4">
          <BookOpen className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold font-sans text-slate-700">اختر حرف ورقة العمل</h3>
        </div>
        <p className="text-sm text-slate-500 font-sans mb-5">
          اختر أي حرف لتوليد ورقة عمل ورسمها وحلها مباشرة على الموقع أو طباعتها لتلوينها يدوياً!
        </p>

        {/* Toggle between Interactive Solving & Printing */}
        <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              setIsInteractive(false);
              audio.playPopSound();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !isInteractive ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الورقة</span>
          </button>
          <button
            onClick={() => {
              setIsInteractive(true);
              audio.playPopSound();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isInteractive ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>حل تفاعلي بالموقع 🎮</span>
          </button>
        </div>

        {/* Letter select grid */}
        <div className="grid grid-cols-4 md:grid-cols-7 lg:grid-cols-4 gap-2 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
          {ARABIC_LETTERS.map((letter) => (
            <button
              key={letter.id}
              onClick={() => {
                setSelectedLetter(letter);
                audio.playPopSound();
              }}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-bold text-lg border-2 transition-all ${
                selectedLetter.id === letter.id
                  ? "bg-purple-500 border-purple-600 text-white shadow-md scale-105"
                  : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:scale-102"
              }`}
            >
              <span className="text-xl font-extrabold font-sans">{letter.char}</span>
              <span className="text-[10px] font-sans opacity-70 font-medium">{letter.name}</span>
            </button>
          ))}
        </div>

        {/* Action Button */}
        {!isInteractive ? (
          <button
            onClick={handlePrint}
            className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-sans font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-98 cursor-pointer"
          >
            <Printer className="w-5 h-5 animate-pulse" />
            <span>اطبع ورقة العمل الآن 🖨️</span>
          </button>
        ) : (
          <button
            onClick={handleSolveComplete}
            disabled={sheetSolved}
            className={`w-full mt-6 py-4 rounded-2xl text-white font-sans font-black text-lg flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-95 cursor-pointer ${
              sheetSolved
                ? "bg-emerald-500 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200"
            }`}
          >
            <Award className="w-5 h-5" />
            <span>{sheetSolved ? "تم حل الورقة بنجاح! 🏆" : "تحقق من حلي للحصول على نجوم! ⭐"}</span>
          </button>
        )}
      </div>

      {/* Main Area: Worksheet Paper Mockup */}
      <div className="flex-1 flex flex-col items-center w-full">
        
        {/* Helper Tip */}
        <div className="w-full max-w-2xl bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3 no-print">
          <span className="text-2xl animate-bounce">💡</span>
          <p className="text-xs font-sans text-amber-800 leading-relaxed">
            {isInteractive ? (
              <span>
                <strong>طريقة الحل الرقمي:</strong> استخدم الفأرة أو إصبعك على الأجهزة المحمولة لتلوين الحرف الكبير بالألوان الرائعة باليسار، وتتبع ورسم الحروف المنقطة بخطك الجميل بالأسفل، ثم اضغط على زر التحقق لكسب <strong>+30 نجمة ومكافأة السنجاب كوكو!</strong>
              </span>
            ) : (
              <span>
                <strong>نصيحة للمعلمين والأولياء:</strong> اضغط على زر "اطبع ورقة العمل" وسيقوم المتصفح بتهيئة الصفحة للطباعة على ورق <strong>A4</strong> مباشرة دون أزرار أو قوائم، ليحصل طفلك على ورقة كتابة يدوية وتلوين مريحة وممتعة!
              </span>
            )}
          </p>
        </div>

        {/* PRINTABLE WORK SHEET */}
        {!isInteractive ? (
          <div
            id="printable-worksheet"
            className="w-full max-w-2xl aspect-[1/1.414] bg-white border-8 border-double border-slate-400 p-8 md:p-12 shadow-xl rounded-2xl relative text-black overflow-hidden font-sans"
            dir="rtl"
          >
            {/* Header Area */}
            <div className="flex justify-between items-center border-b-4 border-slate-800 pb-4 mb-6">
              <div className="text-right">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">أوراق عمل الحروف العربية للروضة</h1>
                <p className="text-xs text-slate-500 font-sans mt-0.5">تعليم تفاعلي مبسط - مرحلة KG1</p>
              </div>
              <div className="text-left font-mono font-bold text-slate-800 bg-slate-100 border border-slate-300 px-3 py-1 rounded">
                حَرْف {selectedLetter.name} ({selectedLetter.char})
              </div>
            </div>

            {/* Student details line */}
            <div className="flex gap-6 mb-8 text-sm border-b-2 border-dotted border-slate-300 pb-3 font-sans font-bold">
              <div className="flex-1">اسم الطالب: ............................................................</div>
              <div>التاريخ: ............................</div>
            </div>

            {/* Letter Showcase Box & Word/Illustration */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Right block: Large Hollow letter for coloring */}
              <div className="border-4 border-slate-800 rounded-3xl p-6 pt-10 pb-4 flex flex-col items-center justify-center bg-slate-50 relative min-h-[170px]">
                <div className="absolute top-2.5 right-4 text-[10px] font-black text-slate-500">🎨 لَوِّنِ الْحَرْفَ الْجَمِيل</div>
                <div className="flex items-center justify-center my-2 select-none">
                  <span
                    className="text-[75px] md:text-[85px] font-black leading-none text-transparent"
                    style={{
                      WebkitTextStroke: "3px #1e293b",
                      fontFamily: '"Cairo", "Tajawal", "Changa", sans-serif'
                    }}
                  >
                    {selectedLetter.char}
                  </span>
                </div>
                <span className="text-md font-black text-slate-800 font-sans mt-2">حَرْفُ الـ {selectedLetter.name}</span>
              </div>

              {/* Left block: Word & Emoji coloring reference */}
              <div className="border-4 border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 relative min-h-[160px]">
                <div className="absolute top-2 left-4 text-[10px] font-bold text-slate-400">🐱 تَعَرَّفْ عَلَى الصُّورَة</div>
                <span className="text-7xl mb-2 select-none filter grayscale print:grayscale">{selectedLetter.emoji}</span>
                <span className="text-3xl font-black text-slate-900 font-sans tracking-wide">
                  {selectedLetter.word}
                </span>
                <span className="text-sm font-bold text-slate-500 font-mono tracking-wider mt-1">
                  {selectedLetter.englishWord}
                </span>
              </div>
            </div>

            {/* Tracing Rows */}
            <div className="mb-6">
              <h3 className="text-md font-bold text-slate-900 border-b-2 border-slate-800 pb-1 mb-4">✍️ تَتَبَّعِ الْحَرْفَ وَاكْتُبْهُ بِخَطِّكَ الْجَمِيلِ:</h3>

              {/* Row 1: Letter tracing */}
              <div className="flex items-center justify-between border-2 border-slate-300 rounded-xl p-3 mb-4 bg-slate-50/50">
                <span className="text-sm font-bold text-slate-500 font-sans w-24">تَتَبَّعْ (Trace):</span>
                <div className="flex-1 flex justify-around text-4xl text-slate-400/80 font-bold tracking-widest font-sans">
                  {Array(6).fill(selectedLetter.char).map((char, idx) => (
                    <span
                      key={idx}
                      className="select-none print:opacity-40"
                      style={{
                        fontFamily: '"Cairo", "Tajawal", sans-serif',
                        borderBottom: "1px dashed #cbd5e1",
                        paddingBottom: "2px",
                        opacity: 0.6
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              {/* Row 2: Free handwriting */}
              <div className="flex items-center justify-between border-2 border-slate-300 rounded-xl p-3 mb-4 bg-slate-50/50">
                <span className="text-sm font-bold text-slate-500 font-sans w-24">اُكْتُبْ وَحْدَك:</span>
                <div className="flex-1 flex justify-around text-4xl text-slate-300 tracking-widest font-bold">
                  {Array(6).fill(".").map((_, idx) => (
                    <span
                      key={idx}
                      className="w-8 h-10 border-b-2 border-dotted border-slate-400"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick interactive sentence to trace */}
            <div className="border-4 border-slate-800 p-4 rounded-2xl bg-slate-50/50 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500">📖 اقْرَأْ وَتَتَبَّعِ الْجُمْلَة (Read & Trace):</span>
              <div
                className="text-xl font-bold text-slate-400 text-center leading-relaxed font-sans"
                style={{ borderBottom: "1px dashed #cbd5e1", paddingBottom: "6px" }}
              >
                أَنَا أَكْتُبُ حَرْفَ الْـ{selectedLetter.name} ({selectedLetter.char}) بِخَطِّي الْجَمِيلِ
              </div>
            </div>

            {/* Footer of sheet */}
            <div className="absolute bottom-6 left-12 right-12 text-center text-[10px] text-slate-400 font-bold border-t border-slate-200 pt-2 flex justify-between">
              <span>حقوق الطبع محفوظة © لروضة حروف الهجاء</span>
              <span>أحسنت العمل يا بطل! 🌟</span>
            </div>
          </div>
        ) : (
          
          /* DIGITAL INTERACTIVE RESOLVING VIEW */
          <div
            className="w-full max-w-2xl bg-white border-8 border-violet-200 p-6 md:p-8 shadow-xl rounded-[32px] relative text-black font-sans select-none overflow-hidden"
            dir="rtl"
          >
            {/* SOLVED STAMP OVERLAY */}
            {sheetSolved && (
              <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="bg-amber-100 border-4 border-amber-300 rounded-full p-6 text-amber-500 mb-4 animate-bounce">
                  <Award className="w-16 h-16" />
                </div>
                <h3 className="text-3xl font-black font-sans text-emerald-600 mb-2">أَحْسَنْتَ عَمَلاً يَا بَطَلْ! 🏆</h3>
                <p className="text-md text-slate-600 font-sans max-w-sm leading-relaxed mb-6">
                  لقد قمت بحل ورقة عمل حرف ({selectedLetter.char}) بنجاح وحصلت على <span className="text-amber-500 font-black">+30 نجمة</span> ذهبية لمجموع رصيدك!
                </p>
                <button
                  onClick={() => {
                    setSheetSolved(false);
                    setTimeout(() => {
                      initColorCanvas();
                      initTraceCanvas();
                    }, 100);
                  }}
                  className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-sans font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  حل ورقة أخرى 🔄
                </button>
              </div>
            )}

            {/* Interactive Mode header */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-slate-100 pb-4 mb-5 gap-3">
              <div className="text-right w-full sm:w-auto">
                <h2 className="text-xl font-black text-violet-950 flex items-center gap-1.5">
                  <span>🎮 حل تفاعلي: ورقة عمل حرف الـ {selectedLetter.name}</span>
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">تعليم ورسم تفاعلي مبسط على الشاشة</p>
              </div>

              {/* Interactive Name input */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                <span className="text-xs font-bold text-slate-500 shrink-0">اسم البطل:</span>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="اكتب اسمك هنا ✍️"
                  className="px-3 py-1.5 border-2 border-slate-200 rounded-xl text-xs font-bold font-sans text-slate-700 focus:outline-none focus:border-violet-400 bg-slate-50 focus:bg-white transition-all w-36"
                />
              </div>
            </div>

            {/* COLORING AND SHOWCASE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
              
              {/* Left Column (5 cols): Canvas to color the letter */}
              <div className="md:col-span-6 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col items-center relative">
                <span className="absolute top-2 right-3 text-[10px] font-black text-slate-400 flex items-center gap-1 select-none">
                  <Palette className="w-3 h-3 text-violet-500 animate-spin" />
                  <span>لوِّن الحرف بالألوان السحرية:</span>
                </span>

                {/* Draw Canvas */}
                <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden mt-6 shadow-inner relative flex items-center justify-center touch-none">
                  <canvas
                    ref={colorCanvasRef}
                    width={500}
                    height={350}
                    onMouseDown={startColoring}
                    onMouseMove={drawColoring}
                    onMouseUp={stopColoring}
                    onMouseLeave={stopColoring}
                    onTouchStart={startColoring}
                    onTouchMove={drawColoring}
                    onTouchEnd={stopColoring}
                    className="cursor-crosshair w-full block bg-white touch-none"
                  />
                </div>

                {/* Palette choices */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        setActiveColor(c.hex);
                        audio.playPopSound();
                      }}
                      style={{ backgroundColor: c.hex }}
                      className={`w-6 h-6 rounded-full border shadow-sm transition-transform cursor-pointer ${
                        activeColor === c.hex ? "scale-120 ring-2 ring-violet-500 ring-offset-1" : "hover:scale-105"
                      }`}
                      title={c.name}
                    />
                  ))}
                  <button
                    onClick={() => {
                      initColorCanvas();
                      audio.playPopSound();
                    }}
                    className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    title="تنظيف"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column (6 cols): Picture/Emoji word block */}
              <div className="md:col-span-6 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative min-h-[180px]">
                <span className="absolute top-2 right-3 text-[10px] font-black text-slate-400">🐱 تعرَّف على الصورة والكلمة:</span>
                <span className="text-7xl mb-2 select-none filter drop-shadow-md animate-bounce">{selectedLetter.emoji}</span>
                <span className="text-3xl font-black text-slate-900 font-sans tracking-wide">
                  {selectedLetter.word}
                </span>
                <span className="text-sm font-bold text-slate-500 font-mono tracking-wider mt-1">
                  {selectedLetter.englishWord}
                </span>
                <button
                  onClick={() => audio.speakArabic(selectedLetter.word)}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-violet-100/50 hover:bg-violet-100 text-violet-700 font-black rounded-lg text-xs cursor-pointer border border-violet-100 transition-colors"
                >
                  <span>انطق الكلمة 🔊</span>
                </button>
              </div>
            </div>

            {/* TRACING ROW */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col relative mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400">✍️ تتبع الحروف المنقطة بقلمك الرقمي:</span>
                <button
                  onClick={() => {
                    initTraceCanvas();
                    audio.playPopSound();
                  }}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-white border border-indigo-100 px-2 py-1 rounded-lg hover:bg-indigo-50 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>مسح التتبع</span>
                </button>
              </div>

              {/* Tracing Area Canvas */}
              <div className="w-full bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden touch-none">
                <canvas
                  ref={traceCanvasRef}
                  width={800}
                  height={160}
                  onMouseDown={startTracing}
                  onMouseMove={drawTracing}
                  onMouseUp={stopTracing}
                  onMouseLeave={stopTracing}
                  onTouchStart={startTracing}
                  onTouchMove={drawTracing}
                  onTouchEnd={stopTracing}
                  className="cursor-crosshair w-full block bg-white touch-none"
                />
              </div>
            </div>

            {/* Read & Compliment interactive segment */}
            <div className="border-2 border-slate-200 p-3 rounded-2xl bg-violet-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-slate-700 font-sans font-bold text-center sm:text-right">
                📖 <strong>اقرأ مع السنجاب:</strong> أَنَا أَكْتُبُ حَرْفَ الْـ{selectedLetter.name} بِخَطِّي الْجَمِيلِ
              </p>
              <button
                onClick={() => audio.speakArabic(`أَنَا أَكْتُبُ حَرْفَ الـ ${selectedLetter.name} بِخَطِّي الْجَمِيلِ`)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-violet-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm hover:bg-violet-700 transition-all active:scale-95 shrink-0"
              >
                <span>اقرأ لي 🔊</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
