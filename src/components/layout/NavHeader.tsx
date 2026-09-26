import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';
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
        <span className="flex items-center gap-1 text-xs font-medium text-miyeon-main" title="English">
          <Globe className="h-[15px] w-[15px]" strokeWidth={1.5} />
          EN
        </span>

        {session.isLoggedIn && session.user ? (
          <div className="flex items-center gap-3">
            <NavLink
              to={session.creator ? `/curator/${session.creator.id}` : '/curator/signup'}
              className="hidden text-xs font-semibold text-miyeon-main/70 transition-colors hover:text-miyeon-main sm:inline"
            >
              {session.creator ? 'My Curator Page' : 'Become a Curator'}
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
              Sign out
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSignIn}
            className="text-[13px] text-miyeon-main/60 transition-colors hover:text-miyeon-main sm:text-sm"
          >
            Sign in
          </motion.button>
        )}
      </div>
    </header>
  );
};
