import React from "react";
import { Badge, UserProgress } from "../types";
import { REWARD_BADGES } from "../data/letters";
import { Trophy, Star, Flame, Sparkles, Check, Lock } from "lucide-react";
import { audio } from "../utils/audio";

interface RewardsProps {
  progress: UserProgress;
}

export default function Rewards({ progress }: RewardsProps) {
  // Check if badge is unlocked
  const isUnlocked = (badgeId: string) => {
    return progress.unlockedBadges.includes(badgeId);
  };

  const handleBadgeClick = (badge: Badge) => {
    const unlocked = isUnlocked(badge.id);
    if (unlocked) {
      audio.playStarSound();
      audio.speakArabic(`لَقَدْ حَصَلْتَ عَلَى وِسَامْ: ${badge.title}! ${badge.description}`);
    } else {
      audio.playBuzzerSound();
      audio.speakArabic(`هَذَا الْوِسَامْ مُقْفَلْ. تَحْتَاجْ إِلَى ${badge.requiredStars} نَجْمَة لِفَتْحِهْ!`);
    }
  };

  // Milestone points along the star road
  const milestones = [
    { stars: 15, name: "البداية 🌟" },
    { stars: 30, name: "النشيط 🏃" },
    { stars: 50, name: "الذكي 🧠" },
    { stars: 75, name: "المتألق ✨" },
    { stars: 100, name: "البطل 🏆" },
    { stars: 150, name: "الملك 👑" }
  ];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 bg-gradient-to-b from-amber-50/60 to-orange-50/40" id="rewards-section">
      {/* Top statistics banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5" id="rewards-stats">
        {/* Streak card */}
        <div className="bg-white p-5 rounded-3xl border-4 border-orange-100 shadow-md flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="bg-orange-100 text-orange-500 p-3 rounded-2xl animate-pulse">
            <Flame className="w-10 h-10 fill-orange-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-sans text-slate-500">الالتزام اليومي</h4>
            <p className="text-2xl font-black font-sans text-orange-600 leading-tight">
              {progress.streak} {progress.streak === 1 ? "يوم" : "أيام"} نشاط 🔥
            </p>
            <p className="text-[11px] text-slate-400 font-sans">ثابر يومياً لرفع الالتزام!</p>
          </div>
        </div>

        {/* Total Stars card */}
        <div className="bg-white p-5 rounded-3xl border-4 border-amber-100 shadow-md flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="bg-amber-100 text-amber-500 p-3 rounded-2xl animate-bounce">
            <Star className="w-10 h-10 fill-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-sans text-slate-500">رصيد النجوم الكلي</h4>
            <p className="text-2xl font-black font-sans text-amber-600 leading-tight">
              {progress.stars} نَجْمَة 🌟
            </p>
            <p className="text-[11px] text-slate-400 font-sans">اجمع المزيد بحل التدريبات والكتابة!</p>
          </div>
        </div>

        {/* Unlocked Badges count card */}
        <div className="bg-white p-5 rounded-3xl border-4 border-yellow-100 shadow-md flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="bg-yellow-100 text-yellow-600 p-3 rounded-2xl">
            <Trophy className="w-10 h-10 fill-yellow-200" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-sans text-slate-500">أوسمتي المحققة</h4>
            <p className="text-2xl font-black font-sans text-yellow-600 leading-tight">
              {progress.unlockedBadges.length} من {REWARD_BADGES.length} أوسمة 🏆
            </p>
            <p className="text-[11px] text-slate-400 font-sans">افتح جميع الأوسمة لتصبح الملك!</p>
          </div>
        </div>
      </div>

      {/* Star Trail roadmap milestone map */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border-4 border-amber-100 shadow-md" id="rewards-star-trail">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
          <h3 className="text-xl font-black font-sans text-slate-800">طَرِيقُ النُّجُومِ وَالْمُفَاجَآتِ السَّعِيدَة</h3>
        </div>
        <p className="text-sm text-slate-500 font-sans mb-8">
          تقدَّم على حجر الألعاب السحري بجمع النجوم وافتح الصناديق والمفاجآت المغلقة!
        </p>

        {/* The winding stepping stones path */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 relative py-4">
          {milestones.map((milestone, index) => {
            const reached = progress.stars >= milestone.stars;
            return (
              <div key={index} className="flex flex-col items-center">
                {/* Stepping stone circle */}
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex flex-col items-center justify-center border-4 font-sans font-bold transition-all relative ${
                    reached
                      ? "bg-amber-400 border-amber-500 text-slate-900 shadow-md scale-105"
                      : "bg-slate-100 border-slate-200 text-slate-400"
                  }`}
                >
                  <span className="text-xs font-mono font-bold leading-none">{milestone.stars}</span>
                  <span className="text-lg md:text-xl font-black font-sans">⭐</span>

                  {/* Tick marker */}
                  {reached && (
                    <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <span className={`text-xs md:text-sm font-bold font-sans mt-2.5 ${reached ? "text-slate-800 font-black" : "text-slate-400"}`}>
                  {milestone.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Cabinet */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border-4 border-yellow-100 shadow-md" id="rewards-badges-cabinet">
        <div className="flex items-center gap-2.5 mb-6">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-black font-sans text-slate-800">خِزَانَةُ الْأَوْسِمَةِ السِّحْرِيَّة</h3>
        </div>
        <p className="text-sm text-slate-500 font-sans mb-8">
          اضغط على أي وسام لتستمع إلى شروطه ومميزاته بصوت المعلم اللطيف!
        </p>

        {/* Grid of badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {REWARD_BADGES.map((badge) => {
            const unlocked = isUnlocked(badge.id);
            return (
              <button
                key={badge.id}
                onClick={() => handleBadgeClick(badge)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-right cursor-pointer hover:shadow-md ${
                  unlocked
                    ? "bg-amber-50/50 border-amber-300 text-slate-800"
                    : "bg-slate-50 border-slate-200 text-slate-400 opacity-70"
                }`}
              >
                {/* Badge Emoji Circle */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm ${
                    unlocked ? "bg-amber-100" : "bg-slate-200 grayscale"
                  }`}
                >
                  {badge.emoji}
                </div>

                <div className="flex-1">
                  <h4 className="font-extrabold font-sans text-md flex items-center gap-1.5">
                    <span>{badge.title}</span>
                    {!unlocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </h4>
                  <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">{badge.description}</p>
                  <p className="text-[10px] font-sans font-bold mt-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block border border-amber-100">
                    المتطلب: {badge.requiredStars} نجمة
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
