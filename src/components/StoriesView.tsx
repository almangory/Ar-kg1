import React, { useState } from "react";
import { PICTURE_BOOKS, StoryBook } from "../data/stories";
import { audio } from "../utils/audio";
import { BookOpen, ChevronLeft, ChevronRight, Volume2, Award, ArrowRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StoriesViewProps {
  onUpdateStars: (stars: number) => void;
  stars: number;
}

export default function StoriesView({ onUpdateStars, stars }: StoriesViewProps) {
  const [activeBook, setActiveBook] = useState<StoryBook | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [readCompletedBooks, setReadCompletedBooks] = useState<string[]>([]);
  const [earnedStarsForCurrent, setEarnedStarsForCurrent] = useState(false);

  const startBook = (book: StoryBook) => {
    setActiveBook(book);
    setCurrentPageIndex(0);
    setEarnedStarsForCurrent(false);
    audio.playPopSound();
    audio.speakArabic(`لِنَقْرَأْ مَعًا قِصَّةَ: ${book.title}`);
  };

  const closeBook = () => {
    setActiveBook(null);
    audio.playPopSound();
  };

  const handleNextPage = () => {
    if (!activeBook) return;
    if (currentPageIndex < activeBook.pages.length - 1) {
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);
      audio.playPopSound();
      // Auto speak page text for ease
      audio.speakArabic(activeBook.pages[nextIndex].audioText);
    }
  };

  const handlePrevPage = () => {
    if (!activeBook) return;
    if (currentPageIndex > 0) {
      const prevIndex = currentPageIndex - 1;
      setCurrentPageIndex(prevIndex);
      audio.playPopSound();
      audio.speakArabic(activeBook.pages[prevIndex].audioText);
    }
  };

  const speakCurrentPage = () => {
    if (!activeBook) return;
    audio.speakArabic(activeBook.pages[currentPageIndex].audioText);
  };

  const claimStoryBonus = () => {
    if (!activeBook || earnedStarsForCurrent) return;

    audio.playCheerSound();
    audio.playStarSound();
    onUpdateStars(20); // Award +20 stars for reading a book!
    setEarnedStarsForCurrent(true);

    if (!readCompletedBooks.includes(activeBook.id)) {
      setReadCompletedBooks([...readCompletedBooks, activeBook.id]);
    }

    audio.speakArabic(`رَائِعْ جِدًّا يَا صَدِيقِي الْبَطَلْ! لَقَدْ أَتْمَمْتَ قِرَاءَةَ الْقِصَّةِ كَامِلَةً وَحَصَلْتَ عَلَى عِشْرِينَ نَجْمَةً مُكافَأَةً! ⭐🏆`);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-sky-50/50 to-emerald-50/40 p-4 md:p-6" id="stories-section">
      
      {!activeBook ? (
        // Gallery Screen
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 md:py-10">
          <div className="bg-emerald-100 border-4 border-emerald-300 text-emerald-500 p-4 rounded-full mb-4 animate-bounce">
            <BookOpen className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-black font-sans text-slate-800 mb-2">مكتبة القصص المصورة السعيدة 📚</h2>
          <p className="text-md md:text-lg text-slate-600 font-sans mb-8 max-w-lg leading-relaxed">
            استمع واستمتع بأروع القصص المصورة والمليئة بالحروف والحيوانات، واجمع النجوم الذهبية عند إتمام القراءة! ⭐🦖
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
            {PICTURE_BOOKS.map((book) => {
              const isCompleted = readCompletedBooks.includes(book.id);
              return (
                <div
                  key={book.id}
                  onClick={() => startBook(book)}
                  className="flex flex-col rounded-3xl bg-white border-4 border-b-8 border-slate-100 hover:border-emerald-300 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-right group cursor-pointer overflow-hidden relative"
                >
                  {/* Colorful header band */}
                  <div className={`h-24 bg-gradient-to-br ${book.colorTheme} flex items-center justify-center text-white relative`}>
                    <span className="text-6xl filter drop-shadow-md select-none group-hover:scale-110 transition-transform duration-300">
                      {book.coverEmoji}
                    </span>
                    {isCompleted && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-white" />
                        <span>تمت القراءة</span>
                      </span>
                    )}
                  </div>

                  {/* Body text */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-black font-sans text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-sans leading-relaxed">
                        {book.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                        حرف الـ {book.letter} ⭐
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <span>افتح الكتاب</span>
                        <ChevronLeft className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Active Story Slider Screen
        <div className="flex-1 flex flex-col bg-white rounded-3xl border-4 border-emerald-100 shadow-lg overflow-hidden relative" id="active-book-panel">
          
          {/* Header Bar */}
          <div className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-4 flex items-center justify-between no-print">
            <button
              onClick={closeBook}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs cursor-pointer transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للمكتبة 🚪</span>
            </button>

            <h3 className="text-lg font-black font-sans text-emerald-700">{activeBook.title}</h3>

            <div className="bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-800 font-black text-xs font-sans">
              صفحة {currentPageIndex + 1} من {activeBook.pages.length}
            </div>
          </div>

          {/* Core Slider content with motion transitions */}
          <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center min-h-[420px] bg-gradient-to-b from-emerald-50/10 to-sky-100/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPageIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl flex flex-col items-center justify-center text-center gap-8"
              >
                {/* Huge Emoji illustration */}
                <div className="w-44 h-44 rounded-full bg-emerald-50 border-4 border-dashed border-emerald-200 flex items-center justify-center text-8xl shadow-inner select-none animate-bounce">
                  {activeBook.pages[currentPageIndex].emoji}
                </div>

                {/* Legible Arabic story text */}
                <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm w-full">
                  <p className="text-2xl md:text-3xl font-black font-sans text-indigo-950 leading-relaxed tracking-wide">
                    {activeBook.pages[currentPageIndex].text}
                  </p>
                </div>

                {/* Vocal Speak button */}
                <button
                  onClick={speakCurrentPage}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black shadow-lg shadow-emerald-200 flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                >
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>انطق القصة بصوت السنجاب كوكو 🔊</span>
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-5 flex items-center justify-between select-none">
            {/* Prev button */}
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className={`px-4 py-2.5 rounded-xl font-bold font-sans text-xs flex items-center gap-1 transition-all ${
                currentPageIndex === 0
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>الصفحة السابقة</span>
            </button>

            {/* Slider progress bullets */}
            <div className="flex gap-2">
              {activeBook.pages.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    idx === currentPageIndex ? "bg-emerald-500 w-6" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            {/* Next or Finish button */}
            {currentPageIndex < activeBook.pages.length - 1 ? (
              <button
                onClick={handleNextPage}
                className="px-4 py-2.5 rounded-xl font-bold font-sans text-xs bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>الصفحة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={claimStoryBonus}
                disabled={earnedStarsForCurrent}
                className={`px-5 py-2.5 rounded-xl font-black font-sans text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                  earnedStarsForCurrent
                    ? "bg-amber-100 text-amber-700 border border-amber-300 cursor-not-allowed"
                    : "bg-amber-400 text-slate-900 hover:bg-amber-500 cursor-pointer animate-pulse"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>{earnedStarsForCurrent ? "تم الحصول على الجائزة! 🏆" : "أنهيت القراءة! خذ الجائزة ⭐"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
