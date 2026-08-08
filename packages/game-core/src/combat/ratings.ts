export const RATING_PARAMS = {
  critRating: { k: 80, cap: 0.6 },
  critDmgRating: { k: 100, cap: 0.8 },
  penRating: { k: 85, cap: 0.45 },
  masteryRating: { k: 90, cap: 0.35 },
  tenacityRating: { k: 90, cap: 0.4 },
  fortuneRating: { k: 100, cap: 0.35 },
} as const;

export type RatingStat = keyof typeof RATING_PARAMS;

export function ratingToPct(rating: number, stat: RatingStat): number {
  const { k, cap } = RATING_PARAMS[stat];
  if (rating <= 0) return 0;
  return Math.min(cap, rating / (rating + k));
}
