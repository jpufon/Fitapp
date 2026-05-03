import React, { useMemo } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Sparkles, TrendingUp, Bell, User, Shield,
  CloudOff, ChevronRight, LogOut, AlertCircle, Home as HomeIcon,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../theme';
import type { RootStackParamList } from '../App';
import { useUser } from '../hooks/useUser';
import { useProfileStats } from '../hooks/useProfileData';
import { hasSupabaseConfig, supabase } from '../utils/supabase';

type ScreenState = 'loading' | 'success' | 'error';

const SETTINGS_ITEMS: Array<{
  id: keyof Pick<
    RootStackParamList,
    'WaliAI' | 'Analytics' | 'Notifications' | 'Settings' | 'PrivacyLegal'
  >;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}> = [
  {
    id: 'WaliAI',
    icon: Sparkles,
    label: 'Chat with Wali AI',
    description: 'Get personalised coaching',
    color: colors.purple,
  },
  {
    id: 'Analytics',
    icon: TrendingUp,
    label: 'Progress & Analytics',
    description: 'View your stats and trends',
    color: colors.blue,
  },
  {
    id: 'Notifications',
    icon: Bell,
    label: 'Notifications',
    description: 'Manage preferences',
    color: colors.energy,
  },
  {
    id: 'Settings',
    icon: User,
    label: 'Account Settings',
    description: 'Profile, units, targets',
    color: colors.mutedForeground,
  },
  {
    id: 'PrivacyLegal',
    icon: Shield,
    label: 'Privacy & Legal',
    description: 'Terms, privacy, AI disclosure',
    color: colors.mutedForeground,
  },
];

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const userQuery = useUser();
  const statsQuery = useProfileStats();

  const state = useMemo<ScreenState>(() => {
    if (userQuery.isLoading || statsQuery.isLoading) {
      return 'loading';
    }
    if (userQuery.error || (statsQuery.isError && !statsQuery.data)) {
      return 'error';
    }
    return 'success';
  }, [statsQuery.data, statsQuery.isError, statsQuery.isLoading, userQuery.error, userQuery.isLoading]);

  const displayName = useMemo(() => {
    const user = userQuery.user;
    if (!user) {
      return 'Athlete';
    }

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const name = metadata?.displayName ?? metadata?.full_name ?? metadata?.name;
    return typeof name === 'string' && name.trim().length > 0
      ? name
      : user.email?.split('@')[0] ?? 'Athlete';
  }, [userQuery.user]);

  const username = useMemo(() => {
    const user = userQuery.user;
    if (!user) {
      return '@athlete';
    }

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const value = metadata?.username;
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.startsWith('@') ? value : `@${value}`;
    }

    return user.email ? `@${user.email.split('@')[0]}` : '@athlete';
  }, [userQuery.user]);

  const memberSince = useMemo(() => {
    const createdAt = userQuery.user?.created_at;
    if (!createdAt) {
      return 'March 2026';
    }

    const date = new Date(createdAt);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [userQuery.user]);

  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase() || 'AT';
  }, [displayName]);

  const stats = statsQuery.data ?? [];

  const handleLogout = async () => {
    try {
      if (hasSupabaseConfig && supabase) {
        await supabase.auth.signOut();
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      Alert.alert(
        'Unable to log out',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      statsQuery.refetch(),
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statsQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.settingsBtn}
              accessibilityLabel="Go Home"
              onPress={() => navigation.navigate('MainTabs')}
            >
              <HomeIcon color={colors.primary} size={20} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>
        </View>

        {userQuery.isOfflineFallback || statsQuery.isOfflineFallback ? (
          <View style={styles.inlineBanner}>
            <CloudOff size={16} color={colors.energy} strokeWidth={1.75} />
            <Text style={styles.inlineBannerText}>Showing cached profile data while offline.</Text>
          </View>
        ) : null}

        {state === 'loading' ? <ProfileSkeleton /> : null}

        {state === 'error' ? (
          <FeedbackCard
            icon={AlertCircle}
            iconColor={colors.destructive}
            title="Couldn’t load profile"
            message={
              userQuery.error?.message ??
              (statsQuery.error instanceof Error ? statsQuery.error.message : 'Please try again.')
            }
            actionLabel="Retry"
            onPress={() => {
              void handleRefresh();
            }}
          />
        ) : null}

        {state === 'success' ? (
          <>
            <View style={[styles.userCard, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }]}>
              <View style={styles.userRow}>
                <View style={[styles.avatarLg, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{displayName}</Text>
                  <Text style={styles.userHandle}>{username}</Text>
                  <Text style={styles.userMember}>Member since {memberSince}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                {stats.map((stat) => (
                  <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card + 'CC' }]}>
                    <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.settingsSection}>
              {SETTINGS_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.settingsRow,
                      index < SETTINGS_ITEMS.length - 1 && styles.settingsRowBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate(item.id)}
                  >
                    <View style={[styles.settingsIcon, { backgroundColor: item.color + '18' }]}>
                      <Icon color={item.color} size={20} strokeWidth={1.75} />
                    </View>
                    <View style={styles.settingsText}>
                      <Text style={styles.settingsLabel}>{item.label}</Text>
                      <Text style={styles.settingsDesc}>{item.description}</Text>
                    </View>
                    <ChevronRight color={colors.mutedForeground} size={18} strokeWidth={1.75} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={[styles.settingsSection, styles.logoutBtn]} activeOpacity={0.7} onPress={handleLogout}>
              <View style={[styles.settingsIcon, { backgroundColor: colors.destructive + '18' }]}>
                <LogOut color={colors.destructive} size={20} strokeWidth={1.75} />
              </View>
              <View style={styles.settingsText}>
                <Text style={[styles.settingsLabel, { color: colors.destructive }]}>Log Out</Text>
                <Text style={styles.settingsDesc}>Sign out of your account</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>waliFit v1.0.0</Text>
              <Text style={styles.footerTagline}>Build the loop. Grow the tree. Compete with the world.</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function FeedbackCard({
  icon: Icon,
  iconColor,
  title,
  message,
  actionLabel,
  onPress,
}: {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.feedbackCard}>
      <Icon size={28} color={iconColor ?? colors.primary} strokeWidth={1.75} />
      <Text style={styles.feedbackTitle}>{title}</Text>
      <Text style={styles.feedbackMessage}>{message}</Text>
      {actionLabel && onPress ? (
        <TouchableOpacity onPress={onPress} style={styles.feedbackButton}>
          <Text style={styles.feedbackButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <View style={[styles.userCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.userRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.userInfo}>
            <View style={styles.skeletonLineLong} />
            <View style={styles.skeletonLineMedium} />
            <View style={styles.skeletonLineShort} />
          </View>
        </View>

        <View style={styles.statsRow}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.secondary }]}>
              <View style={styles.skeletonStatValue} />
              <View style={styles.skeletonStatLabel} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.skeletonSection} />
      <View style={styles.skeletonSectionShort} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.foreground },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineBanner: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.energy + '33',
    backgroundColor: colors.energy + '14',
  },
  inlineBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.energy,
    fontWeight: typography.fontWeight.medium,
  },
  userCard: { borderRadius: borderRadius.xl, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarLg: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.black },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.foreground },
  userHandle: { fontSize: typography.fontSize.sm, color: colors.mutedForeground },
  userMember: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', gap: 3 },
  statValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },
  statLabel: { fontSize: 10, color: colors.mutedForeground, textAlign: 'center', lineHeight: 13 },
  settingsSection: { backgroundColor: colors.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, minHeight: 48 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  settingsText: { flex: 1, gap: 2 },
  settingsLabel: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.foreground },
  settingsDesc: { fontSize: typography.fontSize.sm, color: colors.mutedForeground },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  footer: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.md },
  footerText: { fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  footerTagline: { fontSize: typography.fontSize.xs, color: colors.mutedForeground, textAlign: 'center' },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  feedbackTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.foreground,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  feedbackMessage: {
    fontSize: typography.fontSize.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
  },
  feedbackButton: {
    minHeight: 48,
    minWidth: 120,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  feedbackButtonText: { fontSize: typography.fontSize.base, color: colors.black, fontWeight: typography.fontWeight.bold },
  skeletonAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.secondary,
  },
  skeletonLineLong: {
    width: '70%',
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.secondary,
    marginBottom: spacing.xs,
  },
  skeletonLineMedium: {
    width: '50%',
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.secondary,
    marginBottom: spacing.xs,
  },
  skeletonLineShort: {
    width: '40%',
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  skeletonStatValue: {
    width: 28,
    height: 20,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  skeletonStatLabel: {
    width: '80%',
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  skeletonSection: {
    height: 300,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonSectionShort: {
    height: 88,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
