import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export function CalendarScreen() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">Track your consistency</p>
          </div>
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(currentDate.getDate() - (view === 'day' ? 1 : view === 'week' ? 7 : 30));
              setCurrentDate(newDate);
            }}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="text-xl font-bold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            {view === 'day' && (
              <div className="text-sm text-muted-foreground">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(currentDate.getDate() + (view === 'day' ? 1 : view === 'week' ? 7 : 30));
              setCurrentDate(newDate);
            }}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 p-1 bg-secondary rounded-xl">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all capitalize"
              style={{
                background: view === v ? 'var(--card)' : 'transparent',
                color: view === v ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        {view === 'day' && <DayView />}
        {view === 'week' && <WeekView />}
        {view === 'month' && <MonthView />}
      </div>
    </div>
  );
}

function DayView() {
  const dayData = {
    workout: 'Upper Body Strength',
    completed: true,
    hydration: 6,
    protein: 105,
    notes: 'Felt strong today, PR on bench press!'
  };

  return (
    <div className="space-y-4">
      {/* Daily summary card */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-bold mb-4">Today's Summary</h3>

        {/* Workout */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Workout</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-vitality" />
              <span className="text-sm font-medium" style={{ color: 'var(--vitality)' }}>Complete</span>
            </div>
          </div>
          <div className="font-medium">{dayData.workout}</div>
        </div>

        {/* Nutrition */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Hydration</div>
            <div className="font-bold text-lg">{dayData.hydration}/8 glasses</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Protein</div>
            <div className="font-bold text-lg">{dayData.protein}/150g</div>
          </div>
        </div>

        {/* Notes */}
        {dayData.notes && (
          <div className="bg-secondary rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Notes</div>
            <div className="text-sm">{dayData.notes}</div>
          </div>
        )}
      </div>

      {/* Vitality score */}
      <div className="bg-gradient-to-r from-vitality/10 to-vitality-light/10 rounded-xl p-6 border border-vitality/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Vitality Score</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--vitality)' }}>85%</div>
          </div>
          <div className="w-16 h-16 rounded-full bg-vitality/20 flex items-center justify-center">
            <svg className="w-8 h-8" style={{ color: 'var(--vitality)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeekView() {
  const weekDays = [
    { day: 'Mon', date: 10, type: 'training', completed: true, score: 90 },
    { day: 'Tue', date: 11, type: 'rest', completed: true, score: 70 },
    { day: 'Wed', date: 12, type: 'training', completed: true, score: 85 },
    { day: 'Thu', date: 13, type: 'rest', completed: true, score: 65 },
    { day: 'Fri', date: 14, type: 'training', completed: false, score: 0 },
    { day: 'Sat', date: 15, type: 'training', completed: false, score: 0 },
    { day: 'Sun', date: 16, type: 'rest', completed: false, score: 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Week overview */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekDays.map((day, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="aspect-square rounded-xl border transition-all relative overflow-hidden"
            style={{
              borderColor: day.completed ? 'var(--vitality)' : 'var(--border)',
              background: day.completed ? 'var(--vitality)' + '10' : 'var(--card)'
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
              <div className="text-lg font-bold">{day.date}</div>
              {day.type === 'training' && (
                <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: day.completed ? 'var(--vitality)' : 'var(--muted)' }} />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Week stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Workouts</div>
          <div className="text-2xl font-bold">3/4</div>
          <div className="text-xs text-muted-foreground mt-1">completed</div>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Avg Vitality</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--vitality)' }}>78%</div>
          <div className="text-xs text-muted-foreground mt-1">this week</div>
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="space-y-2">
        {weekDays.filter(d => d.type === 'training').map((day, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{day.day}, {day.date}</div>
                <div className="font-medium">
                  {day.completed ? 'Workout Complete' : 'Upcoming'}
                </div>
              </div>
              {day.completed && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Vitality</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--vitality)' }}>{day.score}%</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthView() {
  // Generate a simple month grid
  const daysInMonth = 30;
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    date: i + 1,
    hasActivity: Math.random() > 0.4,
    score: Math.random() > 0.4 ? Math.floor(Math.random() * 40) + 60 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Month grid */}
      <div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => (
            <button
              key={i}
              className="aspect-square rounded-lg border transition-all flex items-center justify-center text-sm font-medium relative overflow-hidden"
              style={{
                borderColor: day.hasActivity ? 'var(--vitality)' : 'var(--border)',
                background: day.hasActivity ? 'var(--vitality)' + '15' : 'var(--card)',
                opacity: day.score > 0 ? 1 : 0.6
              }}
            >
              {day.date}
              {day.hasActivity && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-vitality" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--vitality)' }}>18</div>
          <div className="text-xs text-muted-foreground mt-1">Workouts</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--energy)' }}>12</div>
          <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>82%</div>
          <div className="text-xs text-muted-foreground mt-1">Avg Score</div>
        </div>
      </div>
    </div>
  );
}
