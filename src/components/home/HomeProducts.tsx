import React from 'react';
import { homeProducts, OLIVE_YOUNG_HOME } from '../../data/products';
import { SwipeRow } from '../common/SwipeRow';
import productBarrierCream from '../../assets/home/product-barrier-cream.jpg';
import productGentleCleanser from '../../assets/home/product-gentle-cleanser.jpg';
import productSpfFluid from '../../assets/home/product-spf-fluid.jpg';

const localImages: Record<string, string> = {
  'home-barrier-cream': productBarrierCream,
  'home-gentle-cleanser': productGentleCleanser,
  'home-spf-fluid': productSpfFluid,
};

export const HomeProducts: React.FC = () => (
  <section id="at-home" className="scroll-mt-20 bg-white pb-[30px] pt-[28px]">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-display text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent">
            SKIP THE CLINIC
          </p>
          <p className="font-display text-[20px] font-medium text-miyeon-ink sm:text-2xl">Bring Korea Home</p>
        </div>
        <a
          href={OLIVE_YOUNG_HOME}
          target="_blank"
          rel="noreferrer"
          className="text-[12.5px] text-miyeon-main/60 transition-colors hover:text-miyeon-ink"
        >
          Shop →
        </a>
      </div>

      <SwipeRow
        gap="gap-3"
        className="mt-4 sm:-mx-8 sm:px-8 sm:scroll-px-8 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0"
      >
        {homeProducts.map((product) => (
          <a
            key={product.id}
            href={product.oliveYoungUrl}
            target="_blank"
            rel="noreferrer"
            className="group block w-[132px] shrink-0 snap-start md:w-auto"
          >
            <img
              src={localImages[product.id] ?? product.imageUrl}
              alt={product.name}
              className="aspect-square w-full rounded-[12px] object-cover transition-transform group-hover:scale-[1.01]"
            />
            <div className="mt-2.5 flex items-center gap-[5px]">
              {product.rankBadge && (
                <span className="rounded-[3px] bg-miyeon-accent-soft px-[5px] py-[2px] text-[8px] font-bold text-miyeon-accent-dark">
                  {product.rankBadge}
                </span>
              )}
              <p className="text-[13px] font-medium text-miyeon-ink">{product.name}</p>
            </div>
            {product.tagline && (
              <p className="mt-[3px] text-[11px] leading-[1.35] text-miyeon-main/55">{product.tagline}</p>
            )}
            <div className="mt-[5px] flex items-center gap-[5px]">
              {product.originalPrice && (
                <span className="text-[12px] font-bold text-miyeon-accent-dark">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              )}
              <span className="text-[13px] font-medium text-miyeon-ink">${product.price}</span>
              {product.originalPrice && (
                <span className="text-[11px] text-miyeon-main/40 line-through">${product.originalPrice}</span>
              )}
            </div>
          </a>
        ))}
      </SwipeRow>
    </div>
  </section>
);
