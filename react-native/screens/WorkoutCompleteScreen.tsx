import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import type { SurfaceTokens } from '../theme/surfaceTheme';
import { useWalifitTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutComplete'>;

export default function WorkoutCompleteScreen({ navigation }: Props) {
  const { surfaces } = useWalifitTheme();
  const styles = useMemo(() => createStyles(surfaces), [surfaces]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Workout Complete — coming soon</Text>
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function createStyles(s: SurfaceTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: s.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.xl,
    },
    title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: s.foreground,
      textAlign: 'center',
    },
    doneBtn: {
      minHeight: 48,
      paddingHorizontal: spacing.xl,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneBtnText: {
      fontSize: typography.fontSize.base,
      color: colors.primaryFg,
      fontWeight: typography.fontWeight.bold,
    },
  });
}
