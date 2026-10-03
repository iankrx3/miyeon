import { useCallback, useEffect, useState } from 'react';
import type { CommunityPost, UserSession } from '../types';
import {
  CreatePostInput,
  createCommunityPost,
  deleteCommunityPost,
  fetchCommunityPosts,
  toggleLike as toggleLikeService,
} from '../services/community/community';
import { fetchCreatorIdsByUserIds } from '../services/places/places';

export function useCommunityPosts(session: UserSession) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchCommunityPosts(session.user?.id)
      .then(async (fetched) => {
        const authorIds = fetched.map((p) => p.authorId).filter((id): id is string => Boolean(id));
        const creatorIdMap = await fetchCreatorIdsByUserIds(authorIds);
        setPosts(fetched.map((p) => ({ ...p, creatorId: p.authorId ? creatorIdMap.get(p.authorId) : undefined })));
      })
      .finally(() => setLoading(false));
  }, [session.user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPost = useCallback(
    async (input: CreatePostInput) => {
      const post = await createCommunityPost(input, session);
      const withCreatorId = { ...post, creatorId: session.creator?.id };
      setPosts((prev) => [withCreatorId, ...prev]);
      return withCreatorId;
    },
    [session]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      const target = posts.find((p) => p.id === postId);
      const wasLiked = target?.likedByMe ?? false;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likedByMe: !wasLiked, likeCount: p.likeCount + (wasLiked ? -1 : 1) } : p
        )
      );
      try {
        await toggleLikeService(postId, session);
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likedByMe: wasLiked, likeCount: p.likeCount + (wasLiked ? 1 : -1) } : p
          )
        );
      }
    },
    [posts, session]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      await deleteCommunityPost(postId, session);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    },
    [session]
  );

  return { posts, loading, createPost, toggleLike, deletePost, refresh };
}
