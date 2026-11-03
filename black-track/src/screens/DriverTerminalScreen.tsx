import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SegmentedToggle from '../components/SegmentedToggle';
import { useApp } from '../context/AppContext';
import { CHAUFFEUR } from '../data/user';
import { BRAND, colors, radius, spacing } from '../theme';
import { Currency } from '../types';
import { maskPhone } from '../utils/format';
import { toLocalNumber } from '../utils/phone';

interface RideRequest {
  id: string;
  riderName: string;
  pickup: string;
  vehicleName: string;
  hours: number;
  fareZmw: number;
}

const PAYOUT_SHARE = 0.8;
const REQUEST_WINDOW_SECONDS = 20;
const REQUEST_DELAY_MS = 4000;

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'ZMW', label: 'ZMW (K)' },
  { value: 'USD', label: 'USD ($)' },
];

const SAMPLE_REQUESTS: Omit<RideRequest, 'id'>[] = [
  {
    riderName: 'Chanda M.',
    pickup: 'Kenneth Kaunda International Airport',
    vehicleName: 'Executive Sedan',
    hours: 4,
    fareZmw: 4000,
  },
  {
    riderName: 'Natasha P.',
    pickup: 'Radisson Blu, Cairo Road',
    vehicleName: 'Premium SUV',
    hours: 6,
    fareZmw: 9600,
  },
  {
    riderName: 'Joseph K.',
    pickup: 'Levy Business Park, Great East Road',
    vehicleName: 'Executive Van',
    hours: 3,
    fareZmw: 6000,
  },
];

interface RoadSpec {
  key: string;
  style: ViewStyle;
  rotate: string;
}

const ROADS: RoadSpec[] = [
  {
    key: 'cairo',
    style: { left: '46%', top: '-15%', width: 8, height: '130%' },
    rotate: '9deg',
  },
  {
    key: 'great-east',
    style: { left: '-15%', top: '40%', width: '130%', height: 8 },
    rotate: '-9deg',
  },
  {
    key: 'kafue',
    style: { left: '22%', top: '-15%', width: 5, height: '130%' },
    rotate: '-24deg',
  },
  {
    key: 'ring',
    style: { left: '-15%', top: '72%', width: '130%', height: 5 },
    rotate: '5deg',
  },
  {
    key: 'airport',
    style: { left: '76%', top: '-15%', width: 5, height: '130%' },
    rotate: '18deg',
  },
];

interface DutyMapProps {
  online: boolean;
  hasPickup: boolean;
  pickupLabel: string;
}

