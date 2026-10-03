import { useCallback, useEffect, useState } from 'react';
import type { MagazineArticle, UserSession } from '../types';
import {
  CreateMagazineArticleInput,
  createMagazineArticle,
  deleteMagazineArticle,
  fetchMagazineArticles,
} from '../services/community/magazine';

export function useMagazineArticles(session: UserSession) {
  const [articles, setArticles] = useState<MagazineArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchMagazineArticles()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createArticle = useCallback(
    async (input: CreateMagazineArticleInput) => {
      const article = await createMagazineArticle(input, session);
      setArticles((prev) => [article, ...prev]);
      return article;
    },
    [session]
  );

  const deleteArticle = useCallback(
    async (articleId: string) => {
      await deleteMagazineArticle(articleId, session);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
    },
    [session]
  );

  return { articles, loading, createArticle, deleteArticle, refresh };
}
