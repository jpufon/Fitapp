import { Play, CheckCircle2, Clock, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function TodayWorkout() {
  const navigate = useNavigate();

  const workout = {
    id: 'upper-body-1',
    name: 'Upper Body Strength',
    completed: false,
    exercises: 6,
    estimatedTime: '45 min',
    type: 'Strength'
  };

  const currentDate = new Date();
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Today's Workout</h2>
        <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{dayName}</span>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-br from-card/80 to-card/50 rounded-2xl p-6 border border-border/50 hover:border-primary/50 backdrop-blur-xl transition-all text-left group relative overflow-hidden"
        onClick={() => navigate(`/train/start/${workout.id}`)}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          style={{
            background: 'linear-gradient(135deg, #10b98140 0%, transparent 50%, #fbbf2440 100%)',
            backgroundSize: '200% 200%',
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">{workout.name}</h3>
              <div className="flex items-center gap-5 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Dumbbell className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span className="font-medium">{workout.exercises} exercises</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" style={{ color: 'var(--energy)' }} />
                  <span className="font-medium">{workout.estimatedTime}</span>
                </span>
              </div>
            </div>

            {/* Play button with glow */}
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--vitality) 100%)',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
              }}
              whileHover={{
                scale: 1.1,
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)',
              }}
            >
              {workout.completed ? (
                <CheckCircle2 className="w-8 h-8 text-black" />
              ) : (
                <Play className="w-8 h-8 text-black fill-black ml-1" />
              )}
            </motion.div>
          </div>

          {/* Workout type badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 backdrop-blur-sm mb-4">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
              {workout.type}
            </span>
          </div>

          {/* Exercise preview */}
          <div className="mt-4 space-y-2.5 pt-4 border-t border-border/30">
            {['Barbell Bench Press', 'Dumbbell Rows', 'Overhead Press'].map((exercise, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
                <span className="text-muted-foreground font-medium">{exercise}</span>
              </motion.div>
            ))}
            <div className="text-sm text-muted-foreground/60 pl-4 font-medium">+ 3 more exercises</div>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
