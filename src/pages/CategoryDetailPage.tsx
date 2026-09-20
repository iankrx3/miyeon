import React, { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { GlowUpSubtype, UserSession } from '../types';
import { guideFor } from '../data/categoryGuides';
import { getStoredItinerary } from '../lib/localItineraryStore';
import { buildGlowUpCreatripUrl, CREATRIP_DISCLOSURE } from '../lib/creatrip';
import { SwipeRow } from '../components/common/SwipeRow';
import { BeautyCardSheet } from '../components/glowup/BeautyCardSheet';

/** Figma "DETAIL — Personal Color": explains a Plan category before sending the
 * user to Creatrip for real options. */
export default function CategoryDetailPage({ session }: { session?: UserSession }) {
  const { subtype } = useParams<{ subtype: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const guide = subtype ? guideFor(subtype) : undefined;
  const [stepIndex, setStepIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [beautyCardOpen, setBeautyCardOpen] = useState(false);

  const fromItinerary = (location.state as { fromItinerary?: string } | null)?.fromItinerary;

  // The plan this page was opened from — needed for the Beauty Card email.
  const plan = useMemo(() => (fromItinerary ? getStoredItinerary(fromItinerary) : null), [fromItinerary]);

  const creatripHref = useMemo(() => {
    if (!guide) return null;
    const profile = fromItinerary ? getStoredItinerary(fromItinerary)?.glowUpSnapshot : undefined;
    return buildGlowUpCreatripUrl(guide.subtype as GlowUpSubtype, {
      region: profile?.region ?? null,
      languages: profile?.languages ?? [],
    });
  }, [guide, fromItinerary]);

  if (!guide) {
    return (
      <div className="px-5 py-10 text-sm text-miyeon-main/60">
        Category not found.{' '}
        <Link to="/" className="underline">
          Plan a trip
        </Link>
      </div>
    );
  }

  const onGalleryScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    const step = card.offsetWidth + 12;
    setStepIndex(Math.min(guide.steps.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };

  const ctaClass =
    'block w-full rounded-full bg-miyeon-ink py-[15px] text-center text-[14.5px] font-medium text-white';

  return (
    <div className="mx-auto max-w-xl pb-40 sm:pb-28">
      <div className="relative h-[340px] w-full overflow-hidden bg-miyeon-line">
        <img src={guide.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-miyeon-ink/75" />
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-5 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-[7px] text-[11.5px] font-medium text-miyeon-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/85">{guide.kicker}</p>
          <h1 className="mt-1.5 font-display text-[28px] font-bold leading-[1.15] text-white">{guide.headline}</h1>
        </div>
      </div>

      <div className="flex items-start px-5 py-5">
        <Stat value={`${guide.minutes}`} label="minutes" />
        <Stat value={guide.downtime} label="downtime" />
        <Stat value={`~$${guide.fromUsd}`} label="to start" />
      </div>

      {creatripHref && (
        <div className="px-5 pb-5">
          <a href={creatripHref} target="_blank" rel="noreferrer" className={ctaClass}>
            See options on Creatrip →
          </a>
          <p className="mt-2 text-center text-[11px] text-miyeon-main/45">or keep reading — 30 sec</p>
        </div>
      )}

      <div className="bg-miyeon-accent-soft px-6 py-7 text-center">
        <p className="text-[10px] font-medium tracking-[0.18em] text-miyeon-accent-dark">✦ WHY KOREA</p>
        <p className="mt-3 font-display text-xl font-bold leading-snug text-miyeon-ink">{guide.whyKorea}</p>
      </div>

      <section className="px-5 pt-7">
        <h2 className="font-display text-lg font-bold text-miyeon-ink">How it goes</h2>
        <p className="mt-1 text-[13px] text-miyeon-main/55">
          {guide.minutes} minutes, start to finish.
        </p>
        <div className="mt-4">
          <SwipeRow scrollRef={galleryRef} onScroll={onGalleryScroll}>
            {guide.steps.map((step, i) => (
              <div
                key={step.title}
                className="relative h-[280px] w-[230px] shrink-0 snap-start overflow-hidden rounded-[16px] bg-miyeon-line"
              >
                <img src={step.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-miyeon-ink/80" />
                <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                  <p className="text-[10px] font-medium tracking-[0.12em] text-white/80">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="font-display text-[18px] font-bold leading-tight">{step.title}</p>
                  <p className="mt-1 text-[11.5px] leading-snug text-white/85">{step.body}</p>
                </div>
              </div>
            ))}
          </SwipeRow>
        </div>
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {guide.steps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex ? 'w-[18px] bg-miyeon-accent' : 'w-1.5 bg-miyeon-line'
              }`}
            />
          ))}
        </div>
      </section>

      <section className="mt-7 bg-miyeon-surface px-5 py-7">
        <h2 className="font-display text-lg font-bold text-miyeon-ink">You leave with</h2>
        <div className="mt-3 space-y-2">
          {guide.leaveWith.map((item) => (
            <div key={item.title} className="flex gap-3 rounded-[12px] bg-white px-4 py-3.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-miyeon-accent" />
              <div>
                <p className="text-[14px] font-medium text-miyeon-ink">{item.title}</p>
                <p className="mt-0.5 text-xs text-miyeon-main/55">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pt-7">
        <h2 className="font-display text-lg font-bold text-miyeon-ink">Before you book</h2>
        <div className="mt-3 space-y-1.5 rounded-[14px] bg-miyeon-accent-soft p-4">
          {guide.beforeYouBook.map((line) => (
            <p key={line} className="flex gap-2 text-[12px] leading-relaxed text-miyeon-main/80">
              <span className="font-bold text-miyeon-accent-dark">•</span>
              {line}
            </p>
          ))}
        </div>
      </section>

      {creatripHref && (
        <div className="px-5 pt-6">
          <a
            href={creatripHref}
            target="_blank"
            rel="noreferrer"
            className={`${ctaClass} shadow-[0_6px_16px_rgba(207,63,97,0.22)]`}
          >
            See options on Creatrip →
          </a>
          {plan && (
            <button
              type="button"
              onClick={() => setBeautyCardOpen(true)}
              className="mt-3 block w-full rounded-full border-[1.5px] border-miyeon-accent bg-white py-[13px] text-center text-[14.5px] font-medium text-miyeon-accent-dark"
            >
              Get my Beauty Card
            </button>
          )}
          <p className="mt-2.5 text-center text-[10.5px] leading-snug text-miyeon-main/45">{CREATRIP_DISCLOSURE}</p>
        </div>
      )}

      {creatripHref && (
        <div className="fixed inset-x-0 bottom-[var(--bottom-nav-h)] z-30 flex items-center justify-between border-t border-miyeon-line bg-white px-5 py-3.5 shadow-[0_-3px_12px_rgba(0,0,0,0.07)] sm:bottom-0">
          <div>
            <p className="text-[15px] font-bold text-miyeon-ink">From ~${guide.fromUsd}</p>
            <p className="text-[10.5px] text-miyeon-main/55">{guide.name}</p>
          </div>
          <a
            href={creatripHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-miyeon-ink px-[18px] py-3.5 text-sm font-medium text-white"
          >
            See options →
          </a>
        </div>
      )}

      {beautyCardOpen && plan && (
        <BeautyCardSheet itinerary={plan} defaultEmail={session?.user?.email} onClose={() => setBeautyCardOpen(false)} />
      )}
    </div>
  );
}

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="flex flex-1 flex-col items-center gap-0.5">
    <p className="font-display text-2xl font-bold text-miyeon-accent-dark">{value}</p>
    <p className="text-[11px] text-miyeon-main/60">{label}</p>
  </div>
);
