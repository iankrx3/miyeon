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
  return (
    <div className="space-y-4">
      {day.theme && <p className="font-display text-xl text-miyeon-main">{day.theme}</p>}
      {day.blocks.map((block) => {
        if (block.kind === 'travel' && block.travel) {
          return (
            <p key={block.id} className="text-xs font-medium text-miyeon-main/55">
              {TRAVEL_ICON[block.travel.mode]} {block.travel.minutes} min {block.travel.mode}
            </p>
          );
        }
        if (block.kind === 'break') {
          return (
            <div key={block.id} className="rounded-2xl border border-dashed border-miyeon-neutral px-4 py-3 text-sm text-miyeon-main/70">
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
        return (
          <article key={block.id} className="rounded-2xl border border-miyeon-neutral bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => spot && onOpenSpot?.(spot)}
                className="text-left"
                disabled={!spot}
              >
                <p className="text-xs font-semibold text-miyeon-main/50">{block.startTime}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-miyeon-sub1">
                  {spot ? SUBCATEGORY_LABEL[spot.subcategory] : 'Creatrip listings'}
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-miyeon-main">
                  {venueName ?? block.label ?? 'Listing'}
                </h3>
              </button>
              {onOpenMenu && spot && (
                <button
                  type="button"
                  aria-label="Spot options"
                  onClick={() => onOpenMenu(block.id, spot)}
                  className="rounded-full p-1.5 text-miyeon-main/50 hover:bg-miyeon-neutral"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            </div>
            {(spot || block.address) && (
              <p className="mt-2 text-xs text-miyeon-main/60">
                📍 {spot?.area ?? block.address}
                {block.durationMin ? ` · ⏱ ${block.durationMin} min` : ''}
                {block.priceUsd != null ? ` · 💰 $${block.priceUsd}` : ''}
              </p>
            )}
            {block.reason && (
              <p className="mt-2 text-xs italic leading-snug text-miyeon-main/70">Why we chose this — {block.reason}</p>
            )}
            {block.note && <p className="mt-1 text-xs text-miyeon-main/60">{block.note}</p>}
            {creatripHref && (
              <a
                href={creatripHref}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-3 block w-full rounded-full bg-miyeon-sub1 py-2.5 text-center text-sm font-bold text-white shadow-sm shadow-miyeon-sub1/30"
              >
                {creatripLabel}
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
};
