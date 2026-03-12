
/**
 * Simple moderation utility for filtering bad words and handling blocks.
 */

// Рӯйхати калимаҳои мамнӯъ (дақиқтар карда шуд, то бо феълҳо омехта нашавад)
const FORBIDDEN_WORDS = [
  // Русӣ ва байналмилалӣ
  'сука', 'блять', 'хуй', 'пиздец', 'гандон', 'далбаеб', 'тварь',
  'fuck', 'shit', 'bitch', 'asshole',
  
  // Тоҷикӣ (ҳақоратҳои возеҳ)
  'ҳаромхур', 'кунте', 'лаънатӣ', 'падарлаънат', 'модарлаънат',
  'ҷалаб', 'қусте', 'касиф', 'хабис', 'нокас', 'ҳаромзада', 'куте'
];

export function containsForbiddenWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Санҷиши калимаҳо ба таври дақиқ
  return FORBIDDEN_WORDS.some(word => {
    // Агар калима кӯтоҳ бошад (масалан 3 ҳарф), онро танҳо ҳамчун калимаи алоҳида месанҷем
    if (word.length <= 3) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    }
    // Барои калимаҳои дарозтар, мавҷудияти онҳоро дар дохили матн месанҷем
    return lowerText.includes(word);
  });
}

export const MODERATION_RULES = {
  MAX_WARNINGS: 3,
  MAX_REPORTS: 5,
  REPORT_MIN_LENGTH: 50,
  REPORT_MAX_LENGTH: 100
};
