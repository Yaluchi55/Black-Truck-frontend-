import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedToggle from '../components/SegmentedToggle';
import { useApp } from '../context/AppContext';
import { USER } from '../data/user';
import { colors, radius, spacing } from '../theme';
import { Currency } from '../types';
import { USD_TO_ZMW, maskPhone } from '../utils/format';
import { toLocalNumber } from '../utils/phone';

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'ZMW', label: 'ZMW (K)' },
  { value: 'USD', label: 'USD ($)' },
];

interface ToggleRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}

function ToggleRow({ icon, title, description, value, onChange, last = false }: ToggleRowProps) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.gold} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#3A4656', true: colors.gold }}
        thumbColor={colors.white}
        ios_backgroundColor="#3A4656"
        accessibilityLabel={title}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const {
    currency,
    setCurrency,
    formatPrice,
    selectedVehicleDetails: selectedVehicle,
    userPhone,
    logout,
    pushNotifications,
    setPushNotifications,
    privacyShield,
    setPrivacyShield,
  } = useApp();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You will return to the sign in screen.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Profile" subtitle="Your account, privacy and currency" />

        <View style={styles.profileCard}>
          <Avatar uri={USER.avatarUri} name={USER.name} size={76} ring />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{USER.name}</Text>
            <Text style={styles.profileMeta}>
              {privacyShield ? maskPhone(toLocalNumber(userPhone)) : USER.email}
            </Text>
            <View style={styles.tierBadge}>
              <Ionicons name="ribbon" size={13} color={colors.background} />
              <Text style={styles.tierText}>{USER.tier}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.group}>
          <ToggleRow
            icon="notifications-outline"
            title="Push Notifications"
            description={
              pushNotifications
                ? 'Chauffeur arrival and booking alerts are on'
                : 'You will not receive trip alerts'
            }
            value={pushNotifications}
            onChange={setPushNotifications}
          />
          <ToggleRow
            icon="shield-checkmark-outline"
            title="Privacy Shield Mode"
            description={
              privacyShield
                ? 'Phone numbers and plates are masked'
                : 'Mask phone numbers and plates in the app'
            }
            value={privacyShield}
            onChange={setPrivacyShield}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>Currency</Text>
        <View style={styles.currencyCard}>
          <SegmentedToggle options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
          <View style={styles.rateRow}>
            <Text style={styles.rateLabel}>Exchange rate</Text>
            <Text style={styles.rateValue}>{`1 USD = K${USD_TO_ZMW}`}</Text>
          </View>
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>{`${selectedVehicle.name} now shows`}</Text>
            <Text style={styles.previewValue}>{`${formatPrice(selectedVehicle.hourlyZmw)} / Hr`}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutPressed]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.gold} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  profileMeta: {
    color: colors.slate,
    fontSize: 13,
    marginTop: 3,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  tierText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    marginHorizontal: 12,
  },
  rowTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  rowDescription: {
    color: colors.slate,
    fontSize: 12,
    marginTop: 2,
  },
  currencyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  rateLabel: {
    color: colors.slate,
    fontSize: 14,
  },
  rateValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  previewBox: {
    marginTop: spacing.md,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    color: colors.slate,
    fontSize: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  signOutPressed: {
    borderColor: colors.gold,
  },
  signOutText: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  previewValue: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
});
