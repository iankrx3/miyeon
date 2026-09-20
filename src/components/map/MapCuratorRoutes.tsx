import React from 'react';
import { curatorRouteTeasers } from '../../data/mapCurators';

export const MapCuratorRoutes: React.FC = () => (
  <section className="bg-white py-6">
    <div className="flex items-center justify-between px-5">
      <div>
        <p className="font-display text-lg font-bold text-miyeon-ink">Curator routes</p>
        <p className="text-xs text-miyeon-main/60">Follow someone who did it already.</p>
      </div>
      <span className="text-xs text-miyeon-main/60">See all →</span>
    </div>

    <div className="mt-4 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
      {curatorRouteTeasers.map((route) => (
        <div key={route.id} className="w-[230px] shrink-0 overflow-hidden rounded-2xl border border-miyeon-line">
          <img src={route.cover} alt="" className="h-[140px] w-full object-cover" />
          <div className="p-3.5">
            <div className="flex items-center gap-2">
              <img src={route.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-miyeon-ink">{route.name}</p>
                <p className="truncate text-[10px] text-miyeon-main/50">{route.meta}</p>
              </div>
            </div>
            <p className="mt-2.5 font-display text-[15px] font-bold leading-snug text-miyeon-ink">{route.title}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="rounded-full bg-miyeon-accent-soft px-2 py-0.5 text-[9.5px] font-medium text-miyeon-accent-dark">
                {route.stops} stops
              </span>
              <span className="text-xs font-medium text-miyeon-ink">${route.priceUsd}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);
