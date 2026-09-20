import React from 'react';
import { defaultProducts, mockProducts } from '../../data/products';

interface ProductCommerceProps {
  concerns: string[];
}

// §02-8 — product-commerce teaser under Results. Ranks the mock catalog by tag overlap with the
// user's selected concerns, falls back to a default trio when nothing overlaps.
export const ProductCommerce: React.FC<ProductCommerceProps> = ({ concerns }) => {
  const ranked = [...mockProducts]
    .map((p) => ({ product: p, hits: p.concernTags.filter((t) => concerns.includes(t)).length }))
    .sort((a, b) => b.hits - a.hits);

  const picks = ranked[0]?.hits > 0 ? ranked.slice(0, 3).map((r) => r.product) : defaultProducts;
  const concernLabel = concerns.slice(0, 2).join(' + ') || 'your goals';

  return (
    <div className="rounded-3xl border border-miyeon-line bg-miyeon-accent-soft/40 p-5">
      <h3 className="text-sm font-bold text-miyeon-main">🧴 And at home</h3>
      <p className="mt-1 text-xs text-miyeon-main/60">
        Whatever you decide at the clinic, these help with {concernLabel}.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {picks.map((product) => (
          <a
            key={product.id}
            href={product.oliveYoungUrl}
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-2xl bg-white text-center shadow-sm"
          >
            <img src={product.imageUrl} alt={product.name} className="h-20 w-full object-cover" />
            <div className="p-2">
              <p className="line-clamp-2 text-[11px] font-medium leading-tight text-miyeon-main">{product.name}</p>
              <p className="mt-1 text-[11px] font-bold text-miyeon-accent">${product.price}</p>
            </div>
          </a>
        ))}
      </div>
      <p className="mt-3 text-center text-[10px] text-miyeon-main/60">via Olive Young</p>
    </div>
  );
};
