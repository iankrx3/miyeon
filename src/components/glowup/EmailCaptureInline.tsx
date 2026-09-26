import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { Itinerary } from '../../types';
import { requestBeautyCard } from '../../services/beautyCard';
import { useT } from '../../i18n';

interface EmailCaptureInlineProps {
  itinerary: Itinerary;
  defaultEmail?: string;
}

/** Figma "Want this saved?": optional — the plan is fully usable without an email. */
export const EmailCaptureInline: React.FC<EmailCaptureInlineProps> = ({ itinerary, defaultEmail = '' }) => {
  const t = useT();
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'skipped'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
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

  if (status === 'skipped') {
    return (
      <p className="px-5 py-8 text-center text-[12.5px] text-miyeon-main/50">
        {t('No problem — your plan stays on this device. Find it again under My.')}
      </p>
    );
  }

  return (
    <section className="px-5 pb-10 pt-9 text-center">
      <h3 className="font-display text-[21px] font-bold text-miyeon-ink">{t('Want this saved?')}</h3>
      <p className="mx-auto mt-2 max-w-[300px] text-[13.5px] leading-snug text-miyeon-main/60">
        {t("We'll send the full plan and remind you when it's time to book.")}
      </p>

      {status === 'done' ? (
        <div className="mt-5 flex items-start gap-2.5 rounded-[14px] bg-miyeon-accent-soft px-4 py-3.5 text-left text-[13px] leading-snug text-miyeon-main">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-miyeon-accent" />
          <p>
            {t("Saved — we'll send your plan to {email}.", { email: email.trim() })}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-5">
          <label htmlFor="plan-email" className="sr-only">
            Email
          </label>
          <input
            id="plan-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('your@email.com')}
            className="w-full rounded-full border border-miyeon-line bg-miyeon-surface px-5 py-3.5 text-[14.5px] text-miyeon-ink outline-none placeholder:text-miyeon-main/35 focus:border-miyeon-accent"
          />
          {error && (
            <p role="alert" className="mt-2 text-xs text-miyeon-accent-dark">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-3 w-full rounded-full bg-miyeon-ink py-[15px] text-[14.5px] font-medium text-white disabled:opacity-40"
          >
            {status === 'sending' ? t('Sending…') : t('Email me my plan')}
          </button>
          <button
            type="button"
            onClick={() => setStatus('skipped')}
            className="mt-4 text-[13px] text-miyeon-main/50"
          >
            {t('Skip for now')}
          </button>
        </form>
      )}
    </section>
  );
};
