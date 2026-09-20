import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { BeautyTripProfile, GlowUpProfile, ItineraryDay, Spot } from '../../types';
import { getSpot, SUBCATEGORY_LABEL } from '../../data/spots';
import { buildCreatripListUrl, buildGlowUpCreatripUrl, creatripThemesForProfile } from '../../lib/creatrip';
import { creatripSubcategoryFor } from '../../services/itinerary/generate';

interface ItineraryTimelineProps {
  day: ItineraryDay;
  profile?: BeautyTripProfile | null;
  glowUpProfile?: GlowUpProfile | null;
  onOpenMenu?: (blockId: string, spot: Spot) => void;
  onOpenSpot?: (spot: Spot) => void;
}

const TRAVEL_ICON: Record<string, string> = {
  walk: '🚶',
  subway: '🚇',
  taxi: '🚕',
};

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  day,
  profile,
  glowUpProfile,
  onOpenMenu,
  onOpenSpot,
}) => {
  const stops = day.blocks.filter((b) => b.kind !== 'travel' && b.kind !== 'break');
  let stopNumber = 0;

  return (
    <div>
      {day.theme && (
        <p className="mb-4 font-display text-[17px] font-bold text-miyeon-ink">{day.theme}</p>
      )}

      <div className="space-y-2.5">
        {day.blocks.map((block) => {
          if (block.kind === 'travel' && block.travel) {
            return (
              <p key={block.id} className="pl-[38px] text-xs font-medium text-miyeon-main/50">
                {TRAVEL_ICON[block.travel.mode]} {block.travel.minutes} min {block.travel.mode}
              </p>
            );
          }
          if (block.kind === 'break') {
            return (
              <div
                key={block.id}
                className="ml-[38px] rounded-2xl border border-dashed border-miyeon-line px-4 py-3 text-sm text-miyeon-main/70"
              >
                {block.startTime && <span className="mr-2 text-xs font-semibold">{block.startTime}</span>}
                🍜 {block.label ?? 'Break'}
              </div>
            );
          }
          const spot = block.spotId ? getSpot(block.spotId) : undefined;
          const venueName = spot?.name ?? block.venueName;
          const glowHref =
            block.glowUpSubtype && glowUpProfile
              ? buildGlowUpCreatripUrl(block.glowUpSubtype, {
                  region: glowUpProfile.region,
                  budget: glowUpProfile.budget,
                  languages: glowUpProfile.languages,
                })
              : null;
          const legacyHref = spot
            ? buildCreatripListUrl(creatripSubcategoryFor(spot, profile), creatripThemesForProfile(profile))
            : null;
          const creatripHref = glowHref ?? legacyHref;
          const creatripLabel = glowHref ? 'Find more on Creatrip →' : 'Book with Creatrip →';
          if (!spot && !block.glowUpSubtype && !venueName) return null;
          stopNumber += 1;

          return (
            <div key={block.id} className="flex items-start gap-3">
              <div className="relative mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-miyeon-accent text-[11.5px] font-bold text-white">
                {stopNumber}
              </div>
              <article className="min-w-0 flex-1 rounded-[14px] border border-miyeon-line bg-white p-3">
                <div className="flex items-center gap-3">
                  {spot?.images?.[0] && (
                    <img
                      src={spot.images[0]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => spot && onOpenSpot?.(spot)}
                    className="min-w-0 flex-1 text-left"
                    disabled={!spot}
                  >
                    <div className="flex items-center gap-1.5">
                      {block.startTime && (
                        <span className="shrink-0 rounded bg-miyeon-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-miyeon-accent-dark">
                          {block.startTime}
                        </span>
                      )}
                      <h3 className="truncate text-[14.5px] font-medium text-miyeon-ink">
                        {venueName ?? block.label ?? 'Listing'}
                      </h3>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-miyeon-main/60">
                      {spot ? SUBCATEGORY_LABEL[spot.subcategory] : 'Creatrip listings'}
                      {block.priceUsd != null ? ` · ~$${block.priceUsd}` : ''}
                    </p>
                    {block.note && <p className="mt-0.5 text-[10.5px] text-miyeon-accent-dark/90">ℹ️ {block.note}</p>}
                  </button>
                  {onOpenMenu && spot ? (
                    <button
                      type="button"
                      aria-label="Spot options"
                      onClick={() => onOpenMenu(block.id, spot)}
                      className="shrink-0 rounded-full p-1.5 text-miyeon-main/40 hover:bg-miyeon-surface"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="shrink-0 text-lg text-miyeon-main/35">›</span>
                  )}
                </div>
                {(spot || block.address) && (
                  <p className="mt-2 text-xs text-miyeon-main/55">
                    📍 {spot?.area ?? block.address}
                    {block.durationMin ? ` · ⏱ ${block.durationMin} min` : ''}
                  </p>
                )}
                {block.reason && (
                  <p className="mt-1.5 text-xs italic leading-snug text-miyeon-main/60">
                    Why we chose this — {block.reason}
                  </p>
                )}
                {creatripHref && (
                  <a
                    href={creatripHref}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 block w-full rounded-full bg-miyeon-ink py-2.5 text-center text-sm font-medium text-white"
                  >
                    {creatripLabel}
                  </a>
                )}
              </article>
            </div>
          );
        })}
      </div>

      {stops.length > 0 && (
        <div className="mt-6 rounded-[14px] bg-miyeon-surface px-4 py-4">
          <p className="text-[10.5px] font-bold tracking-[0.16em] text-miyeon-accent-dark">MIYEON CHECKED</p>
          <ul className="mt-2 space-y-1.5">
            {[
              'Order — placed so nothing works against itself',
              'Timing — nothing overlaps',
              'Your filters — budget, area, language',
              "What's real — filtered, not ads",
            ].map((line) => (
              <li key={line} className="flex gap-1.5 text-[11.5px] leading-relaxed text-miyeon-main/75">
                <span className="font-bold text-miyeon-accent">✓</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
