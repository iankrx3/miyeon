import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { Creator, UserSession } from '../types';
import { updateCurator } from '../services/curator';
import { CuratorProfileForm, type CuratorProfileFormValues } from '../components/curator/CuratorProfileForm';

interface CuratorEditPageProps {
  session: UserSession;
  onCreatorUpdated: (creator: Creator) => void;
}

export default function CuratorEditPage({ session, onCreatorUpdated }: CuratorEditPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const creator = session.creator;

  if (!creator || creator.id !== id) return <Navigate to={`/curator/${id ?? ''}`} replace />;

  const initial: CuratorProfileFormValues = {
    username: creator.username,
    display_name: creator.display_name,
    bio: creator.bio,
    instagram_url: creator.instagram_url ?? '',
    tiktok_url: creator.tiktok_url ?? '',
    website_url: creator.website_url ?? '',
  };

  const handleSubmit = async (values: CuratorProfileFormValues) => {
    const updated = await updateCurator(session, {
      username: values.username.trim().replace(/^@/, ''),
      display_name: values.display_name.trim(),
      bio: values.bio.trim(),
      instagram_url: values.instagram_url.trim() || undefined,
      tiktok_url: values.tiktok_url.trim() || undefined,
      website_url: values.website_url.trim() || undefined,
    });
    onCreatorUpdated(updated);
    navigate(`/curator/${updated.id}`);
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-semibold text-miyeon-main/60">
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div>
        <h1 className="font-display text-2xl text-miyeon-main">Edit profile</h1>
      </div>

      <CuratorProfileForm initial={initial} submitLabel="Save changes" submittingLabel="Saving…" onSubmit={handleSubmit} />
    </div>
  );
}
