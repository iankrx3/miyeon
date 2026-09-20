import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { Creator, UserSession } from '../types';
import { createCurator } from '../services/curator';
import { CuratorProfileForm, type CuratorProfileFormValues } from '../components/curator/CuratorProfileForm';

interface CuratorSignupPageProps {
  session: UserSession;
  onSignIn: () => void;
  onCreatorUpdated: (creator: Creator) => void;
}

export default function CuratorSignupPage({ session, onSignIn, onCreatorUpdated }: CuratorSignupPageProps) {
  const navigate = useNavigate();

  if (session.creator) return <Navigate to={`/curator/${session.creator.id}`} replace />;

  if (!session.isLoggedIn || !session.user) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-10 text-center">
        <h1 className="font-display text-2xl text-miyeon-main">Become a Curator</h1>
        <p className="text-sm text-miyeon-main/60">Sign in first to set up your curator profile.</p>
        <button
          onClick={onSignIn}
          className="rounded-full bg-miyeon-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-miyeon-accent/30"
        >
          Sign in
        </button>
      </div>
    );
  }

  const initial: CuratorProfileFormValues = {
    username: '',
    display_name: session.user.name,
    bio: '',
    instagram_url: '',
    tiktok_url: '',
    website_url: '',
  };

  const handleSubmit = async (values: CuratorProfileFormValues) => {
    const creator = await createCurator(session, {
      username: values.username.trim().replace(/^@/, ''),
      display_name: values.display_name.trim(),
      bio: values.bio.trim(),
      instagram_url: values.instagram_url.trim() || undefined,
      tiktok_url: values.tiktok_url.trim() || undefined,
      website_url: values.website_url.trim() || undefined,
    });
    onCreatorUpdated(creator);
    navigate(`/curator/${creator.id}`);
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60">
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div>
        <h1 className="font-display text-2xl text-miyeon-main">Become a Curator</h1>
        <p className="mt-1 text-xs text-miyeon-main/60">
          Set up your profile, then create lists of your favorite spots for others to explore on the map.
        </p>
      </div>

      <CuratorProfileForm
        initial={initial}
        submitLabel="Create curator profile"
        submittingLabel="Creating…"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
