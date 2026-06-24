export interface Letter {
  id: number;
  char: string;
  name: string;
  word: string;
  englishWord: string;
  emoji: string;
  color: string; // Tailwind background color class, e.g. "bg-amber-100"
  textColor: string; // Tailwind text color class, e.g. "text-amber-600"
  borderColor: string; // Tailwind border color class, e.g. "border-amber-300"
  hoverColor: string; // Tailwind hover color class, e.g. "hover:bg-amber-200"
  accentColor: string; // Tailwind active background, e.g. "bg-amber-500"
  soundText: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requiredStars: number;
}

export interface UserProgress {
  stars: number;
  streak: number;
  lastActive: string; // ISO date string YYYY-MM-DD
  completedToday: string[]; // List of letters studied today
  unlockedBadges: string[]; // List of badge IDs
  completedWriting: string[]; // List of letter chars successfully written
  balloonHighScore: number;
  matchingHighScore: number;
}
