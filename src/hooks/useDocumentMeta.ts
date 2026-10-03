import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface DocumentMeta {
  /** Page name; rendered as "{title} · Miyeon". Omit to keep the site default title. */
  title?: string;
  description?: string;
  /** schema.org object, emitted as <script type="application/ld+json">. */
  jsonLd?: object;
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');
const JSON_LD_ID = 'page-jsonld';
const MAX_DESCRIPTION = 160;

// index.html values, captured before any page touches them, so every page can restore them on unmount.
const DEFAULTS = {
  title: document.title,
  description: metaContent('meta[name="description"]'),
  canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null,
};

function metaContent(selector: string): string {
  return document.querySelector<HTMLMetaElement>(selector)?.content ?? '';
}

function setMeta(selector: string, content: string) {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) el.content = content;
}

function setCanonical(href: string | null) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= MAX_DESCRIPTION ? clean : `${clean.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`;
}

function apply(title: string, description: string) {
  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
}

/**
 * Sets the tab title, description, OG text, canonical and optional JSON-LD for the
 * current page, restoring the index.html defaults on unmount. Pass null while the
 * page's data is still loading. Call it before any early return.
 */
export function useDocumentMeta(meta: DocumentMeta | null) {
  const { pathname } = useLocation();
  // Serialized so callers can pass object literals without re-running the effect every render.
  const key = meta ? JSON.stringify(meta) : null;

  useEffect(() => {
    if (!key) return;
    const { title, description, jsonLd } = JSON.parse(key) as DocumentMeta;

    apply(title ? `${title} · Miyeon` : DEFAULTS.title, description ? truncate(description) : DEFAULTS.description);
    setCanonical(`${SITE_URL || window.location.origin}${pathname}`);

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSON_LD_ID;
      script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...jsonLd });
      document.head.appendChild(script);
    }

    return () => {
      apply(DEFAULTS.title, DEFAULTS.description);
      setCanonical(DEFAULTS.canonical);
      script?.remove();
    };
  }, [key, pathname]);
}

export { SITE_URL };
