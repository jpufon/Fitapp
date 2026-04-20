import { VitalityTree } from '../components/VitalityTree';
import { DailyStats } from '../components/DailyStats';
import { TodayWorkout } from '../components/TodayWorkout';
import { QuickActions } from '../components/QuickActions';
import { Flame, Bell } from 'lucide-react';
import { motion } from 'motion/react';

export function HomeScreen() {
  // Mock data
  const user = {
    name: 'Alex',
    streak: 12,
    vitalityScore: 75,
    todayScore: {
      hydration: 80,
      protein: 70,
      workout: 100
    }
  };

  return (
    <div className="min-h-full bg-background relative overflow-hidden">
      {/* Ambient background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, #10b98140 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, #fbbf2430 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Welcome back</p>
              <h1 className="text-3xl font-bold">{user.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-xl flex items-center justify-center"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>
          </motion.div>

          {/* Streak badge with glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-energy/20 to-energy/10 border border-energy/30 backdrop-blur-xl relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
              style={{
                background: 'linear-gradient(45deg, transparent 30%, #fbbf2440 50%, transparent 70%)',
                backgroundSize: '200% 200%',
              }}
            />
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Flame className="w-6 h-6" style={{ color: 'var(--energy)', filter: 'drop-shadow(0 0 8px #fbbf24)' }} />
            </motion.div>
            <div className="relative">
              <span className="font-bold text-2xl font-mono" style={{ color: 'var(--energy)' }}>{user.streak}</span>
              <span className="ml-2 text-sm text-muted-foreground font-medium">day streak</span>
            </div>
          </motion.div>
        </div>

        {/* Vitality Tree - Centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-6 py-6"
        >
          <VitalityTree score={user.vitalityScore} todayScore={user.todayScore} />
        </motion.div>

        {/* Daily Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="px-6 py-4"
        >
          <DailyStats todayScore={user.todayScore} />
        </motion.div>

        {/* Today's Workout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="px-6 py-4"
        >
          <TodayWorkout />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="px-6 py-4 pb-8"
        >
          <QuickActions />
        </motion.div>
      </div>
    </div>
  );
}
