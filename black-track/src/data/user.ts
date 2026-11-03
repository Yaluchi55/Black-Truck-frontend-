export const USER = {
  name: 'Chanda Mwansa',
  firstName: 'Chanda',
  tier: 'Gold Corporate',
  email: 'chanda.mwansa@mwansaholdings.co.zm',
  phone: '0971234567',
  avatarUri: 'https://i.pravatar.cc/240?img=12',
} as const;

export const CHAUFFEUR = {
  name: 'Mulenga Banda',
  firstName: 'Mulenga',
  plate: 'BAL 4821',
  avatarUri: 'https://i.pravatar.cc/240?img=33',
} as const;

export const QUICK_MESSAGES: string[] = [
  'Arrived at airport exit',
  'Waiting at the main gate',
  'Running 5 minutes late',
  'Please bring the car around',
  'Can we stop on the way?',
];

export const PAYMENT_OPTIONS = [
  { id: 'card', label: 'Card', icon: 'card-outline' },
  { id: 'mtn', label: 'MTN MoMo', icon: 'phone-portrait-outline' },
  { id: 'airtel', label: 'Airtel MoMo', icon: 'phone-portrait-outline' },
] as const;
