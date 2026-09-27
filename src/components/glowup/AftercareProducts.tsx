import React from 'react';
import { aftercareProducts } from '../../data/products';
import { useT } from '../../i18n';
import productBarrierCream from '../../assets/home/product-barrier-cream.jpg';
import productGentleCleanser from '../../assets/home/product-gentle-cleanser.jpg';
import productSpfFluid from '../../assets/home/product-spf-fluid.jpg';

const images: Record<string, string> = {
  'after-barrier-cream': productBarrierCream,
  'after-gentle-cleanser': productGentleCleanser,
  'after-spf': productSpfFluid,
};

/** Fills the space under a short Skin Reset card with what to use once the clinic is done. Each card
 * opens an Amazon search for that exact product. */
export const AftercareProducts: React.FC = () => {
  const t = useT();
  return (
    <section className="mt-5">
      <p className="font-display text-[10.5px] font-medium tracking-[0.18em] text-miyeon-accent">{t('AFTER THE CLINIC')}</p>
      <p className="mt-1 font-display text-[17px] font-medium text-miyeon-ink">{t('Keep the glow at home')}</p>
      <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {aftercareProducts.map((product) => (
          <a
            key={product.id}
            href={product.amazonUrl}
            target="_blank"
            rel="noreferrer sponsored"
            className="group block w-[108px] shrink-0 snap-start"
          >
            <img
              src={images[product.id] ?? product.imageUrl}
              alt={product.name}
              className="aspect-square w-full rounded-[12px] object-cover transition-transform group-hover:scale-[1.01]"
            />
            <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-tight text-miyeon-ink">{product.name}</p>
            <p className="mt-0.5 text-[10.5px] leading-snug text-miyeon-main/55">{t(product.tagline)}</p>
            <p className="mt-1 text-[11px] font-medium text-miyeon-accent-dark">{t('Amazon →')}</p>
          </a>
        ))}
      </div>
    </section>
  );
};
