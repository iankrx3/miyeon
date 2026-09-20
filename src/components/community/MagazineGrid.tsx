import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { MagazineArticle, UserSession } from '../../types';

interface MagazineGridProps {
  articles: MagazineArticle[];
  session: UserSession;
  onDeleteArticle?: (articleId: string) => Promise<void> | void;
}

function makeDeleteHandler(
  article: MagazineArticle,
  onDeleteArticle?: (articleId: string) => Promise<void> | void
) {
  return async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDeleteArticle) return;
    if (!window.confirm('칼럼을 삭제할까요?')) return;
    await onDeleteArticle(article.id);
  };
}

export const MagazineGrid: React.FC<MagazineGridProps> = ({ articles, session, onDeleteArticle }) => {
  const [featured, ...rest] = articles;
  if (!featured) return null;

  const canDelete = (article: MagazineArticle) =>
    Boolean(session.creator?.id) && session.creator?.id === article.curatorId && Boolean(onDeleteArticle);

  const featuredDelete = makeDeleteHandler(featured, onDeleteArticle);

  return (
    <div>
      <Link key={featured.id} to={`/magazine/${featured.id}`} className="relative block overflow-hidden rounded-[18px]">
        {canDelete(featured) && (
          <button
            type="button"
            onClick={featuredDelete}
            aria-label="칼럼 삭제"
            className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <div className="relative h-[240px] w-full">
          <img src={featured.imageUrl} alt={featured.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-miyeon-ink/80" />
          <div className="absolute bottom-[18px] left-[18px] right-[18px]">
            <span className="inline-block rounded bg-miyeon-accent px-[7px] py-[3px] text-[8.5px] font-bold tracking-wide text-white">
              MUST READ
            </span>
            <h3 className="mt-2 font-display text-[19px] font-bold leading-[1.3] text-white">{featured.title}</h3>
            <p className="mt-1 text-[11px] text-white/75">{featured.minutes} min read</p>
          </div>
        </div>
      </Link>

      <div className="mt-1 divide-y divide-miyeon-line">
        {rest.map((article) => {
          const isOwnArticle = canDelete(article);
          return (
            <Link key={article.id} to={`/magazine/${article.id}`} className="relative flex items-center gap-3 py-3.5">
              {isOwnArticle && (
                <button
                  type="button"
                  onClick={makeDeleteHandler(article, onDeleteArticle)}
                  aria-label="칼럼 삭제"
                  className="absolute right-0 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-miyeon-accent-dark">
                  {article.kind}
                </p>
                <h3 className="mt-1 text-[14.5px] font-medium leading-[1.38] text-miyeon-ink">{article.title}</h3>
                <p className="mt-1 text-[11px] text-miyeon-main/50">
                  {article.minutes} min · by {article.authorName}
                </p>
              </div>
              <img
                src={article.imageUrl}
                alt=""
                className="h-[78px] w-[78px] shrink-0 rounded-xl object-cover"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
