import type { CommunityPost, PostComment } from '../../types';

// Fallback persistence for community writes when Supabase isn't configured, or a write
// fails (e.g. the demo session's user id isn't a real auth.users row). Mirrors
// hooks/useSavedPlaces.ts's localStorage pattern.
const POSTS_KEY = 'miyeon_local_posts';
const LIKED_KEY = 'miyeon_liked_post_ids';
const COMMENTS_KEY = 'miyeon_local_comments';

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

export function readLocalPosts(): CommunityPost[] {
  return readJson<CommunityPost[]>(POSTS_KEY, []);
}

export function saveLocalPost(post: CommunityPost) {
  writeJson(POSTS_KEY, [post, ...readLocalPosts()]);
}

export function removeLocalPost(postId: string) {
  writeJson(POSTS_KEY, readLocalPosts().filter((p) => p.id !== postId));
  writeJson(LIKED_KEY, readLikedPostIds().filter((id) => id !== postId));
  const allComments = readJson<Record<string, PostComment[]>>(COMMENTS_KEY, {});
  delete allComments[postId];
  writeJson(COMMENTS_KEY, allComments);
}

export function readLikedPostIds(): string[] {
  return readJson<string[]>(LIKED_KEY, []);
}

export function toggleLocalLike(postId: string): boolean {
  const liked = readLikedPostIds();
  const isLiked = liked.includes(postId);
  writeJson(LIKED_KEY, isLiked ? liked.filter((id) => id !== postId) : [...liked, postId]);
  return !isLiked;
}

export function readLocalComments(postId: string): PostComment[] {
  const all = readJson<Record<string, PostComment[]>>(COMMENTS_KEY, {});
  return all[postId] ?? [];
}

export function saveLocalComment(postId: string, comment: PostComment) {
  const all = readJson<Record<string, PostComment[]>>(COMMENTS_KEY, {});
  all[postId] = [...(all[postId] ?? []), comment];
  writeJson(COMMENTS_KEY, all);
}

export function removeLocalComment(postId: string, commentId: string) {
  const all = readJson<Record<string, PostComment[]>>(COMMENTS_KEY, {});
  all[postId] = (all[postId] ?? []).filter((c) => c.id !== commentId);
  writeJson(COMMENTS_KEY, all);
}

export function bumpLocalPostCounts(postId: string, delta: { like?: number; comment?: number }) {
  const posts = readLocalPosts();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx === -1) return;
  const post = posts[idx];
  posts[idx] = {
    ...post,
    likeCount: Math.max(0, post.likeCount + (delta.like ?? 0)),
    commentCount: Math.max(0, post.commentCount + (delta.comment ?? 0)),
  };
  writeJson(POSTS_KEY, posts);
}
