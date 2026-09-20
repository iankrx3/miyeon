import React from 'react';
import { homeProducts, OLIVE_YOUNG_HOME } from '../../data/products';
import productBarrierCream from '../../assets/home/product-barrier-cream.jpg';
import productGentleCleanser from '../../assets/home/product-gentle-cleanser.jpg';
import productSpfFluid from '../../assets/home/product-spf-fluid.jpg';

const localImages: Record<string, string> = {
  'home-barrier-cream': productBarrierCream,
  'home-gentle-cleanser': productGentleCleanser,
  'home-spf-fluid': productSpfFluid,
};

export const HomeProducts: React.FC = () => (
  <section id="at-home" className="scroll-mt-20 bg-white py-[30px]">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent">
            SKIP THE CLINIC
          </p>
          <p className="mt-1 font-display text-xl text-miyeon-ink sm:text-2xl">Bring Korea Home</p>
        </div>
        <a
          href={OLIVE_YOUNG_HOME}
          target="_blank"
          rel="noreferrer"
          className="hidden text-sm text-miyeon-main/60 transition-colors hover:text-miyeon-ink md:inline"
        >
          Shop →
        </a>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
        {homeProducts.map((product) => (
          <a
            key={product.id}
            href={product.oliveYoungUrl}
            target="_blank"
            rel="noreferrer"
            className="group block"
          >
            <img
              src={localImages[product.id] ?? product.imageUrl}
              alt={product.name}
              className="aspect-square w-full rounded-xl object-cover transition-transform group-hover:scale-[1.01]"
            />
            <div className="mt-2.5 flex items-center gap-1.5">
              {product.rankBadge && (
                <span className="rounded bg-miyeon-accent-soft px-1.5 py-0.5 text-[8px] font-bold text-miyeon-accent-dark">
                  {product.rankBadge}
                </span>
              )}
              <p className="text-[13px] font-medium text-miyeon-ink">{product.name}</p>
            </div>
            {product.tagline && (
              <p className="mt-0.5 text-[11px] leading-snug text-miyeon-main/55">{product.tagline}</p>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              {product.originalPrice && (
                <span className="text-xs font-bold text-miyeon-accent-dark">
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
      </div>
    </div>
  </section>
);
