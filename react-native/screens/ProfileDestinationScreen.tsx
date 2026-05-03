import { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { spacing, typography } from '../theme';
import type { SurfaceTokens } from '../theme/surfaceTheme';
import { useWalifitTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../App';

type RouteName =
  | 'WaliAI'
  | 'Analytics'
  | 'Notifications'
  | 'PrivacyLegal';

type Props = NativeStackScreenProps<RootStackParamList, RouteName>;

const TITLE_MAP: Record<RouteName, string> = {
  WaliAI: 'Chat with Wali AI',
  Analytics: 'Progress & Analytics',
  Notifications: 'Notifications',
  PrivacyLegal: 'Privacy & Legal',
};

export default function ProfileDestinationScreen({ navigation, route }: Props) {
  const title = TITLE_MAP[route.name];
  const { surfaces } = useWalifitTheme();
  const styles = useMemo(() => createStyles(surfaces), [surfaces]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color={surfaces.foreground} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={styles.copy}>{title} screen coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(s: SurfaceTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: s.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: s.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: s.foreground,
    },
    headerSpacer: { width: 44, height: 44 },
    body: {
      padding: spacing.lg,
    },
    copy: {
      fontSize: typography.fontSize.base,
      color: s.mutedForeground,
    },
  });
}
