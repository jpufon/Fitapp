import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, Flower } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface VitalityTreeProps {
  score: number;
  todayScore: {
    hydration: number;
    protein: number;
    steps: number;
  };
}

export default function VitalityTree({ score, todayScore }: VitalityTreeProps) {
  const getGrowthState = (score: number) => {
    if (score < 20) return { stage: 'Wilted',        color: colors.earthBrown,    glow: colors.earthBrown,   Icon: Leaf,   filled: false };
    if (score < 40) return { stage: 'Recovering',    color: colors.earthAmber,    glow: colors.energyGlow,   Icon: Leaf,   filled: false };
    if (score < 60) return { stage: 'Sprouting',     color: colors.earthSage,     glow: colors.earthSage,    Icon: Leaf,   filled: true  };
    if (score < 80) return { stage: 'Growing',       color: colors.vitalityLight, glow: colors.primary,      Icon: Leaf,   filled: true  };
    return           { stage: 'Full Vitality', color: colors.primary,       glow: colors.vitalityDark,  Icon: Flower, filled: true  };
  };

  const growthState = getGrowthState(score);
  const GrowthIcon = growthState.Icon;

  return (
    <View style={styles.container}>
      {/* Glow Effect */}
      <LinearGradient
        colors={[growthState.glow + '40', 'transparent']}
        style={styles.glowBackground}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Card */}
      <LinearGradient
        colors={[colors.card + 'CC', colors.card + '80']}
        style={styles.card}
      >
        {/* Tree Icon */}
        <View style={styles.treeIconContainer}>
          <View style={[styles.glowRing, { backgroundColor: growthState.glow + '20' }]} />
          <View style={[styles.iconBackground, { backgroundColor: growthState.color + '1A' }]}>
            <GrowthIcon
              size={80}
              color={growthState.color}
              strokeWidth={1.75}
              fill={growthState.filled ? growthState.color : 'none'}
            />
          </View>
        </View>

        {/* Growth State Label */}
        <Text style={[styles.stageText, { color: growthState.color }]}>
          {growthState.stage}
        </Text>
        <Text style={styles.subtitleText}>VITALITY STATUS</Text>

        {/* Score Ring */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreRing, { borderColor: colors.muted + '33' }]}>
            <View style={[styles.scoreProgress, {
              borderColor: growthState.color,
              transform: [{ rotate: `${(score / 100) * 360}deg` }],
            }]} />
          </View>
          <View style={styles.scoreContent}>
            <Text style={[styles.scoreValue, { color: growthState.color }]}>{score}</Text>
            <Text style={styles.scorePercent}>%</Text>
          </View>
        </View>

        {/* Daily Pillars */}
        <View style={styles.pillarsContainer}>
          <PillarStat
            icon="water"
            label="Water"
            value={todayScore.hydration}
            weight="30%"
            color={colors.blue}
          />
          <PillarStat
            icon="restaurant"
            label="Protein"
            value={todayScore.protein}
            weight="30%"
            color={colors.energy}
          />
          <PillarStat
            icon="walk"
            label="Steps"
            value={todayScore.steps}
            weight="40%"
            color={growthState.color}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

function PillarStat({ icon, label, value, weight, color }: any) {
  return (
    <View style={[styles.pillar, { borderColor: color + '30' }]}>
      <Text style={styles.pillarEmoji}>{icon === 'water' ? '💧' : icon === 'restaurant' ? '🥩' : '👟'}</Text>
      <Text style={styles.pillarLabel}>{label}</Text>
      <Text style={[styles.pillarValue, { color }]}>{value}%</Text>
      <Text style={styles.pillarWeight}>{weight}</Text>
      <View style={styles.pillarBar}>
        <View style={[styles.pillarProgress, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xxl,
  },
  card: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border + '80',
    alignItems: 'center',
  },
  treeIconContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  glowRing: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 80,
  },
  iconBackground: {
    width: 144,
    height: 144,
    borderRadius: borderRadius.xxl + 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitleText: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 1,
    marginBottom: spacing.xl,
  },
  scoreContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  scoreRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 10,
  },
  scoreProgress: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 64,
    borderWidth: 10,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
  },
  scoreContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  scoreValue: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
  },
  scorePercent: {
    fontSize: typography.fontSize.xl,
    color: colors.mutedForeground,
  },
  pillarsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md - 2,
  },
  pillar: {
    flex: 1,
    backgroundColor: colors.secondary + '80',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  pillarEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  pillarLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs + 2,
  },
  pillarValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
    marginBottom: 2,
  },
  pillarWeight: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground + '99',
    marginBottom: spacing.sm,
  },
  pillarBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.muted + '30',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  pillarProgress: {
    height: '100%',
    borderRadius: 2,
  },
});
