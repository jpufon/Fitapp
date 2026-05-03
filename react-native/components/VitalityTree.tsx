import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Droplets, Footprints, Utensils } from 'lucide-react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { colors, pillarColors, spacing, borderRadius, typography, componentSizes } from '../theme';

const treeSizes = componentSizes.vitalityTree;

export type VitalityTreeStage =
  | 'wilted'
  | 'recovering'
  | 'sprout'
  | 'growing'
  | 'thriving'
  | 'full_vitality';

interface VitalityTreeProps {
  score: number;
  // Rolling 7-day stage from backend (WF-020). Drives the visual state.
  // Optional so the component still renders standalone in tests / dev.
  treeStage?: VitalityTreeStage;
  todayScore: {
    hydration: number;
    protein: number;
    steps: number;
  };
}

type GrowthStage = {
  stage: string;
  detail: string;
  color: string;
  glow: string;
  variant: 'sprout' | 'sapling' | 'young' | 'mature' | 'full' | 'wilted';
  canopyScale: number;
  leafOpacity: number;
  accentOpacity: number;
  branchOpacity: number;
  groundOpacity: number;
  isHealthy: boolean;
};

export default function VitalityTree({ score, treeStage, todayScore }: VitalityTreeProps) {
  const growthState = useMemo(
    () => (treeStage ? getGrowthStateFromStage(treeStage) : getGrowthStateFromScore(score)),
    [score, treeStage]
  );
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!growthState.isHealthy) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [growthState.isHealthy, pulse]);

  const animatedGlowStyle = useMemo(
    () => ({
      opacity: pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.58, 0.88],
      }),
      transform: [
        {
          scale: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.035],
          }),
        },
      ],
    }),
    [pulse]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[growthState.glow + '33', 'transparent']}
        style={styles.glowBackground}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <LinearGradient
        colors={[colors.card + 'F2', colors.popover + 'E6', colors.backgroundAlt + 'F2']}
        style={styles.card}
      >
        <View style={styles.heroHeader}>
          <View style={styles.stageBlock}>
            <Text style={styles.kicker}>VITALITY TREE</Text>
            <Text style={[styles.stageText, { color: growthState.color }]}>{growthState.stage}</Text>
            <Text style={styles.detailText}>{growthState.detail}</Text>
          </View>

          <View style={[styles.scoreBadge, { borderColor: growthState.color + '55' }]}>
            <Text style={[styles.scoreValue, { color: growthState.color }]}>{score}</Text>
            <Text style={styles.scoreLabel}>score</Text>
          </View>
        </View>

        <View style={styles.artFrame}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.animatedGlow,
              { backgroundColor: growthState.glow + '22' },
              growthState.isHealthy ? animatedGlowStyle : styles.restingGlow,
            ]}
          />
          <VitalityTreeArt state={growthState} />
        </View>

        <View style={styles.pillarsContainer}>
          <PillarStat
            icon={Droplets}
            label="Water"
            value={todayScore.hydration}
            weight="30%"
            color={pillarColors.hydration}
          />
          <PillarStat
            icon={Utensils}
            label="Protein"
            value={todayScore.protein}
            weight="30%"
            color={pillarColors.protein}
          />
          <PillarStat
            icon={Footprints}
            label="Steps"
            value={todayScore.steps}
            weight="40%"
            color={pillarColors.steps}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

// Backend stage → visual state. This is authoritative once a HomeSnapshot is loaded.
function getGrowthStateFromStage(stage: VitalityTreeStage): GrowthStage {
  switch (stage) {
    case 'wilted':
      return {
        stage: 'Wilted',
        detail: "You've fallen off — log a goal to recover.",
        color: colors.destructive,
        glow: colors.destructive,
        variant: 'wilted',
        canopyScale: 0.86,
        leafOpacity: 0.36,
        accentOpacity: 0.08,
        branchOpacity: 0.9,
        groundOpacity: 0.25,
        isHealthy: false,
      };
    case 'recovering':
      return {
        stage: 'Recovering',
        detail: 'First habits logged',
        color: colors.earthAmber,
        glow: colors.energyGlow,
        variant: 'sapling',
        canopyScale: 0.48,
        leafOpacity: 0.58,
        accentOpacity: 0.2,
        branchOpacity: 0.86,
        groundOpacity: 0.35,
        isHealthy: false,
      };
    case 'sprout':
      return {
        stage: 'Sprout',
        detail: 'Small but growing',
        color: colors.earthSage,
        glow: colors.earthSage,
        variant: 'sprout',
        canopyScale: 0.4,
        leafOpacity: 0.78,
        accentOpacity: 0.22,
        branchOpacity: 0.78,
        groundOpacity: 0.44,
        isHealthy: false,
      };
    case 'growing':
      return {
        stage: 'Growing',
        detail: 'Solid week in progress',
        color: colors.vitalityLight,
        glow: colors.primary,
        variant: 'young',
        canopyScale: 0.78,
        leafOpacity: 0.78,
        accentOpacity: 0.48,
        branchOpacity: 1,
        groundOpacity: 0.66,
        isHealthy: true,
      };
    case 'thriving':
      return {
        stage: 'Thriving',
        detail: 'Most goals on track',
        color: colors.primary,
        glow: colors.primary,
        variant: 'mature',
        canopyScale: 0.9,
        leafOpacity: 0.86,
        accentOpacity: 0.64,
        branchOpacity: 1,
        groundOpacity: 0.78,
        isHealthy: true,
      };
    case 'full_vitality':
      return {
        stage: 'Full Vitality',
        detail: 'Daily goals reached',
        color: colors.primary,
        glow: colors.vitalityDark,
        variant: 'full',
        canopyScale: 1,
        leafOpacity: 1,
        accentOpacity: 0.8,
        branchOpacity: 1,
        groundOpacity: 0.9,
        isHealthy: true,
      };
  }
}

