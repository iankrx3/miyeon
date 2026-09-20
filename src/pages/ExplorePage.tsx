import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import type {
  ChangeItem,
  FixItem,
  GlowUpBudget,
  GlowUpLanguage,
  GlowUpProfile,
  GlowUpRegion,
  GlowUpTripDays,
  RestoreItem,
} from '../types';
import {
  budgetOptions,
  changeOptions,
  fixDowntimeOptions,
  fixOptions,
  glowUpTransitionMessages,
  languageOptions,
  regionOptions,
  restoreOptions,
  tripDaysOptions,
} from '../data/glowUpQuiz';
import { HomeLanding } from '../components/home/HomeLanding';
import { OptionCard } from '../components/onboarding/OptionCard';
import { Chip } from '../components/onboarding/Chip';
import { WizardShell } from '../components/onboarding/WizardShell';
import { AITransition } from '../components/quiz/AITransition';
import { buildGlowUpResult, emptyGlowUpProfile } from '../services/glowUp/generate';
import { upsertItinerary } from '../lib/localItineraryStore';

type Step = 'home' | 'fix' | 'change' | 'restore' | 'tripInfo' | 'budget' | 'language' | 'transition';

const stepTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };

const FLOW: Step[] = ['fix', 'change', 'restore', 'tripInfo', 'budget', 'language'];

const STEP_DISPLAY_INDEX: Record<Step, number> = {
  home: 0,
  fix: 1,
  change: 2,
  restore: 3,
  tripInfo: 4,
  budget: 5,
  language: 6,
  transition: 6,
};
const TOTAL_STEPS = 6;

