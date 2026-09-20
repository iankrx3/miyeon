import React from 'react';
import { HomeHero } from './HomeHero';
import { HomePartners } from './HomePartners';
import { HomeGlowUpEntries } from './HomeGlowUpEntries';
import { HomeMostBooked } from './HomeMostBooked';
import { HomeTestimonials } from './HomeTestimonials';
import { HomeTrending } from './HomeTrending';
import { HomeProducts } from './HomeProducts';
import { HomeWhyOrderMatters } from './HomeWhyOrderMatters';
import { HomeCta } from './HomeCta';
import { HomeFooter } from './HomeFooter';

interface HomeLandingProps {
  onStartAnalysis: () => void;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({ onStartAnalysis }) => {
  return (
    <div>
      <HomeHero onStartAnalysis={onStartAnalysis} />
      <HomePartners />
      <HomeGlowUpEntries onStartAnalysis={onStartAnalysis} />
      <HomeMostBooked />
      <HomeTestimonials />
      <HomeTrending />
      <HomeProducts />
      <HomeWhyOrderMatters onStartAnalysis={onStartAnalysis} />
      <HomeCta onStartAnalysis={onStartAnalysis} />
      <HomeFooter />
    </div>
  );
};
