import React from 'react';
import { CREATRIP_DISCLOSURE } from '../../lib/creatrip';

const links = ['Terms of Use', 'Privacy Policy', 'Contact'];

export const HomeFooter: React.FC = () => (
  <footer className="bg-miyeon-surface px-5 py-7 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-0.5 font-wordmark text-[19px] font-light tracking-tight text-miyeon-ink">
        miyeon
        <span className="mt-0.5 text-[7px] text-miyeon-accent">✦</span>
      </div>

      <div className="mt-3.5 flex gap-3.5 text-[11.5px] font-medium text-miyeon-main/75">
        {links.map((link) => (
          <span key={link}>{link}</span>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-1 text-[10.5px] leading-[1.5] text-miyeon-main/50">
        <p>MIYEON · o3c</p>
        <p>CEO · SEONGCHAN LEE</p>
        <p>Address · 50 Yonsei-ro, Seodaemun-gu, Seoul, Republic of Korea</p>
        <p>Email · o3c.korea@gmail.com</p>
      </div>

      <p className="mt-3.5 text-[10px] leading-[1.55] text-miyeon-main/40">
        Miyeon is a trip-planning service, not a medical provider. Treatment decisions are made at your
        in-person consultation in Korea. Bookings are completed on partner platforms.
      </p>

      <p className="mt-2 text-[10px] leading-[1.55] text-miyeon-main/40">{CREATRIP_DISCLOSURE}</p>

      <p className="mt-3 text-[10px] text-miyeon-main/40">© 2026 MIYEON. All rights reserved.</p>
    </div>
  </footer>
);
