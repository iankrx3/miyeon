/** Removes emoji from text. Older saved itineraries stored labels like "✨ Skin"
 * (emoji prefix); the UI no longer uses emoji, so strip them at render time. */
export function stripEmoji(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}️?/gu, '')
    .replace(/\p{Regional_Indicator}{2}/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
