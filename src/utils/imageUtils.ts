/**
 * Utility for robust listing image URL resolution, normalization, and fallbacks.
 */

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  dairy: '/milk.jpg',
  bakery: '/biscuits.jpg',
  canned_packaged: '/noodles.jpg',
  pantry_grains: '/sample-food-label-crisp.jpg',
  produce: '/food-box-hero.jpg',
  prepared_meals: '/noodles.jpg',
  beverages: '/milk.jpg',
  other: '/noodles.jpg',
};

export const DEFAULT_LISTING_FALLBACK = '/noodles.jpg';

export function getCategoryFallbackImage(category?: string): string {
  if (!category) return DEFAULT_LISTING_FALLBACK;
  return CATEGORY_FALLBACK_IMAGES[category] || DEFAULT_LISTING_FALLBACK;
}

export function isInvalidOrEphemeralUrl(url?: unknown): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  return (
    trimmed === '' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  );
}

export function resolveListingImageUrl(url?: string | null, category?: string): string {
  if (isInvalidOrEphemeralUrl(url)) {
    return getCategoryFallbackImage(category);
  }
  return (url as string).trim();
}