// Standalone fallback for tests / when a backend stage isn't available.
// Mirrors backend stateFromScore thresholds (CLAUDE.md spec).
function getGrowthStateFromScore(score: number): GrowthStage {
  if (score <= 15) return getGrowthStateFromStage('wilted');
  if (score <= 35) return getGrowthStateFromStage('recovering');
  if (score <= 55) return getGrowthStateFromStage('sprout');
  if (score <= 75) return getGrowthStateFromStage('growing');
  if (score <= 90) return getGrowthStateFromStage('thriving');
  return getGrowthStateFromStage('full_vitality');
}

function VitalityTreeArt({ state }: { state: GrowthStage }) {
  const trunkTop = state.variant === 'sapling' ? 108 : state.variant === 'young' ? 82 : 48;
  const trunkBaseWidth = state.variant === 'sapling' ? 30 : state.variant === 'young' ? 42 : 56;
  const trunkTopWidth = state.variant === 'sapling' ? 10 : state.variant === 'young' ? 18 : 24;
  const canopyOpacity = state.variant === 'wilted' ? 0.2 : state.leafOpacity;

  if (state.variant === 'sprout') {
    return (
      <Svg width="100%" height="100%" viewBox="0 0 320 260" accessibilityRole="image">
        <Defs>
          <RadialGradient id="sproutAura" cx="50%" cy="70%" rx="42%" ry="26%">
            <Stop offset="0%" stopColor={state.color} stopOpacity={0.22} />
            <Stop offset="100%" stopColor={state.glow} stopOpacity={0} />
          </RadialGradient>
          <SvgLinearGradient id="sproutLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primaryLight} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={colors.growth} stopOpacity={0.92} />
          </SvgLinearGradient>
          <SvgLinearGradient id="soilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.earth.amber} stopOpacity={0.62} />
            <Stop offset="100%" stopColor={colors.earth.brown} stopOpacity={0.9} />
          </SvgLinearGradient>
        </Defs>

        <Circle cx={160} cy={194} r={94} fill="url(#sproutAura)" />
        <Ellipse cx={160} cy={232} rx={52} ry={10} fill={colors.black} opacity={0.22} />
        <Path
          d="M108 229 C126 214 196 214 213 230 C190 240 132 239 108 229 Z"
          fill="url(#soilGradient)"
          opacity={0.92}
        />
        <Path d="M154 221 C155 196 158 174 164 153" stroke={colors.earth.brown} strokeWidth={8} strokeLinecap="round" fill="none" />
        <Path d="M163 165 C143 142 116 139 97 156 C120 169 144 170 163 165 Z" fill="url(#sproutLeaf)" />
        <Path d="M161 158 C181 132 211 125 232 139 C213 158 188 168 161 158 Z" fill="url(#sproutLeaf)" opacity={0.96} />
        <Path d="M158 188 C143 171 125 169 110 181 C125 190 143 192 158 188 Z" fill={colors.growth} opacity={0.82} />
      </Svg>
    );
  }

  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 260" accessibilityRole="image">
      <Defs>
        <RadialGradient id="treeAura" cx="50%" cy="44%" rx="48%" ry="48%">
          <Stop offset="0%" stopColor={state.color} stopOpacity={state.isHealthy ? 0.24 : 0.1} />
          <Stop offset="70%" stopColor={state.glow} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={state.glow} stopOpacity={0} />
        </RadialGradient>
        <SvgLinearGradient id="trunkGradient" x1="10%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor={colors.earth.brown} stopOpacity={0.92} />
          <Stop offset="48%" stopColor={colors.energy} stopOpacity={state.variant === 'wilted' ? 0.16 : 0.44} />
          <Stop offset="100%" stopColor={colors.earth.brown} stopOpacity={0.96} />
        </SvgLinearGradient>
        <SvgLinearGradient id="leafGradient" x1="18%" y1="8%" x2="80%" y2="92%">
          <Stop offset="0%" stopColor={state.variant === 'wilted' ? colors.earth.brown : colors.primaryLight} stopOpacity={0.94} />
          <Stop offset="52%" stopColor={state.variant === 'wilted' ? colors.earth.amber : state.color} stopOpacity={0.9} />
          <Stop offset="100%" stopColor={state.variant === 'wilted' ? colors.earth.brown : colors.growth} stopOpacity={0.86} />
        </SvgLinearGradient>
      </Defs>

      <Circle cx={160} cy={124} r={118} fill="url(#treeAura)" />
      <Ellipse cx={160} cy={239} rx={state.variant === 'sapling' ? 70 : 112} ry={12} fill={colors.black} opacity={0.22} />
      <Ellipse cx={160} cy={240} rx={state.variant === 'sapling' ? 48 : 78} ry={5} fill={state.color} opacity={state.groundOpacity * 0.24} />

      <G opacity={state.groundOpacity}>
        <Path
          d="M156 238 C130 231 112 226 84 230 M164 238 C190 231 212 227 238 231"
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          opacity={0.48}
        />
        <Path
          d="M151 236 C132 218 112 211 91 213 M169 236 C188 217 210 211 232 214"
          stroke={colors.earth.sage}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          opacity={0.42}
        />
      </G>

      <G opacity={state.branchOpacity}>
        <Path
          d={`M${160 - trunkBaseWidth / 2} 235 C${151 - trunkBaseWidth / 6} 196 ${151 - trunkTopWidth / 4} 145 ${160 - trunkTopWidth / 2} ${trunkTop} C${167 + trunkTopWidth / 4} 139 ${174 + trunkBaseWidth / 6} 196 ${160 + trunkBaseWidth / 2} 235 Z`}
          fill="url(#trunkGradient)"
          opacity={0.94}
        />
        <Path
          d={state.variant === 'sapling' ? 'M157 166 C139 148 124 141 104 140' : 'M157 176 C128 151 101 142 73 145'}
          stroke="url(#trunkGradient)"
          strokeWidth={state.variant === 'sapling' ? 6 : 9}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={state.variant === 'sapling' ? 'M164 155 C184 135 202 128 224 129' : 'M164 161 C193 135 222 123 255 128'}
          stroke="url(#trunkGradient)"
          strokeWidth={state.variant === 'sapling' ? 6 : 8}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={state.variant === 'sapling' ? 'M158 134 C147 119 136 110 120 104' : 'M158 139 C141 115 123 98 98 88'}
          stroke="url(#trunkGradient)"
          strokeWidth={state.variant === 'sapling' ? 4 : 6}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={state.variant === 'sapling' ? 'M164 129 C177 112 190 103 206 99' : 'M164 131 C185 104 208 89 237 82'}
          stroke="url(#trunkGradient)"
          strokeWidth={state.variant === 'sapling' ? 4 : 6}
          strokeLinecap="round"
          fill="none"
        />
        {state.variant !== 'sapling' ? (
          <Path
            d={state.variant === 'wilted' ? 'M162 112 C170 95 181 79 195 66' : 'M160 113 C160 92 166 73 180 55'}
            stroke="url(#trunkGradient)"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
        <Path
          d="M160 132 C157 169 160 201 166 229"
          stroke={colors.energy}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          opacity={state.variant === 'wilted' ? 0.14 : 0.46}
        />
      </G>

      <G opacity={canopyOpacity}>
        {state.variant !== 'wilted' && state.variant !== 'sapling' ? (
          <G opacity={state.variant === 'full' ? 0.86 : 0.58}>
            <Ellipse cx={150} cy={93} rx={71 * state.canopyScale} ry={45 * state.canopyScale} fill="url(#leafGradient)" opacity={0.44} />
            <Ellipse cx={207} cy={108} rx={63 * state.canopyScale} ry={42 * state.canopyScale} fill="url(#leafGradient)" opacity={0.38} />
            <Ellipse cx={112} cy={124} rx={52 * state.canopyScale} ry={34 * state.canopyScale} fill="url(#leafGradient)" opacity={0.32} />
          </G>
        ) : null}

        <Leaf x={111} y={138} rotate={-18} scale={state.variant === 'sapling' ? 1 : 1.25} />
        <Leaf x={134} y={118} rotate={24} scale={state.variant === 'sapling' ? 0.92 : 1.1} />
        <Leaf x={188} y={118} rotate={-24} scale={state.variant === 'sapling' ? 0.92 : 1.14} />
        <Leaf x={214} y={138} rotate={16} scale={state.variant === 'sapling' ? 1 : 1.18} />
        <Leaf x={156} y={88} rotate={-8} scale={state.variant === 'sapling' ? 0.8 : 1.15} />
        <Leaf x={180} y={79} rotate={18} scale={state.variant === 'sapling' ? 0.72 : 1.05} />
        <Leaf x={92} y={112} rotate={-28} scale={state.variant === 'sapling' ? 0.72 : 1.02} />
        <Leaf x={234} y={106} rotate={26} scale={state.variant === 'sapling' ? 0.72 : 1.02} />
        {state.variant !== 'sapling' ? (
          <>
            <Leaf x={73} y={145} rotate={-34} scale={0.92} />
            <Leaf x={113} y={84} rotate={-18} scale={0.96} />
            <Leaf x={205} y={73} rotate={16} scale={0.98} />
            <Leaf x={247} y={137} rotate={30} scale={0.9} />
            <Leaf x={139} y={151} rotate={16} scale={1.04} />
            <Leaf x={194} y={151} rotate={-16} scale={1.02} />
          </>
        ) : null}
        {state.variant === 'full' ? (
          <>
            <Leaf x={86} y={93} rotate={-24} scale={0.94} />
            <Leaf x={135} y={57} rotate={-10} scale={0.98} />
            <Leaf x={218} y={56} rotate={18} scale={0.96} />
            <Leaf x={260} y={95} rotate={26} scale={0.86} />
            <Leaf x={169} y={137} rotate={0} scale={1.2} />
          </>
        ) : null}
      </G>

      <G opacity={state.accentOpacity}>
        <Circle cx={131} cy={74} r={3.2} fill={colors.hydration} />
        <Circle cx={194} cy={66} r={3.2} fill={colors.primaryLight} />
        <Circle cx={229} cy={114} r={3} fill={colors.energy} />
        <Circle cx={119} cy={135} r={2.8} fill={colors.growth} />
        <Circle cx={175} cy={143} r={3.4} fill={colors.hydration} />
      </G>

      {state.stage === 'Wilted' ? (
        <G opacity={0.68}>
          <Path d="M97 116 C88 130 83 145 86 160" stroke={colors.earth.brown} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M222 84 C241 101 252 123 251 146" stroke={colors.earth.brown} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Leaf x={107} y={164} rotate={102} scale={0.62} />
          <Leaf x={224} y={171} rotate={70} scale={0.58} />
          <Leaf x={252} y={198} rotate={78} scale={0.52} />
        </G>
      ) : null}
    </Svg>
  );
}

function Leaf({ x, y, rotate, scale = 1 }: { x: number; y: number; rotate: number; scale?: number }) {
  return (
    <Path
      d="M0 0 C11 -13 28 -13 38 0 C27 12 10 13 0 0 Z"
      fill="url(#leafGradient)"
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
    />
  );
}

function PillarStat({
  icon: Icon,
  label,
  value,
  weight,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  weight: string;
  color: string;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.pillar, { borderColor: color + '30' }]}>
      <View style={[styles.pillarIcon, { backgroundColor: color + '1A' }]}>
        <Icon color={color} size={18} strokeWidth={1.75} />
      </View>
      <View style={styles.pillarCopy}>
        <Text style={styles.pillarLabel}>{label}</Text>
        <Text style={[styles.pillarValue, { color }]}>{boundedValue}%</Text>
      </View>
      <Text style={styles.pillarWeight}>{weight}</Text>
      <View style={styles.pillarBar}>
        <View style={[styles.pillarProgress, { width: `${boundedValue}%`, backgroundColor: color }]} />
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
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border + '80',
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  stageBlock: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: typography.fontSize.xs,
    color: colors.creamMuted,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  stageText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: 30,
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.greySoft,
    lineHeight: 20,
  },
  scoreBadge: {
    minWidth: treeSizes.scoreBadgeMinWidth,
    minHeight: treeSizes.scoreBadgeMinHeight,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    backgroundColor: colors.backgroundAlt + 'AA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  scoreValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
  },
  scoreLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.creamMuted,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  artFrame: {
    height: treeSizes.artFrameHeight,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  animatedGlow: {
    position: 'absolute',
    width: treeSizes.glow,
    height: treeSizes.glow,
    borderRadius: borderRadius.full,
  },
  restingGlow: {
    opacity: 0.45,
  },
  pillarsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pillar: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.secondary + '66',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
  },
  pillarIcon: {
    width: treeSizes.pillarIcon,
    height: treeSizes.pillarIcon,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pillarCopy: {
    minHeight: treeSizes.pillarCopyMinHeight,
  },
  pillarLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.greySoft,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pillarValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.mono,
  },
  pillarWeight: {
    fontSize: typography.fontSize.xs,
    color: colors.greyDim,
    marginTop: spacing.xs,
  },
  pillarBar: {
    width: '100%',
    height: treeSizes.pillarBarHeight,
    backgroundColor: colors.muted + '40',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  pillarProgress: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
