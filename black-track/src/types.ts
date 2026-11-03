export type Currency = 'ZMW' | 'USD';
export type UserRole = 'RIDER' | 'CHAUFFEUR';
export type PaymentMethod = 'card' | 'mtn' | 'airtel';
export type BillingMode = 'personal' | 'corporate';
export type Sender = 'rider' | 'chauffeur';
export type MobileNetwork = 'Airtel' | 'MTN' | 'Zamtel';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text?: string;
  imageUri?: string;
  sentAt: number;
}
