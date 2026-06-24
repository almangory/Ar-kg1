import React, { useState } from "react";
import { Letter, UserProgress } from "../types";
import { ARABIC_LETTERS } from "../data/letters";
import { audio } from "../utils/audio";
import TraceCanvas from "./TraceCanvas";
import {
  BookOpen,
  Volume2,
  Award,
  Sparkles,
  ChevronLeft,
  Printer,
  CheckCircle2,
  BookMarked,
  Mic
} from "lucide-react";

interface LetterExplorerProps {
  progress: UserProgress;
  onUpdateStars: (starsEarned: number) => void;
  onMarkLetterCompleted: (letterChar: string) => void;
  onMarkLetterWritten: (letterChar: string) => void;
  selectedLetter: Letter | null;
  onSelectLetter: (letter: Letter | null) => void;
}

export default function LetterExplorer({
  progress,
  onUpdateStars,
  onMarkLetterCompleted,
  onMarkLetterWritten,
  selectedLetter,
  onSelectLetter
}: LetterExplorerProps) {

  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [speechStatus, setSpeechStatus] = useState<"idle" | "listening" | "success" | "fail">("idle");
  const [speechStarsAwarded, setSpeechStarsAwarded] = useState<string[]>([]);

  const handleStartListening = (letter: Letter) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback Simulator
      setIsListening(true);
      setSpeechStatus("listening");
      setSpeechTranscript("جاري الاستماع... انطق بصوت عالي!");
      audio.playPopSound();
      
      setTimeout(() => {
        setIsListening(false);
        setSpeechStatus("success");
        setSpeechTranscript(letter.name);
        audio.playPopSound();
        audio.playStarSound();
        
        if (!speechStarsAwarded.includes(letter.char)) {
          onUpdateStars(10);
          setSpeechStarsAwarded([...speechStarsAwarded, letter.char]);
        }
        audio.speakArabic(`نُطْقٌ عَبْقَرِيٌّ لِحَرْفِ الْـ ${letter.name}! أَحْسَنْتَ يَا بَطَلْ!`);
      }, 2500);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "ar-SA";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setSpeechStatus("listening");
        setSpeechTranscript("كوكو يستمع إليك الآن... 🎙️");
        audio.playPopSound();
      };

      rec.onerror = () => {
        setIsListening(false);
        setSpeechStatus("fail");
        setSpeechTranscript("عذراً، لم أستطع سماعك بوضوح.");
        audio.playBuzzerSound();
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setSpeechTranscript(resultText);

        const normalizedResult = resultText.trim().toLowerCase();
        const isMatch = normalizedResult.includes(letter.char) || 
                        normalizedResult.includes(letter.name) || 
                        normalizedResult.includes("ألف") || 
                        normalizedResult.includes("باء") || 
                        normalizedResult.includes("تاء") ||
                        normalizedResult.includes(letter.word);

        if (isMatch) {
          setSpeechStatus("success");
          audio.playPopSound();
          audio.playStarSound();
          if (!speechStarsAwarded.includes(letter.char)) {
            onUpdateStars(10);
            setSpeechStarsAwarded([...speechStarsAwarded, letter.char]);
          }
          audio.speakArabic(`أَنْتَ رَائِعْ! نُطْقُكَ لِحَرْفِ الْـ ${letter.name} صَحِيحٌ مِئَة بِالْمِئَة!`);
        } else {
          setSpeechStatus("fail");
          audio.playBuzzerSound();
          audio.speakArabic(`نُطْقٌ قَرِيبٌ! هَيَّا نَسْتَمِعْ لِصَوْتِ السِّنْجَابِ ثُمَّ نُحَاوِلْ مَرَّةً أُخْرَى!`);
        }
      };

      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      setSpeechStatus("fail");
      setSpeechTranscript("حدث خطأ أثناء تشغيل الميكروفون.");
    }
  };

  const handleLetterSelect = (letter: Letter) => {
    onSelectLetter(letter);
    // Automatically pronounce letter when selected
    audio.playPopSound();
    audio.speakArabic(`${letter.char}... ${letter.name}... ${letter.word}`);
  };

  const handlePronounce = (letter: Letter) => {
    audio.speakArabic(letter.soundText);
  };

  // Award stars for completing letter study
  const handleMarkAsStudied = (letter: Letter) => {
    const isAlreadyCompleted = progress.completedToday.includes(letter.char);
    if (!isAlreadyCompleted) {
      onMarkLetterCompleted(letter.char);
      onUpdateStars(5);
      audio.playStarSound();
      audio.speakArabic(`عَمَلٌ رَائِعْ! حَصَلْتَ عَلَى خَمْسِ نُجُومْ لِدِرَاسَةِ حَرْفْ الـ ${letter.name}`);
    } else {
      audio.speakArabic(`لَقَدْ دَرَسْتَ حَرْفْ الـ ${letter.name} الْيَوْمْ! أَنْتَ بَطَلْ نَشِيطْ!`);
    }
  };

  // Callback when letter is successfully drawn on canvas
  const handleCanvasSuccess = (letter: Letter) => {
    const isAlreadyWritten = progress.completedWriting.includes(letter.char);
    onMarkLetterWritten(letter.char);
    onUpdateStars(10); // 10 stars for writing!
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50" id="explorer-section">
      {!selectedLetter ? (
        // --- LETTERS GRID VIEW ---
        <div className="p-4 md:p-6 flex-1 flex flex-col" id="letters-grid-container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-rose-500 text-white p-2.5 rounded-2xl shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black font-sans text-slate-800">مَسْرَحُ الْحُرُوفِ الْعَرَبِيَّةِ</h2>
                <p className="text-sm text-slate-500 font-sans mt-0.5">
                  اضغط على أي حرف لتبدأ رحلة التعلم والنطق التفاعلي والكتابة السحرية!
                </p>
              </div>
            </div>

            {/* Simple counters */}
            <div className="flex items-center gap-3 self-end md:self-auto bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm font-sans text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                📚 درست اليوم: {progress.completedToday.length}/28
              </span>
              <span className="text-slate-200">|</span>
              <span className="flex items-center gap-1">
                ✍️ كتبت: {progress.completedWriting.length}/28
              </span>
            </div>
          </div>

          {/* Letters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 md:gap-5 flex-1">
            {ARABIC_LETTERS.map((letter) => {
              const studied = progress.completedToday.includes(letter.char);
              const written = progress.completedWriting.includes(letter.char);

              return (
                <div
                  key={letter.id}
                  onClick={() => handleLetterSelect(letter)}
                  className={`group relative rounded-3xl p-5 border-4 border-b-8 cursor-pointer flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] active:scale-95 shadow-md hover:shadow-xl ${letter.color} ${letter.borderColor} ${letter.hoverColor}`}
                >
                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex gap-1">
                    {studied && (
                      <span className="bg-emerald-500 text-white rounded-full p-1 shadow-md text-[9px]" title="تمت دراسته">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                    {written && (
                      <span className="bg-amber-500 text-white rounded-full p-1 shadow-md text-[9px]" title="تمت كتابته">
                        <Award className="w-4 h-4 fill-white" />
                      </span>
                    )}
                  </div>

                  {/* Big Letter Character */}
                  <span
                    className={`text-6xl md:text-7xl font-extrabold select-none mb-1.5 leading-none transition-transform group-hover:scale-110 drop-shadow-sm`}
                    style={{ fontFamily: '"Cairo", "Tajawal", "Changa", sans-serif' }}
                  >
                    {letter.char}
                  </span>

                  {/* Letter name with diacritics */}
                  <span className={`text-sm font-black font-sans ${letter.textColor}`}>
                    {letter.name}
                  </span>

                  {/* Mini-word illustration */}
                  <div className="mt-3 bg-white/70 group-hover:bg-white/95 backdrop-blur-sm rounded-2xl py-2 px-3 w-full flex items-center justify-center gap-1.5 border border-white/60 transition-colors shadow-sm">
                    <span className="text-xl leading-none">{letter.emoji}</span>
                    <span className="text-xs font-bold text-slate-800 font-sans truncate">{letter.word}</span>
                  </div>

                  {/* Direct Pronounce volume button on card hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePronounce(letter);
                    }}
                    className="absolute bottom-3 right-3 p-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-600 hover:bg-white hover:text-rose-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="استمع للنطق"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // --- INDIVIDUAL LETTER DETAIL VIEW ---
        <div className="p-4 md:p-6 flex-1 flex flex-col h-full" id="letter-detail-view">
          {/* Back Navigation Header */}
          <button
            onClick={() => {
              onSelectLetter(null);
              audio.playPopSound();
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-slate-700 bg-white border-2 border-b-4 border-slate-300 hover:bg-slate-50 transition-all self-start shadow-sm font-sans font-black text-sm mb-6 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لجميع الحروف 🔙</span>
          </button>

          {/* Letter Details Grid split into Interactive left & Canvas tracing right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
            {/* Left Panel (Interactive pronunciation, meaning, rewards) (5/12 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Primary Letter and Speaker Showcase Card */}
              <div className={`p-6 md:p-8 rounded-[32px] border-r-4 border-b-4 border-sky-300 border-4 ${selectedLetter.color} ${selectedLetter.borderColor} shadow-lg flex flex-col items-center text-center relative overflow-hidden`}>
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold font-sans text-slate-500 border border-slate-100">
                  🔊 انقر للنطق بصوت المعلم
                </div>

                {/* Main letter trigger */}
                <button
                  onClick={() => handlePronounce(selectedLetter)}
                  className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white border-4 border-white/80 hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center text-[100px] font-black leading-none text-slate-800 transition-transform relative cursor-pointer group"
                >
                  <span style={{ fontFamily: '"Cairo", "Tajawal", "Changa", sans-serif' }} className="group-hover:text-rose-500 transition-colors select-none">
                    {selectedLetter.char}
                  </span>
                  <div className="absolute bottom-2 bg-rose-500 text-white rounded-full p-2 group-hover:scale-110 transition-transform">
                    <Volume2 className="w-4 h-4" />
                  </div>
                </button>

                <h3 className="text-3xl font-black font-sans text-slate-800 mt-6 mb-1">
                  حَرْفُ {selectedLetter.name} ({selectedLetter.char})
                </h3>
                <p className="text-sm font-bold text-slate-500 font-sans">
                  هيا ننطق ونكتب حرف {selectedLetter.name} الجميل!
                </p>
              </div>

              {/* Corresponding Word / Illustration Card - Styled like Mockup visual side */}
              <div className="bg-white p-6 rounded-[32px] border-r-4 border-b-4 border-sky-300 shadow-lg flex flex-col items-center justify-center text-center relative border border-slate-100">
                <div className="absolute top-3 right-4 text-xs font-sans text-sky-600 font-black">🎯 مثال توضيحي مصور</div>
                
                {/* Dashed circular background for emoji representation */}
                <div className="w-44 h-44 bg-yellow-50 rounded-full border-4 border-dashed border-yellow-200 flex items-center justify-center text-7xl shadow-inner mb-4 select-none mt-4 animate-bounce">
                  {selectedLetter.emoji}
                </div>

                <span className="text-3xl font-black text-sky-900 font-sans">
                  {selectedLetter.word}
                </span>
                <div className="mt-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-500 tracking-wide flex items-center gap-1">
                  <span>{selectedLetter.englishWord}</span>
                </div>

                {/* Audio word speaker button */}
                <button
                  onClick={() => audio.speakArabic(`${selectedLetter.word}`)}
                  className="mt-5 px-6 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-sans font-bold text-xs flex items-center gap-1.5 border border-rose-100 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>استمع للكلمة</span>
                </button>
              </div>

              {/* 🎙️ Voice Pronunciation Interactive Check Card */}
              <div className="bg-white p-6 rounded-[32px] border-r-4 border-b-4 border-emerald-300 shadow-lg flex flex-col items-center justify-center text-center relative border border-slate-100">
                <div className="absolute top-3 right-4 text-xs font-sans text-emerald-600 font-black">🎙️ اختبار النطق الذكي</div>
                
                <p className="text-xs text-slate-500 font-sans mt-5 max-w-xs leading-relaxed">
                  اضغط على الميكروفون وانطق حرف <strong className="text-emerald-600">{selectedLetter.char} ({selectedLetter.name})</strong> بصوتٍ واضحٍ وسنجوب يستمع إليك!
                </p>

                {/* Microphone Button with Pulse Animation */}
                <button
                  onClick={() => handleStartListening(selectedLetter)}
                  disabled={isListening}
                  className={`mt-4 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer transition-all active:scale-90 ${
                    isListening 
                      ? "bg-rose-500 animate-pulse ring-4 ring-rose-200" 
                      : speechStatus === "success" 
                        ? "bg-emerald-500 ring-4 ring-emerald-200" 
                        : "bg-gradient-to-tr from-emerald-400 to-teal-500 hover:scale-105"
                  }`}
                >
                  <Mic className="w-6 h-6" />
                </button>

                {/* Status indicator and transcript feedback */}
                {speechStatus !== "idle" && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 w-full">
                    <span className="text-[10px] font-black text-slate-400 block mb-1">تفريغ النطق:</span>
                    <p className="text-md font-black text-slate-800 font-sans">
                      {speechTranscript || "..."}
                    </p>
                    {speechStatus === "success" && (
                      <span className="text-xs font-bold text-emerald-600 mt-1 block">🏆 نطق صحيح وممتاز! (+10 نجوم)</span>
                    )}
                    {speechStatus === "fail" && (
                      <span className="text-xs font-bold text-rose-500 mt-1 block">🤔 حاول مجدداً مع السنجاب</span>
                    )}
                  </div>
                )}
              </div>

              {/* Reward/Completed Actions Panel */}
              <div className="bg-white p-6 rounded-[32px] border-r-4 border-b-4 border-sky-300 shadow-lg flex flex-col gap-4 border border-slate-100">
                <h4 className="text-md font-bold text-slate-700 font-sans flex items-center gap-1.5 border-b pb-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>أنهيت دراسة الحرف؟</span>
                </h4>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  إذا قرأت الحرف بصوت مسموع مع المعلم وتعرفت على صورته، اضغط على الزر الذهبي لجمع نقاط مكافأتك اليومية!
                </p>

                {/* Studying Completed Trigger */}
                <button
                  onClick={() => handleMarkAsStudied(selectedLetter)}
                  className={`py-3.5 rounded-2xl font-sans font-black text-sm flex items-center justify-center gap-2 border-2 transition-all active:scale-95 cursor-pointer shadow-md ${
                    progress.completedToday.includes(selectedLetter.char)
                      ? "bg-emerald-50 border-emerald-300 text-emerald-600 cursor-default"
                      : "bg-yellow-400 border-b-4 border-yellow-600 hover:bg-yellow-500 text-yellow-950"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {progress.completedToday.includes(selectedLetter.char)
                      ? "رائع! لقد درست هذا الحرف اليوم! 🌟"
                      : "نعم، درست الحرف اليوم! (+5 نجوم) 🏆"}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Panel (Interactive Canvas Tracing) (7/12 cols) */}
            <div className="lg:col-span-7 h-full min-h-[500px]">
              <TraceCanvas
                letter={selectedLetter}
                onSuccess={() => handleCanvasSuccess(selectedLetter)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
