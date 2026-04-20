import { Droplet, Beef, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

interface DailyStatsProps {
  todayScore: {
    hydration: number;
    protein: number;
    workout: number;
  };
}

export function DailyStats({ todayScore }: DailyStatsProps) {
  const navigate = useNavigate();

  const stats = [
    {
      icon: Droplet,
      label: 'Hydration',
      value: '6/8',
      unit: 'glasses',
      progress: todayScore.hydration,
      color: '#60a5fa',
      glow: '#3b82f6',
      action: 'Log water',
      path: '/nutrition'
    },
    {
      icon: Beef,
      label: 'Protein',
      value: '105/150',
      unit: 'grams',
      progress: todayScore.protein,
      color: '#fbbf24',
      glow: '#f59e0b',
      action: 'Log meal',
      path: '/nutrition'
    },
    {
      icon: Zap,
      label: 'Activity',
      value: todayScore.workout === 100 ? 'Complete' : 'Pending',
      unit: todayScore.workout === 100 ? '' : 'for today',
      progress: todayScore.workout,
      color: '#10b981',
      glow: '#059669',
      action: todayScore.workout === 100 ? 'View details' : 'Start workout',
      path: todayScore.workout === 100 ? '/train/history' : '/train'
    }
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Today's Progress</h2>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{
              scale: 1.05,
              borderColor: stat.color + '60',
            }}
            whileTap={{ scale: 0.98 }}
            className="bg-card/50 rounded-2xl p-4 border border-border/50 backdrop-blur-xl transition-all text-left relative overflow-hidden group"
            onClick={() => navigate(stat.path)}
          >
            {/* Hover glow effect */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
              style={{ background: `radial-gradient(circle at center, ${stat.glow}, transparent)` }}
            />

            <div className="relative">
              {/* Icon with glow */}
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative"
                style={{
                  background: `${stat.color}15`,
                  border: `1px solid ${stat.color}30`,
                }}
                whileHover={{
                  boxShadow: `0 0 20px ${stat.glow}40`,
                }}
              >
                <stat.icon
                  className="w-6 h-6"
                  style={{
                    color: stat.color,
                    filter: `drop-shadow(0 0 4px ${stat.glow}80)`,
                  }}
                />
              </motion.div>

              {/* Label */}
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                {stat.label}
              </div>

              {/* Value */}
              <div className="font-bold text-base mb-1 font-mono" style={{ color: stat.color }}>
                {stat.value}
              </div>
              {stat.unit && (
                <div className="text-xs text-muted-foreground opacity-70">{stat.unit}</div>
              )}

              {/* Progress ring */}
              <div className="mt-3 relative">
                <svg className="w-full h-2" viewBox="0 0 100 8">
                  {/* Background */}
                  <rect x="0" y="0" width="100" height="8" rx="4" fill="currentColor" className="text-muted/20" />
                  {/* Progress */}
                  <motion.rect
                    x="0"
                    y="0"
                    height="8"
                    rx="4"
                    fill={stat.color}
                    initial={{ width: 0 }}
                    animate={{ width: stat.progress }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
                    style={{
                      filter: `drop-shadow(0 0 4px ${stat.glow})`,
                    }}
                  />
                </svg>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
