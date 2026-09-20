import React from 'react';
import trustCreatrip from '../../assets/home/trust-creatrip.png';
import trustO3c from '../../assets/home/trust-o3c.png';
import trustOliveYoung from '../../assets/home/trust-oliveyoung.png';
import trustAmazon from '../../assets/home/trust-amazon.png';

const logos = [
  { src: trustCreatrip, alt: 'Creatrip', className: 'h-7 w-auto' },
  { src: trustO3c, alt: 'o3c', className: 'h-6 w-auto' },
  { src: trustOliveYoung, alt: 'Olive Young', className: 'h-4 w-auto' },
  { src: trustAmazon, alt: 'amazon', className: 'h-[23px] w-auto' },
];

export const HomePartners: React.FC = () => (
  <section className="border-y border-miyeon-line bg-white px-5 py-6 sm:px-8 sm:py-10">
    <div className="mx-auto max-w-5xl text-center">
      <p className="text-[9.5px] font-medium uppercase tracking-[0.22em] text-miyeon-ink/45 sm:text-[11px]">
        Our trusted partners
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
        {logos.map((logo) => (
          <img key={logo.alt} src={logo.src} alt={logo.alt} className={`${logo.className} object-contain`} />
        ))}
      </div>
    </div>
  </section>
);
