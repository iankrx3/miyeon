import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  ChangeItem,
  FixItem,
  GlowUpBudget,
  GlowUpLanguage,
  GlowUpProfile,
  GlowUpRegion,
  GlowUpResult,
  GlowUpTripDays,
  RestoreItem,
} from '../types';
import {
  budgetOptions,
  changeOptions,
  fixDowntimeOptions,
  fixOptions,
  fixReactionCopy,
  glowUpTransitionMessages,
  languageOptions,
  regionOptions,
  restoreOptions,
  tripDaysOptions,
} from '../data/glowUpQuiz';
import { HomeLanding } from '../components/home/HomeLanding';
import { OptionCard } from '../components/onboarding/OptionCard';
import { WizardShell } from '../components/onboarding/WizardShell';
import { AITransition } from '../components/quiz/AITransition';
import { GlowUpWhyThis } from '../components/glowup/GlowUpWhyThis';
import { GlowUpResultGrid } from '../components/glowup/GlowUpResultGrid';
import { GlowUpCheckedFooter } from '../components/glowup/GlowUpCheckedFooter';
import { buildGlowUpResult, emptyGlowUpProfile } from '../services/glowUp/generate';

type Step =
  | 'home'
  | 'fix'
  | 'fixDowntime'
  | 'change'
  | 'restore'
  | 'tripInfo'
  | 'budget'
  | 'language'
  | 'transition'
  | 'result';

const stepTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };

// fixDowntime is a conditional sub-step of Screen 1, not a 7th screen — the
// progress dots always show 6, keyed off this display map rather than flow.length.
const STEP_DISPLAY_INDEX: Record<Step, number> = {
  home: 0,
  fix: 1,
  fixDowntime: 1,
  change: 2,
  restore: 3,
  tripInfo: 4,
  budget: 5,
  language: 6,
  transition: 6,
  result: 6,
};
const TOTAL_STEPS = 6;

