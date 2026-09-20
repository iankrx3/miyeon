import React from 'react';
import { Star } from 'lucide-react';
import { testimonials } from '../../data/home';
import reviewMaya from '../../assets/home/review-maya.png';
import reviewAlicia from '../../assets/home/review-alicia.png';
import reviewJess from '../../assets/home/review-jess.png';

const avatars: Record<string, string> = {
  maya: reviewMaya,
  alicia: reviewAlicia,
  jess: reviewJess,
};

export const HomeTestimonials: React.FC = () => (
  <section className="bg-miyeon-accent-soft py-[30px]">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <p className="font-display text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent">
        STILL DOOMSCROLLING?
      </p>
      <p className="mt-1 font-display text-xl text-miyeon-ink sm:text-2xl">Not Anymore</p>

      <div className="mt-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {testimonials.map((item) => (
          <blockquote
            key={item.id}
            className="min-w-[262px] snap-start rounded-2xl bg-white p-[18px] md:min-w-0"
          >
            <div className="flex items-center gap-2.5">
              <img src={avatars[item.id]} alt="" className="h-[34px] w-[34px] rounded-full object-cover" />
              <div>
                <p className="text-[13px] font-medium text-miyeon-ink">{item.name}</p>
                <p className="text-[11px] text-miyeon-main/50">{item.meta}</p>
                <div className="mt-0.5 flex gap-px">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 fill-miyeon-accent text-miyeon-accent" />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3.5 text-[13.5px] leading-[1.52] text-miyeon-ink">“{item.quote}”</p>
          </blockquote>
        ))}
      </div>
    </div>
  </section>
);
