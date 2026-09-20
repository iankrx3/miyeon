import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, MapPin, MessageCircle, Star, Trash2 } from 'lucide-react';
import type { CommunityPost, PostComment, UserSession } from '../../types';
import { addComment, deleteComment, fetchComments } from '../../services/community';
import { ShareButton } from './ShareButton';

interface PostCardProps {
  post: CommunityPost;
  session: UserSession;
  onSignIn: () => void;
  onLikeToggle: (postId: string) => void;
  onDeletePost?: (postId: string) => Promise<void> | void;
  defaultExpanded?: boolean;
}

/** Author avatar/name, its own tap target — links to the Curator page when the
 * poster is a registered curator, otherwise stays a plain (non-interactive) label. */
const AuthorProfileLink: React.FC<{ post: CommunityPost }> = ({ post }) => {
  const content = (
    <>
      <img
        src={post.authorAvatarUrl}
        alt={post.authorName}
        referrerPolicy="no-referrer"
        className="h-9 w-9 rounded-full object-cover"
      />
      <div>
        <p className="text-sm font-semibold text-miyeon-main">{post.authorName}</p>
        <p className="text-[11px] text-miyeon-main/70">
          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </>
  );

  if (!post.creatorId) {
    return <div className="flex items-center gap-2.5">{content}</div>;
  }

  return (
    <Link to={`/curator/${post.creatorId}`} className="flex items-center gap-2.5">
      {content}
    </Link>
  );
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  session,
  onSignIn,
  onLikeToggle,
  onDeletePost,
  defaultExpanded,
}) => {
  const [expanded, setExpanded] = useState(Boolean(defaultExpanded));
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const isOwnPost = Boolean(session.user?.id) && session.user?.id === post.authorId;

  useEffect(() => {
    if (expanded && !commentsLoaded) {
      fetchComments(post.id).then((c) => {
        setComments(c);
        setCommentsLoaded(true);
      });
    }
  }, [expanded, commentsLoaded, post.id]);

  const handleLike = () => {
    if (!session.isLoggedIn) {
      onSignIn();
      return;
    }
    onLikeToggle(post.id);
  };

  const handleSubmitComment = async () => {
    if (!session.isLoggedIn || !session.user || !commentText.trim() || submitting) return;
    setSubmitting(true);
    setCommentError(null);
    try {
      const comment = await addComment(post.id, { text: commentText.trim() }, session);
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Could not post the comment. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!onDeletePost) return;
    if (!window.confirm('게시글을 삭제할까요?')) return;
    await onDeletePost(post.id);
  };

  const handleDeleteComment = async (comment: PostComment) => {
    if (!session.user) return;
    if (!window.confirm('댓글을 삭제할까요?')) return;
    await deleteComment(post.id, comment.id, session);
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[14px] border border-miyeon-line bg-white p-4"
    >
      {defaultExpanded ? (
        <div>
          <div className="flex items-center gap-2.5">
            <AuthorProfileLink post={post} />
            {post.rating && (
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-miyeon-ink">
                <Star className="h-3 w-3 fill-miyeon-accent-dark text-miyeon-accent-dark" /> {post.rating}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-miyeon-ink/90">{post.text}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2.5">
            <AuthorProfileLink post={post} />
            {post.rating && (
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-miyeon-ink">
                <Star className="h-3 w-3 fill-miyeon-accent-dark text-miyeon-accent-dark" /> {post.rating}
              </span>
            )}
          </div>

          <Link to={`/community/${post.id}`} className="block">
            <p className="mt-3 text-sm leading-relaxed text-miyeon-ink/90">{post.text}</p>
          </Link>
        </div>
      )}

      {post.placeId && post.placeName && (
        <Link
          to={`/place/${post.placeId}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-miyeon-surface px-3 py-1 text-[11px] font-medium text-miyeon-ink"
        >
          <MapPin className="h-3 w-3" strokeWidth={1.75} />
          {post.placeName}
          {post.treatmentName ? ` · ${post.treatmentName}` : ''}
        </Link>
      )}

      <div className="mt-3.5 flex items-center gap-5 border-t border-miyeon-line pt-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-medium ${
            post.likedByMe ? 'text-miyeon-accent' : 'text-miyeon-main/60 hover:text-miyeon-ink'
          }`}
        >
          <motion.span animate={post.likedByMe ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
            <Heart className="h-4 w-4" fill={post.likedByMe ? 'currentColor' : 'none'} />
          </motion.span>
          {post.likeCount}
        </motion.button>
        {defaultExpanded ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-miyeon-main/70 hover:text-miyeon-main"
          >
            <MessageCircle className="h-4 w-4" />
            {post.commentCount}
          </button>
        ) : (
          <Link
            to={`/community/${post.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-miyeon-main/70 hover:text-miyeon-main"
          >
            <MessageCircle className="h-4 w-4" />
            {post.commentCount}
          </Link>
        )}
        <ShareButton postId={post.id} title={post.text} />
        {isOwnPost && onDeletePost && (
          <button
            onClick={handleDeletePost}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-miyeon-main/70 hover:text-red-500"
            aria-label="게시글 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
        <div className="mt-3 space-y-2.5 border-t border-miyeon-line pt-3">
          {commentsLoaded && comments.length === 0 && (
            <p className="text-xs text-miyeon-main/70">No comments yet.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <img
                src={c.authorAvatarUrl}
                alt={c.authorName}
                referrerPolicy="no-referrer"
                className="h-6 w-6 shrink-0 rounded-full object-cover"
              />
              <div className="flex items-center gap-1.5 rounded-2xl bg-miyeon-surface px-3 py-1.5 text-xs text-miyeon-ink">
                <span>
                  <span className="font-semibold">{c.authorName}</span>{' '}
                  <span className="text-miyeon-main/80">{c.text}</span>
                </span>
                {session.user?.id === c.authorId && (
                  <button
                    onClick={() => handleDeleteComment(c)}
                    className="shrink-0 text-miyeon-main/60 hover:text-red-500"
                    aria-label="댓글 삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {session.isLoggedIn && session.user ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitComment();
                }}
                placeholder="Add a comment…"
                className="w-full rounded-full border border-miyeon-line px-3.5 py-1.5 text-xs text-miyeon-ink placeholder:text-miyeon-main/50 focus:outline-none focus:border-miyeon-accent/50"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
                className="shrink-0 text-xs font-bold text-miyeon-accent-dark disabled:opacity-40"
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          ) : (
            <button onClick={onSignIn} className="pt-1 text-xs font-semibold text-miyeon-main/60">
              Sign in to comment
            </button>
          )}
          {commentError && <p className="text-xs text-red-500">{commentError}</p>}
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};
