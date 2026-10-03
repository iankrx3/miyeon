import { CommunityPost, PostComment, UserSession } from '../../types';
import { mapCommunityPost, mapPostComment } from '../../lib/mappers';
import { supabase } from '../../lib/supabase/client';
import { mockCommunityPosts, mockPostComments } from '../../data/mock/mock';
import { DEMO_USER } from '../auth';
import {
  bumpLocalPostCounts,
  readLikedPostIds,
  readLocalComments,
  readLocalPosts,
  removeLocalComment,
  removeLocalPost,
  saveLocalComment,
  saveLocalPost,
  toggleLocalLike,
} from '../../lib/storage/localCommunityStore';

export interface CreatePostInput {
  text: string;
  category: CommunityPost['category'];
  placeId?: string;
  placeName?: string;
  treatmentName?: string;
  rating?: number;
}

export interface AddCommentInput {
  text: string;
}

function isDemoSession(session: UserSession): boolean {
  return session.user?.id === DEMO_USER.id;
}

function isMockPost(postId: string): boolean {
  return mockCommunityPosts.some((p) => p.id === postId);
}

function isMockComment(commentId: string): boolean {
  return mockPostComments.some((c) => c.id === commentId);
}

function isLocalOrMockPost(postId: string): boolean {
  return postId.startsWith('local-') || readLocalPosts().some((p) => p.id === postId) || isMockPost(postId);
}

function mockPostsWithLocal(): CommunityPost[] {
  const liked = readLikedPostIds();
  return [...readLocalPosts(), ...mockCommunityPosts].map((post) => ({
    ...post,
    likedByMe: liked.includes(post.id),
  }));
}

function sortByCreatedAtDesc(posts: CommunityPost[]): CommunityPost[] {
  return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function fetchCommunityPosts(viewerId?: string): Promise<CommunityPost[]> {
  const local = mockPostsWithLocal();
  if (!supabase) return sortByCreatedAtDesc(local);
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*, post_likes(count), post_comments(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    let likedIds = new Set<string>();
    if (viewerId) {
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', viewerId);
      likedIds = new Set((likes ?? []).map((l: any) => l.post_id));
    }

    const remote = (data ?? []).map((row: any) => mapCommunityPost(row, undefined, likedIds.has(row.id)));
    return sortByCreatedAtDesc([...remote, ...local]);
  } catch (err) {
    console.warn('fetchCommunityPosts: Supabase query failed, falling back to local/mock data', err);
    return sortByCreatedAtDesc(local);
  }
}

export async function fetchCommunityPostById(id: string, viewerId?: string): Promise<CommunityPost | null> {
  const local = readLocalPosts().find((p) => p.id === id);
  if (local) return { ...local, likedByMe: readLikedPostIds().includes(id) };

  const mock = mockCommunityPosts.find((p) => p.id === id);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, post_likes(count), post_comments(count)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        let likedByMe = false;
        if (viewerId) {
          const { data: like } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('post_id', id)
            .eq('user_id', viewerId)
            .maybeSingle();
          likedByMe = Boolean(like);
        }
        return mapCommunityPost(data, undefined, likedByMe);
      }
    } catch (err) {
      console.warn('fetchCommunityPostById: Supabase query failed, falling back to mock data', err);
    }
  }
  if (mock) return { ...mock, likedByMe: readLikedPostIds().includes(id) };
  return null;
}

export async function createCommunityPost(input: CreatePostInput, session: UserSession): Promise<CommunityPost> {
  if (!session.isLoggedIn || !session.user) throw new Error('Must be signed in to post.');
  const author = session.user;

  if (supabase && !isDemoSession(session)) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: author.id,
          author_name: author.name,
          author_avatar_url: author.avatar_url,
          place_id: input.placeId ?? null,
          place_name: input.placeName ?? null,
          treatment_name: input.treatmentName ?? null,
          category: input.category,
          text: input.text,
          rating: input.rating ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapCommunityPost(data, { likeCount: 0, commentCount: 0 }, false);
    } catch (err) {
      console.error('createCommunityPost: Supabase write failed unexpectedly, saving locally instead', err);
    }
  }

  const post: CommunityPost = {
    id: `local-${crypto.randomUUID()}`,
    authorId: author.id,
    authorName: author.name,
    authorAvatarUrl: author.avatar_url,
    placeId: input.placeId,
    placeName: input.placeName,
    treatmentName: input.treatmentName,
    category: input.category,
    text: input.text,
    rating: input.rating,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  };
  saveLocalPost(post);
  return post;
}

export async function toggleLike(postId: string, session: UserSession): Promise<{ liked: boolean }> {
  if (!session.isLoggedIn || !session.user) throw new Error('Must be signed in to like a post.');
  const userId = session.user.id;
  const isLocalPost = isLocalOrMockPost(postId);

  if (supabase && !isLocalPost && !isDemoSession(session)) {
    try {
      const { data: existing } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
        if (error) throw error;
        return { liked: false };
      }
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      if (error) throw error;
      return { liked: true };
    } catch (err) {
      console.warn('toggleLike: Supabase call failed, falling back to local like state', err);
    }
  }

  const liked = toggleLocalLike(postId);
  bumpLocalPostCounts(postId, { like: liked ? 1 : -1 });
  return { liked };
}

export async function deleteCommunityPost(postId: string, session: UserSession): Promise<void> {
  if (!session.isLoggedIn || !session.user) throw new Error('Must be signed in to delete a post.');
  const isLocalPost = isLocalOrMockPost(postId);

  if (isLocalPost) {
    removeLocalPost(postId);
    return;
  }

  if (!supabase) throw new Error('Unable to delete post.');
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', session.user.id);
  if (error) throw error;
}

export async function fetchComments(postId: string): Promise<PostComment[]> {
  const seed = mockPostComments.filter((c) => c.postId === postId);
  const local = readLocalComments(postId);
  if (!supabase || isMockPost(postId)) return [...seed, ...local];
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return [...seed, ...(data ?? []).map(mapPostComment), ...local];
  } catch (err) {
    console.warn('fetchComments: Supabase query failed, falling back to local/seed data', err);
    return [...seed, ...local];
  }
}

export async function addComment(postId: string, input: AddCommentInput, session: UserSession): Promise<PostComment> {
  if (!session.isLoggedIn || !session.user) throw new Error('Must be signed in to comment.');
  const author = session.user;
  const isLocalPost = isLocalOrMockPost(postId);

  if (supabase && !isLocalPost && !isDemoSession(session)) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: author.id,
          author_name: author.name,
          author_avatar_url: author.avatar_url,
          text: input.text,
        })
        .select()
        .single();
      if (error) throw error;
      return mapPostComment(data);
    } catch (err) {
      console.warn('addComment: Supabase insert failed, saving comment locally instead', err);
    }
  }

  const comment: PostComment = {
    id: `local-${crypto.randomUUID()}`,
    postId,
    authorId: author.id,
    authorName: author.name,
    authorAvatarUrl: author.avatar_url,
    text: input.text,
    createdAt: new Date().toISOString(),
  };
  saveLocalComment(postId, comment);
  bumpLocalPostCounts(postId, { comment: 1 });
  return comment;
}

export async function deleteComment(postId: string, commentId: string, session: UserSession): Promise<void> {
  if (!session.isLoggedIn || !session.user) throw new Error('Must be signed in to delete a comment.');
  const isLocalComment = commentId.startsWith('local-') || isMockComment(commentId);

  if (isLocalComment) {
    removeLocalComment(postId, commentId);
    return;
  }

  if (!supabase) throw new Error('Unable to delete comment.');
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', session.user.id);
  if (error) throw error;
}
