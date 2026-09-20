import React, { useState } from 'react';
import { saveLead } from '../../services/leads';
import type { QuizAnswers } from '../../types';

interface EmailCaptureCardProps {
  answers: QuizAnswers;
  topTreatmentId: string | null;
}

// §02-9 — "Take this to your consultation." Saves the lead (email + trip date + quiz context)
// for future follow-up. No email is actually sent by this — success copy stays honest about that.
export const EmailCaptureCard: React.FC<EmailCaptureCardProps> = ({ answers, topTreatmentId }) => {
  const [email, setEmail] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('saving');
    try {
      await saveLead({
        email,
        tripDate: tripDate || null,
        category: answers.category,
        concerns: answers.concerns,
        vibes: answers.vibes,
        topTreatmentId,
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="rounded-3xl border border-miyeon-line bg-white p-5">
      <h3 className="text-sm font-bold text-miyeon-main">📋 Take this to your consultation.</h3>
      <p className="mt-1 text-xs text-miyeon-main/60">
        Your answers, your matches, and the questions to ask the doctor.
      </p>

      {status === 'saved' ? (
        <div className="mt-4 rounded-2xl bg-miyeon-accent-soft/50 px-4 py-3 text-xs text-miyeon-main">
          ✓ Saved — we'll be in touch before your trip. Good clinics fill up 2–3 weeks ahead.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-miyeon-main/70">📅 When's your trip?</label>
            <input
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              className="w-full rounded-xl border border-miyeon-line bg-white px-3 py-2 text-sm text-miyeon-main"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-miyeon-main/70">✉️ Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-miyeon-line bg-white px-3 py-2 text-sm text-miyeon-main"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'saving'}
            className="w-full rounded-full bg-miyeon-accent py-3 text-sm font-bold text-white shadow-sm shadow-miyeon-accent/30 disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving…' : 'Send me my card'}
          </button>
          {status === 'error' && (
            <p className="text-[11px] text-red-500">Couldn't save that — please try again.</p>
          )}
          <p className="text-center text-[10px] text-miyeon-main/60">
            Good clinics fill up 2–3 weeks ahead. We'll remind you when it's time to book.
          </p>
        </form>
      )}
    </div>
  );
};
