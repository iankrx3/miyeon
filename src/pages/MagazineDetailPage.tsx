import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import type { MagazineArticle, UserSession } from '../types';
import { deleteMagazineArticle, fetchMagazineArticles } from '../services/magazine';

interface MagazineDetailPageProps {
  session: UserSession;
}

export default function MagazineDetailPage({ session }: MagazineDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<MagazineArticle | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    fetchMagazineArticles().then((articles) => setArticle(articles.find((a) => a.id === id) ?? null));
  }, [id]);

  if (article === undefined) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Loading…</div>;
  if (!article) return <div className="px-4 py-10 text-sm text-miyeon-main/60">Column not found.</div>;

  const isOwnArticle = Boolean(session.creator?.id) && session.creator?.id === article.curatorId;

  const handleDelete = async () => {
    if (!window.confirm('칼럼을 삭제할까요?')) return;
    await deleteMagazineArticle(article.id, session);
    navigate('/community?tab=magazine');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link
          to="/community?tab=magazine"
          className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to magazine
        </Link>
        {isOwnArticle && (
          <button
            type="button"
            onClick={handleDelete}
            aria-label="칼럼 삭제"
            className="flex items-center gap-1 text-xs font-semibold text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>

      <img src={article.imageUrl} alt={article.title} className="aspect-[5/3] w-full rounded-2xl object-cover" />

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-miyeon-accent">{article.kind}</p>
        <h1 className="mt-1 font-display text-2xl leading-snug text-miyeon-main">{article.title}</h1>
        <div className="mt-3 flex items-center gap-2 text-xs text-miyeon-main/60">
          {article.authorAvatarUrl && (
            <img
              src={article.authorAvatarUrl}
              alt={article.authorName}
              referrerPolicy="no-referrer"
              className="h-6 w-6 rounded-full object-cover"
            />
          )}
          {article.curatorId ? (
            <Link to={`/curator/${article.curatorId}`} className="font-semibold text-miyeon-main hover:underline">
              {article.authorName}
            </Link>
          ) : (
            <span>{article.authorName}</span>
          )}
          <span>· {article.minutes} min read</span>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-miyeon-main/90">
        {article.body.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
