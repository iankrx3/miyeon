import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import type { BeautyGoal, BeautyTripProfile, CreatripLanguage, Restriction } from '../types';
import {
  beautyTimeOptions,
  budgetOptions,
  detailsVibeOptions,
  downtimeOptions,
  faceVibeOptions,
  goalLabel,
  goalOptions,
  hairVibeOptions,
  languageOptions,
  makeupStyleVibeOptions,
  needleOptions,
  purposeLabel,
  purposeOptions,
  restrictionLabel,
  restrictionOptions,
  skinExperienceOptions,
  tripDaysOptions,
} from '../data/quiz';
import { HomeLanding } from '../components/home/HomeLanding';
import { OptionCard } from '../components/onboarding/OptionCard';
import { WizardShell } from '../components/onboarding/WizardShell';
import { AITransition } from '../components/quiz/AITransition';
import { emptyProfile, generateItinerary } from '../services/itinerary/generate';
import { upsertItinerary } from '../lib/localItineraryStore';

type Step =
  | 'home'
  | 'purpose'
  | 'goals'
  | 'skin'
  | 'needles'
  | 'hairVibe'
  | 'faceVibe'
  | 'makeupStyleVibe'
  | 'detailsVibe'
  | 'restrictions'
  | 'languages'
  | 'budget'
  | 'time'
  | 'days'
  | 'downtime'
  | 'profile'
  | 'transition';

const stepTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };

