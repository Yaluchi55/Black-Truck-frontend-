import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import {
  OTP_LENGTH,
  OTP_RESEND_SECONDS,
  requestOtp,
  verifyOtp,
} from '../services/authService';
import { BRAND, colors, radius, spacing } from '../theme';
import { UserRole } from '../types';
import {
  detectNetwork,
  isValidZambianMobile,
  normalizeLocalNumber,
  toE164,
} from '../utils/phone';
import { maskPhone } from '../utils/format';

type Step = 'role' | 'phone' | 'otp';
type Busy = 'sending' | 'verifying' | null;

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'RIDER',
    label: 'I AM A RIDER',
    description: 'Book a private chauffeur by the hour',
    icon: 'person-outline',
  },
  {
    role: 'CHAUFFEUR',
    label: 'I AM A CHAUFFEUR',
    description: 'Go on duty and accept executive bookings',
    icon: 'car-sport-outline',
  },
];

function BrandMark() {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  const line = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rise, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(line, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [fade, rise, line, glow]);

  const ringScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Animated.View
      style={[styles.brandWrap, { opacity: fade, transform: [{ translateY: rise }] }]}
      accessibilityRole="header"
    >
      <View style={styles.emblemWrap}>
        <Animated.View
          style={[styles.emblemRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
        <View style={styles.emblem}>
          <Ionicons name="car-sport" size={34} color={colors.gold} />
        </View>
      </View>
      <Text style={styles.brandTitle}>{BRAND.logoTitle}</Text>
      <Animated.View style={[styles.brandLine, { transform: [{ scaleX: line }] }]} />
      <Text style={styles.brandTagline}>{BRAND.tagline}</Text>
    </Animated.View>
  );
}

function ZambiaFlag() {
  return (
    <View style={styles.flag} accessibilityLabel="Zambia flag">
      <View style={styles.flagEagle} />
      <View style={styles.flagStripes}>
        <View style={[styles.flagStripe, styles.flagRed]} />
        <View style={[styles.flagStripe, styles.flagBlack]} />
        <View style={[styles.flagStripe, styles.flagOrange]} />
      </View>
    </View>
  );
}

export default function AuthScreen() {
  const { login } = useApp();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [busy, setBusy] = useState<Busy>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [otpFocused, setOtpFocused] = useState<boolean>(false);

  const otpRef = useRef<TextInput>(null);
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const mounted = useRef<boolean>(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const goToStep = useCallback(
    (next: Step) => {
      Animated.timing(stepOpacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(
        () => {
          if (!mounted.current) {
            return;
          }
          setStep(next);
          Animated.timing(stepOpacity, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }).start();
        },
      );
    },
    [stepOpacity],
  );

  const handleRole = (selected: UserRole) => {
    setRole(selected);
    goToStep('phone');
  };

  const handleBack = () => {
    if (busy) {
      return;
    }
    if (step === 'otp') {
      setOtp('');
      goToStep('phone');
      return;
    }
    if (step === 'phone') {
      goToStep('role');
    }
  };

  const sendCode = async (advance: boolean) => {
    if (!isValidZambianMobile(phoneInput)) {
      Alert.alert(
        'Check your number',
        'Enter a valid Zambian mobile number starting with 97, 96, 95, 77, 76 or 75, for example 97 123 4567.',
      );
      return;
    }
    setBusy('sending');
    try {
      const receipt = await requestOtp(phoneInput);
      if (!mounted.current) {
        return;
      }
      setBusy(null);
      setOtp('');
      setSecondsLeft(OTP_RESEND_SECONDS);
      if (advance) {
        goToStep('otp');
      }
      Alert.alert(
        'Demo mode',
        `No SMS is sent in this build. Your verification code is ${receipt.demoCode}.`,
      );
    } catch {
      if (mounted.current) {
        setBusy(null);
        Alert.alert('Could not send code', 'Check your connection and try again.');
      }
    }
  };

  const submitCode = async (code: string) => {
    if (role === null) {
      goToStep('role');
      return;
    }
    setBusy('verifying');
    try {
      const valid = await verifyOtp(phoneInput, code);
      if (!mounted.current) {
        return;
      }
      if (valid) {
        login(role, toE164(phoneInput));
        return;
      }
      setBusy(null);
      setOtp('');
      Alert.alert('Incorrect code', 'That code did not match. Check the digits and try again.', [
        { text: 'OK', onPress: () => otpRef.current?.focus() },
      ]);
    } catch {
      if (mounted.current) {
        setBusy(null);
        Alert.alert('Could not verify code', 'Check your connection and try again.');
      }
    }
  };

  const handleOtpChange = (value: string) => {
    if (busy) {
      return;
    }
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (digits.length === OTP_LENGTH) {
      otpRef.current?.blur();
      submitCode(digits);
    }
  };

  const network = detectNetwork(phoneInput);
  const localDigits = normalizeLocalNumber(phoneInput);
  const numberLooksInvalid = localDigits.length >= 9 && !isValidZambianMobile(phoneInput);
  const sending = busy === 'sending';
  const verifying = busy === 'verifying';

  const renderRoleStep = () => (
    <View>
      <Text style={styles.stepTitle}>Welcome</Text>
      <Text style={styles.stepSubtitle}>Choose how you will use {BRAND.name}.</Text>
      {ROLE_OPTIONS.map((option) => (
        <Pressable
          key={option.role}
          onPress={() => handleRole(option.role)}
          android_ripple={{ color: 'rgba(197,168,128,0.25)' }}
          style={({ pressed }) => [styles.roleButton, pressed && styles.roleButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={option.label}
        >
          <View style={styles.roleIcon}>
            <Ionicons name={option.icon} size={26} color={colors.gold} />
          </View>
          <View style={styles.roleText}>
            <Text style={styles.roleLabel}>{option.label}</Text>
            <Text style={styles.roleDescription}>{option.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.slate} />
        </Pressable>
      ))}
    </View>
  );

  const renderPhoneStep = () => (
    <View>
      <Text style={styles.stepTitle}>Your mobile number</Text>
      <Text style={styles.stepSubtitle}>
        {`We will text a 6-digit code to verify your ${role === 'CHAUFFEUR' ? 'chauffeur' : 'rider'} account.`}
      </Text>

      <View style={[styles.phoneRow, numberLooksInvalid && styles.phoneRowInvalid]}>
        <View style={styles.countryBadge}>
          <ZambiaFlag />
          <Text style={styles.countryCode}>+260</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          value={phoneInput}
          onChangeText={(value) => setPhoneInput(value.replace(/[^\d\s]/g, '').slice(0, 13))}
          placeholder="97 123 4567"
          placeholderTextColor={colors.slate}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          selectionColor={colors.gold}
          editable={!sending}
          returnKeyType="done"
          onSubmitEditing={() => sendCode(true)}
          accessibilityLabel="Mobile number"
        />
      </View>

      <View style={styles.networkRow}>
        {network ? (
          <>
            <Ionicons name="checkmark-circle" size={16} color={colors.gold} />
            <Text style={styles.networkText}>{`${network} number`}</Text>
          </>
        ) : (
          <Text style={styles.networkHint}>Airtel, MTN and Zamtel numbers are supported.</Text>
        )}
      </View>

      <Pressable
        onPress={() => sendCode(true)}
        disabled={sending}
        android_ripple={{ color: 'rgba(11,12,16,0.2)' }}
        style={({ pressed }) => [
          styles.primaryButton,
          (pressed || sending) && styles.primaryButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Send code"
      >
        {sending ? (
          <View style={styles.buttonBusy}>
            <ActivityIndicator color={colors.background} />
            <Text style={styles.primaryText}>SENDING CODE</Text>
          </View>
        ) : (
          <Text style={styles.primaryText}>SEND CODE</Text>
        )}
      </Pressable>
    </View>
  );

  const renderOtpStep = () => (
    <View>
      <Text style={styles.stepTitle}>Enter your code</Text>
      <Text style={styles.stepSubtitle}>
        {`Sent to +260 ${maskPhone(normalizeLocalNumber(phoneInput))}`}
      </Text>

      <Pressable
        onPress={() => otpRef.current?.focus()}
        style={styles.otpRow}
        accessibilityRole="button"
        accessibilityLabel="Enter 6-digit code"
      >
        {Array.from({ length: OTP_LENGTH }).map((_, index) => {
          const filled = index < otp.length;
          const active = otpFocused && index === Math.min(otp.length, OTP_LENGTH - 1);
          return (
            <View
              key={`otp-${index}`}
              style={[styles.otpBox, filled && styles.otpBoxFilled, active && styles.otpBoxActive]}
            >
              <Text style={styles.otpDot}>{filled ? '•' : ''}</Text>
            </View>
          );
        })}
        <TextInput
          ref={otpRef}
          style={styles.otpHiddenInput}
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          secureTextEntry
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          caretHidden
          editable={!busy}
          onFocus={() => setOtpFocused(true)}
          onBlur={() => setOtpFocused(false)}
          accessibilityLabel="Verification code"
        />
      </Pressable>

      <View style={styles.verifyRow}>
        {verifying ? (
          <>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.verifyText}>Verifying securely…</Text>
          </>
        ) : (
          <Text style={styles.networkHint}>The code is checked as soon as you enter all 6 digits.</Text>
        )}
      </View>

      <Pressable
        onPress={() => sendCode(false)}
        disabled={secondsLeft > 0 || busy !== null}
        style={styles.resendButton}
        accessibilityRole="button"
        accessibilityLabel="Resend code"
      >
        {sending ? (
          <ActivityIndicator color={colors.gold} />
        ) : (
          <Text style={[styles.resendText, secondsLeft > 0 && styles.resendTextDisabled]}>
            {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
          </Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backRow}>
            {step !== 'role' && (
              <Pressable
                onPress={handleBack}
                hitSlop={12}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={22} color={colors.gold} />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            )}
          </View>

          <BrandMark />

          <Animated.View style={[styles.stepWrap, { opacity: stepOpacity }]}>
            {step === 'role' && renderRoleStep()}
            {step === 'phone' && renderPhoneStep()}
            {step === 'otp' && renderOtpStep()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backRow: {
    height: 44,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  brandWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  emblemWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  emblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 7,
    marginTop: spacing.md,
    paddingLeft: 7,
  },
  brandLine: {
    width: 120,
    height: 2,
    marginTop: 12,
    backgroundColor: colors.gold,
  },
  brandTagline: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 5,
    marginTop: 12,
    paddingLeft: 5,
  },
  stepWrap: {
    flex: 1,
  },
  stepTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
  },
  stepSubtitle: {
    color: colors.slate,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  roleButtonPressed: {
    borderColor: colors.gold,
    backgroundColor: '#243040',
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    flex: 1,
    marginHorizontal: 14,
  },
  roleLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  roleDescription: {
    color: colors.slate,
    fontSize: 13,
    marginTop: 3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  phoneRowInvalid: {
    borderColor: colors.danger,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: '100%',
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
  },
  countryCode: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    color: colors.white,
    fontSize: 18,
    letterSpacing: 1,
  },
  flag: {
    width: 28,
    height: 19,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#198A00',
  },
  flagEagle: {
    position: 'absolute',
    top: 3,
    right: 5,
    width: 7,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF7D00',
  },
  flagStripes: {
    position: 'absolute',
    right: 2,
    bottom: 0,
    flexDirection: 'row',
  },
  flagStripe: {
    width: 4,
    height: 8,
  },
  flagRed: {
    backgroundColor: '#DE2010',
  },
  flagBlack: {
    backgroundColor: '#000000',
  },
  flagOrange: {
    backgroundColor: '#EF7D00',
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 24,
    marginTop: 10,
    marginBottom: spacing.lg,
  },
  networkText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  networkHint: {
    color: colors.slate,
    fontSize: 13,
  },
  primaryButton: {
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  buttonBusy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpBox: {
    width: 48,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.slate,
  },
  otpBoxActive: {
    borderColor: colors.gold,
  },
  otpDot: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  otpHiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.02,
    color: 'transparent',
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 32,
    marginTop: spacing.lg,
  },
  verifyText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  resendButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  resendText: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: colors.slate,
    fontWeight: '500',
  },
});
