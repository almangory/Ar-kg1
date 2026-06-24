import React, { useState, useEffect, useRef } from "react";
import { Letter } from "../types";
import { ARABIC_LETTERS } from "../data/letters";
import { audio } from "../utils/audio";
import {
  Volume2,
  Trophy,
  Star,
  RotateCcw,
  Sparkles,
  Gamepad2,
  HelpCircle,
  Clock,
  Heart
} from "lucide-react";

interface GamesProps {
  progress: {
    stars: number;
    balloonHighScore: number;
    matchingHighScore: number;
  };
  onUpdateStars: (starsEarned: number) => void;
  onUpdateHighScore: (game: "balloon" | "matching", score: number) => void;
}

// Interfaces for Balloon pop game
interface Balloon {
  id: number;
  letter: Letter;
  x: number; // percentage width 5% - 85%
  y: number; // percentage height (from bottom)
  speed: number;
  color: string;
  size: number;
}

export default function Games({ progress, onUpdateStars, onUpdateHighScore }: GamesProps) {
  const [activeGame, setActiveGame] = useState<"balloon" | "matching" | "quiz" | "oddOneOut" | null>(null);

  // --- ODD ONE OUT GAME STATE ---
  interface OddQuestion {
    options: string[];
    correctIndex: number;
    correctChar: string;
    repeatedChar: string;
  }
  const [oddScore, setOddScore] = useState(0);
  const [oddQuestionIndex, setOddQuestionIndex] = useState(0);
  const [oddQuestions, setOddQuestions] = useState<OddQuestion[]>([]);
  const [oddFinished, setOddFinished] = useState(false);
  const [oddFeedback, setOddFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [selectedOddIndex, setSelectedOddIndex] = useState<number | null>(null);
  const [oddHighScore, setOddHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("odd_high_score");
    return saved ? parseInt(saved, 10) : 0;
  });

  const startOddGame = () => {
    setOddScore(0);
    setOddQuestionIndex(0);
    setOddFinished(false);
    setOddFeedback(null);
    setSelectedOddIndex(null);
    setActiveGame("oddOneOut");

    // Generate 5 questions
    const generated: OddQuestion[] = [];
    for (let i = 0; i < 5; i++) {
      const letters = [...ARABIC_LETTERS].sort(() => Math.random() - 0.5);
      const oddChar = letters[0].char;
      const commonChar = letters[1].char;

      const options = [commonChar, commonChar, commonChar, oddChar];
      const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
      const correctIndex = shuffledOptions.indexOf(oddChar);

      generated.push({
        options: shuffledOptions,
        correctIndex,
        correctChar: oddChar,
        repeatedChar: commonChar
      });
    }

    setOddQuestions(generated);
    setTimeout(() => {
      audio.speakArabic("أَوْجِدِ الْحَرْفَ الْمُخْتَلِفَ يَا بَطَلْ! اِبْحَثْ عَنِ الْحَرْفِ الَّذِي لَا يُشْبِهُ الْآخَرِينْ.");
    }, 400);
  };

  const handleOddAnswer = (idx: number) => {
    if (selectedOddIndex !== null || oddFinished) return;
    setSelectedOddIndex(idx);
    const q = oddQuestions[oddQuestionIndex];

    if (idx === q.correctIndex) {
      audio.playPopSound();
      audio.playStarSound();
      setOddScore(prev => prev + 1);
      setOddFeedback("correct");
      onUpdateStars(5);

      setTimeout(() => {
        audio.speakArabic("أَحْسَنْتَ! نَعَمْ هَذَا هُوَ الْحَرْفُ الْمُخْتَلِفْ!");
      }, 100);
    } else {
      audio.playBuzzerSound();
      setOddFeedback("incorrect");
      setTimeout(() => {
        audio.speakArabic(`حَاوِلْ مَرَّةً أُخْرَى، الْحَرْفُ الْمُخْتَلِفُ هُوَ حَرْفُ ${ARABIC_LETTERS.find(l => l.char === q.correctChar)?.name || ""}`);
      }, 100);
    }

    setTimeout(() => {
      if (oddQuestionIndex < 4) {
        setOddQuestionIndex(prev => prev + 1);
        setSelectedOddIndex(null);
        setOddFeedback(null);
      } else {
        setOddFinished(true);
        const finalScore = oddScore + (idx === q.correctIndex ? 1 : 0);
        if (finalScore > oddHighScore) {
          setOddHighScore(finalScore);
          localStorage.setItem("odd_high_score", finalScore.toString());
        }
        onUpdateStars(15);
        setTimeout(() => {
          audio.playCheerSound();
          audio.speakArabic(`مُمْتَازْ جِدًّا! لَقَدْ أَنْهَيْتَ لُعْبَةَ الْحَرْفِ الْمُخْتَلِفِ وَحَصَلْتَ عَلَى ${finalScore} نِقَاط!`);
        }, 300);
      }
    }, 2200);
  };

  // --- BALLOON POP GAME STATE ---
  const [balloonScore, setBalloonScore] = useState(0);
  const [targetLetter, setTargetLetter] = useState<Letter | null>(null);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds round
  const [balloonFeedback, setBalloonFeedback] = useState<"correct" | "incorrect" | null>(null);

  // --- MATCHING GAME STATE ---
  interface Card {
    id: number;
    type: "letter" | "image";
    matchId: number; // letter id
    content: string; // letter char or emoji + word
    isFlipped: boolean;
    isMatched: boolean;
    color: string;
  }
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchingMoves, setMatchingMoves] = useState(0);
  const [matchingFinished, setMatchingFinished] = useState(false);

  // --- QUIZ GAME STATE ---
  interface QuizQuestion {
    letter: Letter;
    options: string[]; // 3 letter chars
    correctIndex: number;
  }
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [quizHighScore, setQuizHighScore] = useState<number>(() => {
    const saved = localStorage.getItem("quiz_high_score");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Refs for loops
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------
  // --- 0. QUIZ GAME ENGINE ---
  // ----------------------------------------------------
  const startQuizGame = () => {
    setQuizScore(0);
    setQuizQuestionIndex(0);
    setQuizFinished(false);
    setQuizFeedback(null);
    setSelectedOptionIndex(null);
    setActiveGame("quiz");

    // Generate 5 unique random questions
    const shuffledLetters = [...ARABIC_LETTERS].sort(() => Math.random() - 0.5);
    const selectedLetters = shuffledLetters.slice(0, 5);

    const generatedQuestions: QuizQuestion[] = selectedLetters.map(letter => {
      // Correct answer is the letter itself
      const correctChar = letter.char;
      // Get 2 unique random distractors
      const otherChars = ARABIC_LETTERS.filter(l => l.char !== correctChar).map(l => l.char);
      const distractors = [...otherChars].sort(() => Math.random() - 0.5).slice(0, 2);
      // Mix them and shuffle
      const options = [correctChar, ...distractors].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(correctChar);

      return {
        letter,
        options,
        correctIndex
      };
    });

    setQuizQuestions(generatedQuestions);

    // Speak introduction and first question
    const firstQ = generatedQuestions[0];
    setTimeout(() => {
      audio.speakArabic(`مَرْحَبًا بِكَ فِي مُسَابَقَةِ الْحُرُوف! بَأْيِ حَرْفٍ تَبْدَأُ كَلِمَةُ ${firstQ.letter.word}؟`);
    }, 400);
  };

  const handleQuizAnswer = (optionIndex: number) => {
    if (selectedOptionIndex !== null || quizFinished) return;

    setSelectedOptionIndex(optionIndex);
    const currentQuestion = quizQuestions[quizQuestionIndex];

    if (optionIndex === currentQuestion.correctIndex) {
      // Correct!
      audio.playPopSound();
      audio.playStarSound();
      setQuizScore(prev => prev + 1);
      setQuizFeedback("correct");
      onUpdateStars(5); // +5 stars immediately

      // Speak correct confirmation
      setTimeout(() => {
        audio.speakArabic(`مُمْتَاز! إِجَابَةٌ صَحِيحَة.`);
      }, 400);

      // Advance to next question or finish after 2s
      setTimeout(() => {
        if (quizQuestionIndex < 4) {
          const nextIndex = quizQuestionIndex + 1;
          setQuizQuestionIndex(nextIndex);
          setSelectedOptionIndex(null);
          setQuizFeedback(null);
          // Play instruction for next question
          const nextQ = quizQuestions[nextIndex];
          audio.speakArabic(`بَأْيِ حَرْفٍ تَبْدَأُ كَلِمَةُ ${nextQ.letter.word}؟`);
        } else {
          endQuizGame(quizScore + 1);
        }
      }, 2000);

    } else {
      // Incorrect!
      audio.playBuzzerSound();
      setQuizFeedback("incorrect");
      setTimeout(() => {
        audio.speakArabic(`حَاوِلْ مَرَّةً أُخْرَى.`);
      }, 300);

      // Let them try again - clear selected option after 1.2s
      setTimeout(() => {
        setSelectedOptionIndex(null);
        setQuizFeedback(null);
      }, 1200);
    }
  };

  const endQuizGame = (finalScore: number) => {
    setQuizFinished(true);
    audio.playCheerSound();
    
    // Check and save high score
    if (finalScore > quizHighScore) {
      setQuizHighScore(finalScore);
      localStorage.setItem("quiz_high_score", finalScore.toString());
    }

    // Completion bonus
    onUpdateStars(15);

    setTimeout(() => {
      audio.speakArabic(`أَحْسَنْتَ يَا بَطَلْ! لَقَدْ أَكْمَلْتَ مُسَابَقَةَ الْكَلِمَاتِ وَجَمَعْتَ الْكَثِيرَ مِنَ النُّجُوم!`);
    }, 800);
  };

  // ----------------------------------------------------
  // --- 1. BALLOON POP GAME ENGINE ---
  // ----------------------------------------------------
  const startBalloonGame = () => {
    setBalloonScore(0);
    setTimeLeft(35);
    setGameActive(true);
    setBalloonFeedback(null);
    setActiveGame("balloon");

    // Choose first target letter
    const lettersPool = ARABIC_LETTERS;
    const initialTarget = lettersPool[Math.floor(Math.random() * lettersPool.length)];
    setTargetLetter(initialTarget);

    // Create starting balloons (one correct, others random)
    generateBalloons(initialTarget);

    // Speak target letter
    setTimeout(() => {
      audio.speakArabic(`أَيْن حَرْف الـ ${initialTarget.name}؟`);
    }, 400);
  };

  const generateBalloons = (currentCorrect: Letter) => {
    const balloonColors = [
      "from-rose-400 to-rose-500",
      "from-sky-400 to-sky-500",
      "from-amber-400 to-amber-500",
      "from-emerald-400 to-emerald-500",
      "from-indigo-400 to-indigo-500",
      "from-fuchsia-400 to-fuchsia-500",
      "from-orange-400 to-orange-500"
    ];

    const count = 5; // 5 balloons on screen
    const newBalloons: Balloon[] = [];

    // Ensure at least one correct balloon
    newBalloons.push({
      id: Math.random(),
      letter: currentCorrect,
      x: Math.random() * 70 + 10, // 10% to 80%
      y: -10, // start just below screen
      speed: Math.random() * 0.5 + 0.6,
      color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
      size: Math.floor(Math.random() * 20) + 70 // 70px to 90px
    });

    // Add 4 other random letters
    const otherLetters = ARABIC_LETTERS.filter(l => l.id !== currentCorrect.id);
    for (let i = 0; i < count - 1; i++) {
      const randomLetter = otherLetters[Math.floor(Math.random() * otherLetters.length)];
      newBalloons.push({
        id: Math.random(),
        letter: randomLetter,
        x: Math.random() * 70 + 10,
        y: -(Math.random() * 30 + 10),
        speed: Math.random() * 0.4 + 0.5,
        color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
        size: Math.floor(Math.random() * 20) + 70
      });
    }

    setBalloons(newBalloons);
  };

  // Game timer loop
  useEffect(() => {
    if (gameActive && activeGame === "balloon") {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            endBalloonGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameActive, activeGame]);

  // Balloon floating animation loop
  useEffect(() => {
    if (gameActive && activeGame === "balloon") {
      const updateFrame = () => {
        setBalloons(prev =>
          prev.map(b => {
            let nextY = b.y + b.speed;
            // If balloon floats above screen (y > 110), recycle it down
            if (nextY > 110) {
              nextY = -15;
              const isCorrect = targetLetter && b.letter.id === targetLetter.id;
              // If we recycled the correct balloon without clicking, keep it correct but reset position
              // or pick a random letter to keep variety
              const otherLetters = ARABIC_LETTERS.filter(l => targetLetter ? l.id !== targetLetter.id : true);
              const nextLetter = isCorrect
                ? targetLetter!
                : otherLetters[Math.floor(Math.random() * otherLetters.length)];

              return {
                ...b,
                letter: nextLetter,
                y: nextY,
                x: Math.random() * 70 + 10,
                speed: Math.random() * 0.5 + 0.5
              };
            }
            return { ...b, y: nextY };
          })
        );
        animationRef.current = requestAnimationFrame(updateFrame);
      };
      animationRef.current = requestAnimationFrame(updateFrame);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameActive, activeGame, targetLetter]);

  const speakTargetAgain = () => {
    if (targetLetter) {
      audio.speakArabic(`أَيْن حَرْف الـ ${targetLetter.name}؟`);
    }
  };

  const handleBalloonClick = (balloon: Balloon) => {
    if (!gameActive || !targetLetter) return;

    if (balloon.letter.id === targetLetter.id) {
      // Correct!
      audio.playPopSound();
      audio.playStarSound();
      setBalloonScore(prev => prev + 1);
      setBalloonFeedback("correct");

      // Earn 2 stars per pop immediately
      onUpdateStars(2);

      // Select new target letter
      const lettersPool = ARABIC_LETTERS;
      const nextTarget = lettersPool[Math.floor(Math.random() * lettersPool.length)];
      setTargetLetter(nextTarget);

      // Regenerate balloons with the new correct letter
      generateBalloons(nextTarget);

      // Play vocal confirmation
      setTimeout(() => {
        audio.speakArabic(`مُمْتَاز! جِدْ حَرْفْ الـ ${nextTarget.name}`);
        setBalloonFeedback(null);
      }, 500);

    } else {
      // Incorrect!
      audio.playBuzzerSound();
      setBalloonFeedback("incorrect");
      setTimeout(() => {
        setBalloonFeedback(null);
      }, 800);
    }
  };

  const endBalloonGame = () => {
    setGameActive(false);
    audio.playCheerSound();
    if (balloonScore > progress.balloonHighScore) {
      onUpdateHighScore("balloon", balloonScore);
    }
    // Final reward of 10 stars for completing the session
    onUpdateStars(10);
  };

  // ----------------------------------------------------
  // --- 2. PAIRING MEMORY MATCH GAME ---
  // ----------------------------------------------------
  const startMatchingGame = () => {
    setActiveGame("matching");
    setMatchingMoves(0);
    setMatchingFinished(false);
    setSelectedCards([]);

    // Select 3 random letters for a simple 3 pairs (6 cards) - perfect for KG1!
    // We double them: 3 letter cards, 3 corresponding word/emoji cards.
    const shuffledPool = [...ARABIC_LETTERS].sort(() => Math.random() - 0.5);
    const selectedLetters = shuffledPool.slice(0, 3);

    const letterCards: Card[] = selectedLetters.map((l, i) => ({
      id: l.id * 10, // unique card ID
      type: "letter",
      matchId: l.id,
      content: l.char,
      isFlipped: false,
      isMatched: false,
      color: l.color
    }));

    const imageCards: Card[] = selectedLetters.map((l, i) => ({
      id: l.id * 10 + 1,
      type: "image",
      matchId: l.id,
      content: `${l.emoji} ${l.word}`,
      isFlipped: false,
      isMatched: false,
      color: l.color
    }));

    // Combine and shuffle the 6 cards
    const deck = [...letterCards, ...imageCards].sort(() => Math.random() - 0.5);
    setCards(deck);

    // Speak introductory match instructions
    setTimeout(() => {
      audio.speakArabic("لُعْبَةُ الذَّاكِرَة.. جِدْ الْحَرْفَ وَالصُّورَةَ الْمُطَابِقَةَ لَهْ!");
    }, 400);
  };

  const handleCardClick = (cardId: number) => {
    // Prevent clicking if 2 cards are already flipped
    if (selectedCards.length >= 2) return;

    const clickedCard = cards.find(c => c.id === cardId);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    // Flip the clicked card
    audio.playPopSound();
    setCards(prev => prev.map(c => (c.id === cardId ? { ...c, isFlipped: true } : c)));

    // Say the card's letter/emoji
    const matchLetter = ARABIC_LETTERS.find(l => l.id === clickedCard.matchId);
    if (matchLetter) {
      if (clickedCard.type === "letter") {
        audio.speakArabic(matchLetter.char);
      } else {
        audio.speakArabic(matchLetter.word);
      }
    }

    const newSelection = [...selectedCards, cardId];
    setSelectedCards(newSelection);

    if (newSelection.length === 2) {
      setMatchingMoves(prev => prev + 1);
      const [firstId, secondId] = newSelection;
      const firstCard = cards.find(c => c.id === firstId)!;
      const secondCard = cards.find(c => c.id === secondId)!;

      if (firstCard.matchId === secondCard.matchId) {
        // MATCH!
        setTimeout(() => {
          audio.playStarSound();
          setCards(prev =>
            prev.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setSelectedCards([]);

          // Give +5 stars immediately
          onUpdateStars(5);

          // Check if all matched
          setCards(currentCards => {
            const allMatched = currentCards.every(c =>
              c.id === firstId || c.id === secondId ? true : c.isMatched
            );
            if (allMatched) {
              setMatchingFinished(true);
              audio.playCheerSound();
              const finalScore = Math.max(1, 20 - matchingMoves); // calculated kids score
              if (finalScore > progress.matchingHighScore) {
                onUpdateHighScore("matching", finalScore);
              }
              // Star bonus completion
              onUpdateStars(15);
              setTimeout(() => {
                audio.speakArabic("مُمْتَاز يا بَطَلْ! لَقَدْ طَابَقْتَ جَمِيعَ الْحُرُوفْ وَالْصُّوَر!");
              }, 600);
            }
            return currentCards;
          });
        }, 800);
      } else {
        // NO MATCH - Flip back
        setTimeout(() => {
          audio.playBuzzerSound();
          setCards(prev =>
            prev.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setSelectedCards([]);
        }, 1200);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-teal-50/50 to-amber-50/40 p-4 md:p-6" id="games-section">
      {/* Selection screen */}
      {!activeGame ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 md:py-10" id="game-selection-screen">
          <div className="bg-amber-100 border-4 border-amber-300 text-amber-500 p-4 rounded-full mb-4 animate-bounce">
            <Gamepad2 className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-black font-sans text-slate-800 mb-2">ألعاب تفاعلية مسلية ومسابقات 🎈</h2>
          <p className="text-md md:text-lg text-slate-600 font-sans mb-8 max-w-lg">
            العب مع الحروف السحرية، طابق الصور بالكلمات، واجتز مسابقة التحدي لتجمع النجوم وتحصل على كؤوس الفوز المذهلة! 🏆
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
            {/* Game 1: Balloon Pop */}
            <button
              onClick={startBalloonGame}
              className="flex flex-col items-center p-6 rounded-3xl bg-white border-4 border-b-8 border-pink-100 hover:border-pink-300 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-center group cursor-pointer"
            >
              <span className="text-5xl mb-3 animate-pulse">🎈</span>
              <h3 className="text-xl font-black font-sans text-pink-600 mb-2 group-hover:scale-105 transition-transform">
                لعبة بالونات الحروف
              </h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed flex-1">
                استمع للحرف وقم بتفجير البالون الطائر الصحيح لجمع النجوم في أسرع وقت!
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold font-sans text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                <Trophy className="w-3.5 h-3.5" />
                <span>أعلى مجموع نقاط: {progress.balloonHighScore}</span>
              </div>
            </button>

            {/* Game 2: Matching Game */}
            <button
              onClick={startMatchingGame}
              className="flex flex-col items-center p-6 rounded-3xl bg-white border-4 border-b-8 border-cyan-100 hover:border-cyan-300 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-center group cursor-pointer"
            >
              <span className="text-5xl mb-3">🃏</span>
              <h3 className="text-xl font-black font-sans text-cyan-600 mb-2 group-hover:scale-105 transition-transform">
                لعبة تطابق الذاكرة
              </h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed flex-1">
                اكشف الكروت السحرية وطابق كل حرف بصورة الحيوان والكلمة الصحيحة!
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold font-sans text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                <Trophy className="w-3.5 h-3.5" />
                <span>أعلى مجموع نقاط: {progress.matchingHighScore}</span>
              </div>
            </button>

            {/* Game 3: Quiz Game (NEW!) */}
            <button
              onClick={startQuizGame}
              className="flex flex-col items-center p-6 rounded-3xl bg-white border-4 border-b-8 border-violet-100 hover:border-violet-300 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-center group cursor-pointer"
            >
              <span className="text-5xl mb-3">🏆</span>
              <h3 className="text-xl font-black font-sans text-violet-600 mb-2 group-hover:scale-105 transition-transform">
                مسابقة الحروف السحرية
              </h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed flex-1">
                مسابقة شيقة وممتعة! استمع للكلمة والرمز، واختر الحرف الأول الصحيح لتركيب قطار الكلمات!
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold font-sans text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                <Trophy className="w-3.5 h-3.5" />
                <span>أعلى مجموع نقاط: {quizHighScore} / 5</span>
              </div>
            </button>

            {/* Game 4: Find the Odd Letter Game (NEW!) */}
            <button
              onClick={startOddGame}
              className="flex flex-col items-center p-6 rounded-3xl bg-white border-4 border-b-8 border-emerald-100 hover:border-emerald-300 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all text-center group cursor-pointer"
            >
              <span className="text-5xl mb-3">🔍</span>
              <h3 className="text-xl font-black font-sans text-emerald-600 mb-2 group-hover:scale-105 transition-transform">
                لعبة الحرف المختلف
              </h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed flex-1">
                أوجد الحرف الغريب الذي لا يشبه رفاقه الفقاعات الثلاثة الأخرى واكسب النجوم بسرعة!
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold font-sans text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                <Trophy className="w-3.5 h-3.5" />
                <span>أعلى مجموع نقاط: {oddHighScore} / 5</span>
              </div>
            </button>
          </div>
        </div>
      ) : activeGame === "balloon" ? (
        // --- BALLOON POP GAME PLAY UI ---
        <div className="flex-1 flex flex-col bg-white rounded-3xl border-4 border-pink-100 shadow-lg overflow-hidden relative" id="balloon-game-panel">
          {/* Header Stats bar */}
          <div className="bg-pink-50/50 border-b border-pink-100 px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎈</span>
              <h3 className="text-xl font-extrabold font-sans text-pink-600">فرقعة البالونات</h3>
            </div>

            {/* Target Instructions panel */}
            {gameActive && targetLetter && (
              <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl border-2 border-pink-200 shadow-sm animate-pulse">
                <span className="text-xs font-bold font-sans text-slate-500">ابحث عن:</span>
                <span className="text-2xl font-extrabold font-sans text-pink-600 bg-pink-50 w-9 h-9 rounded-full flex items-center justify-center">
                  {targetLetter.char}
                </span>
                <span className="text-sm font-bold font-sans text-slate-700">({targetLetter.name})</span>
                <button
                  onClick={speakTargetAgain}
                  className="p-1.5 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200"
                  title="استمع مجدداً"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-mono font-bold text-amber-700 text-sm">النقاط: {balloonScore}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="font-mono font-bold text-rose-700 text-sm">{timeLeft} ثانية</span>
              </div>
            </div>
          </div>

          {/* Balloon active field */}
          <div className="flex-1 relative bg-gradient-to-b from-sky-50 to-cyan-100/30 overflow-hidden min-h-[380px]">
            {gameActive ? (
              <>
                {balloons.map(balloon => (
                  <button
                    key={balloon.id}
                    onClick={() => handleBalloonClick(balloon)}
                    style={{
                      left: `${balloon.x}%`,
                      bottom: `${balloon.y}%`,
                      width: `${balloon.size}px`,
                      height: `${balloon.size * 1.25}px`
                    }}
                    className={`absolute rounded-full shadow-lg flex flex-col items-center justify-center text-white cursor-pointer active:scale-95 transition-all select-none bg-gradient-to-b ${balloon.color}`}
                  >
                    {/* Balloon string knot */}
                    <div className="absolute -bottom-1 w-3 h-3 bg-current rotate-45 rounded-sm" />
                    {/* Balloon text */}
                    <span className="text-3xl font-extrabold font-sans select-none drop-shadow-sm">
                      {balloon.letter.char}
                    </span>
                  </button>
                ))}

                {/* Feedbacks on balloon click */}
                {balloonFeedback === "correct" && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white font-sans text-2xl font-bold px-6 py-3 rounded-full shadow-lg animate-ping">
                    أحسنت! 🌟
                  </div>
                )}
                {balloonFeedback === "incorrect" && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white font-sans text-2xl font-bold px-6 py-3 rounded-full shadow-lg animate-bounce">
                    حاول مجدداً 🐥
                  </div>
                )}
              </>
            ) : (
              // Round Over Screen
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center text-center p-6 z-10 animate-fade-in">
                <span className="text-6xl mb-4">🎉</span>
                <h4 className="text-3xl font-extrabold font-sans text-slate-800 mb-2">انتهى الوقت يا بطل!</h4>
                <p className="text-lg text-slate-600 font-sans mb-4 max-w-sm">
                  لقد حصلت على <span className="text-pink-500 font-bold">{balloonScore} نقطة</span>!
                  وجمعت <span className="text-amber-500 font-bold">+{balloonScore * 2 + 10} نجوم</span> ذهبية ساطعة.
                </p>

                {balloonScore > progress.balloonHighScore && (
                  <div className="mb-6 flex items-center gap-2 bg-amber-50 border-2 border-amber-300 text-amber-700 font-sans font-bold px-4 py-2 rounded-2xl shadow-sm">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>رقم قياسي جديد! 🏆</span>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={startBalloonGame}
                    className="px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-sans font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    العب مرة أخرى 🔄
                  </button>
                  <button
                    onClick={() => setActiveGame(null)}
                    className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold transition-all cursor-pointer"
                  >
                    الخروج للرئيسية 🚪
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeGame === "matching" ? (
        // --- MEMORY MATCHING GAME UI ---
        <div className="flex-1 flex flex-col bg-white rounded-3xl border-4 border-cyan-100 shadow-lg overflow-hidden" id="matching-game-panel">
          {/* Header Stats bar */}
          <div className="bg-cyan-50/50 border-b border-cyan-100 px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🃏</span>
              <h3 className="text-xl font-extrabold font-sans text-cyan-600">تطابق الذاكرة الممتع</h3>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-sans font-medium text-slate-600">عدد المحاولات: {matchingMoves}</span>

              <button
                onClick={startMatchingGame}
                className="p-2 rounded-xl bg-white border border-cyan-200 text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
                title="إعادة بدء اللعبة"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards board */}
          <div className="flex-1 p-6 md:p-10 bg-slate-50/50 flex items-center justify-center min-h-[380px]">
            {!matchingFinished ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-xl w-full h-full">
                {cards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className={`aspect-[4/3] rounded-3xl flex items-center justify-center text-center transition-all duration-300 transform font-sans font-bold shadow-md cursor-pointer relative overflow-hidden ${
                      card.isFlipped || card.isMatched
                        ? `${card.color} border-4 border-white ring-4 ring-offset-2 ring-slate-200 scale-100`
                        : "bg-gradient-to-tr from-cyan-400 to-indigo-500 border-4 border-white ring-4 ring-slate-100 text-white hover:scale-102"
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? (
                      <span className={`text-4xl select-none ${card.type === "letter" ? "text-slate-800" : "text-slate-700"}`}>
                        {card.content}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 select-none text-white">
                        <HelpCircle className="w-10 h-10 animate-pulse text-white/90" />
                        <span className="text-xs font-sans">افتح الكرت</span>
                      </div>
                    )}

                    {/* Checkmark overlay for completed matches */}
                    {card.isMatched && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                        <Star className="w-3.5 h-3.5 fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              // Match Finished Overlay
              <div className="flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                <div className="bg-amber-100 border-4 border-amber-300 rounded-full p-5 text-amber-500 mb-4 animate-bounce">
                  <Sparkles className="w-14 h-14" />
                </div>
                <h4 className="text-3xl font-extrabold font-sans text-slate-800 mb-2">ممتاز يا بطل الذاكرة! 🏆</h4>
                <p className="text-lg text-slate-600 font-sans mb-6 max-w-sm">
                  لقد حللت لعبة التطابق بـ <span className="text-cyan-600 font-bold">{matchingMoves} محاولة</span> فقط!
                  وحصلت على مكافأة <span className="text-amber-500 font-bold">+30 نجمة</span> ذهبية.
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={startMatchingGame}
                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-sans font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    العب مرة أخرى 🔄
                  </button>
                  <button
                    onClick={() => setActiveGame(null)}
                    className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold transition-all cursor-pointer"
                  >
                    الخروج للرئيسية 🚪
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeGame === "quiz" ? (
        // --- MAGIC QUIZ GAME PLAY UI ---
        <div className="flex-1 flex flex-col bg-white rounded-3xl border-4 border-violet-100 shadow-lg overflow-hidden relative" id="quiz-game-panel">
          {/* Header Stats bar */}
          <div className="bg-violet-50/50 border-b border-violet-100 px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <h3 className="text-xl font-extrabold font-sans text-violet-600">مسابقة الحروف السحرية</h3>
            </div>

            {/* Question Progress Tracker */}
            {!quizFinished && quizQuestions.length > 0 && (
              <div className="bg-violet-100 border border-violet-200 px-4 py-1.5 rounded-full text-violet-800 font-black text-xs font-sans">
                سؤال {quizQuestionIndex + 1} من 5
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-mono font-bold text-amber-700 text-sm">النقاط: {quizScore}</span>
              </div>
              <button
                onClick={startQuizGame}
                className="p-1.5 rounded-xl bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                title="إعادة بدء المسابقة"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Quiz Area */}
          <div className="flex-1 p-6 bg-gradient-to-b from-violet-50/20 to-indigo-100/10 flex flex-col items-center justify-center min-h-[380px]">
            {!quizFinished && quizQuestions.length > 0 ? (
              <div className="w-full max-w-xl flex flex-col gap-6" id="active-question-card">
                {/* Clue Prompt Card */}
                <div className="bg-white border-4 border-b-8 border-violet-200 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-violet-100/40 rounded-full translate-x-1/3 -translate-y-1/3" />
                  
                  <div className="flex-1 text-right">
                    <h4 className="text-md font-bold font-sans text-slate-500 mb-1">اسمع الكلمة واختر الحرف الأول:</h4>
                    <p className="text-2xl md:text-3xl font-black font-sans text-indigo-950 flex items-center gap-3">
                      <span>بأي حرف تبدأ كلمة</span>
                      <span className="text-violet-600 border-b-4 border-dotted border-violet-300 px-2 bg-violet-50 rounded-xl animate-pulse">
                        {quizQuestions[quizQuestionIndex].letter.word}
                      </span>
                      <span>؟</span>
                    </p>
                    {/* Vocal Repeat button */}
                    <button
                      onClick={() => audio.speakArabic(`بَأْيِ حَرْفٍ تَبْدَأُ كَلِمَةُ ${quizQuestions[quizQuestionIndex].letter.word}؟`)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-100 text-xs font-bold font-sans cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>انطق مجدداً 🔊</span>
                    </button>
                  </div>

                  {/* Gigantic Clue Emoji */}
                  <span className="text-6xl md:text-7xl animate-bounce filter drop-shadow-md select-none">
                    {quizQuestions[quizQuestionIndex].letter.emoji}
                  </span>
                </div>

                {/* 3 Large Circular Option Bubbles */}
                <div className="grid grid-cols-3 gap-4 md:gap-6">
                  {quizQuestions[quizQuestionIndex].options.map((option, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    const isCorrect = idx === quizQuestions[quizQuestionIndex].correctIndex;
                    
                    let btnStyle = "bg-white border-slate-200 text-slate-800 hover:border-violet-300 hover:bg-violet-50/50 hover:scale-105";
                    
                    if (selectedOptionIndex !== null) {
                      if (isSelected) {
                        btnStyle = isCorrect 
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200 scale-110"
                          : "bg-rose-500 border-rose-600 text-white shadow-rose-200 scale-95";
                      } else if (isCorrect) {
                        // Reveal the correct option in green if user selected the wrong one
                        btnStyle = "bg-emerald-100 border-emerald-400 text-emerald-800";
                      } else {
                        btnStyle = "bg-slate-50 border-slate-100 text-slate-300 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        disabled={selectedOptionIndex !== null}
                        className={`aspect-square rounded-full border-4 border-b-8 flex flex-col items-center justify-center transition-all duration-300 shadow-md font-sans font-black text-4xl md:text-5xl cursor-pointer select-none relative ${btnStyle}`}
                      >
                        <span>{option}</span>
                        {/* Overlay feedback badge */}
                        {selectedOptionIndex !== null && isSelected && isCorrect && (
                          <span className="absolute -top-1 -right-1 bg-white border-2 border-emerald-500 text-emerald-500 text-xs px-2 py-0.5 rounded-full font-black animate-ping">
                            صح! ⭐
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Feedback Overlay Text */}
                {quizFeedback === "correct" && (
                  <p className="text-center font-black text-xl text-emerald-600 font-sans animate-bounce mt-2">
                    إجابة رائعة يا بطل الحروف! 🌟🎉 (+5 نجوم)
                  </p>
                )}
                {quizFeedback === "incorrect" && (
                  <p className="text-center font-black text-xl text-rose-500 font-sans animate-shake mt-2">
                    حاول مرة أخرى.. ابحث عن الحرف الأول! 🤔
                  </p>
                )}
              </div>
            ) : (
              // Quiz Ended Screen
              <div className="flex flex-col items-center justify-center text-center p-6 animate-fade-in max-w-sm">
                <div className="bg-amber-100 border-4 border-amber-300 rounded-full p-5 text-amber-500 mb-4 animate-bounce">
                  <Trophy className="w-16 h-16" />
                </div>
                <h4 className="text-3xl font-black font-sans text-violet-950 mb-2">تهانينا يا بطل! 🏆</h4>
                <p className="text-md text-slate-600 font-sans mb-4 leading-relaxed">
                  لقد أجبت بشكل رائع وحققت <span className="text-violet-600 font-extrabold">{quizScore} من 5</span> إجابات صحيحة!
                  وحصلت على مكافأة <span className="text-amber-500 font-bold">+{quizScore * 5 + 15} نجوم</span> ذهبية ساطعة. ⭐
                </p>

                {quizScore > quizHighScore && (
                  <div className="mb-6 flex items-center gap-2 bg-amber-50 border-2 border-amber-300 text-amber-700 font-sans font-bold px-4 py-2 rounded-2xl shadow-sm">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>رقم قياسي جديد في المسابقة! 🏆</span>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={startQuizGame}
                    className="px-6 py-3 rounded-2xl bg-violet-600 border-b-4 border-violet-800 hover:bg-violet-700 text-white font-sans font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    العب مرة أخرى 🔄
                  </button>
                  <button
                    onClick={() => setActiveGame(null)}
                    className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold transition-all cursor-pointer"
                  >
                    الخروج للرئيسية 🚪
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // --- ODD ONE OUT GAME PLAY UI ---
        <div className="flex-1 flex flex-col bg-white rounded-3xl border-4 border-emerald-100 shadow-lg overflow-hidden relative" id="odd-game-panel">
          {/* Header Stats bar */}
          <div className="bg-emerald-50/50 border-b border-emerald-100 px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              <h3 className="text-xl font-extrabold font-sans text-emerald-600">لعبة الحرف المختلف</h3>
            </div>

            {/* Question Progress Tracker */}
            {!oddFinished && oddQuestions.length > 0 && (
              <div className="bg-emerald-100 border border-emerald-200 px-4 py-1.5 rounded-full text-emerald-800 font-black text-xs font-sans">
                سؤال {oddQuestionIndex + 1} من 5
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-mono font-bold text-amber-700 text-sm">النقاط: {oddScore}</span>
              </div>
              <button
                onClick={startOddGame}
                className="p-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="إعادة بدء اللعبة"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Game Area */}
          <div className="flex-1 p-6 bg-gradient-to-b from-emerald-50/20 to-teal-100/10 flex flex-col items-center justify-center min-h-[380px]">
            {!oddFinished && oddQuestions.length > 0 ? (
              <div className="w-full max-w-xl flex flex-col gap-6" id="active-odd-card">
                {/* Clue Prompt Card */}
                <div className="bg-white border-4 border-b-8 border-emerald-200 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-md relative overflow-hidden text-right">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100/40 rounded-full translate-x-1/3 -translate-y-1/3" />
                  
                  <div className="flex-1">
                    <h4 className="text-md font-bold font-sans text-slate-500 mb-1">ابحث يا ذكي عن الحرف الغريب:</h4>
                    <p className="text-2xl md:text-3xl font-black font-sans text-slate-900 leading-relaxed">
                      هناك حرف واحد مختلف بين هذه الفقاعات الجميلة.. اضغط عليه! 🔎
                    </p>
                    {/* Vocal Repeat button */}
                    <button
                      onClick={() => audio.speakArabic("أَوْجِدِ الْحَرْفَ الْمُخْتَلِفَ بَيْنَ الْحُرُوفِ الْأَرْبَعَة يَا صَدِيقِي الْبَطَلْ!")}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 text-xs font-bold font-sans cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>استمع للتوجيه 🔊</span>
                    </button>
                  </div>
                </div>

                {/* 4 Large Bubble Options */}
                <div className="grid grid-cols-4 gap-3 md:gap-4">
                  {oddQuestions[oddQuestionIndex].options.map((option, idx) => {
                    const isSelected = selectedOddIndex === idx;
                    const isCorrect = idx === oddQuestions[oddQuestionIndex].correctIndex;
                    
                    let btnStyle = "bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50 hover:scale-110 active:scale-95";
                    
                    if (selectedOddIndex !== null) {
                      if (isSelected) {
                        btnStyle = isCorrect 
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200 scale-110 animate-bounce"
                          : "bg-rose-500 border-rose-600 text-white shadow-rose-200 scale-95";
                      } else if (isCorrect) {
                        btnStyle = "bg-emerald-100 border-emerald-400 text-emerald-800";
                      } else {
                        btnStyle = "bg-slate-50 border-slate-100 text-slate-300 opacity-60";
                      }
                    }

                    const colors = ["bg-sky-50 border-sky-300 hover:bg-sky-100", "bg-rose-50 border-rose-300 hover:bg-rose-100", "bg-amber-50 border-amber-300 hover:bg-amber-100", "bg-purple-50 border-purple-300 hover:bg-purple-100"];
                    const bubbleBg = selectedOddIndex === null ? colors[idx % 4] : "";

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOddAnswer(idx)}
                        disabled={selectedOddIndex !== null}
                        className={`aspect-square rounded-full border-4 border-b-8 flex flex-col items-center justify-center transition-all duration-300 shadow-md font-sans font-black text-4xl md:text-5xl cursor-pointer select-none relative ${bubbleBg} ${btnStyle}`}
                      >
                        <span>{option}</span>
                        {selectedOddIndex !== null && isSelected && isCorrect && (
                          <span className="absolute -top-1 -right-1 bg-white border-2 border-emerald-500 text-emerald-500 text-xs px-2 py-0.5 rounded-full font-black animate-ping">
                            صح! ⭐
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Feedback Overlay Text */}
                {oddFeedback === "correct" && (
                  <p className="text-center font-black text-xl text-emerald-600 font-sans animate-bounce mt-2">
                    أنت عبقري الحروف! نعم، هذا هو الحرف المختلف! 🌟🎉 (+5 نجوم)
                  </p>
                )}
                {oddFeedback === "incorrect" && (
                  <p className="text-center font-black text-xl text-rose-500 font-sans animate-shake mt-2">
                    حاول مجدداً.. ركِّز جيداً في أشكال الحروف! 🤔
                  </p>
                )}
              </div>
            ) : (
              // Odd Ended Screen
              <div className="flex flex-col items-center justify-center text-center p-6 animate-fade-in max-w-sm">
                <div className="bg-amber-100 border-4 border-amber-300 rounded-full p-5 text-amber-500 mb-4 animate-bounce">
                  <Trophy className="w-16 h-16" />
                </div>
                <h4 className="text-3xl font-black font-sans text-emerald-950 mb-2">تهانينا يا ذكي! 🏆</h4>
                <p className="text-md text-slate-600 font-sans mb-4 leading-relaxed">
                  لقد كشفت الحروف المختلفة بمهارة وحققت <span className="text-emerald-600 font-extrabold">{oddScore} من 5</span> نقاط كاملة!
                  وحصلت على مكافأة إضافية <span className="text-amber-500 font-bold">+{oddScore * 5 + 15} نجوم</span> ذهبية ساطعة. ⭐
                </p>

                {oddScore > oddHighScore && (
                  <div className="mb-6 flex items-center gap-2 bg-amber-50 border-2 border-amber-300 text-amber-700 font-sans font-bold px-4 py-2 rounded-2xl shadow-sm">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>رقم قياسي جديد في لعبة الاختلاف! 🏆</span>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={startOddGame}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 border-b-4 border-emerald-800 hover:bg-emerald-700 text-white font-sans font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    العب مرة أخرى 🔄
                  </button>
                  <button
                    onClick={() => setActiveGame(null)}
                    className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold transition-all cursor-pointer"
                  >
                    الخروج للرئيسية 🚪
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
