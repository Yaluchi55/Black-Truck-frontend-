import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CHAUFFEUR } from '../data/user';
import { Vehicle, VEHICLES } from '../data/vehicles';
import { BillingMode, ChatMessage, Currency, PaymentMethod, Sender, UserRole } from '../types';
import { formatMoney, USD_TO_ZMW } from '../utils/format';
import { toLocalNumber } from '../utils/phone';

export const MIN_HOURS = 1;
export const MAX_HOURS = 12;
export const USD_ANCHOR_ZMW = USD_TO_ZMW;

interface MessageContent {
  text?: string;
  imageUri?: string;
}

export interface AppContextValue {
  userRole: UserRole | null;
  userPhone: string;
  isAuthenticated: boolean;
  login: (role: UserRole, phone: string) => void;
  logout: () => void;

  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (baseZmw: number) => string;

  vehicles: Vehicle[];
  selectedVehicle: string;
  selectedVehicleDetails: Vehicle;
  setSelectedVehicle: (vehicleId: string) => void;

  selectedHours: number;
  setSelectedHours: (hours: number) => void;
  totalZmw: number;

  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  payment: PaymentMethod;
  setPayment: (payment: PaymentMethod) => void;
  billing: BillingMode;
  setBilling: (billing: BillingMode) => void;
  momoNumber: string;
  setMomoNumber: (value: string) => void;

  expenseMemo: string;
  setExpenseMemo: (value: string) => void;
  emailInvoice: boolean;
  setEmailInvoice: (value: boolean) => void;
  invoiceEmail: string;
  setInvoiceEmail: (value: string) => void;

  pushNotifications: boolean;
  setPushNotifications: (value: boolean) => void;
  privacyShield: boolean;
  setPrivacyShield: (value: boolean) => void;

  messages: ChatMessage[];
  addMessage: (sender: Sender, content: MessageContent) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const buildInitialMessages = (): ChatMessage[] => [
  {
    id: 'seed-1',
    sender: 'chauffeur',
    text: `Good day, this is ${CHAUFFEUR.firstName}, your chauffeur. I will meet you at your pickup point.`,
    sentAt: Date.now() - 1000 * 60 * 4,
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userPhone, setUserPhone] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('ZMW');
  const [selectedVehicle, setSelectedVehicleState] = useState<string>(VEHICLES[0].id);
  const [selectedHours, setSelectedHoursState] = useState<number>(4);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [payment, setPayment] = useState<PaymentMethod>('mtn');
  const [billing, setBilling] = useState<BillingMode>('personal');
  const [momoNumber, setMomoNumber] = useState<string>('');
  const [expenseMemo, setExpenseMemo] = useState<string>('');
  const [emailInvoice, setEmailInvoice] = useState<boolean>(true);
  const [invoiceEmail, setInvoiceEmail] = useState<string>('accounts@mwansaholdings.co.zm');
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [privacyShield, setPrivacyShield] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(buildInitialMessages);
  const messageCounter = useRef<number>(0);

  const selectedVehicleDetails = useMemo<Vehicle>(
    () => VEHICLES.find((vehicle) => vehicle.id === selectedVehicle) ?? VEHICLES[0],
    [selectedVehicle],
  );

  const setSelectedVehicle = useCallback((vehicleId: string) => {
    if (VEHICLES.some((vehicle) => vehicle.id === vehicleId)) {
      setSelectedVehicleState(vehicleId);
    }
  }, []);

  const setSelectedHours = useCallback((hours: number) => {
    setSelectedHoursState(Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(hours))));
  }, []);

  const formatPrice = useCallback(
    (baseZmw: number) => formatMoney(baseZmw, currency),
    [currency],
  );

  const login = useCallback((role: UserRole, phone: string) => {
    setUserRole(role);
    setUserPhone(phone);
    setMomoNumber(toLocalNumber(phone));
    setIsOnline(false);
  }, []);

  const logout = useCallback(() => {
    setUserRole(null);
    setUserPhone('');
    setIsOnline(false);
    setMomoNumber('');
    setExpenseMemo('');
    setBilling('personal');
    setSelectedHoursState(4);
    setSelectedVehicleState(VEHICLES[0].id);
    setMessages(buildInitialMessages());
  }, []);

  const addMessage = useCallback((sender: Sender, content: MessageContent) => {
    messageCounter.current += 1;
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${messageCounter.current}`,
      sender,
      text: content.text,
      imageUri: content.imageUri,
      sentAt: Date.now(),
    };
    setMessages((previous) => [...previous, message]);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      userRole,
      userPhone,
      isAuthenticated: userRole !== null,
      login,
      logout,
      currency,
      setCurrency,
      formatPrice,
      vehicles: VEHICLES,
      selectedVehicle,
      selectedVehicleDetails,
      setSelectedVehicle,
      selectedHours,
      setSelectedHours,
      totalZmw: selectedVehicleDetails.hourlyZmw * selectedHours,
      isOnline,
      setIsOnline,
      payment,
      setPayment,
      billing,
      setBilling,
      momoNumber,
      setMomoNumber,
      expenseMemo,
      setExpenseMemo,
      emailInvoice,
      setEmailInvoice,
      invoiceEmail,
      setInvoiceEmail,
      pushNotifications,
      setPushNotifications,
      privacyShield,
      setPrivacyShield,
      messages,
      addMessage,
    }),
    [
      userRole,
      userPhone,
      login,
      logout,
      currency,
      formatPrice,
      selectedVehicle,
      selectedVehicleDetails,
      setSelectedVehicle,
      selectedHours,
      setSelectedHours,
      isOnline,
      payment,
      billing,
      momoNumber,
      expenseMemo,
      emailInvoice,
      invoiceEmail,
      pushNotifications,
      privacyShield,
      messages,
      addMessage,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
}
