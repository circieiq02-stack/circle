export interface ParsedIraqiPhone {
  valid: boolean;
  e164: string;
  localDisplay: string;
  formattedDisplay: string;
  operatorEn: string;
  operatorAr: string;
  errorEn?: string;
  errorAr?: string;
}

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

export function normalizeDigits(input: string): string {
  return input
    .split('')
    .map((ch) => {
      const idxA = ARABIC_INDIC.indexOf(ch);
      if (idxA !== -1) return String(idxA);
      const idxE = EASTERN_ARABIC.indexOf(ch);
      if (idxE !== -1) return String(idxE);
      return ch;
    })
    .join('');
}

function detectOperator(national: string): { en: string; ar: string } {
  const prefix = national.slice(0, 2);
  if (prefix === '77') return { en: 'Asiacell', ar: 'آسياسيل' };
  if (prefix === '78' || prefix === '79') return { en: 'Zain Iraq', ar: 'زين العراق' };
  if (prefix === '75') return { en: 'Korek Telecom', ar: 'كورك تيليكوم' };
  if (prefix === '74') return { en: 'Itisaluna / Omnnea', ar: 'اتصالنا / أمنية' };
  if (prefix === '76') return { en: 'Mobitel', ar: 'موبيتيل' };
  return { en: 'Iraqi Mobile', ar: 'شبكة عراقية' };
}

export function parseIraqiPhone(rawInput: string): ParsedIraqiPhone {
  const ascii = normalizeDigits(rawInput).trim();
  const stripped = ascii.replace(/[\s\-().]/g, '');

  let national = stripped;
  if (national.startsWith('+964')) {
    national = national.slice(4);
  } else if (national.startsWith('00964')) {
    national = national.slice(5);
  } else if (national.startsWith('964') && national.length >= 12) {
    national = national.slice(3);
  }

  if (national.startsWith('0')) {
    national = national.slice(1);
  }

  // Iraqi mobile numbers: 10 digits starting with 7 (73x - 79x)
  if (!/^7[3-9]\d{8}$/.test(national)) {
    return {
      valid: false,
      e164: '',
      localDisplay: '',
      formattedDisplay: '',
      operatorEn: '',
      operatorAr: '',
      errorEn:
        'Enter a valid Iraqi mobile number (e.g. 0770 123 4567 or 770 123 4567).',
      errorAr:
        'يرجى إدخال رقم هاتف عراقي صحيح (مثال: 0770 123 4567 أو 770 123 4567).',
    };
  }

  const e164 = `+964${national}`;
  const part1 = national.slice(0, 3);
  const part2 = national.slice(3, 6);
  const part3 = national.slice(6, 10);
  const formattedDisplay = `+964 ${part1} ${part2} ${part3}`;
  const localDisplay = `0${part1} ${part2} ${part3}`;
  const op = detectOperator(national);

  return {
    valid: true,
    e164,
    localDisplay,
    formattedDisplay,
    operatorEn: op.en,
    operatorAr: op.ar,
  };
}
