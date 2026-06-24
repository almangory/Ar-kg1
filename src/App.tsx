/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Letter, UserProgress } from "./types";
import { ARABIC_LETTERS, REWARD_BADGES } from "./data/letters";
import { audio } from "./utils/audio";
import LetterExplorer from "./components/LetterExplorer";
import Games from "./components/Games";
import PrintSheet from "./components/PrintSheet";
import Rewards from "./components/Rewards";
import StoriesView from "./components/StoriesView";
import {
  Sparkles,
  BookOpen,
  Gamepad2,
  Printer,
  Trophy,
  Flame,
  Star,
  Award,
  Volume2,
  Calendar,
  Heart,
  HelpCircle,
  Menu,
  X,
  Wifi,
  WifiOff,
  BookMarked
} from "lucide-react";

const LOCAL_STORAGE_KEY = "arabic_kindergarten_progress_v1";

const DEFAULT_PROGRESS: UserProgress = {
  stars: 10, // start with 10 stars for welcoming!
  streak: 1,
  lastActive: new Date().toISOString().split("T")[0],
  completedToday: [],
  unlockedBadges: [],
  completedWriting: [],
  balloonHighScore: 0,
  matchingHighScore: 0
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "explorer" | "games" | "stories" | "print" | "rewards">("home");
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [initialGameToLaunch, setInitialGameToLaunch] = useState<"balloon" | "matching" | "quiz" | "oddOneOut" | "letterOrdering" | "alphabetSequence" | null>(null);

  const handleSwitchTab = (tab: "home" | "explorer" | "games" | "stories" | "print" | "rewards", initialGame: "balloon" | "matching" | "quiz" | "oddOneOut" | "letterOrdering" | "alphabetSequence" | null = null) => {
    setActiveTab(tab);
    setInitialGameToLaunch(initialGame);
    audio.playPopSound();
  };

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: UserProgress = JSON.parse(saved);
        // Calculate daily streak on load
        const todayStr = new Date().toISOString().split("T")[0];
        const lastActiveStr = parsed.lastActive;

        let updatedStreak = parsed.streak;
        let updatedCompletedToday = parsed.completedToday;

        if (lastActiveStr !== todayStr) {
          const lastActiveDate = new Date(lastActiveStr);
          const todayDate = new Date(todayStr);
          const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day! Increment streak
            updatedStreak += 1;
          } else if (diffDays > 1) {
            // Broke the streak, reset to 1
            updatedStreak = 1;
          }
          // It is a new day, so clear today's completed letters list
          updatedCompletedToday = [];
        }

        const newProgress = {
          ...parsed,
          streak: updatedStreak,
          completedToday: updatedCompletedToday,
          lastActive: todayStr
        };

        // Check if any new badges can be unlocked based on loaded/modified progress
        const finalProgress = checkAndUnlockBadges(newProgress);
        setProgress(finalProgress);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalProgress));
      } catch (e) {
        console.error("Error loading progress", e);
      }
    } else {
      // First time loading - play welcoming greeting!
      setTimeout(() => {
        audio.speakArabic("مَرْحَبًا بِكَ يَا بَطَلْ فِي رَوْضَةِ حُرُوفِ الْلُّغَةِ الْعَرَبِيَّةِ التَّفَاعُلِيَّةْ!");
      }, 1000);
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize History state on mount
  useEffect(() => {
    window.history.replaceState({ tab: "home", letter: null }, "");
  }, []);

  // Keep browser history state in sync on activeTab / selectedLetter changes
  useEffect(() => {
    const currentState = window.history.state;
    const letterChar = selectedLetter ? selectedLetter.char : null;
    
    if (!currentState || currentState.tab !== activeTab || currentState.letter !== letterChar) {
      window.history.pushState({ tab: activeTab, letter: letterChar }, "");
    }
  }, [activeTab, selectedLetter]);

  // Handle mobile and browser physical Back button clicks (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { tab, letter } = event.state;
        setActiveTab(tab || "home");
        if (letter) {
          const letterObj = ARABIC_LETTERS.find((l) => l.char === letter);
          setSelectedLetter(letterObj || null);
        } else {
          setSelectedLetter(null);
        }
      } else {
        setActiveTab("home");
        setSelectedLetter(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Warn before leaving ("وفي حال الخروج يكتب هل انت متاكد من المغادرة")
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      const msg = "هل أنت متأكد من مغادرة البرنامج؟";
      e.returnValue = msg;
      return msg;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Save progress helper
  const saveProgress = (newProgress: UserProgress) => {
    const checkedProgress = checkAndUnlockBadges(newProgress);
    setProgress(checkedProgress);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(checkedProgress));
  };

  // Badge unlock validation engine
  const checkAndUnlockBadges = (current: UserProgress): UserProgress => {
    const unlocked = [...current.unlockedBadges];
    let newlyUnlocked = false;

    REWARD_BADGES.forEach((badge) => {
      if (!unlocked.includes(badge.id)) {
        let qualifies = false;

        if (badge.id === "first_steps" && current.stars >= 15) {
          qualifies = true;
        } else if (badge.id === "halfway" && current.stars >= 75) {
          qualifies = true;
        } else if (badge.id === "alphabet_master" && current.stars >= 150) {
          qualifies = true;
        } else if (badge.id === "writing_star" && current.completedWriting.length >= 5) {
          qualifies = true;
        } else if (badge.id === "game_champion" && current.balloonHighScore >= 10) {
          qualifies = true;
        } else if (badge.id === "super_streak" && current.streak >= 3) {
          qualifies = true;
        }

        if (qualifies) {
          unlocked.push(badge.id);
          newlyUnlocked = true;
        }
      }
    });

    if (newlyUnlocked) {
      // Delay speech/chimes slightly so it doesn't collide with immediate actions
      setTimeout(() => {
        audio.playCheerSound();
        audio.speakArabic("تَهَانِينَا! لَقَدْ حَصَلْتَ عَلَى وِسَامٍ جَدِيدٍ رَائِعْ! تَفَقَّدْ خِزَانَةَ الْأَوْسِمَة.");
      }, 1200);
    }

    return {
      ...current,
      unlockedBadges: unlocked
    };
  };

  // Action: Add stars
  const handleUpdateStars = (starsEarned: number) => {
    const updated = {
      ...progress,
      stars: progress.stars + starsEarned
    };
    saveProgress(updated);
  };

  // Action: Mark letter as studied today
  const handleMarkLetterCompleted = (letterChar: string) => {
    if (!progress.completedToday.includes(letterChar)) {
      const updated = {
        ...progress,
        completedToday: [...progress.completedToday, letterChar]
      };
      saveProgress(updated);
    }
  };

  // Action: Mark letter as successfully written
  const handleMarkLetterWritten = (letterChar: string) => {
    if (!progress.completedWriting.includes(letterChar)) {
      const updated = {
        ...progress,
        completedWriting: [...progress.completedWriting, letterChar]
      };
      saveProgress(updated);
    }
  };

  // Action: Update game high scores
  const handleUpdateHighScore = (game: "balloon" | "matching", score: number) => {
    const updated = {
      ...progress,
      balloonHighScore: game === "balloon" ? Math.max(progress.balloonHighScore, score) : progress.balloonHighScore,
      matchingHighScore: game === "matching" ? Math.max(progress.matchingHighScore, score) : progress.matchingHighScore
    };
    saveProgress(updated);
  };

  // Daily Letter Challenge generator (cycles based on day of the month)
  const todayDayNum = new Date().getDate();
  const dailyLetterChallenge: Letter = ARABIC_LETTERS[(todayDayNum * 3) % ARABIC_LETTERS.length];

  const handleClaimDailyBonus = () => {
    const studied = progress.completedToday.includes(dailyLetterChallenge.char);
    const written = progress.completedWriting.includes(dailyLetterChallenge.char);

    if (studied || written) {
      handleUpdateStars(15);
      audio.playStarSound();
      audio.speakArabic("أَحْسَنْتَ يَا بَطَلْ! لَقَدْ أَتْمَمْتَ تَحَدِّي الْيَوْمِ وَحَصَلْتَ عَلَى خَمْسَةَ عَشَرَ نَجْمَةً إِضَافِيَّةً!");
    } else {
      audio.playBuzzerSound();
      audio.speakArabic(`عَلَيْكَ دِرَاسَةُ أَوْ كِتَابَةُ حَرْفْ الـ ${dailyLetterChallenge.name} أَوَّلًا لِتَحْصُلَ عَلَى الْمُكَافَأَة!`);
    }
  };

  // Friendly Mascot Welcome TTS
  const handleMascotSpeech = () => {
    audio.playPopSound();
    audio.speakArabic("مَرْحَبًا! أَنَا صَدِيقُكَ كُوكُو السِّنْجَابْ. هَيَّا نَلْعَبْ وَنَتَعَلَّمْ مَعًا حُرُوفَ الْعَرَبِيَّةِ الْجَمِيلَةْ! اِخْتَرْ أيَّ قِسْمٍ مِنَ الْأَعْلَى لِنَبْدَأَ الْمُرَاحْ!");
  };

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 flex flex-col font-sans selection:bg-rose-100 relative overflow-x-hidden" dir="rtl">
      {/* Decorative top candy colored visual border */}
      <div className="h-3 w-full bg-gradient-to-r from-orange-400 via-yellow-400 to-emerald-400 via-sky-400 to-purple-400 no-print" />

      {/* Primary Navigation Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b-4 border-yellow-400 px-4 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        {/* Logo & title brand */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div
            onClick={handleMascotSpeech}
            className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200 cursor-pointer animate-bounce hover:scale-105 transition-transform shrink-0"
            title="انقر لتسمع سنجوب!"
          >
            <span className="text-3xl font-bold">أ</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-sans text-sky-900 tracking-tight flex items-center gap-1.5 leading-tight">
              <span>رَوْضَةُ الْحُرُوفِ</span>
              <span className="text-xs bg-rose-50 border border-rose-200 text-rose-600 px-2.5 py-0.5 rounded-full font-bold">KG1</span>
            </h1>
            <p className="text-xs text-sky-600 font-semibold mt-0.5">مرحباً بك يا بطل!</p>
          </div>
        </div>

        {/* Daily Progress Bar (Mockup styling but real data!) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-6 xl:mx-12 flex-col">
          <div className="flex justify-between mb-1 text-xs font-bold text-sky-700 uppercase tracking-wider">
            <span>تقدمك اليومي</span>
            <span>{Math.round(((progress.completedToday.length + progress.completedWriting.length) / 56) * 100)}%</span>
          </div>
          <div className="w-full bg-sky-100 h-4 rounded-full overflow-hidden border-2 border-white shadow-inner">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, Math.min(100, ((progress.completedToday.length + progress.completedWriting.length) / 56) * 100))}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Right Side Widget: Stars, Streaks, Workspace actions */}
        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div
              onClick={() => { audio.playStarSound(); audio.speakArabic(`رصيدك الحالي هو ${progress.stars} نجمة!`); }}
              className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-300 shadow-sm cursor-pointer hover:scale-105 transition-transform"
              title="رصيد نجومي"
            >
              <span className="text-xl">⭐</span>
              <span className="text-xl font-black text-yellow-700">{progress.stars}</span>
            </div>

            <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full border-2 border-orange-300 shadow-sm" title="سلسلة الالتزام">
              <span className="text-xl">🔥</span>
              <span className="text-xl font-black text-orange-700">{progress.streak}</span>
            </div>

            {/* Connection State indicator */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-xs font-bold shadow-sm select-none transition-colors ${
                isOnline 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                  : "bg-orange-50 border-orange-200 text-orange-700 animate-pulse"
              }`}
              title={isOnline ? "الموقع متصل بالإنترنت" : "الموقع يعمل الآن بدون اتصال"}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden xl:inline">متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-orange-500" />
                  <span>أوفلاين</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab("print"); audio.playPopSound(); }}
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-5 rounded-full shadow-md shadow-rose-200 flex items-center gap-2 text-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">أوراق العمل</span>
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 md:hidden transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Subbar Menu matching the layout spec */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-4 pb-1 no-print hidden md:block">
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-3xl border-r-4 border-b-4 border-sky-200 flex justify-center gap-3 shadow-sm">
          <button
            onClick={() => handleSwitchTab("home")}
            className={`px-5 py-2.5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "home"
                ? "bg-rose-500 text-white shadow-md border-b-4 border-rose-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🏠</span>
            <span>الرئيسية</span>
          </button>
          <button
            onClick={() => handleSwitchTab("explorer")}
            className={`px-5 py-2.5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "explorer"
                ? "bg-sky-500 text-white shadow-md border-b-4 border-sky-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>📚</span>
            <span>مسرح الحروف</span>
          </button>
          <button
            onClick={() => handleSwitchTab("games")}
            className={`px-5 py-2.5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "games"
                ? "bg-emerald-500 text-white shadow-md border-b-4 border-emerald-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🎈</span>
            <span>ألعاب ومرح</span>
          </button>
          <button
            onClick={() => handleSwitchTab("stories")}
            className={`px-5 py-2.5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "stories"
                ? "bg-indigo-500 text-white shadow-md border-b-4 border-indigo-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>📖</span>
            <span>القصص المصورة</span>
          </button>
          <button
            onClick={() => handleSwitchTab("print")}
            className={`px-5 py-2.5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "print"
                ? "bg-purple-500 text-white shadow-md border-b-4 border-purple-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🖨️</span>
            <span>أوراق العمل للطباعة</span>
          </button>
          <button
            onClick={() => handleSwitchTab("rewards")}
            className={`px-5 py-2.5 rounded-2xl font-bold font-sans text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
              activeTab === "rewards"
                ? "bg-amber-400 text-slate-900 shadow-md border-b-4 border-amber-600"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🏆</span>
            <span>صندوق الأوسمة</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b-4 border-yellow-400 px-4 py-4 flex flex-col gap-2.5 no-print animate-fade-in shadow-inner">
          <button
            onClick={() => { handleSwitchTab("home"); setMobileMenuOpen(false); }}
            className={`w-full py-3 px-4 rounded-xl font-bold font-sans text-right ${
              activeTab === "home" ? "bg-rose-50 text-rose-600" : "text-slate-600"
            }`}
          >
            🏠 الرئيسية والنشاط
          </button>
          <button
            onClick={() => { handleSwitchTab("explorer"); setMobileMenuOpen(false); }}
            className={`w-full py-3 px-4 rounded-xl font-bold font-sans text-right ${
              activeTab === "explorer" ? "bg-sky-50 text-sky-600" : "text-slate-600"
            }`}
          >
            📚 مسرح الحروف التفاعلي
          </button>
          <button
            onClick={() => { handleSwitchTab("games"); setMobileMenuOpen(false); }}
            className={`w-full py-3 px-4 rounded-xl font-bold font-sans text-right ${
              activeTab === "games" ? "bg-emerald-50 text-emerald-600" : "text-slate-600"
            }`}
          >
            🎈 ألعاب بالونات وتطابق الصور
          </button>
          <button
            onClick={() => { handleSwitchTab("stories"); setMobileMenuOpen(false); }}
            className={`w-full py-3 px-4 rounded-xl font-bold font-sans text-right ${
              activeTab === "stories" ? "bg-indigo-50 text-indigo-600" : "text-slate-600"
            }`}
          >
            📖 قصص وحكايات كوكو المصورة
          </button>
          <button
            onClick={() => { handleSwitchTab("print"); setMobileMenuOpen(false); }}
            className={`w-full py-3 px-4 rounded-xl font-bold font-sans text-right ${
              activeTab === "print" ? "bg-purple-50 text-purple-600" : "text-slate-600"
            }`}
          >
            🖨️ أوراق عمل مجهزة للطباعة
          </button>
          <button
            onClick={() => { handleSwitchTab("rewards"); setMobileMenuOpen(false); }}
            className={`w-full py-3 px-4 rounded-xl font-bold font-sans text-right ${
              activeTab === "rewards" ? "bg-amber-50 text-amber-600" : "text-slate-600"
            }`}
          >
            🏆 صندوق الأوسمة والإنجازات
          </button>
        </div>
      )}

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-20">
        {activeTab === "home" && (
          // --- HOME / WELCOME DASHBOARD VIEW ---
          <div className="flex flex-col gap-6" id="dashboard-container">
            {/* Daily Letter Challenge Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Challenge layout (7 cols) */}
              <div className="md:col-span-7 bg-white p-6 md:p-8 rounded-[36px] border-r-4 border-b-4 border-sky-200 shadow-md flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-rose-500" />
                    <h3 className="text-lg font-black font-sans text-sky-900">تَحَدِّي الْحَرْفِ الْيَوْمِيِّ (Letter of the Day)</h3>
                  </div>
                  <p className="text-sm text-sky-600 font-sans">
                    أكمل دراسة وكتابة حرف اليوم الرائع لتكسب مكافأة ذهبية مضافة!
                  </p>
                </div>

                {/* Challenge content box */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  {/* Big letter trigger - customized mockup style */}
                  <div
                    onClick={() => {
                      audio.speakArabic(dailyLetterChallenge.char);
                      audio.speakArabic(`${dailyLetterChallenge.char}... ${dailyLetterChallenge.name}... ${dailyLetterChallenge.word}`);
                    }}
                    className="w-24 h-24 rounded-full bg-yellow-50 border-4 border-dashed border-yellow-200 flex items-center justify-center text-5xl font-black text-blue-600 shadow-inner cursor-pointer hover:scale-105 active:scale-95 transition-all select-none shrink-0"
                    title="استمع للنطق"
                  >
                    {dailyLetterChallenge.char}
                  </div>

                  <div className="text-center sm:text-right">
                    <h4 className="font-extrabold font-sans text-sky-950 text-xl">حَرْفُ {dailyLetterChallenge.name}</h4>
                    <p className="text-md text-sky-700 font-sans mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span>الكلمة المصورة:</span>
                      <span className="font-black text-rose-500 text-lg">({dailyLetterChallenge.word})</span>
                      <span className="text-2xl">{dailyLetterChallenge.emoji}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-sans mt-1">انقر على الحرف الدائري لتستمع للمخارج اللفظية</p>
                  </div>
                </div>

                {/* Claim/Validate buttons */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <button
                    onClick={() => {
                      setSelectedLetter(dailyLetterChallenge);
                      setActiveTab("explorer");
                      audio.playPopSound();
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold text-sm shadow-md shadow-sky-200 cursor-pointer active:scale-95 transition-all"
                  >
                    اذهب للتحدي والكتابة ✍️
                  </button>

                  <button
                    onClick={handleClaimDailyBonus}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-yellow-400 border-b-4 border-yellow-600 text-yellow-950 font-sans font-bold text-sm shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>تحصيل الجائزة اليومية (+15 نجمة)</span>
                  </button>
                </div>
              </div>

              {/* Fast Activity Stats Tracker (5 cols) */}
              <div className="md:col-span-5 bg-white p-6 md:p-8 rounded-[36px] border-r-4 border-b-4 border-sky-200 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black font-sans text-sky-900 mb-2">📊 مُؤَشِّرُ النَّشَاطِ الْيَوْمِيِّ</h3>
                  <p className="text-xs text-sky-600 font-sans mb-4">
                    تابع إنجازك لهذا اليوم وحافظ على الالتزام اليومي المرتفع!
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  {/* studied letters list */}
                  <div>
                    <div className="flex justify-between text-xs font-bold font-sans text-slate-600 mb-1.5">
                      <span>حروف قرأتها اليوم:</span>
                      <span className="text-sky-600 font-black">{progress.completedToday.length} / 28</span>
                    </div>
                    <div className="w-full bg-sky-100 h-4 rounded-full overflow-hidden border-2 border-white shadow-inner">
                      <div
                        className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(progress.completedToday.length / 28) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* written letters list */}
                  <div>
                    <div className="flex justify-between text-xs font-bold font-sans text-slate-600 mb-1.5">
                      <span>حروف رسمتها بقلمك:</span>
                      <span className="text-amber-600 font-black">{progress.completedWriting.length} / 28</span>
                    </div>
                    <div className="w-full bg-sky-100 h-4 rounded-full overflow-hidden border-2 border-white shadow-inner">
                      <div
                        className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(progress.completedWriting.length / 28) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-right leading-relaxed font-sans">
                  ⭐ كُلّ مَرَّة تَدْرُس فِيهَا حَرْفًا تَكْسَب <strong className="text-sky-500">+5 نُجُوم</strong>، وَكُلّ مَرَّة تَكْتُبُه فِيهَا تَكْسَب <strong className="text-emerald-500">+10 نُجُوم</strong>!
                </div>
              </div>
            </div>

            {/* Reward & Daily Goal Bar (Sleek Interface style!) */}
            <div className="bg-indigo-900 rounded-[30px] flex flex-col lg:flex-row items-center p-6 md:px-10 md:py-8 gap-6 md:gap-8 shadow-xl relative overflow-hidden text-right">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center gap-4 shrink-0 w-full lg:w-auto">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-yellow-200 ring-4 ring-indigo-500 shrink-0">
                  🎁
                </div>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">صندوق كنز الحروف اليومي</p>
                  <p className="text-indigo-200 text-sm mt-1">ادرس واكتب الحروف لجمع الكنز وفتح المفاتيح!</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row gap-4 justify-end items-center w-full relative z-10">
                <div className="h-4 bg-indigo-950 w-full lg:max-w-md rounded-full overflow-hidden border border-indigo-700 p-0.5 shadow-inner">
                  <div
                    className="h-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, Math.min(100, ((progress.completedToday.length + progress.completedWriting.length) / 56) * 100))}%` }}
                  ></div>
                </div>
                <span className="text-yellow-400 font-black text-xl whitespace-nowrap">
                  {progress.completedToday.length + progress.completedWriting.length} / 56 مهمة منجزة
                </span>
              </div>
            </div>

            {/* Quick action cartoon layout bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2" id="quick-bento">
              {/* Study Card */}
              <div
                onClick={() => handleSwitchTab("explorer")}
                className="bg-gradient-to-tr from-sky-400 to-blue-500 p-6 rounded-[28px] text-white shadow-xl hover:scale-105 hover:shadow-2xl hover:shadow-sky-100 cursor-pointer transition-all flex flex-col justify-between h-44 animate-fade-in"
              >
                <span className="text-4xl">📚</span>
                <div>
                  <h4 className="text-lg font-black font-sans">التعلم السريع</h4>
                  <p className="text-xs text-white/80 font-sans mt-0.5">انطق، العب، والفظ جميع الحروف الـ 28</p>
                </div>
              </div>

              {/* Games Card */}
              <div
                onClick={() => handleSwitchTab("games")}
                className="bg-gradient-to-tr from-emerald-400 to-teal-500 p-6 rounded-[28px] text-white shadow-xl hover:scale-105 hover:shadow-2xl hover:shadow-emerald-100 cursor-pointer transition-all flex flex-col justify-between h-44 animate-fade-in"
              >
                <span className="text-4xl">🎈</span>
                <div>
                  <h4 className="text-lg font-black font-sans">فرقعة البالونات والذاكرة</h4>
                  <p className="text-xs text-white/80 font-sans mt-0.5">ألعاب وتحديات مسلية جداً لجمع النجوم</p>
                </div>
              </div>

              {/* Magical Alphabet Path Game Card */}
              <div
                onClick={() => handleSwitchTab("games", "alphabetSequence")}
                className="bg-gradient-to-tr from-orange-400 to-amber-500 p-6 rounded-[28px] text-white shadow-xl hover:scale-105 hover:shadow-2xl hover:shadow-orange-100 cursor-pointer transition-all flex flex-col justify-between h-44 animate-fade-in"
              >
                <span className="text-4xl">🗺️</span>
                <div>
                  <h4 className="text-lg font-black font-sans">طريق الحروف السحري</h4>
                  <p className="text-xs text-white/80 font-sans mt-0.5">رتب الحروف من الألف إلى الياء لتكسب التاج السحري</p>
                </div>
              </div>

              {/* Print worksheets card */}
              <div
                onClick={() => handleSwitchTab("print")}
                className="bg-gradient-to-tr from-purple-500 to-pink-500 p-6 rounded-[28px] text-white shadow-xl hover:scale-105 hover:shadow-2xl hover:shadow-purple-100 cursor-pointer transition-all flex flex-col justify-between h-44 animate-fade-in"
              >
                <span className="text-4xl">🖨️</span>
                <div>
                  <h4 className="text-lg font-black font-sans">طباعة أوراق العمل</h4>
                  <p className="text-xs text-white/80 font-sans mt-0.5">أوراق تلوين وكتابة يدوية للتنزيل والطباعة</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- EXPLORER ROUTE TAB --- */}
        {activeTab === "explorer" && (
          <LetterExplorer
            progress={progress}
            onUpdateStars={handleUpdateStars}
            onMarkLetterCompleted={handleMarkLetterCompleted}
            onMarkLetterWritten={handleMarkLetterWritten}
            selectedLetter={selectedLetter}
            onSelectLetter={setSelectedLetter}
          />
        )}

        {/* --- GAMES ROUTE TAB --- */}
        {activeTab === "games" && (
          <Games
            progress={progress}
            onUpdateStars={handleUpdateStars}
            onUpdateHighScore={handleUpdateHighScore}
            initialGame={initialGameToLaunch}
          />
        )}

        {/* --- PRINT SHEET ROUTE TAB --- */}
        {activeTab === "print" && <PrintSheet onUpdateStars={handleUpdateStars} />}

        {/* --- STORIES ROUTE TAB --- */}
        {activeTab === "stories" && (
          <StoriesView
            stars={progress.stars}
            onUpdateStars={handleUpdateStars}
          />
        )}

        {/* --- REWARDS ROUTE TAB --- */}
        {activeTab === "rewards" && <Rewards progress={progress} />}
      </main>

      {/* Cloud-styled SVG elements to enhance kindergarten feel */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-white/40 pointer-events-none no-print" />

      {/* Bottom Bar: Games & Activities shortcut bar (Sleek Interface!) */}
      <div className="bg-white p-6 flex flex-wrap justify-center gap-4 md:gap-8 border-t-2 border-sky-100 no-print">
        <button
          onClick={() => { setActiveTab("print"); audio.playPopSound(); }}
          className="flex items-center gap-3 px-6 py-2.5 bg-pink-50 text-pink-600 hover:bg-pink-100 font-bold rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="text-2xl">🎨</span>
          <span>تلوين الصور</span>
        </button>
        <button
          onClick={() => { setActiveTab("games"); audio.playPopSound(); }}
          className="flex items-center gap-3 px-6 py-2.5 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="text-2xl">🧩</span>
          <span>ألعاب الذاكرة والبالونات</span>
        </button>
        <button
          onClick={() => { setActiveTab("explorer"); audio.playPopSound(); }}
          className="flex items-center gap-3 px-6 py-2.5 bg-teal-50 text-teal-600 hover:bg-teal-100 font-bold rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="text-2xl">🎤</span>
          <span>مسرح الحروف ونطقها</span>
        </button>
      </div>

      {/* Global Kid Friendly Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6 border-t border-slate-800 text-center no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-right">
            <h4 className="text-md font-black text-white font-sans flex items-center gap-1.5">
              <span>🐿️ رَوْضَةُ الْحُرُوفِ الْعَرَبِيَّةِ التَّفَاعُلِيَّةْ</span>
            </h4>
            <p className="text-xs text-slate-500 font-sans mt-1">تطبيق تعليمي تفاعلي لطلاب الروضة KG1 مبني بأحدث التقنيات لسهولة الاستخدام والتشجيع الذاتي.</p>
          </div>
          <div className="text-xs font-sans text-slate-500">
            صنع بكل حب لتشجيع أبطال الغد 🌟 جميع الحقوق محفوظة © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