function DutyMap({ online, hasPickup, pickupLabel }: DutyMapProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!online) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [online, pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 3.4] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.map}>
      {ROADS.map((road) => (
        <View
          key={road.key}
          style={[styles.road, road.style, { transform: [{ rotate: road.rotate }] }]}
        />
      ))}

      <Text style={[styles.mapLabel, { top: '12%', left: '50%' }]}>Cairo Rd</Text>
      <Text style={[styles.mapLabel, { top: '33%', left: '6%' }]}>Great East Rd</Text>
      <Text style={[styles.mapLabel, { top: '78%', left: '8%' }]}>Ring Rd</Text>
      <Text style={[styles.mapLabel, { top: '10%', left: '78%' }]}>Airport Rd</Text>

      {hasPickup && (
        <View style={styles.pickupPin}>
          <Ionicons name="location" size={30} color={colors.gold} />
          <View style={styles.pickupTag}>
            <Text style={styles.pickupTagText} numberOfLines={1}>
              {pickupLabel}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.driverDotWrap}>
        {online && (
          <Animated.View
            style={[
              styles.driverPulse,
              { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          />
        )}
        <View style={[styles.driverDot, !online && styles.driverDotOffline]} />
      </View>

      {!online && (
        <View style={styles.mapShade}>
          <Ionicons name="moon-outline" size={22} color={colors.slate} />
          <Text style={styles.mapShadeText}>You are off duty</Text>
        </View>
      )}
    </View>
  );
}

export default function DriverTerminalScreen() {
  const { isOnline, setIsOnline, userPhone, logout, formatPrice, currency, setCurrency } =
    useApp();

  const [request, setRequest] = useState<RideRequest | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(REQUEST_WINDOW_SECONDS);
  const [activeTrip, setActiveTrip] = useState<RideRequest | null>(null);
  const [earningsZmw, setEarningsZmw] = useState<number>(0);
  const [completedTrips, setCompletedTrips] = useState<number>(0);
  const requestIndex = useRef<number>(0);
  const mapHeight = useRef<number>(0);

  useEffect(() => {
    if (!isOnline) {
      setRequest(null);
      return undefined;
    }
    if (request !== null || activeTrip !== null) {
      return undefined;
    }
    const timer = setTimeout(() => {
      const template = SAMPLE_REQUESTS[requestIndex.current % SAMPLE_REQUESTS.length];
      requestIndex.current += 1;
      setSecondsLeft(REQUEST_WINDOW_SECONDS);
      setRequest({ ...template, id: `req-${Date.now()}-${requestIndex.current}` });
    }, REQUEST_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isOnline, request, activeTrip]);

  useEffect(() => {
    if (request === null) {
      return undefined;
    }
    if (secondsLeft <= 0) {
      setRequest(null);
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [request, secondsLeft]);

  const handleDutyChange = useCallback(
    (online: boolean) => {
      if (!online && activeTrip !== null) {
        Alert.alert('Trip in progress', 'Complete your active trip before going off duty.');
        return;
      }
      setIsOnline(online);
    },
    [activeTrip, setIsOnline],
  );

  const handleAccept = () => {
    if (request === null) {
      return;
    }
    setActiveTrip(request);
    setRequest(null);
  };

  const handleDecline = () => {
    setRequest(null);
  };

  const handleComplete = () => {
    if (activeTrip === null) {
      return;
    }
    setEarningsZmw((value) => value + activeTrip.fareZmw * PAYOUT_SHARE);
    setCompletedTrips((value) => value + 1);
    setActiveTrip(null);
  };

  const handleSignOut = () => {
    const message =
      activeTrip !== null
        ? 'You have a trip in progress. Complete it before signing out.'
        : 'You will go off duty and return to the sign in screen.';
    if (activeTrip !== null) {
      Alert.alert('Trip in progress', message);
      return;
    }
    Alert.alert('Sign out', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleMapLayout = (event: LayoutChangeEvent) => {
    mapHeight.current = event.nativeEvent.layout.height;
  };

  const pickupFocus = activeTrip ?? request;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerBrand}>{BRAND.name}</Text>
            <Text style={styles.headerSub}>{`Chauffeur terminal  ·  ${maskPhone(
              toLocalNumber(userPhone),
            )}`}</Text>
          </View>
          <Pressable
            onPress={handleSignOut}
            hitSlop={10}
            style={styles.signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.gold} />
          </Pressable>
        </View>

        <View style={[styles.dutyCard, isOnline && styles.dutyCardOnline]}>
          <View style={styles.dutyText}>
            <View style={styles.dutyStatusRow}>
              <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
              <Text style={styles.dutyStatus}>{isOnline ? 'ON DUTY' : 'OFF DUTY'}</Text>
            </View>
            <Text style={styles.dutyDescription}>
              {isOnline
                ? 'Searching for executive bookings near you'
                : 'Go on duty to start receiving bookings'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleDutyChange}
            trackColor={{ false: '#3A4656', true: colors.gold }}
            thumbColor={colors.white}
            ios_backgroundColor="#3A4656"
            accessibilityLabel="Duty status"
          />
        </View>

        <View style={styles.mapFrame} onLayout={handleMapLayout}>
          <DutyMap
            online={isOnline}
            hasPickup={pickupFocus !== null}
            pickupLabel={pickupFocus ? pickupFocus.pickup : ''}
          />
        </View>

        {request !== null && (
          <View style={styles.requestCard}>
            <View style={styles.requestHead}>
              <Text style={styles.requestTitle}>New booking request</Text>
              <View style={styles.timerPill}>
                <Ionicons name="timer-outline" size={14} color={colors.gold} />
                <Text style={styles.timerText}>{`${secondsLeft}s`}</Text>
              </View>
            </View>
            <Text style={styles.requestRider}>{request.riderName}</Text>
            <View style={styles.requestLine}>
              <Ionicons name="location-outline" size={16} color={colors.slate} />
              <Text style={styles.requestLineText}>{request.pickup}</Text>
            </View>
            <View style={styles.requestLine}>
              <Ionicons name="car-sport-outline" size={16} color={colors.slate} />
              <Text style={styles.requestLineText}>
                {`${request.vehicleName}  ·  ${request.hours} hours`}
              </Text>
            </View>
            <View style={styles.requestEarnRow}>
              <Text style={styles.requestEarnLabel}>Your earnings</Text>
              <Text style={styles.requestEarnValue}>
                {formatPrice(request.fareZmw * PAYOUT_SHARE)}
              </Text>
            </View>
            <View style={styles.requestActions}>
              <Pressable
                onPress={handleDecline}
                style={({ pressed }) => [styles.declineButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Decline booking"
              >
                <Text style={styles.declineText}>DECLINE</Text>
              </Pressable>
              <Pressable
                onPress={handleAccept}
                style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Accept booking"
              >
                <Text style={styles.acceptText}>ACCEPT</Text>
              </Pressable>
            </View>
          </View>
        )}

        {activeTrip !== null && (
          <View style={styles.requestCard}>
            <View style={styles.requestHead}>
              <Text style={styles.requestTitle}>Active trip</Text>
              <View style={styles.timerPill}>
                <View style={styles.statusDotOnline} />
                <Text style={styles.timerText}>In progress</Text>
              </View>
            </View>
            <Text style={styles.requestRider}>{activeTrip.riderName}</Text>
            <View style={styles.requestLine}>
              <Ionicons name="location-outline" size={16} color={colors.slate} />
              <Text style={styles.requestLineText}>{activeTrip.pickup}</Text>
            </View>
            <View style={styles.requestLine}>
              <Ionicons name="person-outline" size={16} color={colors.slate} />
              <Text style={styles.requestLineText}>
                {`${activeTrip.vehicleName}  ·  ${activeTrip.hours} hours booked  ·  ${CHAUFFEUR.plate}`}
              </Text>
            </View>
            <Pressable
              onPress={handleComplete}
              style={({ pressed }) => [styles.completeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Complete trip"
            >
              <Text style={styles.acceptText}>COMPLETE TRIP</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Earned today</Text>
            <Text style={styles.statValue}>{formatPrice(earningsZmw)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Trips completed</Text>
            <Text style={styles.statValue}>{completedTrips}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Display currency</Text>
        <View style={styles.currencyCard}>
          <SegmentedToggle options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerBrand: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: colors.slate,
    fontSize: 13,
    marginTop: 2,
  },
  signOut: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dutyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dutyCardOnline: {
    borderColor: colors.gold,
  },
  dutyText: {
    flex: 1,
    marginRight: 12,
  },
  dutyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.slate,
  },
  statusDotOnline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  dutyStatus: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  dutyDescription: {
    color: colors.slate,
    fontSize: 13,
    marginTop: 4,
  },
  mapFrame: {
    height: 260,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
    backgroundColor: '#161D26',
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#2A3644',
    borderRadius: 4,
  },
  mapLabel: {
    position: 'absolute',
    color: colors.slate,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  driverDotWrap: {
    position: 'absolute',
    top: '55%',
    left: '44%',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverPulse: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
  },
  driverDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.white,
  },
  driverDotOffline: {
    backgroundColor: colors.slate,
    borderColor: colors.card,
  },
  pickupPin: {
    position: 'absolute',
    top: '18%',
    left: '58%',
    alignItems: 'flex-start',
  },
  pickupTag: {
    maxWidth: 150,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  pickupTagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  mapShade: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(11,12,16,0.55)',
  },
  mapShadeText: {
    color: colors.slate,
    fontSize: 14,
    fontWeight: '600',
  },
  requestCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  requestHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTitle: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  requestRider: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  requestLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  requestLineText: {
    flex: 1,
    color: colors.slate,
    fontSize: 14,
  },
  requestEarnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  requestEarnLabel: {
    color: colors.slate,
    fontSize: 14,
  },
  requestEarnValue: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: '800',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  declineButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  declineText: {
    color: colors.slate,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  acceptButton: {
    flex: 2,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  completeButton: {
    height: 52,
    marginTop: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  acceptText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  pressed: {
    opacity: 0.85,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    color: colors.slate,
    fontSize: 12,
  },
  statValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  currencyCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
