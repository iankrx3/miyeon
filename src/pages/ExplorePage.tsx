import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import type {
  ChangeItem,
  FixItem,
  GlowUpLanguage,
  GlowUpProfile,
  GlowUpRegion,
  GlowUpTripDays,
  RestoreItem,
} from '../types';
import {
  changeOptions,
  fixDowntimeOptions,
  fixOptions,
  glowUpTransitionMessages,
  languageOptions,
  regionOptionsFor,
  cityOptions,
  constraintsInterlude,
  pickedInterlude,
  restoreOptions,
  tripDaysOptions,
} from '../data/glowUpQuiz';
import { HomeLanding } from '../components/home/HomeLanding';
import { OptionCard } from '../components/onboarding/OptionCard';
import { Chip } from '../components/onboarding/Chip';
import { BudgetSlider } from '../components/onboarding/BudgetSlider';
import { WizardShell } from '../components/onboarding/WizardShell';
import { AITransition } from '../components/quiz/AITransition';
import { PinkTransition } from '../components/quiz/PinkTransition';
import { useT } from '../i18n';
import { buildGlowUpItinerary, emptyGlowUpProfile } from '../services/glowUp/generate';
import { upsertItinerary } from '../lib/localItineraryStore';

type Step =
  | 'home'
  | 'fix'
  | 'change'
  | 'restore'
  | 'interlude1'
  | 'tripInfo'
  | 'budget'
  | 'interlude2'
  | 'language'
  | 'transition';

const stepTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const };

const FLOW: Step[] = ['fix', 'change', 'restore', 'tripInfo', 'budget', 'language'];

const STEP_DISPLAY_INDEX: Record<Step, number> = {
  home: 0,
  fix: 1,
  change: 2,
  restore: 3,
  interlude1: 3,
  tripInfo: 4,
  budget: 5,
  interlude2: 5,
  language: 6,
  transition: 6,
};
const TOTAL_STEPS = 6;

/** null until the user taps one of the base-city chips. */
type Base = 'seoul' | 'busan' | 'unsure' | null;

/** Wizard progress kept at module scope so it survives ExplorePage unmounting when the
 * user visits another tab (Map, Community…) and comes back. Cleared once a plan is built. */
const freshWizardMemory = () => ({
  step: 'home' as Step,
  profile: emptyGlowUpProfile(),
  base: null as Base,
});
let wizardMemory = freshWizardMemory();

