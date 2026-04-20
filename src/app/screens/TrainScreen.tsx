import { useState } from 'react';
import { Play, Plus, History, Zap, Timer, Search } from 'lucide-react';
import { motion } from 'motion/react';

export function TrainScreen() {
  const [activeTab, setActiveTab] = useState<'start' | 'custom' | 'history'>('start');

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-bold mb-2">Train</h1>
        <p className="text-muted-foreground">Let's build strength together</p>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 p-1 bg-secondary rounded-xl">
          <TabButton
            active={activeTab === 'start'}
            onClick={() => setActiveTab('start')}
            icon={Play}
            label="Start"
          />
          <TabButton
            active={activeTab === 'custom'}
            onClick={() => setActiveTab('custom')}
            icon={Plus}
            label="Custom"
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={History}
            label="History"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        {activeTab === 'start' && <StartTab />}
        {activeTab === 'custom' && <CustomTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all relative"
      style={{
        background: active ? 'var(--card)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--muted-foreground)',
      }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function StartTab() {
  const workouts = [
    {
      name: 'Upper Body Strength',
      type: 'AI Generated',
      exercises: 6,
      time: '45 min',
      status: 'ready'
    },
    {
      name: 'Easy 5K Run',
      type: 'GPS Tracking',
      exercises: 1,
      time: '30 min',
      status: 'ready'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-3">Today's Plan</h2>
        {workouts.map((workout, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="w-full bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all text-left mb-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold mb-1">{workout.name}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {workout.exercises} exercises
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    {workout.time}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-xs font-medium" style={{ color: 'var(--primary)' }}>
                    {workout.type}
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <button className="w-full bg-secondary hover:bg-secondary/80 rounded-xl p-5 border border-border transition-all flex items-center justify-center gap-2 text-primary font-medium">
        <Plus className="w-5 h-5" />
        Generate New Plan with Wali AI
      </button>
    </div>
  );
}

function CustomTab() {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search exercises..."
          className="w-full pl-12 pr-4 py-4 bg-card rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Build Custom Workout</h3>
        <button className="w-full bg-card rounded-xl p-5 border border-dashed border-border hover:border-primary/50 transition-all flex items-center justify-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          <span className="font-medium" style={{ color: 'var(--primary)' }}>Add Exercise</span>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Exercise Categories</h3>
        <div className="grid grid-cols-2 gap-3">
          {['Push', 'Pull', 'Legs', 'Core', 'Cardio', 'Olympic'].map((category) => (
            <button
              key={category}
              className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all text-left"
            >
              <div className="font-medium">{category}</div>
              <div className="text-xs text-muted-foreground mt-1">Browse exercises</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryTab() {
  const history = [
    { date: 'Today', workout: 'Upper Body Strength', completed: true },
    { date: 'Yesterday', workout: 'Easy 5K Run', completed: true },
    { date: 'Monday', workout: 'Lower Body Strength', completed: true },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold mb-3">Recent Workouts</h2>
      {history.map((item, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="w-full bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">{item.date}</div>
              <div className="font-bold">{item.workout}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-vitality/10 flex items-center justify-center">
              <svg className="w-5 h-5" style={{ color: 'var(--vitality)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
