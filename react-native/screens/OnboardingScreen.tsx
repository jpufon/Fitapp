import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '../theme';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to waliFit</Text>
        <Text style={styles.description}>
          Your hybrid athlete operating system. Train smarter, grow consistently, compete with your squad.
        </Text>
      </View>

      <TouchableOpacity onPress={onComplete} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.primary, colors.vitalityLight]}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.lg,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.lg,
  },
  button: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  buttonText: {
    fontSize: typography.fontSize.xl,
    color: colors.black,
    fontWeight: typography.fontWeight.bold,
  },
});
