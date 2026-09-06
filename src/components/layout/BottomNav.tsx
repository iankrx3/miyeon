import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, MapPin, User, Users } from 'lucide-react';
import type { UserSession } from '../../types';

interface BottomNavProps {
  session: UserSession;
  onSignIn: () => void;
}

const tabs = [
  { to: '/', label: 'Plan', icon: Compass },
  { to: '/map', label: 'Map', icon: MapPin },
  { to: '/community', label: 'Community', icon: Users },
];

export const BottomNav: React.FC<BottomNavProps> = ({ session, onSignIn }) => {

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-stretch border-t border-miyeon-neutral bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[9px] font-medium"
        >
          {({ isActive }) => (
            <>
              <Icon
                strokeWidth={1.5}
                className={`h-5 w-5 ${isActive ? 'text-miyeon-main' : 'text-miyeon-main/30'}`}
              />
              <span className={isActive ? 'text-miyeon-main' : 'text-miyeon-main/30'}>{label}</span>
            </>
          )}
        </NavLink>
      ))}

      {session.isLoggedIn && session.user ? (
        <NavLink
          to="/profile"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[9px] font-medium"
        >
          {({ isActive }) => (
            <>
              <img
                src={session.user!.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                className={`h-5 w-5 rounded-full object-cover ${
                  isActive ? 'ring-2 ring-miyeon-main' : 'ring-1 ring-miyeon-neutral'
                }`}
              />
              <span className={isActive ? 'text-miyeon-main' : 'text-miyeon-main/30'}>Profile</span>
            </>
          )}
        </NavLink>
      ) : (
        <button
          onClick={onSignIn}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[9px] font-medium text-miyeon-main/30"
        >
          <User strokeWidth={1.5} className="h-5 w-5" />
          Profile
        </button>
      )}
    </nav>
  );
};
