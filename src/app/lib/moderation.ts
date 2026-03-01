
/**
 * Simple moderation utility for filtering bad words and handling blocks.
 */

// Basic list of forbidden words (can be extended)
const FORBIDDEN_WORDS = [
  'лаънат', 'ҳаром', 'кун', 'ганда', 'аҳмақ', 'шарманда', 'ҳаромхур',
  'сука', 'блять', 'хуй', 'пиздец', 'гандон', 'далбаеб', 'тварь',
  'fuck', 'shit', 'bitch', 'asshole'
];

export function containsForbiddenWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return FORBIDDEN_WORDS.some(word => lowerText.includes(word));
}

export const MODERATION_RULES = {
  MAX_WARNINGS: 3,
  MAX_REPORTS: 5,
  REPORT_MIN_LENGTH: 50,
  REPORT_MAX_LENGTH: 100
};