export default function ExplorePage() {
  const [step, setStep] = useState<Step>('home');
  const [profile, setProfile] = useState<GlowUpProfile>(emptyGlowUpProfile());
  const [result, setResult] = useState<GlowUpResult | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const flow = useMemo<Step[]>(() => {
    const steps: Step[] = ['fix'];
    if (profile.fix.items.length > 0) steps.push('fixDowntime');
    steps.push('change', 'restore', 'tripInfo', 'budget', 'language');
    return steps;
  }, [profile.fix.items.length]);

  const stepIndex = STEP_DISPLAY_INDEX[step];

  const goNextFrom = (current: Step) => {
    const idx = flow.indexOf(current);
    const next = flow[idx + 1] ?? 'transition';
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

  const toggleFix = (id: FixItem) => {
    setProfile((prev) => {
      const items = prev.fix.items.includes(id)
        ? prev.fix.items.filter((i) => i !== id)
        : [...prev.fix.items, id];
      return { ...prev, fix: { items, downtime: items.length > 0 ? prev.fix.downtime : null } };
    });
  };

  const toggleChange = (id: ChangeItem) => {
    setProfile((prev) => ({
      ...prev,
      change: prev.change.includes(id) ? prev.change.filter((c) => c !== id) : [...prev.change, id],
    }));
  };

  const toggleRestore = (id: RestoreItem) => {
    setProfile((prev) => ({
      ...prev,
      restore: prev.restore.includes(id) ? prev.restore.filter((r) => r !== id) : [...prev.restore, id],
    }));
  };

  const toggleLanguage = (id: GlowUpLanguage) => {
    setProfile((prev) => ({
      ...prev,
      languages: prev.languages.includes(id) ? prev.languages.filter((l) => l !== id) : [...prev.languages, id],
    }));
  };

  const setTripDays = (id: GlowUpTripDays) => setProfile((p) => ({ ...p, tripDays: id }));
  const setRegion = (id: GlowUpRegion) => setProfile((p) => ({ ...p, region: id }));
  const setBudget = (id: GlowUpBudget) => setProfile((p) => ({ ...p, budget: id }));

  const handleTransitionDone = () => {
    setResult(buildGlowUpResult(profile));
    setStep('result');
  };

  const startOver = () => {
    setProfile(emptyGlowUpProfile());
    setResult(null);
    setStep('home');
  };

  if (step === 'home') {
    return <HomeLanding onStartAnalysis={() => setStep('fix')} />;
  }

  if (step === 'transition') {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <AITransition onDone={handleTransitionDone} messages={glowUpTransitionMessages} />
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:py-14">
        <h1 className="font-display text-2xl text-miyeon-main">Your Glow Up</h1>
        <GlowUpWhyThis whyThisLine={result.whyThisLine} />
        <GlowUpResultGrid days={result.days} />
        <GlowUpCheckedFooter profile={profile} />
        <button
          type="button"
          onClick={startOver}
          className="w-full rounded-full border border-miyeon-neutral py-3.5 text-sm font-bold text-miyeon-main"
        >
          Start over
        </button>
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
          {step === 'fix' && (
            <WizardShell
              title="FIX — want to fix up skin & face?"
              subtitle="Pick what applies, or skip."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => setStep('home')}
              onNext={() => goNextFrom('fix')}
              nextLabel={profile.fix.items.length > 0 ? 'Next →' : 'Skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {fixOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.fix.items.includes(opt.id)}
                    onClick={() => toggleFix(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'fixDowntime' && (
            <WizardShell
              title="Is puffiness or redness okay during your trip?"
              subtitle={profile.fix.downtime ? fixReactionCopy(profile.fix.items) : "This won't be sent anywhere — it just helps us schedule your days."}
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('fixDowntime')}
            >
              <div className="space-y-2.5">
                {fixDowntimeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.fix.downtime === opt.id}
                    onClick={() => {
                      setProfile((p) => ({ ...p, fix: { ...p.fix, downtime: opt.id } }));
                      setTimeout(() => goNextFrom('fixDowntime'), 900);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'change' && (
            <WizardShell
              title="CHANGE — want to switch things up?"
              subtitle="Pick as many as you like, or skip."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('change')}
              onNext={() => goNextFrom('change')}
              nextLabel={profile.change.length > 0 ? 'Next →' : 'Skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {changeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.change.includes(opt.id)}
                    onClick={() => toggleChange(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'restore' && (
            <WizardShell
              title="RESTORE — want to take it slow?"
              subtitle="Pick as many as you like, or skip."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('restore')}
              onNext={() => goNextFrom('restore')}
              nextLabel={profile.restore.length > 0 ? 'Next →' : 'Skip'}
            >
              <div className="space-y-2.5">
                {restoreOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.restore.includes(opt.id)}
                    onClick={() => toggleRestore(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'tripInfo' && (
            <WizardShell
              title="Tell us about the trip."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('tripInfo')}
              onNext={() => goNextFrom('tripInfo')}
              nextLabel="Next →"
            >
              <div className="space-y-6">
                <div>
                  <p className="mb-2.5 text-xs font-semibold text-miyeon-main/60">How many days?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {tripDaysOptions.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        label={opt.label}
                        selected={profile.tripDays === opt.id}
                        onClick={() => setTripDays(opt.id)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2.5 text-xs font-semibold text-miyeon-main/60">Which area are you based in?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {regionOptions.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        label={opt.label}
                        selected={profile.region === opt.id}
                        onClick={() => setRegion(opt.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </WizardShell>
          )}

          {step === 'budget' && (
            <WizardShell
              title="How much do you want to spend on beauty?"
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('budget')}
            >
              <div className="space-y-2.5">
                {budgetOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    selected={profile.budget === opt.id}
                    onClick={() => {
                      setBudget(opt.id);
                      setTimeout(() => goNextFrom('budget'), 180);
                    }}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'language' && (
            <WizardShell
              title="Do you need staff who speak a specific language?"
              subtitle="Optional — pick as many as you like, or skip."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('language')}
              onNext={() => goNextFrom('language')}
              nextLabel={profile.languages.length > 0 ? 'Next →' : 'Skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {languageOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={profile.languages.includes(opt.id)}
                    onClick={() => toggleLanguage(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
