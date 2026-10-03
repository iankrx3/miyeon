import type { MagazineArticle } from '../../types';

// Fallback persistence for curator-submitted magazine columns when Supabase isn't configured,
// or a write fails. Mirrors lib/storage/localCommunityStore.ts's pattern.
const ARTICLES_KEY = 'miyeon_local_magazine_articles';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota — write still applies for this tab's in-memory state
  }
}

export function readLocalArticles(): MagazineArticle[] {
  return readJson<MagazineArticle[]>(ARTICLES_KEY, []);
}

export function saveLocalArticle(article: MagazineArticle) {
  writeJson(ARTICLES_KEY, [article, ...readLocalArticles()]);
}

export function removeLocalArticle(articleId: string) {
  writeJson(ARTICLES_KEY, readLocalArticles().filter((a) => a.id !== articleId));
}
