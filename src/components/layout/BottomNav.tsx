import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, MapPin, MessageCircle, User } from 'lucide-react';
import type { UserSession } from '../../types';

interface BottomNavProps {
  session: UserSession;
  onSignIn: () => void;
}

const tabs = [
  { to: '/', label: 'Explore', icon: Compass },
  { to: '/map', label: 'Map', icon: MapPin },
  { to: '/community', label: 'Community', icon: MessageCircle },
];

export const BottomNav: React.FC<BottomNavProps> = ({ session, onSignIn }) => {

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[430px] items-start justify-between border-t border-miyeon-line bg-white/95 px-8 pb-[max(18px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex flex-col items-center gap-[5px] text-[10px]"
        >
          {({ isActive }) => (
            <>
              <Icon
                strokeWidth={1.5}
                className={`h-[22px] w-[22px] ${isActive ? 'text-miyeon-ink' : 'text-miyeon-main/50'}`}
              />
              <span className={isActive ? 'font-medium text-miyeon-ink' : 'text-miyeon-main/50'}>{label}</span>
            </>
          )}
        </NavLink>
      ))}

      {session.isLoggedIn && session.user ? (
        <NavLink
          to="/profile"
          className="flex flex-col items-center gap-[5px] text-[10px]"
        >
          {({ isActive }) => (
            <>
              <img
                src={session.user!.avatar_url}
                alt=""
                referrerPolicy="no-referrer"
                className={`h-[22px] w-[22px] rounded-full object-cover ${
                  isActive ? 'ring-2 ring-miyeon-ink' : 'ring-1 ring-miyeon-line'
                }`}
              />
              <span className={isActive ? 'font-medium text-miyeon-ink' : 'text-miyeon-main/50'}>My</span>
            </>
          )}
        </NavLink>
      ) : (
        <button
          onClick={onSignIn}
          className="flex flex-col items-center gap-[5px] text-[10px] text-miyeon-main/50"
        >
          <User strokeWidth={1.5} className="h-[22px] w-[22px]" />
          My
        </button>
      )}
    </nav>
  );
};
