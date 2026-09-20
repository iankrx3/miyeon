import React, { useState } from 'react';

export interface CuratorProfileFormValues {
  username: string;
  display_name: string;
  bio: string;
  instagram_url: string;
  tiktok_url: string;
  website_url: string;
}

interface CuratorProfileFormProps {
  initial: CuratorProfileFormValues;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (values: CuratorProfileFormValues) => Promise<void>;
}

const inputClass =
  'w-full rounded-xl border border-miyeon-line bg-white px-3.5 py-2.5 text-sm text-miyeon-main placeholder:text-miyeon-main/60 focus:outline-none focus:border-miyeon-accent/50';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold text-miyeon-main/70">{label}</span>
    {children}
  </label>
);

export const CuratorProfileForm: React.FC<CuratorProfileFormProps> = ({
  initial,
  submitLabel,
  submittingLabel,
  onSubmit,
}) => {
  const [values, setValues] = useState<CuratorProfileFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (key: keyof CuratorProfileFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const canSubmit = values.username.trim().length > 0 && values.display_name.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Field label="Username">
          <input value={values.username} onChange={set('username')} placeholder="yourhandle" className={inputClass} />
        </Field>
        <Field label="Display name">
          <input value={values.display_name} onChange={set('display_name')} className={inputClass} />
        </Field>
        <Field label="Bio">
          <textarea
            value={values.bio}
            onChange={set('bio')}
            rows={3}
            maxLength={280}
            placeholder="Tell people what you curate…"
            className={`${inputClass} resize-none`}
          />
        </Field>
        <Field label="Instagram URL">
          <input
            value={values.instagram_url}
            onChange={set('instagram_url')}
            placeholder="https://instagram.com/…"
            className={inputClass}
          />
        </Field>
        <Field label="TikTok URL">
          <input
            value={values.tiktok_url}
            onChange={set('tiktok_url')}
            placeholder="https://tiktok.com/@…"
            className={inputClass}
          />
        </Field>
        <Field label="Website">
          <input value={values.website_url} onChange={set('website_url')} placeholder="https://…" className={inputClass} />
        </Field>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-miyeon-accent py-3 text-sm font-bold text-white shadow-sm shadow-miyeon-accent/30 disabled:opacity-40"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </div>
  );
};
