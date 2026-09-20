import React from 'react';
import { Link } from 'react-router-dom';
import { Info, TriangleAlert } from 'lucide-react';
import type { ItineraryDay } from '../../types';
import { guideFor } from '../../data/categoryGuides';

interface GlowUpCategoryListProps {
  day: ItineraryDay;
  itineraryId: string;
}

/** The Plan result's stops for one day: category recommendations (Skin Clinic,
 * Personal Color…), each opening its explainer page — not specific venues. */
export const GlowUpCategoryList: React.FC<GlowUpCategoryListProps> = ({ day, itineraryId }) => {
  const stops = day.blocks.filter((b) => b.glowUpSubtype);

  if (stops.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-miyeon-line px-4 py-8 text-center text-sm text-miyeon-main/55">
        Nothing planned — explore at your own pace.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {stops.map((block, i) => {
        const guide = guideFor(block.glowUpSubtype!);
        if (!guide) return null;
        const NoteIcon = guide.resultNote?.tone === 'warn' ? TriangleAlert : Info;
        return (
          <div key={block.id} className="flex items-start gap-3">
            <div
              className={`mt-3 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-miyeon-accent text-[11.5px] font-bold ${
                i === 0 ? 'bg-miyeon-accent text-white' : 'bg-white text-miyeon-accent'
              }`}
            >
              {i + 1}
            </div>
            <Link
              to={`/category/${guide.subtype}`}
              state={{ fromItinerary: itineraryId }}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-miyeon-line bg-white p-2.5"
            >
              <img src={guide.image} alt="" className="h-14 w-14 shrink-0 rounded-[10px] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {block.startTime && (
                    <span className="shrink-0 rounded bg-miyeon-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-miyeon-accent-dark">
                      {block.startTime}
                    </span>
                  )}
                  <h3 className="truncate text-[15px] font-medium text-miyeon-ink">{guide.name}</h3>
                </div>
                <p className="mt-0.5 truncate text-xs text-miyeon-main/60">
                  {guide.summary}
                  {block.priceUsd != null ? ` · ~$${block.priceUsd}` : ''}
                </p>
                {guide.resultNote && (
                  <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-miyeon-accent-dark">
                    <NoteIcon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{guide.resultNote.text}</span>
                  </p>
                )}
              </div>
              <span className="shrink-0 text-lg text-miyeon-main/35" aria-hidden>
                ›
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
};
