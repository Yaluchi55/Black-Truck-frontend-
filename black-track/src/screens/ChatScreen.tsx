import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../components/Avatar';
import { useApp } from '../context/AppContext';
import { CHAUFFEUR, QUICK_MESSAGES } from '../data/user';
import { colors, radius, spacing } from '../theme';
import { ChatMessage } from '../types';
import { formatTime, maskPlate } from '../utils/format';

const GENERIC_REPLIES: string[] = [
  'Understood. I am on it.',
  'Noted, thank you. Anything else you need?',
  'Of course. I will take care of it.',
];

const buildReply = (text: string, fallbackIndex: number): string => {
  const lower = text.toLowerCase();
  if (lower.includes('airport')) {
    return 'Understood. I am at the arrivals exit in the black car, hazards on.';
  }
  if (lower.includes('gate')) {
    return 'Copy that. I am pulling up to the main gate now.';
  }
  if (lower.includes('late')) {
    return 'No problem at all. I will wait for you, take your time.';
  }
  if (lower.includes('bring') || lower.includes('around')) {
    return 'On my way to you now. Two minutes.';
  }
  if (lower.includes('stop')) {
    return 'Certainly. Tell me where and I will adjust the route.';
  }
  return GENERIC_REPLIES[fallbackIndex % GENERIC_REPLIES.length];
};

export default function ChatScreen() {
  const {
    messages,
    addMessage,
    privacyShield,
    selectedVehicleDetails: selectedVehicle,
  } = useApp();
  const tabBarHeight = useBottomTabBarHeight();
  const [draft, setDraft] = useState<string>('');
  const [typing, setTyping] = useState<boolean>(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const replyCount = useRef<number>(0);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const scheduleReply = useCallback(
    (text: string) => {
      setTyping(true);
      const timer = setTimeout(() => {
        addMessage('chauffeur', { text: buildReply(text, replyCount.current) });
        replyCount.current += 1;
        setTyping(false);
      }, 1500);
      timers.current.push(timer);
    },
    [addMessage],
  );

  const sendText = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) {
        return;
      }
      addMessage('rider', { text });
      scheduleReply(text);
    },
    [addMessage, scheduleReply],
  );

  const handleSend = () => {
    sendText(draft);
    setDraft('');
  };

  const handleCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera access needed',
          'Allow camera access in your phone settings to share photos with your chauffeur.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!result.canceled && result.assets.length > 0) {
        addMessage('rider', { imageUri: result.assets[0].uri });
        scheduleReply('photo');
      }
    } catch {
      Alert.alert('Camera unavailable', 'The camera could not be opened on this device.');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.sender === 'rider';
    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.bubbleImage} />
          ) : null}
          {item.text ? (
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
          ) : null}
          <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
            {formatTime(item.sentAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Avatar uri={CHAUFFEUR.avatarUri} name={CHAUFFEUR.name} size={46} ring />
        <View style={styles.headerText}>
          <Text style={styles.headerName}>{CHAUFFEUR.name}</Text>
          <Text style={styles.headerSub}>
            {`${selectedVehicle.name}  ·  ${
              privacyShield ? maskPlate(CHAUFFEUR.plate) : CHAUFFEUR.plate
            }`}
          </Text>
        </View>
        <View style={styles.onlineWrap}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{typing ? 'Typing' : 'Online'}</Text>
        </View>
      </View>

      <View style={styles.quickBank}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.quickContent}
        >
          {QUICK_MESSAGES.map((message) => (
            <Pressable
              key={message}
              onPress={() => sendText(message)}
              style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Send: ${message}`}
            >
              <Ionicons name="flash-outline" size={14} color={colors.gold} />
              <Text style={styles.quickText}>{message}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {typing && (
          <Text style={styles.typingText}>{`${CHAUFFEUR.firstName} is typing…`}</Text>
        )}

        <View style={styles.inputBar}>
          <Pressable
            onPress={handleCamera}
            style={styles.cameraButton}
            accessibilityRole="button"
            accessibilityLabel="Take a photo"
          >
            <Ionicons name="camera-outline" size={24} color={colors.gold} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message your chauffeur"
            placeholderTextColor={colors.slate}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline
            selectionColor={colors.gold}
          />
          <Pressable
            onPress={handleSend}
            disabled={draft.trim().length === 0}
            style={[styles.sendButton, draft.trim().length === 0 && styles.sendDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Ionicons name="arrow-up" size={22} color={colors.background} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    color: colors.slate,
    fontSize: 12,
    marginTop: 2,
  },
  onlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineText: {
    color: colors.slate,
    fontSize: 12,
  },
  quickBank: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  quickChipPressed: {
    backgroundColor: colors.goldTint,
  },
  quickText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleMine: {
    backgroundColor: colors.gold,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: colors.background,
    fontWeight: '500',
  },
  bubbleImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    marginBottom: 6,
  },
  bubbleTime: {
    color: colors.slate,
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine: {
    color: '#5B4B33',
  },
  typingText: {
    color: colors.slate,
    fontSize: 12,
    paddingHorizontal: spacing.md,
    paddingBottom: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.white,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  sendDisabled: {
    opacity: 0.4,
  },
});
