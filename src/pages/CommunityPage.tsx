import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import type { CommunityPost, UserSession } from '../types';
import { useCommunityPosts } from '../hooks/useCommunityPosts';
import { useMagazineArticles } from '../hooks/useMagazineArticles';
import { PostComposer } from '../components/community/PostComposer';
import { PostCard } from '../components/community/PostCard';
import { MagazineGrid } from '../components/community/MagazineGrid';
import { MagazineComposer } from '../components/community/MagazineComposer';

interface CommunityPageProps {
  session: UserSession;
  onSignIn: () => void;
}

const CATEGORIES: { id: CommunityPost['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'treatment-reviews', label: '✨ Treatment Reviews' },
  { id: 'seoul-places', label: '📍 Seoul Beauty Places' },
  { id: 'questions', label: '💬 Questions' },
];

const TABS: { id: 'community' | 'magazine'; label: string }[] = [
  { id: 'magazine', label: 'Magazine' },
  { id: 'community', label: 'Community' },
];

export default function CommunityPage({ session, onSignIn }: CommunityPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'magazine' ? 'magazine' : 'community';
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]['id']>('all');
  const { posts, loading, createPost, toggleLike, deletePost } = useCommunityPosts(session);
  const { articles, createArticle, deleteArticle } = useMagazineArticles(session);

  const filteredPosts = filter === 'all' ? posts : posts.filter((p) => p.category === filter);

  return (
    <div>
      <div className="bg-gradient-to-b from-[#f9dde4] to-[#fef6f8] px-5 pb-6 pt-5">
        <p className="flex items-center gap-1 text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent-dark">
          ✦ READ BEFORE YOU GO
        </p>
        <h1 className="mt-1.5 font-display text-[23px] font-bold leading-[1.28] text-miyeon-ink">
          The stuff nobody
          <br />
          tells you.
        </h1>
        <p className="mt-1.5 text-[12.5px] text-miyeon-main/65">Real prices, real timing, real mistakes.</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-5 py-5">
        <div className="flex gap-6 border-b border-miyeon-line">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams(tab.id === 'community' ? {} : { tab: tab.id })}
              className={`-mb-px border-b-2 pb-2.5 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? 'border-miyeon-accent text-miyeon-ink'
                  : 'border-transparent text-miyeon-main/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'magazine' ? (
          <div className="space-y-5">
            <MagazineComposer session={session} onSignIn={onSignIn} onSubmit={createArticle} />
            <MagazineGrid articles={articles} session={session} onDeleteArticle={deleteArticle} />
          </div>
        ) : (
          <>
            <PostComposer session={session} onSignIn={onSignIn} onSubmit={createPost} />

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(cat.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    filter === cat.id ? 'bg-miyeon-ink text-white' : 'bg-miyeon-surface text-miyeon-main/70'
                  }`}
                >
                  {cat.label}
                </motion.button>
              ))}
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-miyeon-main/70">Loading…</p>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    session={session}
                    onSignIn={onSignIn}
                    onLikeToggle={toggleLike}
                    onDeletePost={deletePost}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
