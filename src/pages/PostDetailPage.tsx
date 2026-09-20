import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { CommunityPost, UserSession } from '../types';
import { deleteCommunityPost, fetchCommunityPostById, toggleLike } from '../services/community';
import { PostCard } from '../components/community/PostCard';

interface PostDetailPageProps {
  session: UserSession;
  onSignIn: () => void;
}

export default function PostDetailPage({ session, onSignIn }: PostDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCommunityPostById(id, session.user?.id)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [id, session.user?.id]);

  const handleLikeToggle = async (postId: string) => {
    if (!post) return;
    const wasLiked = post.likedByMe ?? false;
    setPost({ ...post, likedByMe: !wasLiked, likeCount: post.likeCount + (wasLiked ? -1 : 1) });
    try {
      await toggleLike(postId, session);
    } catch {
      setPost((prev) =>
        prev ? { ...prev, likedByMe: wasLiked, likeCount: prev.likeCount + (wasLiked ? 1 : -1) } : prev
      );
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    await deleteCommunityPost(post.id, session);
    navigate('/community?tab=qna');
  };

  if (loading) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Loading…</div>;
  if (!post) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Post not found.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <Link to="/community?tab=qna" className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to community
      </Link>

      <PostCard
        post={post}
        session={session}
        onSignIn={onSignIn}
        onLikeToggle={handleLikeToggle}
        onDeletePost={handleDeletePost}
        defaultExpanded
      />
    </div>
  );
}