export default function ExplorePage() {
  const navigate = useNavigate();
  const generatingRef = useRef(false);
  const [step, setStep] = useState<Step>('home');
  const [profile, setProfile] = useState<GlowUpProfile>(emptyGlowUpProfile());
  const [base, setBase] = useState<'seoul' | 'busan' | 'unsure'>('seoul');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const stepIndex = STEP_DISPLAY_INDEX[step];

  const goNextFrom = (current: Step) => {
    const idx = FLOW.indexOf(current);
    const next = FLOW[idx + 1] ?? 'transition';
    setStep(next);
  };

  const goBackFrom = (current: Step) => {
    const idx = FLOW.indexOf(current);
    if (idx <= 0) {
      setStep('home');
      return;
    }
    setStep(FLOW[idx - 1]);
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
    if (generatingRef.current) return;
    generatingRef.current = true;
    void (async () => {
      const next = await buildGlowUpResult(profile);
      upsertItinerary(next.itinerary);
      navigate(`/itinerary/${next.itinerary.id}`);
    })();
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
              kicker="FIX"
              title="Fix — start with your face"
              subtitle="Pick what you'd become. Or skip."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => setStep('home')}
              onNext={() => goNextFrom('fix')}
              nextLabel={profile.fix.items.length > 0 ? 'Next' : 'Skip — nothing to fix'}
              nextVariant={profile.fix.items.length > 0 ? 'primary' : 'skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {fixOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    image={opt.image}
                    headline={opt.headline}
                    label={opt.label}
                    selected={profile.fix.items.includes(opt.id)}
                    onClick={() => toggleFix(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'change' && (
            <WizardShell
              kicker="CHANGE"
              title="Change — maximize your trip"
              subtitle="Pick what you'd like. As many as you want."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('change')}
              onNext={() => goNextFrom('change')}
              nextLabel={profile.change.length > 0 ? 'Next' : 'Skip — none of these'}
              nextVariant={profile.change.length > 0 ? 'primary' : 'skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {changeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    image={opt.image}
                    headline={opt.headline}
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
              kicker="RESTORE"
              title="Restore — take it slow"
              subtitle="K-recovery is on another level."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('restore')}
              onNext={() => goNextFrom('restore')}
              nextLabel={profile.restore.length > 0 ? 'Next' : "Skip — I'll keep moving"}
              nextVariant={profile.restore.length > 0 ? 'primary' : 'skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {restoreOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    image={opt.image}
                    headline={opt.headline}
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
              title="Boring, but important"
              subtitle="How long you've got, and where you're staying."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('tripInfo')}
              onNext={() => goNextFrom('tripInfo')}
              nextLabel="Next"
            >
              <div className="space-y-6">
                <div>
                  <p className="mb-2.5 text-[11px] font-medium tracking-[0.12em] text-miyeon-main/50">
                    HOW MANY DAYS?
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {tripDaysOptions.map((opt) => (
                      <Chip
                        key={opt.id}
                        label={opt.label}
                        selected={profile.tripDays === opt.id}
                        onClick={() => setTripDays(opt.id)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2.5 text-[11px] font-medium tracking-[0.12em] text-miyeon-main/50">
                    WHERE ARE YOU BASED?
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        ['seoul', 'Seoul'],
                        ['busan', 'Busan'],
                        ['unsure', 'Not sure yet'],
                      ] as const
                    ).map(([id, label]) => (
                      <Chip
                        key={id}
                        label={label}
                        selected={base === id}
                        onClick={() => {
                          setBase(id);
                          if (id !== 'seoul') setProfile((p) => ({ ...p, region: null }));
                        }}
                      />
                    ))}
                  </div>
                </div>
                {base === 'seoul' && (
                  <div className="rounded-2xl bg-miyeon-surface p-3.5">
                    <p className="mb-2.5 text-[10.5px] font-medium tracking-[0.12em] text-miyeon-main/50">
                      WHICH PART OF SEOUL?
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {regionOptions.map((opt) => (
                        <Chip
                          key={opt.id}
                          label={opt.label}
                          selected={profile.region === opt.id}
                          onClick={() => setRegion(opt.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </WizardShell>
          )}

          {step === 'budget' && (
            <WizardShell
              title="Practical and a must"
              subtitle="So that we can actually plan, only for you."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('budget')}
              onNext={() => goNextFrom('budget')}
              nextLabel="Next"
            >
              <div className="space-y-6">
                <div>
                  <p className="mb-2.5 text-[11px] font-medium tracking-[0.12em] text-miyeon-main/50">
                    HOW MUCH FOR ONE EXPERIENCE?
                  </p>
                  <div className="space-y-2.5">
                    {budgetOptions.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        label={opt.label}
                        caption={opt.caption}
                        selected={profile.budget === opt.id}
                        onClick={() => setBudget(opt.id)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.12em] text-miyeon-main/50">
                    CAN YOU AFFORD TO LOOK A LITTLE RED?
                  </p>
                  <p className="mb-2.5 mt-1 text-xs text-miyeon-main/55">
                    Some treatments leave you puffy. Our plan considers it.
                  </p>
                  <div className="space-y-2.5">
                    {fixDowntimeOptions.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        label={opt.label}
                        selected={profile.fix.downtime === opt.id}
                        onClick={() => setProfile((p) => ({ ...p, fix: { ...p.fix, downtime: opt.id } }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </WizardShell>
          )}

          {step === 'language' && (
            <WizardShell
              title="English available, and...?"
              subtitle="English is already covered — pick any extras."
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('language')}
              onNext={() => goNextFrom('language')}
              nextLabel="See my Glow Up"
            >
              <div className="space-y-2.5">
                {languageOptions
                  .filter((opt) => opt.id !== 'English')
                  .map((opt) => (
                    <OptionCard
                      key={opt.id}
                      label={opt.label}
                      selected={profile.languages.includes(opt.id)}
                      onClick={() => toggleLanguage(opt.id)}
                    />
                  ))}
                <OptionCard
                  label="No, English is fine"
                  caption="Most people choose this"
                  selected={profile.languages.length === 0}
                  onClick={() => setProfile((p) => ({ ...p, languages: [] }))}
                />
              </div>
            </WizardShell>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
