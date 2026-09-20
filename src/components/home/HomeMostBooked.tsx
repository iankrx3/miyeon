import React from 'react';
import { Star, MapPin } from 'lucide-react';
import { mostBookedItems } from '../../data/home';
import { withCreatripAffiliate, CREATRIP_DISCLOSURE } from '../../lib/creatrip';
import mostBooked1 from '../../assets/home/mostbooked-1-personal-color.png';
import mostBooked2 from '../../assets/home/mostbooked-2-skin-booster.png';
import mostBooked3 from '../../assets/home/mostbooked-3-hair-color.png';

const images: Record<string, string> = {
  'personal-color-analysis': mostBooked1,
  'skin-booster': mostBooked2,
  'korean-hair-color': mostBooked3,
};

export const HomeMostBooked: React.FC = () => (
  <section className="bg-white py-7">
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent">
            THEY ALREADY GLOW
          </p>
          <p className="mt-1 font-display text-xl text-miyeon-ink">Most Booked This Week</p>
        </div>
        <span className="text-xs text-miyeon-main/60">See all →</span>
      </div>

      <div className="mt-3.5 divide-y divide-miyeon-line">
        {mostBookedItems.map((item) => (
          <a
            key={item.id}
            href={withCreatripAffiliate(item.creatripUrl)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group flex items-center gap-3 py-3"
          >
            <img
              src={images[item.id]}
              alt={item.name}
              className="h-[62px] w-[62px] shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-[15px] font-bold text-miyeon-accent">{item.rank}</span>
                <span className="truncate text-[14.5px] font-medium text-miyeon-ink">{item.name}</span>
                {item.best && (
                  <span className="shrink-0 rounded bg-miyeon-accent px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white">
                    BEST
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-miyeon-main/55">
                <Star className="h-[11px] w-[11px] fill-miyeon-ink text-miyeon-ink" />
                <span className="font-medium text-miyeon-ink">{item.rating}</span>
                <span>({item.reviews.toLocaleString()})</span>
                <span>·</span>
                <span>{item.duration}</span>
              </div>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-miyeon-accent-soft px-2 py-0.5 text-[10px] font-medium text-miyeon-accent-dark">
                <MapPin className="h-[9px] w-[9px]" />
                {item.location}
              </span>
              <p className="mt-1 text-[12.5px] font-medium text-miyeon-ink">From ${item.fromPrice}</p>
            </div>
            <span className="shrink-0 text-miyeon-main/45 transition-colors group-hover:text-miyeon-accent">→</span>
          </a>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-miyeon-main/60">{CREATRIP_DISCLOSURE}</p>
    </div>
  </section>
);
