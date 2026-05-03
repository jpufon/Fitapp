// DEV ONLY — REMOVE BEFORE PRODUCTION BUILD

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { RootStackParamList } from '../App';

const SCREENS: Array<{ label: string; route: keyof RootStackParamList; params?: any }> = [
  { label: 'Auth (welcome)',              route: 'Auth' },
  { label: 'OnboardingFlow',               route: 'OnboardingFlow' },
  { label: 'Home (MainTabs)',              route: 'MainTabs' },
  { label: 'ActiveWorkout',                route: 'ActiveWorkout', params: { workout: {} as any } },
  { label: 'WorkoutComplete',              route: 'WorkoutComplete' },
  { label: 'NutritionLog (protein)',       route: 'NutritionLog' },
  { label: 'Coach',                        route: 'Coach' },
  { label: 'WaliRun (run tab)',            route: 'WaliRun' },
  { label: 'Settings',                     route: 'Settings' },
  { label: 'Arena (feed) — via MainTabs',  route: 'MainTabs' },
  { label: 'Friends',                      route: 'Friends' },
  { label: 'Badges',                       route: 'Badges' },
  { label: 'TreeDetail',                   route: 'TreeDetail' },
];

export default function DevScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dev Screen Selector</Text>
        <Text style={styles.subtitle}>DEV ONLY — tap a row to open that screen</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SCREENS.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(s.route as any, s.params)}
          >
            <Text style={styles.rowText}>{s.label}</Text>
            <ChevronRight color={colors.mutedForeground} size={16} strokeWidth={1.75} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 48,
  },
  rowText: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
    fontWeight: typography.fontWeight.semibold,
  },
});
