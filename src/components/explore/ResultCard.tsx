import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { MatchResult } from '../../types';
import { withCreatripAffiliate, CREATRIP_BASE_URL, CREATRIP_DISCLOSURE } from '../../lib/creatrip';

interface ResultCardProps {
  result: MatchResult;
  rank: 1 | 2 | 3;
  /** Rank-1 only — the personalized italic "why this" line, built from the quiz answers. */
  quote?: string;
}

const TIER = {
  1: { label: 'YOUR MATCH', fallbackTagline: "Miyeon's top pick for you." },
  2: { label: 'GO BIGGER', fallbackTagline: 'Same direction — stronger effect.' },
  3: { label: 'THE OTHER ROUTE', fallbackTagline: 'A different way to get there.' },
} as const;

const DOWNTIME_LABEL: Record<string, string> = {
  none: 'No downtime',
  '1-3-days': '1–3 days downtime',
  '3-7-days': '3–7 days downtime',
  'no-mind': 'Flexible downtime',
};

function priceLabel(price: { min: number; max: number }): string {
  return price.min === price.max ? `$${price.min}` : `$${price.min}–${price.max}`;
}

// §02-7 — "Miyeon's Picks" result card, tiered by rank (YOUR MATCH / GO BIGGER / THE OTHER ROUTE).
export const ResultCard: React.FC<ResultCardProps> = ({ result, rank, quote }) => {
  const navigate = useNavigate();
  const { treatment, place, matchScore, reasons } = result;
  const tier = TIER[rank];
  const isPrimary = rank === 1;
  const bulletCount = isPrimary ? 3 : 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: (rank - 1) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className={`rounded-3xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-miyeon-main/10 ${
        isPrimary ? 'border-miyeon-accent/50' : 'border-miyeon-line'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-miyeon-main/60">
          {tier.label}
        </span>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: (rank - 1) * 0.1 + 0.2 }}
          className="text-xs font-semibold text-miyeon-accent"
        >
          Miyeon says: {matchScore}% Match
        </motion.span>
      </div>

      {isPrimary && quote ? (
        <p className="mt-2 text-sm italic leading-snug text-miyeon-main/80">"{quote}"</p>
      ) : (
        <p className="mt-2 text-sm text-miyeon-main/70">{tier.fallbackTagline}</p>
      )}

      <h3 className="mt-2 text-lg font-semibold text-miyeon-main">{treatment.name}</h3>
      <p className="text-xs text-miyeon-main/60">
        {place.name} · {place.area}
      </p>

      <p className="mt-2 text-xs font-medium text-miyeon-main/70">
        {priceLabel(treatment.price)}
        {treatment.durationMinutes ? ` · ${treatment.durationMinutes} min` : ''} ·{' '}
        {DOWNTIME_LABEL[treatment.downtime] ?? treatment.downtime}
      </p>

      <div className="mt-3 space-y-1">
        {reasons.slice(0, bulletCount).map((reason) => (
          <p key={reason} className="flex items-start gap-1.5 text-xs text-miyeon-main/70">
            <span className="text-miyeon-accent">✓</span> {reason}
          </p>
        ))}
      </div>

      {isPrimary && (
        <p className="mt-2 text-[11px] text-miyeon-main/70">{treatment.reviewCount} reviews from foreign visitors</p>
      )}
      {place.medicalTourismMatch && (
        <p className="mt-1 text-[11px] text-miyeon-main/70">Registered with Korea Medical Tourism Info (KTO)</p>
      )}

      <div className="mt-4 flex gap-2">
        {isPrimary && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/treatment/${treatment.id}`)}
            className="flex-1 rounded-full border border-miyeon-main/30 px-4 py-2.5 text-xs font-bold text-miyeon-main"
          >
            VIEW TREATMENT
          </motion.button>
        )}
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          href={withCreatripAffiliate(treatment.creatripUrl || place.bookingUrl || CREATRIP_BASE_URL)}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-full bg-miyeon-accent px-4 py-2.5 text-center text-xs font-bold text-white shadow-sm shadow-miyeon-accent/30"
        >
          CHECK AVAILABILITY →
        </motion.a>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-miyeon-main/60">{CREATRIP_DISCLOSURE}</p>
    </motion.div>
  );
};
