import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../theme';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWorkout'>;

export default function ActiveWorkoutScreen({ navigation, route }: Props) {
  const { workout } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>ACTIVE WORKOUT</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>{workout.name}</Text>
          <Text style={styles.subtitle}>{workout.type}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="barbell-outline" size={16} color={colors.primary} />
              <Text style={styles.metaText}>{workout.exerciseCount} exercises</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={16} color={colors.energy} />
              <Text style={styles.metaText}>{workout.durationMinutes} min</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Workout session ready</Text>
          <Text style={styles.statusCopy}>
            This modal is wired and receives the selected workout from the Train
            screen. The full live logging flow can be implemented on top of this
            route.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPill: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
    fontWeight: typography.fontWeight.medium,
  },
  statusCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
  },
  statusCopy: {
    fontSize: typography.fontSize.base,
    color: colors.mutedForeground,
    lineHeight: 22,
  },
});
