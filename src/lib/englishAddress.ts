const HANGUL = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;

export interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
  languageCode?: string;
}

export function hasHangul(text: string): boolean {
  return HANGUL.test(text);
}

export function isEnglishText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || hasHangul(trimmed)) return false;
  return /[A-Za-z0-9]/.test(trimmed);
}

function collapse(value: string): string {
  return value
    .replace(HANGUL, ' ')
    .replace(/[·•]/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();
}

function englishPiece(value?: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  return isEnglishText(trimmed) ? trimmed : '';
}

function pickComponent(components: AddressComponent[], types: string[]): string {
  for (const type of types) {
    const match = components.find((component) => component.types?.includes(type));
    const text = englishPiece(match?.longText) || englishPiece(match?.shortText);
    if (text) return text;
  }
  return '';
}

function composeFromComponents(components: AddressComponent[]): string {
  const streetNumber = pickComponent(components, ['street_number']);
  const route = pickComponent(components, ['route']);
  const street = [streetNumber, route].filter(Boolean).join(' ');
  const parts = [
    street,
    pickComponent(components, ['sublocality_level_2', 'sublocality_level_1', 'sublocality']),
    pickComponent(components, ['locality']),
    pickComponent(components, ['administrative_area_level_1']),
    pickComponent(components, ['country']),
  ].filter(Boolean);

  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
      unique.push(part);
    }
  }
  return unique.join(', ');
}

function sanitizeFormatted(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (!hasHangul(trimmed)) return collapse(trimmed);

  const englishSegments = trimmed
    .split(',')
    .map((segment) => segment.trim())
    .filter((segment) => isEnglishText(segment));
  if (englishSegments.length) return collapse(englishSegments.join(', '));

  const stripped = collapse(trimmed);
  return /[A-Za-z]{2,}/.test(stripped) ? stripped : '';
}

/** Prefer an already-English part over a Hangul+English concatenation. */
export function pickEnglishAddressParts(...parts: Array<string | undefined>): string {
  const english = parts.map((part) => (part ?? '').trim()).filter(isEnglishText);
  if (english.length) return collapse(english.join(', '));
  return toEnglishAddress(parts.filter(Boolean).join(' '));
}

export function toEnglishAddress(
  formatted: string | undefined,
  opts?: {
    components?: AddressComponent[];
    area?: string;
    fallback?: string;
  }
): string {
  const fromComponents = opts?.components?.length ? composeFromComponents(opts.components) : '';
  if (fromComponents) return fromComponents;

  const fromFormatted = sanitizeFormatted(formatted || '');
  if (fromFormatted) return fromFormatted;

  const area = (opts?.area ?? '').trim();
  if (area && isEnglishText(area)) {
    return area.toLowerCase().includes('seoul') ? `${area}, South Korea` : `${area}, Seoul, South Korea`;
  }
  return opts?.fallback || 'Seoul, South Korea';
}
