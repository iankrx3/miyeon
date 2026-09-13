import React, { useState } from 'react';
import { HomeHero } from './HomeHero';
import { HomeGlowUpEntries, type GlowUpSubEntry } from './HomeGlowUpEntries';
import { ComingSoonOverlay } from './ComingSoonOverlay';
import { HomeTrending } from './HomeTrending';
import { HomeProducts } from './HomeProducts';
import { HomePartners } from './HomePartners';
import { HomeTestimonials } from './HomeTestimonials';
import { HomeCta } from './HomeCta';

interface HomeLandingProps {
  onStartAnalysis: () => void;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({ onStartAnalysis }) => {
  const [comingSoon, setComingSoon] = useState<GlowUpSubEntry | null>(null);

  return (
    <div>
      <HomeHero onStartAnalysis={onStartAnalysis} />
      <HomeGlowUpEntries onComingSoon={setComingSoon} />
      <HomeTrending />
      <HomeProducts />
      <HomePartners />
      <HomeTestimonials />
      <HomeCta onStartAnalysis={onStartAnalysis} />
      <ComingSoonOverlay feature={comingSoon} onClose={() => setComingSoon(null)} />
    </div>
  );
};
