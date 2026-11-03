import { Currency } from '../types';

export const USD_TO_ZMW = 28.56;

const groupThousands = (digits: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const formatMoney = (amountZmw: number, currency: Currency): string => {
  if (currency === 'ZMW') {
    return `K${groupThousands(String(Math.round(amountZmw)))}`;
  }
  const [whole, cents] = (amountZmw / USD_TO_ZMW).toFixed(2).split('.');
  return `$${groupThousands(whole)}.${cents}`;
};

export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 5) {
    return '••••';
  }
  return `${digits.slice(0, 3)} ••• ••${digits.slice(-2)}`;
};

export const maskPlate = (plate: string): string => `${plate.slice(0, 3)} ••••`;

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes} ${suffix}`;
};

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
