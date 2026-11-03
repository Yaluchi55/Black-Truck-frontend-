import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MAX_HOURS, MIN_HOURS, useApp } from '../context/AppContext';
import { PAYMENT_OPTIONS, USER } from '../data/user';
import { HomeScreenProps } from '../navigation/types';
import { BRAND, colors, radius, spacing } from '../theme';
import { Vehicle } from '../data/vehicles';

const HOUR_PRESETS: number[] = [2, 4, 6, 8, 12];

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const {
    vehicles,
    selectedVehicleDetails: selectedVehicle,
    setSelectedVehicle: selectVehicle,
    selectedHours: hours,
    setSelectedHours: setHours,
    formatPrice,
    totalZmw,
    currency,
    payment,
    setPayment,
  } = useApp();

  const renderVehicle = ({ item }: { item: Vehicle }) => {
    const active = item.id === selectedVehicle.id;
    return (
      <Pressable
        onPress={() => selectVehicle(item.id)}
        style={[styles.vehicleCard, active && styles.vehicleCardActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${item.name}, ${formatPrice(item.hourlyZmw)} per hour`}
      >
        <View style={[styles.vehicleIconWrap, active && styles.vehicleIconWrapActive]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={34}
            color={active ? colors.background : colors.gold}
          />
        </View>
        <Text style={styles.vehicleName}>{item.name}</Text>
        <Text style={styles.vehicleModel} numberOfLines={1}>
          {item.model}
        </Text>
        <View style={styles.vehicleMeta}>
          <Ionicons name="people-outline" size={14} color={colors.slate} />
          <Text style={styles.vehicleMetaText}>{item.seats}</Text>
          <Ionicons name="time-outline" size={14} color={colors.slate} style={styles.metaGap} />
          <Text style={styles.vehicleMetaText}>{item.etaMinutes} min away</Text>
        </View>
        <Text style={styles.vehiclePrice}>{`${formatPrice(item.hourlyZmw)} / Hr`}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>{`${getGreeting()}, ${USER.firstName}`}</Text>
            <Text style={styles.brand}>{BRAND.name}</Text>
          </View>
          <View style={styles.currencyPill}>
            <Text style={styles.currencyPillText}>{currency}</Text>
          </View>
        </View>

        <View style={styles.pickupCard}>
          <View style={styles.pickupRow}>
            <View style={styles.dotGold} />
            <View style={styles.pickupTextWrap}>
              <Text style={styles.pickupLabel}>Pickup</Text>
              <Text style={styles.pickupValue}>Kenneth Kaunda International Airport</Text>
            </View>
          </View>
          <View style={styles.pickupDivider} />
          <View style={styles.pickupRow}>
            <View style={styles.dotRing} />
            <View style={styles.pickupTextWrap}>
              <Text style={styles.pickupLabel}>Chauffeur stays with you</Text>
              <Text style={styles.pickupValue}>Lusaka, all day or by the hour</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Chauffeur hours</Text>
        <View style={styles.hoursCard}>
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => setHours(hours - 1)}
              disabled={hours <= MIN_HOURS}
              style={[styles.stepperButton, hours <= MIN_HOURS && styles.stepperDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Decrease hours"
            >
              <Ionicons name="remove" size={22} color={colors.gold} />
            </Pressable>
            <View style={styles.hoursValueWrap}>
              <Text style={styles.hoursValue}>{hours}</Text>
              <Text style={styles.hoursUnit}>{hours === 1 ? 'hour' : 'hours'}</Text>
            </View>
            <Pressable
              onPress={() => setHours(hours + 1)}
              disabled={hours >= MAX_HOURS}
              style={[styles.stepperButton, hours >= MAX_HOURS && styles.stepperDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Increase hours"
            >
              <Ionicons name="add" size={22} color={colors.gold} />
            </Pressable>
          </View>
          <View style={styles.presetRow}>
            {HOUR_PRESETS.map((preset) => {
              const active = preset === hours;
              return (
                <Pressable
                  key={preset}
                  onPress={() => setHours(preset)}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>
                    {`${preset} hrs`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose your vehicle</Text>
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicle}
          extraData={`${currency}-${selectedVehicle.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vehicleList}
          ItemSeparatorComponent={() => <View style={styles.vehicleGap} />}
        />

        <Text style={styles.sectionTitle}>Pay with</Text>
        <View style={styles.paymentRow}>
          {PAYMENT_OPTIONS.map((option) => {
            const active = option.id === payment;
            return (
              <Pressable
                key={option.id}
                onPress={() => setPayment(option.id)}
                style={[styles.paymentTile, active && styles.paymentTileActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={active ? colors.gold : colors.slate}
                />
                <Text style={[styles.paymentLabel, active && styles.paymentLabelActive]}>
                  {option.label}
                </Text>
                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.gold}
                    style={styles.paymentCheck}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>{`${selectedVehicle.name} for ${hours} ${hours === 1 ? 'hr' : 'hrs'}`}</Text>
            <Text style={styles.totalValue}>{formatPrice(totalZmw)}</Text>
          </View>
          <Text style={styles.totalRate}>{`${formatPrice(selectedVehicle.hourlyZmw)} / Hr`}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Checkout')}
          style={({ pressed }) => [styles.bookButton, pressed && styles.bookButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Book private chauffeur"
        >
          <Text style={styles.bookText}>BOOK PRIVATE CHAUFFEUR</Text>
        </Pressable>
      </View>
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
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greeting: {
    color: colors.slate,
    fontSize: 14,
  },
  brand: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  currencyPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.goldTint,
  },
  currencyPillText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pickupCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  pickupLabel: {
    color: colors.slate,
    fontSize: 12,
  },
  pickupValue: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  pickupDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
    marginLeft: 26,
  },
  dotGold: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
  },
  dotRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  hoursCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.background,
  },
  stepperDisabled: {
    opacity: 0.35,
  },
  hoursValueWrap: {
    alignItems: 'center',
  },
  hoursValue: {
    color: colors.white,
    fontSize: 44,
    fontWeight: '800',
  },
  hoursUnit: {
    color: colors.slate,
    fontSize: 13,
    marginTop: -4,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  presetText: {
    color: colors.slate,
    fontSize: 13,
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.background,
    fontWeight: '800',
  },
  vehicleList: {
    paddingRight: spacing.md,
  },
  vehicleGap: {
    width: 12,
  },
  vehicleCard: {
    width: 220,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  vehicleCardActive: {
    borderColor: colors.gold,
    backgroundColor: '#243040',
  },
  vehicleIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  vehicleIconWrapActive: {
    backgroundColor: colors.gold,
  },
  vehicleName: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  vehicleModel: {
    color: colors.slate,
    fontSize: 12,
    marginTop: 2,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  vehicleMetaText: {
    color: colors.slate,
    fontSize: 12,
    marginLeft: 4,
  },
  metaGap: {
    marginLeft: 12,
  },
  vehiclePrice: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  paymentTileActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldTint,
  },
  paymentLabel: {
    color: colors.slate,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  paymentLabelActive: {
    color: colors.white,
  },
  paymentCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  totalLabel: {
    color: colors.slate,
    fontSize: 13,
  },
  totalValue: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  totalRate: {
    color: colors.slate,
    fontSize: 13,
  },
  bookButton: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonPressed: {
    opacity: 0.85,
  },
  bookText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
});
