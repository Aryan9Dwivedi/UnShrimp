export const POSTURE_ROASTS = [
  "Sit up bro.",
  "Your ancestors fought wars for this posture?",
  "Your ancestors didn't evolve vertebrae for this.",
  "You are curling like a cocktail shrimp.",
  "That posture is a crime.",
  "You are becoming linguine.",
  "Please stop becoming seafood.",
  "Please stop folding yourself.",
  "The shrimp council is disappointed.",
  "Your spine would like a word.",
  "Brother, respectfully, what are you doing?",
  "You are approaching crustacean levels.",
  "Human posture not found.",
  "Loading vertebrate mode…",
  "Unshrimp yourself. Immediately.",
  "This is not the shrimp way.",
  "Your chair is winning."
] as const;

export function pickRoast(previous?: string): string {
  const pool =
    previous && POSTURE_ROASTS.length > 1
      ? POSTURE_ROASTS.filter((roast) => roast !== previous)
      : POSTURE_ROASTS;

  return pool[Math.floor(Math.random() * pool.length)] ?? POSTURE_ROASTS[0];
}

export const ROAST_NOTIFICATION_TITLES = [
  "Shrimp council",
  "Anti-Shrimp Protocol",
  "UnShrimp dispatch",
  "Vertebrate mode offline"
] as const;

export function pickNotificationTitle(): string {
  return ROAST_NOTIFICATION_TITLES[
    Math.floor(Math.random() * ROAST_NOTIFICATION_TITLES.length)
  ];
}
