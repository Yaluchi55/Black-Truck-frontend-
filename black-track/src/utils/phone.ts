import { MobileNetwork } from '../types';

export const ZAMBIA_MOBILE_PATTERN = /^(97|96|95|77|76|75)\d{7}$/;

export const normalizeLocalNumber = (input: string): string => {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('260')) {
    digits = digits.slice(3);
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

export const isValidZambianMobile = (input: string): boolean =>
  ZAMBIA_MOBILE_PATTERN.test(normalizeLocalNumber(input));

export const detectNetwork = (input: string): MobileNetwork | null => {
  const prefix = normalizeLocalNumber(input).slice(0, 2);
  if (prefix === '97' || prefix === '77') {
    return 'Airtel';
  }
  if (prefix === '96' || prefix === '76') {
    return 'MTN';
  }
  if (prefix === '95' || prefix === '75') {
    return 'Zamtel';
  }
  return null;
};

export const toE164 = (input: string): string => `+260${normalizeLocalNumber(input)}`;

export const toLocalNumber = (e164: string): string => {
  const local = normalizeLocalNumber(e164);
  return local.length > 0 ? `0${local}` : '';
};
