import { normalizeLocalNumber, ZAMBIA_MOBILE_PATTERN } from '../utils/phone';

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 30;

const NETWORK_DELAY_MS = 1800;
const issuedCodes = new Map<string, string>();

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const generateCode = (): string => {
  let code = '';
  for (let index = 0; index < OTP_LENGTH; index += 1) {
    code += String(Math.floor(Math.random() * 10));
  }
  return code;
};

export interface OtpReceipt {
  demoCode: string;
}

/**
 * Simulated SMS gateway. Swap the body of these two functions for your real
 * backend calls; the screens only depend on the signatures.
 */
export async function requestOtp(phoneInput: string): Promise<OtpReceipt> {
  const local = normalizeLocalNumber(phoneInput);
  if (!ZAMBIA_MOBILE_PATTERN.test(local)) {
    throw new Error('Invalid Zambian mobile number');
  }
  await wait(NETWORK_DELAY_MS);
  const code = generateCode();
  issuedCodes.set(local, code);
  return { demoCode: code };
}

export async function verifyOtp(phoneInput: string, code: string): Promise<boolean> {
  const local = normalizeLocalNumber(phoneInput);
  await wait(NETWORK_DELAY_MS);
  const expected = issuedCodes.get(local);
  if (expected !== undefined && expected === code) {
    issuedCodes.delete(local);
    return true;
  }
  return false;
}
