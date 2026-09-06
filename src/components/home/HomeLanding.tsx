import React from 'react';
import { HomeHero } from './HomeHero';
import { HomeTrending } from './HomeTrending';
import { HomeProducts } from './HomeProducts';
import { HomePartners } from './HomePartners';
import { HomeTestimonials } from './HomeTestimonials';
import { HomeCta } from './HomeCta';

interface HomeLandingProps {
  onStartAnalysis: () => void;
}

export const HomeLanding: React.FC<HomeLandingProps> = ({ onStartAnalysis }) => (
  <div>
    <HomeHero onStartAnalysis={onStartAnalysis} />
    <HomeTrending />
    <HomeProducts />
    <HomePartners />
    <HomeTestimonials />
    <HomeCta onStartAnalysis={onStartAnalysis} />
  </div>
);
