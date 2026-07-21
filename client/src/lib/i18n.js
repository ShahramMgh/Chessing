// Internationalisation — English / Français / فارسی.
// This module is PURE (no store import) so it can be used from anywhere,
// including the Zustand store. The `useI18n` hook (separate file) wires the
// current language from the store into components.

export const LANGS = ['en', 'fr', 'fa'];

export const LANG_META = {
  en: { code: 'en', label: 'EN', name: 'English', dir: 'ltr' },
  fr: { code: 'fr', label: 'FR', name: 'Français', dir: 'ltr' },
  fa: { code: 'fa', label: 'فا', name: 'فارسی', dir: 'rtl' },
};

// Full language names handed to the coach LLM so it replies in the right tongue.
export const LANG_LLM_NAME = { en: 'English', fr: 'French', fa: 'Persian (Farsi)' };

// Move-quality visuals are language-independent; labels live in the dictionary.
export const QUALITY = {
  brilliant: { emoji: '✨', color: '#14b8a6' },
  good: { emoji: '👍', color: '#22c55e' },
  inaccuracy: { emoji: '⚠️', color: '#eab308' },
  mistake: { emoji: '❗', color: '#f97316' },
  blunder: { emoji: '💥', color: '#ef4444' },
};

export const DICT = {
  en: {
    appTitle: 'ChessMentor',
    headerSubtitle: 'Your smart chess-strategy coach',
    language: 'Language',
    coachName: 'Master Kian',
    coachTagline: 'Chess strategy coach',
    coachThinking: 'Master Kian is analyzing…',
    coachActive: 'Coach on',
    coachInactive: 'Coach off',
    coachIntro:
      "Hi! I'm Master Kian. We'll play together and you'll pick up real strategic plans along the way. Good luck!",
    silentModeMessage:
      "Silent mode is on. The coach stays quiet — you'll only see the evaluation bar and move-quality badges. Switch modes to get strategic plans.",
    planChip: 'Suggested plan shown on the board with arrows',
    coachError: "Couldn't reach the coach.",
    coachTimeout: 'The coach took too long. Please try again.',
    newGame: 'New game',
    resign: 'Resign',
    playAs: 'Play as',
    white: 'White',
    black: 'Black',
    difficulty: 'Opponent level',
    level: 'Level',
    mode: 'Mode',
    modes: { silent: 'Silent', coached: 'Coached', ask: 'Ask coach' },
    modeHints: {
      silent: 'Just the eval bar and move-quality badges',
      coached: 'The coach gives plans at key moments',
      ask: 'Ask the coach anytime',
    },
    skillLevels: {
      beginner: 'Beginner',
      novice: 'Novice',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      master: 'Master',
    },
    askPlaceholder: "e.g. What's my plan here?",
    send: 'Ask',
    undo: 'Undo',
    hint: 'Hint',
    sound: 'Sound',
    voice: 'Coach voice',
    listen: 'Read aloud',
    pieces: { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' },
    threat: {
      capture: 'Careful — I can win your {piece}!',
      mate: "Careful — I'm threatening checkmate!",
      check: 'Careful — I have a dangerous check!',
      general: 'Careful — I have a strong threat here!',
    },
    thinking: 'Thinking…',
    yourTurn: 'Your turn',
    engineTurn: "Opponent's turn",
    player: 'You',
    opponent: 'Stockfish',
    evalLabel: 'Evaluation',
    movesTitle: 'Moves',
    noMovesYet: 'No moves yet.',
    summaryTitle: 'Game summary',
    playAgain: 'Play again',
    close: 'Close',
    gameOver: 'Game over',
    checkmate: 'Checkmate',
    stalemate: 'Stalemate',
    draw: 'Draw',
    youWin: 'You win! 🎉',
    youLose: 'Opponent wins',
    drawResult: "It's a draw",
    stats: {
      brilliant: 'Brilliant',
      good: 'Good',
      inaccuracy: 'Inaccuracy',
      mistake: 'Mistake',
      blunder: 'Blunder',
      accuracy: 'Accuracy',
      avgLoss: 'Avg. loss (cp)',
    },
    moveQuality: {
      brilliant: 'Brilliant!',
      good: 'Good',
      inaccuracy: 'Inaccuracy',
      mistake: 'Mistake',
      blunder: 'Blunder!',
    },
    difficultyUp: "You're doing great! Want to raise the opponent's level?",
    difficultyDown: "No worries — want to lower the opponent's level a bit?",
    raise: 'Raise',
    lower: 'Lower',
    dismiss: 'No, keep going',
    engineLoading: 'Loading chess engine…',
    engineError: 'Failed to load the chess engine',
    mate: 'Mate in',
    takeaways: {
      accurate: 'Very accurate game — you executed the plans well! 👏',
      noBlunder: 'No blunders today — great focus. 💪',
      brilliant: "You found a brilliant move! You're developing an eye for combinations. ✨",
      default: 'Every game is a lesson. Focus on pawn structure and king safety. Keep going! 🌱',
    },
  },

  fr: {
    appTitle: 'ChessMentor',
    headerSubtitle: 'Votre coach intelligent de stratégie',
    language: 'Langue',
    coachName: 'Maître Kian',
    coachTagline: "Coach de stratégie d'échecs",
    coachThinking: 'Maître Kian analyse…',
    coachActive: 'Coach actif',
    coachInactive: 'Coach inactif',
    coachIntro:
      "Bonjour ! Je suis Maître Kian. Nous allons jouer ensemble et tu apprendras de vrais plans stratégiques en chemin. Bonne chance !",
    silentModeMessage:
      "Le mode silencieux est activé. Le coach reste discret — tu ne vois que la barre d'évaluation et les badges de qualité. Change de mode pour recevoir des plans.",
    planChip: "Plan suggéré affiché sur l'échiquier par des flèches",
    coachError: 'Impossible de joindre le coach.',
    coachTimeout: 'Le coach a mis trop de temps. Réessaie.',
    newGame: 'Nouvelle partie',
    resign: 'Abandonner',
    playAs: 'Jouer avec',
    white: 'Blancs',
    black: 'Noirs',
    difficulty: "Niveau de l'adversaire",
    level: 'Niveau',
    mode: 'Mode',
    modes: { silent: 'Silencieux', coached: 'Coaché', ask: 'Demander' },
    modeHints: {
      silent: "Seulement la barre d'éval et les badges de qualité",
      coached: 'Le coach donne des plans aux moments clés',
      ask: 'Demande au coach quand tu veux',
    },
    skillLevels: {
      beginner: 'Débutant',
      novice: 'Novice',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      master: 'Maître',
    },
    askPlaceholder: 'ex. : Quel est mon plan ici ?',
    send: 'Envoyer',
    undo: 'Annuler',
    hint: 'Indice',
    sound: 'Son',
    voice: 'Voix du coach',
    listen: 'Lire à voix haute',
    pieces: { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' },
    threat: {
      capture: 'Attention — je peux gagner ton {piece} !',
      mate: 'Attention — je menace mat !',
      check: 'Attention — j’ai un échec dangereux !',
      general: 'Attention — j’ai une menace sérieuse ici !',
    },
    thinking: 'Réflexion…',
    yourTurn: 'À toi de jouer',
    engineTurn: "Au tour de l'adversaire",
    player: 'Vous',
    opponent: 'Stockfish',
    evalLabel: 'Évaluation',
    movesTitle: 'Coups',
    noMovesYet: "Aucun coup pour l'instant.",
    summaryTitle: 'Résumé de la partie',
    playAgain: 'Rejouer',
    close: 'Fermer',
    gameOver: 'Partie terminée',
    checkmate: 'Échec et mat',
    stalemate: 'Pat (nulle)',
    draw: 'Nulle',
    youWin: 'Vous gagnez ! 🎉',
    youLose: "L'adversaire gagne",
    drawResult: 'Partie nulle',
    stats: {
      brilliant: 'Brillant',
      good: 'Bon',
      inaccuracy: 'Imprécision',
      mistake: 'Erreur',
      blunder: 'Gaffe',
      accuracy: 'Précision',
      avgLoss: 'Perte moy. (cp)',
    },
    moveQuality: {
      brilliant: 'Brillant !',
      good: 'Bon',
      inaccuracy: 'Imprécision',
      mistake: 'Erreur',
      blunder: 'Gaffe !',
    },
    difficultyUp: "Tu joues très bien ! Veux-tu augmenter le niveau de l'adversaire ?",
    difficultyDown: 'Pas de souci — veux-tu baisser un peu le niveau ?',
    raise: 'Augmenter',
    lower: 'Baisser',
    dismiss: 'Non, continuer',
    engineLoading: "Chargement du moteur d'échecs…",
    engineError: 'Échec du chargement du moteur',
    mate: 'Mat en',
    takeaways: {
      accurate: 'Partie très précise — tu as bien exécuté les plans ! 👏',
      noBlunder: "Aucune gaffe aujourd'hui — belle concentration. 💪",
      brilliant: 'Tu as trouvé un coup brillant ! Tu développes le sens des combinaisons. ✨',
      default:
        "Chaque partie est une leçon. Concentre-toi sur la structure de pions et la sécurité du roi. Continue ! 🌱",
    },
  },

  fa: {
    appTitle: 'ChessMentor',
    headerSubtitle: 'مربی هوشمند استراتژی شطرنج',
    language: 'زبان',
    coachName: 'استاد کیان',
    coachTagline: 'مربی استراتژی شطرنج',
    coachThinking: 'استاد کیان در حال تحلیل…',
    coachActive: 'مربی فعال',
    coachInactive: 'مربی غیرفعال',
    coachIntro:
      'سلام! من استاد کیان هستم. با هم بازی می‌کنیم و نقشه‌های استراتژیک را یاد می‌گیری. موفق باشی!',
    silentModeMessage:
      'حالت «بازی آرام» فعال است. مربی ساکت می‌ماند؛ فقط نوار ارزیابی و نشان‌های کیفیت حرکت را می‌بینی. برای دریافت نقشه، حالت را عوض کن.',
    planChip: 'نقشه‌ی پیشنهادی روی صفحه با فلش نشان داده شده',
    coachError: 'ارتباط با مربی برقرار نشد.',
    coachTimeout: 'مربی دیر پاسخ داد. لطفاً دوباره تلاش کن.',
    newGame: 'بازی جدید',
    resign: 'تسلیم',
    playAs: 'بازی با مهره‌های',
    white: 'سفید',
    black: 'سیاه',
    difficulty: 'سطح حریف',
    level: 'سطح',
    mode: 'حالت',
    modes: { silent: 'بازی آرام', coached: 'بازی با مربی', ask: 'پرسش از مربی' },
    modeHints: {
      silent: 'فقط نوار ارزیابی و نشان کیفیت حرکت',
      coached: 'مربی در لحظه‌های کلیدی نقشه می‌دهد',
      ask: 'هر زمان خواستی از مربی بپرس',
    },
    skillLevels: {
      beginner: 'مبتدی',
      novice: 'تازه‌کار',
      intermediate: 'متوسط',
      advanced: 'پیشرفته',
      master: 'استاد',
    },
    askPlaceholder: 'مثلاً: نقشه‌ی من در این وضعیت چیست؟',
    send: 'بپرس',
    undo: 'بازگرداندن',
    hint: 'راهنما',
    sound: 'صدا',
    voice: 'صدای مربی',
    listen: 'خواندن',
    pieces: { p: 'پیاده', n: 'اسب', b: 'فیل', r: 'رخ', q: 'وزیر', k: 'شاه' },
    threat: {
      capture: 'مواظب باش — می‌توانم {piece} تو را بگیرم!',
      mate: 'مواظب باش — تهدید به مات می‌کنم!',
      check: 'مواظب باش — کیش خطرناکی دارم!',
      general: 'مواظب باش — یک تهدید جدی دارم!',
    },
    thinking: 'در حال فکر کردن…',
    yourTurn: 'نوبت شماست',
    engineTurn: 'نوبت حریف',
    player: 'شما',
    opponent: 'استاکفیش',
    evalLabel: 'ارزیابی',
    movesTitle: 'حرکت‌ها',
    noMovesYet: 'هنوز حرکتی انجام نشده.',
    summaryTitle: 'خلاصه‌ی بازی',
    playAgain: 'بازی دوباره',
    close: 'بستن',
    gameOver: 'پایان بازی',
    checkmate: 'کیش و مات',
    stalemate: 'پات (تساوی)',
    draw: 'تساوی',
    youWin: 'شما بردید! 🎉',
    youLose: 'حریف برد',
    drawResult: 'بازی مساوی شد',
    stats: {
      brilliant: 'درخشان',
      good: 'خوب',
      inaccuracy: 'بی‌دقتی',
      mistake: 'اشتباه',
      blunder: 'خطای بزرگ',
      accuracy: 'دقت',
      avgLoss: 'میانگین افت (cp)',
    },
    moveQuality: {
      brilliant: 'درخشان!',
      good: 'خوب',
      inaccuracy: 'بی‌دقتی',
      mistake: 'اشتباه',
      blunder: 'خطای بزرگ!',
    },
    difficultyUp: 'عالی پیش می‌روی! می‌خواهی سطح حریف را بالا ببری؟',
    difficultyDown: 'اشکالی ندارد؛ می‌خواهی سطح حریف را کمی پایین بیاوری؟',
    raise: 'بالا ببر',
    lower: 'پایین بیاور',
    dismiss: 'نه، ادامه بده',
    engineLoading: 'در حال بارگذاری موتور شطرنج…',
    engineError: 'خطا در بارگذاری موتور شطرنج',
    mate: 'مات در',
    takeaways: {
      accurate: 'بازی بسیار دقیقی داشتی — نقشه‌ها را عالی اجرا کردی! 👏',
      noBlunder: 'امروز هیچ خطای بزرگی نداشتی؛ تمرکزت عالی بود. 💪',
      brilliant: 'یک حرکت درخشان زدی! کم‌کم چشمِ ترکیب‌ها را پیدا می‌کنی. ✨',
      default: 'هر بازی یک درس است. روی ساختار پیاده‌ها و امنیت شاه تمرکز کن. ادامه بده! 🌱',
    },
  },
};

export function getDict(lang) {
  return DICT[lang] || DICT.en;
}

/** Format a White-perspective eval into a compact label (mate word localised). */
export function formatEval({ cp, mate }, dict) {
  const mateWord = dict?.mate ?? 'Mate in';
  if (mate != null) {
    const n = Math.abs(mate);
    return mate > 0 ? `${mateWord} ${n}` : `-${mateWord} ${n}`;
  }
  const pawns = (cp || 0) / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}

/** Map a Stockfish skill (0-20) to a skillLevels key. */
export function skillLevelKey(skill) {
  if (skill <= 2) return 'beginner';
  if (skill <= 6) return 'novice';
  if (skill <= 11) return 'intermediate';
  if (skill <= 16) return 'advanced';
  return 'master';
}

/** Choose an end-of-game takeaway key from the stats. */
export function takeawayKey(stats, accuracy) {
  if (accuracy >= 85) return 'accurate';
  if ((stats.blunder || 0) === 0) return 'noBlunder';
  if ((stats.brilliant || 0) > 0) return 'brilliant';
  return 'default';
}
