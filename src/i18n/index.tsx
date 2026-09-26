import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ja } from './ja';
import { zh } from './zh';
import { vi } from './vi';
import { th } from './th';

// Lightweight UI translation. Strings are keyed by their English text, so `t('Start Glowing')`
// returns the English text itself for English and for anything that has no translation yet —
// untranslated screens simply stay in English. Placeholders use {name}.

export type Lang = 'en' | 'ja' | 'zh' | 'vi' | 'th';

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: 'JA' },
  { code: 'zh', label: '中文', short: 'ZH' },
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'th', label: 'ไทย', short: 'TH' },
];

const DICTIONARIES: Record<Exclude<Lang, 'en'>, Record<string, string>> = { ja, zh, vi, th };

const STORAGE_KEY = 'miyeon_lang';
const HTML_LANG: Record<Lang, string> = { en: 'en', ja: 'ja', zh: 'zh-CN', vi: 'vi', th: 'th' };

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const text = (lang !== 'en' && DICTIONARIES[lang][key]) || key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored as Lang;
  } catch {
    // private mode — fall through to English
  }
  return 'en';
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunction;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => translate('en', key, vars),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // the choice still applies for this session
    }
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang]
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
};

export const useLang = (): LangContextValue => useContext(LangContext);
export const useT = (): TFunction => useContext(LangContext).t;
