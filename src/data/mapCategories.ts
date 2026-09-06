import type { BeautyCategory } from '../types';

// Only skin/face categories are live on the map for now — hair/nails/makeup
// are still being built out. Remove this restriction once those categories
// are ready.
export const ENABLED_MAP_CATEGORIES: BeautyCategory[] = ['skin', 'face', 'hair', 'nails', 'makeup'];
