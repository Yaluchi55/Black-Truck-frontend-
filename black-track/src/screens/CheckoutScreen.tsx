import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { PAYMENT_OPTIONS } from '../data/user';
import { CheckoutScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { BillingMode } from '../types';
import { isValidEmail, maskPhone } from '../utils/format';

interface BillingChoice {
  id: BillingMode;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const BILLING_CHOICES: BillingChoice[] = [
  {
    id: 'personal',
    title: 'Personal Wallet',
    description: 'Pay now with MTN MoMo, Airtel MoMo or card',
    icon: 'wallet-outline',
  },
  {
    id: 'corporate',
    title: 'Corporate Billing',
    description: 'Charge your company account and invoice it',
    icon: 'business-outline',
  },
];

export default function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const {
    selectedVehicleDetails: selectedVehicle,
    selectedHours: hours,
    totalZmw,
    formatPrice,
    currency,
    billing,
    setBilling,
    payment,
    setPayment,
    momoNumber,
    setMomoNumber,
    expenseMemo,
    setExpenseMemo,
    emailInvoice,
    setEmailInvoice,
    invoiceEmail,
    setInvoiceEmail,
    privacyShield,
    addMessage,
  } = useApp();

  const isMomo = payment === 'mtn' || payment === 'airtel';
  const paymentLabel = PAYMENT_OPTIONS.find((option) => option.id === payment)?.label ?? 'Card';

  const validate = (): string | null => {
    if (billing === 'corporate' && expenseMemo.trim().length === 0) {
      return 'Add an expense memo or project code so finance can match this charge.';
    }
    if (billing === 'personal' && isMomo && momoNumber.replace(/\D/g, '').length < 9) {
      return `Enter the ${paymentLabel} number you want to pay from.`;
    }
    if (emailInvoice && !isValidEmail(invoiceEmail)) {
      return 'Enter a valid email address for the PDF invoice.';
    }
    return null;
  };

  const handleConfirm = () => {
    const problem = validate();
    if (problem) {
      Alert.alert('One more detail', problem);
      return;
    }
    const method = billing === 'corporate' ? 'Corporate Billing' : paymentLabel;
    const invoiceNote = emailInvoice ? ` A PDF invoice will be emailed to ${invoiceEmail.trim()}.` : '';
    addMessage('chauffeur', {
      text: `Your booking is confirmed: ${selectedVehicle.name} for ${hours} ${
        hours === 1 ? 'hour' : 'hours'
      }. I will be with you shortly.`,
    });
    Alert.alert(
      'Booking confirmed',
      `${selectedVehicle.name}, ${hours} ${hours === 1 ? 'hour' : 'hours'}, ${formatPrice(
        totalZmw,
      )} via ${method}.${invoiceNote}`,
      [
        {
          text: 'Message chauffeur',
          onPress: () => navigation.navigate('Tabs', { screen: 'Chat' }),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons name={selectedVehicle.icon} size={30} color={colors.gold} />
              </View>
              <View style={styles.summaryHeadText}>
                <Text style={styles.summaryName}>{selectedVehicle.name}</Text>
                <Text style={styles.summaryModel}>{selectedVehicle.model}</Text>
              </View>
              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Edit booking"
              >
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hours requested</Text>
              <Text style={styles.summaryValue}>{`${hours} ${hours === 1 ? 'hour' : 'hours'}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hourly rate</Text>
              <Text style={styles.summaryValue}>{`${formatPrice(selectedVehicle.hourlyZmw)} / Hr`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Billing currency</Text>
              <Text style={styles.summaryValue}>{currency}</Text>
            </View>

            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(totalZmw)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Billing</Text>
          {BILLING_CHOICES.map((choice) => {
            const active = choice.id === billing;
            return (
              <Pressable
                key={choice.id}
                onPress={() => setBilling(choice.id)}
                style={[styles.billingCard, active && styles.billingCardActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={choice.title}
              >
                <View style={[styles.billingIcon, active && styles.billingIconActive]}>
                  <Ionicons
                    name={choice.icon}
                    size={22}
                    color={active ? colors.background : colors.gold}
                  />
                </View>
                <View style={styles.billingText}>
                  <Text style={styles.billingTitle}>{choice.title}</Text>
                  <Text style={styles.billingDescription}>{choice.description}</Text>
                </View>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={active ? colors.gold : colors.slate}
                />
              </Pressable>
            );
          })}

          {billing === 'personal' && (
            <View style={styles.walletCard}>
              <Text style={styles.fieldLabel}>Pay from</Text>
              <View style={styles.walletRow}>
                {PAYMENT_OPTIONS.map((option) => {
                  const active = option.id === payment;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setPayment(option.id)}
                      style={[styles.walletChip, active && styles.walletChipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.walletChipText, active && styles.walletChipTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {isMomo && (
                <View style={styles.momoField}>
                  <Text style={styles.fieldLabel}>{`${paymentLabel} number`}</Text>
                  {privacyShield ? (
                    <View style={styles.maskedInput}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={colors.gold} />
                      <Text style={styles.maskedText}>{maskPhone(momoNumber)}</Text>
                    </View>
                  ) : (
                    <TextInput
                      style={styles.input}
                      value={momoNumber}
                      onChangeText={setMomoNumber}
                      keyboardType="phone-pad"
                      placeholder="097 123 4567"
                      placeholderTextColor={colors.slate}
                      selectionColor={colors.gold}
                      maxLength={13}
                    />
                  )}
                </View>
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>Expense details</Text>
          <View style={styles.expenseCard}>
            <Text style={styles.fieldLabel}>Expense Memo / Project Code</Text>
            <TextInput
              style={styles.input}
              value={expenseMemo}
              onChangeText={setExpenseMemo}
              placeholder="e.g. PRJ-2041 Copperbelt site visit"
              placeholderTextColor={colors.slate}
              selectionColor={colors.gold}
              autoCapitalize="characters"
              returnKeyType="done"
            />
            {billing === 'corporate' && (
              <Text style={styles.helper}>Required for corporate billing.</Text>
            )}

            <View style={styles.invoiceRow}>
              <View style={styles.invoiceText}>
                <Text style={styles.invoiceTitle}>Email PDF invoice automatically</Text>
                <Text style={styles.invoiceDescription}>Sent as soon as the trip ends</Text>
              </View>
              <Switch
                value={emailInvoice}
                onValueChange={setEmailInvoice}
                trackColor={{ false: '#3A4656', true: colors.gold }}
                thumbColor={colors.white}
                ios_backgroundColor="#3A4656"
                accessibilityLabel="Email PDF invoice automatically"
              />
            </View>

            {emailInvoice && (
              <TextInput
                style={[styles.input, styles.emailInput]}
                value={invoiceEmail}
                onChangeText={setInvoiceEmail}
                placeholder="accounts@company.co.zm"
                placeholderTextColor={colors.slate}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.gold}
              />
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmPressed]}
            accessibilityRole="button"
            accessibilityLabel="Confirm booking"
          >
            <Text style={styles.confirmText}>{`CONFIRM  ·  ${formatPrice(totalZmw)}`}</Text>
          </Pressable>
        </View>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryHeadText: {
    flex: 1,
    marginLeft: 12,
  },
  summaryName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  summaryModel: {
    color: colors.slate,
    fontSize: 12,
    marginTop: 2,
  },
  editLink: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    color: colors.slate,
    fontSize: 14,
  },
  summaryValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  billingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  billingCardActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldTint,
  },
  billingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingIconActive: {
    backgroundColor: colors.gold,
  },
  billingText: {
    flex: 1,
    marginHorizontal: 12,
  },
  billingTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  billingDescription: {
    color: colors.slate,
    fontSize: 12,
    marginTop: 2,
  },
  walletCard: {
    marginTop: 2,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  walletChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  walletChipText: {
    color: colors.slate,
    fontSize: 13,
    fontWeight: '600',
  },
  walletChipTextActive: {
    color: colors.background,
    fontWeight: '800',
  },
  momoField: {
    marginTop: 14,
  },
  expenseCard: {
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    color: colors.slate,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 50,
    marginTop: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.white,
    fontSize: 15,
  },
  maskedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    marginTop: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  maskedText: {
    color: colors.white,
    fontSize: 15,
    letterSpacing: 1,
  },
  emailInput: {
    marginTop: 12,
  },
  helper: {
    color: colors.slate,
    fontSize: 12,
    marginTop: 6,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  invoiceText: {
    flex: 1,
    marginRight: 12,
  },
  invoiceTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  invoiceDescription: {
    color: colors.slate,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  confirmButton: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPressed: {
    opacity: 0.85,
  },
  confirmText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
});
