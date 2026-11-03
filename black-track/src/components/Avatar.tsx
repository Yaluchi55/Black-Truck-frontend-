import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface AvatarProps {
  uri: string;
  name: string;
  size: number;
  ring?: boolean;
}

export default function Avatar({ uri, name, size, ring = false }: AvatarProps) {
  const [failed, setFailed] = useState<boolean>(false);
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const frame = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: ring ? 2 : 0,
    borderColor: colors.gold,
  };

  if (failed) {
    return (
      <View style={[styles.fallback, frame]}>
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={frame}
      onError={() => setFailed(true)}
      accessibilityLabel={`${name} profile picture`}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.gold,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
