import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { MagazineArticle, UserSession } from '../../types';
import type { CreateMagazineArticleInput } from '../../services/magazine';
import { DEMO_USER } from '../../services/auth';

interface MagazineComposerProps {
  session: UserSession;
  onSignIn: () => void;
  onSubmit: (input: CreateMagazineArticleInput) => Promise<MagazineArticle>;
}

const KINDS: MagazineArticle['kind'][] = ['GUIDE', 'TREATMENT', 'TREND'];

export const MagazineComposer: React.FC<MagazineComposerProps> = ({ session, onSignIn, onSubmit }) => {
  const [kind, setKind] = useState<MagazineArticle['kind']>('GUIDE');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session.isLoggedIn || !session.user) {
    return (
      <button
        onClick={onSignIn}
        className="w-full rounded-2xl border border-miyeon-line bg-miyeon-surface/30 px-4 py-3.5 text-left text-sm text-miyeon-main/60"
      >
        Sign in to write a column…
      </button>
    );
  }

  if (!session.creator) {
    return (
      <div className="rounded-2xl border border-miyeon-line bg-miyeon-surface/30 px-4 py-3.5 text-sm text-miyeon-main/70">
        Only curators can publish to the Magazine.{' '}
        <Link to="/curator/signup" className="font-semibold text-miyeon-main hover:underline">
          Become a curator →
        </Link>
      </div>
    );
  }

  const canSubmit = title.trim() && imageUrl.trim() && body.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ kind, title: title.trim(), imageUrl: imageUrl.trim(), body: body.trim() });
      setTitle('');
      setImageUrl('');
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2.5 rounded-2xl border border-miyeon-line bg-white p-4">
      <div className="flex gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              kind === k ? 'bg-miyeon-ink text-white' : 'bg-miyeon-surface/60 text-miyeon-main/70'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Column title"
        className="w-full rounded-xl border border-miyeon-line bg-transparent px-3 py-2 text-sm text-miyeon-main placeholder:text-miyeon-main/50 focus:outline-none"
      />
      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Cover photo URL"
        className="w-full rounded-xl border border-miyeon-line bg-transparent px-3 py-2 text-sm text-miyeon-main placeholder:text-miyeon-main/50 focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write the column… separate paragraphs with a blank line."
        rows={5}
        className="w-full resize-none rounded-xl border border-miyeon-line bg-transparent px-3 py-2 text-sm text-miyeon-main placeholder:text-miyeon-main/50 focus:outline-none"
      />

      <div className="flex justify-end">
        <motion.button
          whileHover={canSubmit ? { scale: 1.05 } : undefined}
          whileTap={canSubmit ? { scale: 0.95 } : undefined}
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="shrink-0 rounded-full bg-miyeon-accent px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-miyeon-accent/30 disabled:opacity-40"
        >
          {submitting ? 'Publishing…' : 'Publish'}
        </motion.button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {session.user.id === DEMO_USER.id && (
        <p className="text-[11px] text-miyeon-main/70">
          Demo mode saves to this browser only. Sign in with Google to keep your columns across logins and devices.
        </p>
      )}
    </div>
  );
};
