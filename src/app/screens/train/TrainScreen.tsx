import { useState } from 'react';
import { Link } from 'react-router';
import { Play, Plus, History, Zap, Timer, Search, Calculator, Dumbbell, Book, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function TrainScreen() {
  const todayWorkouts = [
    {
      id: '1',
      name: 'Upper Body Strength',
      type: 'AI Generated',
      exercises: 6,
      time: '45 min',
      completed: false
    },
    {
      id: '2',
      name: 'Easy 5K Run',
      type: 'GPS Tracking',
      exercises: 1,
      time: '30 min',
      completed: false
    }
  ];

  const quickActions = [
    {
      icon: Plus,
      label: 'Custom Workout',
      path: '/train/custom',
      color: '#10b981',
      glow: '#059669',
      description: 'Build from scratch'
    },
    {
      icon: Book,
      label: 'Exercise Library',
      path: '/train/exercises',
      color: '#60a5fa',
      glow: '#3b82f6',
      description: 'Browse movements'
    },
    {
      icon: Calculator,
      label: 'Plate Calculator',
      path: '/train/plate-calculator',
      color: '#fbbf24',
      glow: '#f59e0b',
      description: 'Load the bar'
    },
    {
      icon: History,
      label: 'Workout History',
      path: '/train/history',
      color: '#a78bfa',
      glow: '#8b5cf6',
      description: 'View past sessions'
    }
  ];

  return (
    <div className="min-h-full bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-1/4 right-0 w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, #10b98130 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="px-6 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-2">Train</h1>
            <p className="text-muted-foreground font-medium">Build strength, push limits</p>
          </motion.div>
        </div>

        {/* Today's Workouts */}
        <div className="px-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Today's Plan</h2>
          <div className="space-y-3">
            {todayWorkouts.map((workout, i) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/train/start/${workout.id}`}
                  className="block bg-card/50 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all group relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, var(--primary)40 0%, transparent 100%)' }}
                  />

                  <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-2">{workout.name}</h3>
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Dumbbell className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                          <span className="font-medium">{workout.exercises} exercises</span>
                        </span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Timer className="w-4 h-4" style={{ color: 'var(--energy)' }} />
                          <span className="font-medium">{workout.time}</span>
                        </span>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                        {workout.type}
                      </span>
                    </div>
                    <motion.div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--vitality))',
                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
                      }}
                      whileHover={{
                        scale: 1.1,
                        boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)',
                      }}
                    >
                      <Play className="w-8 h-8 text-black fill-black ml-1" />
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.path}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Link
                  to={action.path}
                  className="block bg-card/50 backdrop-blur-xl rounded-2xl p-5 border border-border/50 hover:border-primary/50 transition-all group relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity blur-2xl"
                    style={{ background: `radial-gradient(circle, ${action.glow}, transparent)` }}
                  />

                  <div className="relative">
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                      style={{
                        background: `linear-gradient(135deg, ${action.color}20, ${action.color}10)`,
                        border: `1px solid ${action.color}30`,
                      }}
                      whileHover={{ boxShadow: `0 0 25px ${action.glow}40` }}
                    >
                      <action.icon className="w-7 h-7" style={{ color: action.color, filter: `drop-shadow(0 0 6px ${action.glow}80)` }} />
                    </motion.div>
                    <h3 className="font-bold text-sm mb-1">{action.label}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{action.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Generate New Plan */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 bg-gradient-to-r from-primary/20 to-vitality/20 rounded-2xl p-6 border border-primary/40 hover:border-primary/60 transition-all relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              style={{
                background: 'linear-gradient(135deg, transparent 30%, var(--primary)40 50%, transparent 70%)',
                backgroundSize: '200% 200%',
              }}
            />

            <div className="relative flex items-center justify-center gap-3">
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="w-6 h-6" style={{ color: 'var(--primary)' }} />
              </motion.div>
              <span className="font-bold text-lg" style={{ color: 'var(--primary)' }}>Generate New Plan with Wali AI</span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