export default function ExplorePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('home');
  const [profile, setProfile] = useState<BeautyTripProfile>(emptyProfile());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const needsSkin = profile.goals.includes('skin');
  const needsNeedles = needsSkin && profile.skinExperience === 'medical';
  const needsHairVibe = profile.goals.includes('hair');
  const needsFaceVibe = profile.goals.includes('face');
  const needsMakeupStyleVibe = profile.goals.includes('makeup-style');
  const needsDetailsVibe = profile.goals.includes('details');

  const flow = useMemo<Step[]>(() => {
    const steps: Step[] = ['purpose', 'goals'];
    if (needsSkin) steps.push('skin');
    if (needsNeedles) steps.push('needles');
    if (needsHairVibe) steps.push('hairVibe');
    if (needsFaceVibe) steps.push('faceVibe');
    if (needsMakeupStyleVibe) steps.push('makeupStyleVibe');
    if (needsDetailsVibe) steps.push('detailsVibe');
    steps.push('restrictions', 'languages', 'budget', 'time', 'days', 'downtime', 'profile');
    return steps;
  }, [needsSkin, needsNeedles, needsHairVibe, needsFaceVibe, needsMakeupStyleVibe, needsDetailsVibe]);

  const stepIndex = Math.max(1, flow.indexOf(step) + 1);

  const goNextFrom = (current: Step) => {
    const idx = flow.indexOf(current);
    const next = flow[idx + 1] ?? 'profile';
    setStep(next);
  };

  const goBackFrom = (current: Step) => {
    const idx = flow.indexOf(current);
    if (idx <= 0) {
      setStep('home');
      return;
    }
    setStep(flow[idx - 1]);
  };

  const toggleGoal = (id: BeautyGoal) => {
    setProfile((prev) => {
      if (id === 'dont-know') {
        return { ...prev, goals: prev.goals.includes('dont-know') ? [] : ['dont-know'] };
      }
      const withoutUnknown = prev.goals.filter((g) => g !== 'dont-know');
      const next = withoutUnknown.includes(id)
        ? withoutUnknown.filter((g) => g !== id)
        : withoutUnknown.length >= 3
          ? withoutUnknown
          : [...withoutUnknown, id];
      return { ...prev, goals: next };
    });
  };

  const toggleRestriction = (id: Restriction) => {
    setProfile((prev) => {
      const selected = prev.restrictions.includes(id)
        ? prev.restrictions.filter((r) => r !== id)
        : [...prev.restrictions, id];
      return { ...prev, restrictions: selected, nothingOffLimits: false };
    });
  };

  const toggleLanguage = (id: CreatripLanguage) => {
    setProfile((prev) => {
      const selected = prev.languageNeeds.includes(id)
        ? prev.languageNeeds.filter((l) => l !== id)
        : [...prev.languageNeeds, id];
      return { ...prev, languageNeeds: selected };
    });
  };

  const handleBuild = () => setStep('transition');

  const handleTransitionDone = () => {
    const itinerary = generateItinerary(profile);
    upsertItinerary(itinerary);
    navigate(`/itinerary/${itinerary.id}`);
  };

  if (step === 'home') {
    return <HomeLanding onStartAnalysis={() => setStep('purpose')} />;
  }

  if (step === 'transition') {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <AITransition onDone={handleTransitionDone} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl overflow-hidden px-4 py-8 sm:py-14">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={stepTransition}
        >
          {step === 'purpose' && (
            <WizardShell
              title="What’s this trip really about?"
              subtitle="There’s no right answer. Tell us what you’re hoping to get out of Seoul."
              step={stepIndex}
              total={flow.length}
              onBack={() => setStep('home')}
            >
              <div className="space-y-2.5">
                {purposeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    large
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.purpose === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, purpose: opt.id }));
                      setTimeout(() => goNextFrom('purpose'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'goals' && (
            <WizardShell
              title="What would you most like to improve?"
              subtitle={`${profile.goals.filter((g) => g !== 'dont-know').length} / 3 selected`}
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('goals')}
              onNext={() => goNextFrom('goals')}
              nextDisabled={profile.goals.length === 0}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {goalOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.goals.includes(opt.id)}
                    onClick={() => toggleGoal(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'skin' && (
            <WizardShell
              title="What kind of experience are you looking for?"
              subtitle="We’ll only ask medical questions if they’re actually relevant."
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('skin')}
            >
              <div className="space-y-2.5">
                {skinExperienceOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.skinExperience === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, skinExperience: opt.id }));
                      setTimeout(() => goNextFrom('skin'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'needles' && (
            <WizardShell
              title="Are you comfortable with treatments involving needles?"
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('needles')}
            >
              <div className="space-y-2.5">
                {needleOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.needleComfort === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, needleComfort: opt.id }));
                      setTimeout(() => goNextFrom('needles'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'hairVibe' && (
            <WizardShell
              title="What's calling you for hair?"
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('hairVibe')}
            >
              <div className="space-y-2.5">
                {hairVibeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.subcategoryVibe.hair === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, subcategoryVibe: { ...p.subcategoryVibe, hair: opt.id } }));
                      setTimeout(() => goNextFrom('hairVibe'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'faceVibe' && (
            <WizardShell
              title="What matters most for your face?"
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('faceVibe')}
            >
              <div className="space-y-2.5">
                {faceVibeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.subcategoryVibe.face === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, subcategoryVibe: { ...p.subcategoryVibe, face: opt.id } }));
                      setTimeout(() => goNextFrom('faceVibe'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'makeupStyleVibe' && (
            <WizardShell
              title="How do you want to look your best?"
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('makeupStyleVibe')}
            >
              <div className="space-y-2.5">
                {makeupStyleVibeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.subcategoryVibe['makeup-style'] === opt.id}
                    onClick={() => {
                      setProfile((p) => ({
                        ...p,
                        subcategoryVibe: { ...p.subcategoryVibe, 'makeup-style': opt.id },
                      }));
                      setTimeout(() => goNextFrom('makeupStyleVibe'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'detailsVibe' && (
            <WizardShell
              title="Any finishing touches on your list?"
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('detailsVibe')}
            >
              <div className="space-y-2.5">
                {detailsVibeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.subcategoryVibe.details === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, subcategoryVibe: { ...p.subcategoryVibe, details: opt.id } }));
                      setTimeout(() => goNextFrom('detailsVibe'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'restrictions' && (
            <WizardShell
              title="Pick anything that’s off-limits."
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('restrictions')}
              onNext={() => goNextFrom('restrictions')}
              nextDisabled={!profile.nothingOffLimits && profile.restrictions.length === 0}
            >
              <label className="mb-3 flex items-center justify-between rounded-2xl border border-miyeon-neutral bg-white px-4 py-3">
                <span className="text-sm font-semibold text-miyeon-main">Nothing is off limits</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profile.nothingOffLimits}
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      nothingOffLimits: !p.nothingOffLimits,
                      restrictions: !p.nothingOffLimits ? [] : p.restrictions,
                    }))
                  }
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    profile.nothingOffLimits ? 'bg-miyeon-sub1' : 'bg-miyeon-neutral'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      profile.nothingOffLimits ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
              <div className="space-y-2.5">
                {restrictionOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.restrictions.includes(opt.id)}
                    disabled={profile.nothingOffLimits}
                    onClick={() => toggleRestriction(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'languages' && (
            <WizardShell
              title="Do you need staff who speak a specific language?"
              subtitle="Optional — skip if English is fine."
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('languages')}
              onNext={() => goNextFrom('languages')}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {languageOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.languageNeeds.includes(opt.id)}
                    onClick={() => toggleLanguage(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'budget' && (
            <WizardShell
              title="How much do you want to spend on beauty?"
              subtitle="This is your beauty budget, not the whole trip."
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('budget')}
            >
              <div className="space-y-2.5">
                {budgetOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.budget === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, budget: opt.id }));
                      setTimeout(() => goNextFrom('budget'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'time' && (
            <WizardShell
              title="How much time do you want to spend on beauty?"
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('time')}
            >
              <div className="space-y-2.5">
                {beautyTimeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.beautyTime === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, beautyTime: opt.id }));
                      setTimeout(() => goNextFrom('time'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'days' && (
            <WizardShell
              title="How many days in Seoul should we plan around?"
              subtitle="We use this to split neighborhoods across days."
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('days')}
            >
              <div className="space-y-2.5">
                {tripDaysOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.tripDays === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, tripDays: opt.id }));
                      setTimeout(() => goNextFrom('days'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'downtime' && (
            <WizardShell
              title="How much recovery time are you comfortable with?"
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('downtime')}
            >
              <div className="space-y-2.5">
                {downtimeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.downtime === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, downtime: opt.id }));
                      setTimeout(() => goNextFrom('downtime'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'profile' && (
            <WizardShell
              title="Got it. Here’s what we’re planning around."
              step={stepIndex}
              total={flow.length}
              onBack={() => goBackFrom('profile')}
              onNext={handleBuild}
              nextLabel="Build my itinerary →"
            >
              <div className="space-y-5 rounded-3xl border border-miyeon-neutral bg-white p-5 text-sm">
                <ProfileRow label="YOUR GOAL" value={profile.purpose ? purposeLabel[profile.purpose] : '—'} />
                <ProfileRow
                  label="FOCUS"
                  value={
                    profile.goals.length
                      ? profile.goals.map((g) => goalLabel[g]).join(' · ')
                      : '—'
                  }
                />
                <ProfileRow
                  label="YOU PREFER"
                  value={
                    profile.nothingOffLimits
                      ? 'Nothing is off limits'
                      : profile.restrictions.map((r) => restrictionLabel[r]).join('\n') || '—'
                  }
                />
                <ProfileRow
                  label="BEAUTY BUDGET"
                  value={budgetOptions.find((b) => b.id === profile.budget)?.label ?? '—'}
                />
                <ProfileRow
                  label="TIME"
                  value={beautyTimeOptions.find((b) => b.id === profile.beautyTime)?.label ?? '—'}
                />
                {profile.languageNeeds.length > 0 && (
                  <ProfileRow label="LANGUAGE" value={profile.languageNeeds.join(' · ')} />
                )}
              </div>
            </WizardShell>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const ProfileRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-wider text-miyeon-main/45">{label}</p>
    <p className="mt-1 whitespace-pre-line font-medium text-miyeon-main">{value}</p>
  </div>
);
