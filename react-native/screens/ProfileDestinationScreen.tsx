import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.foreground} strokeWidth={1.75} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
  },
  headerSpacer: { width: 44, height: 44 },
  body: {
    padding: spacing.lg,
  },
  copy: {
    fontSize: typography.fontSize.base,
    color: colors.mutedForeground,
  },
});
