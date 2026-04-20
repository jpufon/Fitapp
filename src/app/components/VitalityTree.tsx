import { motion } from 'motion/react';
import { Sprout, TreeDeciduous, Trees } from 'lucide-react';

interface VitalityTreeProps {
  score: number;
  todayScore: {
    hydration: number;
    protein: number;
    workout: number;
  };
}

export function VitalityTree({ score, todayScore }: VitalityTreeProps) {
  // Determine growth state based on score
  const getGrowthState = (score: number) => {
    if (score < 20) return { stage: 'Wilted', color: '#92400e', glow: '#92400e', icon: Sprout, opacity: 0.4 };
    if (score < 40) return { stage: 'Recovering', color: '#f59e0b', glow: '#f59e0b', icon: Sprout, opacity: 0.6 };
    if (score < 60) return { stage: 'Sprouting', color: '#84cc16', glow: '#84cc16', icon: TreeDeciduous, opacity: 0.7 };
    if (score < 80) return { stage: 'Growing', color: '#34d399', glow: '#10b981', icon: TreeDeciduous, opacity: 0.85 };
    return { stage: 'Full Vitality', color: '#10b981', glow: '#10b981', icon: Trees, opacity: 1 };
  };

  const growthState = getGrowthState(score);
  const TreeIcon = growthState.icon;

  return (
    <div className="relative">
      {/* Dramatic glow effect */}
      <motion.div
        className="absolute inset-0 blur-[100px] opacity-30"
        animate={{
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          background: `radial-gradient(ellipse at center, ${growthState.glow}40 0%, transparent 65%)`,
        }}
      />

      {/* Tree container with glass morphism */}
      <div className="relative bg-card rounded-3xl p-8 border border-border/50 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear'
          }}
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${growthState.color}40 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, ${growthState.glow}30 0%, transparent 50%)`,
            backgroundSize: '200% 200%',
          }}
        />

        <div className="relative flex flex-col items-center">
          {/* Tree visualization with breathing animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
            className="mb-6 relative"
          >
            {/* Glow ring behind tree */}
            <motion.div
              className="absolute inset-0 blur-2xl rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [growthState.opacity * 0.3, growthState.opacity * 0.5, growthState.opacity * 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{
                background: `radial-gradient(circle, ${growthState.glow} 0%, transparent 70%)`,
              }}
            />

            <div className="relative">
              {/* Animated tree icon with breathing */}
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <TreeIcon
                  className="w-36 h-36 drop-shadow-2xl"
                  style={{
                    color: growthState.color,
                    filter: `drop-shadow(0 0 20px ${growthState.glow}80)`,
                  }}
                  strokeWidth={1.5}
                />
              </motion.div>

              {/* Energy particles around tree */}
              {score > 40 && (
                <>
                  {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = 80;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    return (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: growthState.color,
                          boxShadow: `0 0 10px ${growthState.glow}`,
                          left: '50%',
                          top: '50%',
                        }}
                        animate={{
                          x: [0, x, 0],
                          y: [0, y, 0],
                          opacity: [0, growthState.opacity, 0],
                          scale: [0, 1.5, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.375,
                          ease: 'easeInOut'
                        }}
                      />
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>

          {/* Growth state label */}
          <div className="text-center mb-6">
            <motion.h3
              className="text-3xl font-bold mb-2"
              style={{
                color: growthState.color,
                textShadow: `0 0 30px ${growthState.glow}40`,
              }}
              animate={{
                textShadow: [
                  `0 0 20px ${growthState.glow}30`,
                  `0 0 40px ${growthState.glow}50`,
                  `0 0 20px ${growthState.glow}30`,
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {growthState.stage}
            </motion.h3>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Vitality Status</p>
          </div>

          {/* Score ring with premium styling */}
          <div className="relative w-32 h-32 mb-8">
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-40"
              style={{ background: growthState.glow }}
            />

            <svg className="transform -rotate-90 w-32 h-32 relative">
              {/* Background ring */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-muted/20"
              />
              {/* Progress ring with gradient */}
              <defs>
                <linearGradient id="vitality-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={growthState.color} />
                  <stop offset="100%" stopColor={growthState.glow} />
                </linearGradient>
              </defs>
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#vitality-gradient)"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 352 }}
                animate={{ strokeDashoffset: 352 - (352 * score) / 100 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{
                  strokeDasharray: 352,
                  filter: `drop-shadow(0 0 8px ${growthState.glow})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl font-bold font-mono" style={{ color: growthState.color }}>
                  {score}
                </span>
                <span className="text-xl text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Daily pillars with enhanced styling */}
          <div className="w-full grid grid-cols-3 gap-3">
            <PillarStat
              label="Water"
              value={todayScore.hydration}
              weight="30%"
              color="#60a5fa"
              icon="💧"
            />
            <PillarStat
              label="Protein"
              value={todayScore.protein}
              weight="30%"
              color="#fbbf24"
              icon="🥩"
            />
            <PillarStat
              label="Activity"
              value={todayScore.workout}
              weight="40%"
              color={growthState.color}
              icon="⚡"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PillarStatProps {
  label: string;
  value: number;
  weight: string;
  color: string;
  icon: string;
}

function PillarStat({ label, value, weight, color, icon }: PillarStatProps) {
  return (
    <motion.div
      className="bg-secondary/50 rounded-xl p-4 text-center border border-border/30 backdrop-blur-sm"
      whileHover={{
        scale: 1.05,
        borderColor: color + '40',
      }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold font-mono mb-1" style={{ color }}>{value}%</div>
      <div className="text-xs text-muted-foreground opacity-60">{weight}</div>

      {/* Mini progress bar */}
      <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden mt-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
