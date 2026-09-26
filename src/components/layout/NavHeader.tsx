import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Globe } from 'lucide-react';
import { LANGUAGES, useLang } from '../../i18n';
import type { UserSession } from '../../types';

interface NavHeaderProps {
  session: UserSession;
  onSignIn: () => void;
  onSignOut: () => void;
}

const tabs = [
  { to: '/', label: 'Plan' },
  { to: '/map', label: 'Map' },
  { to: '/community', label: 'Community' },
];

export const NavHeader: React.FC<NavHeaderProps> = ({ session, onSignIn, onSignOut }) => {
  const { lang, setLang, t } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!langOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [langOpen]);

  return (
    <header className="sticky top-0 z-40 grid grid-cols-[1fr_auto] items-center h-[var(--header-h)] border-b border-miyeon-line bg-white/95 px-5 backdrop-blur-md sm:grid-cols-[1fr_auto_1fr] sm:px-10">
      <NavLink
        to="/"
        className="flex items-start gap-[3px] justify-self-start font-wordmark text-[22px] font-light tracking-[0.05em] text-miyeon-ink sm:text-[24px]"
      >
        miyeon
        <span className="mt-1 text-[8px] font-normal tracking-normal text-miyeon-accent sm:text-[9px]">✦</span>
      </NavLink>

      <nav className="hidden items-center gap-8 sm:flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `text-sm transition-colors ${
                isActive ? 'font-semibold text-miyeon-ink' : 'text-miyeon-main/40 hover:text-miyeon-ink'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-self-end gap-3">
        <div ref={langRef} className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            aria-label={t('Language')}
            className="flex items-center gap-1 rounded-full py-1 text-xs font-medium text-miyeon-main"
          >
            <Globe className="h-[15px] w-[15px]" strokeWidth={1.5} />
            {current.short}
          </button>
          {langOpen && (
            <ul
              role="listbox"
              aria-label={t('Language')}
              className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-[14px] border border-miyeon-line bg-white py-1 shadow-[0_8px_24px_rgba(43,37,35,0.12)]"
            >
              {LANGUAGES.map((l) => (
                <li key={l.code} role="option" aria-selected={l.code === lang}>
                  <button
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13.5px] ${
                      l.code === lang ? 'font-medium text-miyeon-ink' : 'text-miyeon-main'
                    }`}
                  >
                    {l.label}
                    {l.code === lang && <Check className="h-3.5 w-3.5 text-miyeon-accent" strokeWidth={2.5} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {session.isLoggedIn && session.user ? (
          <div className="flex items-center gap-3">
            <NavLink
              to={session.creator ? `/curator/${session.creator.id}` : '/curator/signup'}
              className="whitespace-nowrap text-xs font-semibold text-miyeon-main/70 transition-colors hover:text-miyeon-main"
            >
              {session.creator ? t('My Curator Page') : t('Become a Curator')}
            </NavLink>
            <NavLink to="/profile" className="hidden sm:inline">
              <img
                src={session.user.avatar_url}
                alt={session.user.name}
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-full object-cover ring-1 ring-miyeon-line"
              />
            </NavLink>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSignOut}
              className="text-xs font-semibold text-miyeon-main"
            >
              {t('Sign out')}
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSignIn}
            className="text-[13px] text-miyeon-main/60 transition-colors hover:text-miyeon-main sm:text-sm"
          >
            {t('Sign in')}
          </motion.button>
        )}
      </div>
    </header>
  );
};
