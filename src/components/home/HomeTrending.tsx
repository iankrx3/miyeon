import React from 'react';
import { Link } from 'react-router-dom';
import { trendingItems } from '../../data/home';
import trendingTreatment from '../../assets/home/trending-treatment.jpg';
import trendingGuide from '../../assets/home/trending-guide.jpg';

const localImages: Record<string, string> = {
  'rejuran-juvelook': trendingTreatment,
  'four-days': trendingGuide,
};

const kindStyles: Record<string, string> = {
  TREATMENT: 'bg-miyeon-accent-dark text-white',
  GUIDE: 'bg-miyeon-accent-soft text-miyeon-accent-dark',
  TREND: 'bg-miyeon-accent-soft text-miyeon-accent-dark',
};

export const HomeTrending: React.FC = () => (
  <section className="bg-miyeon-surface py-7">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent">
            SEOUL IS CHANGING
          </p>
          <p className="mt-1 font-display text-xl text-miyeon-ink sm:text-2xl">Know What’s Next</p>
        </div>
        <Link
          to="/community?tab=magazine"
          className="hidden text-sm text-miyeon-main/60 transition-colors hover:text-miyeon-ink md:inline"
        >
          See all →
        </Link>
      </div>

      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {trendingItems.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="min-w-[250px] snap-start overflow-hidden rounded-2xl bg-white md:min-w-0"
          >
            <img
              src={localImages[item.id] ?? item.imageUrl}
              alt={item.title.replace(/\n/g, ' ')}
              className="aspect-[5/3] w-full object-cover"
            />
            <div className="p-3.5">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide ${kindStyles[item.kind]}`}
              >
                {item.kind}
              </span>
              <h3 className="mt-1.5 whitespace-pre-line font-display text-[14.5px] font-medium leading-[1.38] text-miyeon-ink">
                {item.title}
              </h3>
              <p className="mt-1.5 text-[11px] text-miyeon-main/50">{item.minutes} min read</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);
