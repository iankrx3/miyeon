import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { Itinerary } from '../../types';
import { requestBeautyCard } from '../../services/beautyCard';

interface BeautyCardSheetProps {
  itinerary: Itinerary;
  /** Signed-in user's email, used to pre-fill the field. */
  defaultEmail?: string;
  onClose: () => void;
}

/** Figma "Get my Beauty Card": collects an email and sends the plan there. */
export const BeautyCardSheet: React.FC<BeautyCardSheetProps> = ({ itinerary, defaultEmail = '', onClose }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setError(null);
    setStatus('sending');
    try {
      await requestBeautyCard(email, itinerary);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="beauty-card-title"
        className="relative w-full max-w-sm rounded-t-3xl bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-miyeon-main/50 hover:bg-miyeon-surface"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent-dark">✦ YOUR BEAUTY CARD</p>
        <h2 id="beauty-card-title" className="mt-1.5 font-display text-xl font-bold text-miyeon-ink">
          Get my Beauty Card
        </h2>

        {status === 'done' ? (
          <div className="mt-4">
            <div className="flex gap-2.5 rounded-[14px] bg-miyeon-accent-soft px-4 py-3.5 text-[13px] leading-snug text-miyeon-main">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-miyeon-accent" />
              <p>
                Saved — we&apos;ll email your Beauty Card to <span className="font-medium">{email.trim()}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-miyeon-ink py-[15px] text-[14.5px] font-medium text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-2">
            <p className="text-[13px] leading-snug text-miyeon-main/60">
              Your plan, ready to show at the clinic. Enter your email and we&apos;ll send it to you.
            </p>
            <label htmlFor="beauty-card-email" className="mt-4 block text-[11px] font-semibold text-miyeon-main/70">
              Email
            </label>
            <input
              id="beauty-card-email"
              ref={inputRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-full border border-miyeon-line bg-white px-4 py-3 text-miyeon-ink outline-none focus:border-miyeon-accent"
            />
            {error && (
              <p role="alert" className="mt-2 text-xs text-miyeon-accent-dark">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="mt-4 w-full rounded-full bg-miyeon-ink py-[15px] text-[14.5px] font-medium text-white disabled:opacity-40"
            >
              {status === 'sending' ? 'Sending…' : 'Send my Beauty Card →'}
            </button>
            <p className="mt-2.5 text-center text-[10.5px] leading-snug text-miyeon-main/45">
              We only use your email to send your plan.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