export default function ExplorePage() {
  const navigate = useNavigate();
  const t = useT();
  const generatingRef = useRef(false);
  const [step, setStep] = useState<Step>(wizardMemory.step);
  const [profile, setProfile] = useState<GlowUpProfile>(wizardMemory.profile);
  const [base, setBase] = useState<Base>(wizardMemory.base);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    // 'transition' isn't resumable (it would re-run generation) and the interludes are pass-throughs,
    // so remember the last real question instead.
    const resumable: Step =
      step === 'transition' || step === 'interlude2' ? 'language' : step === 'interlude1' ? 'tripInfo' : step;
    wizardMemory = { step: resumable, profile, base };
  }, [step, profile, base]);

  const stepIndex = STEP_DISPLAY_INDEX[step];

  const goNextFrom = (current: Step) => {
    const idx = FLOW.indexOf(current);
    const next = FLOW[idx + 1] ?? 'transition';
    // Reflect the answers just given before moving on — skipped when there is nothing to reflect.
    if (current === 'restore' && pickedInterlude(profile, t)) return setStep('interlude1');
    if (current === 'budget' && constraintsInterlude(profile, t)) return setStep('interlude2');
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
  const pickCity = (id: NonNullable<Base>) => {
    setBase(id);
    // Switching city clears the district — the chips below belong to the previous city.
    setProfile((p) => ({ ...p, city: id === 'unsure' ? undefined : id, region: null }));
  };
  const setRegion = (id: GlowUpRegion) => setProfile((p) => ({ ...p, region: id }));
  const setBudgetMax = (max: number | null) => setProfile((p) => ({ ...p, budgetMaxUsd: max }));

  const handleTransitionDone = () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    void (async () => {
      const itinerary = await buildGlowUpItinerary(profile);
      upsertItinerary(itinerary);
      wizardMemory = freshWizardMemory();
      navigate(`/itinerary/${itinerary.id}`);
    })();
  };

  if (step === 'home') {
    return <HomeLanding onStartAnalysis={() => setStep('fix')} />;
  }

  if (step === 'interlude1' || step === 'interlude2') {
    const copy = step === 'interlude1' ? pickedInterlude(profile, t) : constraintsInterlude(profile, t);
    const next: Step = step === 'interlude1' ? 'tripInfo' : 'language';
    if (!copy) {
      setStep(next);
      return null;
    }
    return <PinkTransition key={step} {...copy} onDone={() => setStep(next)} />;
  }

  if (step === 'transition') {
    return (
      <div className="mx-auto max-w-xl px-5 py-8">
        <AITransition onDone={handleTransitionDone} messages={glowUpTransitionMessages.map((m) => t(m))} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl overflow-hidden px-5 pb-8 pt-8">
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
              kicker={t("FIX")}
              title={t("Fix — start with your face")}
              subtitle={t("Pick what you'd become. Or skip.")}
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => setStep('home')}
              onNext={() => goNextFrom('fix')}
              nextLabel={profile.fix.items.length > 0 ? t('Next') : t('Skip — nothing to fix')}
              nextVariant={profile.fix.items.length > 0 ? 'primary' : 'skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {fixOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    image={opt.image}
                    headline={t(opt.headline)}
                    label={t(opt.label)}
                    selected={profile.fix.items.includes(opt.id)}
                    onClick={() => toggleFix(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'change' && (
            <WizardShell
              kicker={t("CHANGE")}
              title={t("Change — maximize your trip")}
              subtitle={t("Pick what you'd like. As many as you want.")}
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('change')}
              onNext={() => goNextFrom('change')}
              nextLabel={profile.change.length > 0 ? t('Next') : t('Skip — none of these')}
              nextVariant={profile.change.length > 0 ? 'primary' : 'skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {changeOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    image={opt.image}
                    headline={t(opt.headline)}
                    label={t(opt.label)}
                    selected={profile.change.includes(opt.id)}
                    onClick={() => toggleChange(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'restore' && (
            <WizardShell
              kicker={t("RESTORE")}
              title={t("Restore — take it slow")}
              subtitle={t("K-recovery is on another level.")}
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('restore')}
              onNext={() => goNextFrom('restore')}
              nextLabel={profile.restore.length > 0 ? t('Next') : t("Skip — I'll keep moving")}
              nextVariant={profile.restore.length > 0 ? 'primary' : 'skip'}
            >
              <div className="grid grid-cols-2 gap-2.5">
                {restoreOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    image={opt.image}
                    headline={t(opt.headline)}
                    label={t(opt.label)}
                    selected={profile.restore.includes(opt.id)}
                    onClick={() => toggleRestore(opt.id)}
                  />
                ))}
              </div>
            </WizardShell>
          )}

          {step === 'tripInfo' && (
            <WizardShell
              title={t("Boring, but important")}
              subtitle={t("How long you've got, and where you're staying.")}
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('tripInfo')}
              onNext={() => goNextFrom('tripInfo')}
              nextLabel={t("Next")}
            >
              <div className="space-y-6">
                <div>
                  <p className="mb-2.5 text-[11px] font-medium tracking-[1.2px] text-miyeon-main/50">
                    {t('HOW MANY DAYS?')}
                  </p>
                  <div className="grid grid-cols-2 gap-[9px]">
                    {tripDaysOptions.map((opt) => (
                      <Chip
                        key={opt.id}
                        label={t(opt.label)}
                        selected={profile.tripDays === opt.id}
                        onClick={() => setTripDays(opt.id)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2.5 text-[11px] font-medium tracking-[1.2px] text-miyeon-main/50">
                    {t('WHERE ARE YOU BASED?')}
                  </p>
                  <div className="grid grid-cols-3 gap-[9px]">
                    {cityOptions.map((opt) => (
                      <Chip
                        key={opt.id}
                        label={t(opt.label)}
                        selected={base === opt.id}
                        onClick={() => pickCity(opt.id)}
                      />
                    ))}
                  </div>
                </div>
                {(base === 'seoul' || base === 'busan') && (
                  <div className="-mt-3 rounded-[14px] bg-miyeon-surface p-3.5">
                    <p className="mb-2.5 text-[10.5px] font-medium tracking-[1.2px] text-miyeon-main/50">
                      {base === 'seoul' ? t('WHICH PART OF SEOUL?') : t('WHICH PART OF BUSAN?')}
                    </p>
                    <div className="grid grid-cols-2 gap-[9px]">
                      {regionOptionsFor(base).map((opt) => (
                        <Chip
                          key={opt.id}
                          label={t(opt.label)}
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
              title={t("Practical and a must")}
              subtitle={t("So that we can actually plan, only for you.")}
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('budget')}
              onNext={() => goNextFrom('budget')}
              nextLabel={t("Next")}
            >
              <div className="space-y-6">
                <div>
                  <p className="mb-2.5 text-[10.5px] font-medium tracking-[1.3px] text-miyeon-main/50">
                    {t('HOW MUCH FOR ONE EXPERIENCE?')}
                  </p>
                  <BudgetSlider value={profile.budgetMaxUsd ?? null} onChange={setBudgetMax} />
                </div>
                <div>
                  <p className="text-[10.5px] font-medium tracking-[1.3px] text-miyeon-main/50">
                    {t('CAN YOU AFFORD TO LOOK A LITTLE RED?')}
                  </p>
                  <p className="mb-3 mt-1 text-[12px] leading-[1.48] text-miyeon-main/55">
                    {t('Some treatments leave you puffy. Our plan considers it.')}
                  </p>
                  <div className="space-y-2.5">
                    {fixDowntimeOptions.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        label={t(opt.label)}
                        compact
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
              title={t("Which languages do you need?")}
              subtitle={t("Pick all that apply.")}
              step={stepIndex}
              total={TOTAL_STEPS}
              onBack={() => goBackFrom('language')}
              onNext={() => goNextFrom('language')}
              nextLabel={t("See my Glow Up")}
            >
              <div className="space-y-2.5">
                <OptionCard
                  label={t('No preference')}
                  caption={t("Don't filter by language")}
                  selected={profile.languages.length === 0}
                  onClick={() => setProfile((p) => ({ ...p, languages: [] }))}
                />
                {languageOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    label={t(opt.label)}
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
