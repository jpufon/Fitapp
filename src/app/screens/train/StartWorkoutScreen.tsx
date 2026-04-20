import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Play, Pause, Check, Timer, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function StartWorkoutScreen() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [sets, setSets] = useState<{ weight: number; reps: number; completed: boolean }[]>([]);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(90);

  // Mock workout data
  const workout = {
    name: 'Upper Body Strength',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: 90, type: 'strength' },
      { name: 'Dumbbell Rows', sets: 4, reps: '10-12', rest: 75, type: 'strength' },
      { name: 'Overhead Press', sets: 3, reps: '8-10', rest: 90, type: 'strength' },
      { name: 'Lat Pulldown', sets: 3, reps: '12-15', rest: 60, type: 'strength' },
      { name: 'Dumbbell Curls', sets: 3, reps: '12-15', rest: 60, type: 'accessory' },
      { name: 'Tricep Dips', sets: 3, reps: '12-15', rest: 60, type: 'accessory' }
    ]
  };

  const currentExercise = workout.exercises[activeExerciseIndex];

  const handleAddSet = () => {
    setSets([...sets, { weight: 0, reps: 0, completed: false }]);
  };

  const handleCompleteSet = (index: number) => {
    const newSets = [...sets];
    newSets[index].completed = true;
    setSets(newSets);
    setRestTimerActive(true);
    setRestTimeRemaining(currentExercise.rest);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1 mx-4">
            <h1 className="font-bold">{workout.name}</h1>
            <p className="text-xs text-muted-foreground">
              Exercise {activeExerciseIndex + 1} of {workout.exercises.length}
            </p>
          </div>
          <button className="w-10 h-10 rounded-full bg-vitality hover:bg-vitality/90 flex items-center justify-center transition-colors">
            <Check className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-secondary">
          <motion.div
            className="h-full bg-vitality"
            initial={{ width: 0 }}
            animate={{ width: `${((activeExerciseIndex + 1) / workout.exercises.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Exercise Info */}
      <div className="px-6 py-6">
        <motion.div
          key={activeExerciseIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-primary/10 to-vitality/10 rounded-2xl p-6 border border-primary/20 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{currentExercise.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{currentExercise.sets} sets</span>
                <span>•</span>
                <span>{currentExercise.reps} reps</span>
                <span>•</span>
                <span>{currentExercise.rest}s rest</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium capitalize" style={{ color: 'var(--primary)' }}>
              {currentExercise.type}
            </span>
          </div>

          <button className="w-full py-3 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors" style={{ color: 'var(--primary)' }}>
            View Exercise Demo
          </button>
        </motion.div>

        {/* Sets Log */}
        <div className="mb-6">
          <h3 className="font-bold mb-3">Sets</h3>
          <div className="space-y-2">
            {sets.map((set, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card rounded-xl p-4 border transition-all ${
                  set.completed ? 'border-vitality bg-vitality/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground w-8">#{i + 1}</span>
                  <input
                    type="number"
                    placeholder="Weight"
                    className="flex-1 px-3 py-2 bg-secondary rounded-lg border border-border text-center font-medium"
                    value={set.weight || ''}
                    onChange={(e) => {
                      const newSets = [...sets];
                      newSets[i].weight = parseInt(e.target.value) || 0;
                      setSets(newSets);
                    }}
                    disabled={set.completed}
                  />
                  <span className="text-muted-foreground">×</span>
                  <input
                    type="number"
                    placeholder="Reps"
                    className="flex-1 px-3 py-2 bg-secondary rounded-lg border border-border text-center font-medium"
                    value={set.reps || ''}
                    onChange={(e) => {
                      const newSets = [...sets];
                      newSets[i].reps = parseInt(e.target.value) || 0;
                      setSets(newSets);
                    }}
                    disabled={set.completed}
                  />
                  <button
                    onClick={() => handleCompleteSet(i)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      set.completed
                        ? 'bg-vitality'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    disabled={set.completed || !set.weight || !set.reps}
                  >
                    <Check className="w-5 h-5 text-white" />
                  </button>
                </div>
              </motion.div>
            ))}

            <button
              onClick={handleAddSet}
              className="w-full py-4 bg-secondary hover:bg-secondary/80 rounded-xl border border-dashed border-border transition-colors flex items-center justify-center gap-2 font-medium text-muted-foreground"
            >
              <Plus className="w-5 h-5" />
              Add Set
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {activeExerciseIndex > 0 && (
            <button
              onClick={() => {
                setActiveExerciseIndex(activeExerciseIndex - 1);
                setSets([]);
              }}
              className="flex-1 py-4 bg-secondary hover:bg-secondary/80 rounded-xl font-medium transition-colors"
            >
              Previous Exercise
            </button>
          )}
          {activeExerciseIndex < workout.exercises.length - 1 && (
            <button
              onClick={() => {
                setActiveExerciseIndex(activeExerciseIndex + 1);
                setSets([]);
              }}
              className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors"
            >
              Next Exercise
            </button>
          )}
        </div>
      </div>

      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {restTimerActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-3xl p-8 m-6 max-w-sm w-full text-center"
            >
              <div className="mb-6">
                <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Timer className="w-16 h-16" style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Rest Period</h3>
                <p className="text-muted-foreground">Take a break before your next set</p>
              </div>

              <div className="text-6xl font-bold mb-6" style={{ color: 'var(--primary)' }}>
                {restTimeRemaining}s
              </div>

              <button
                onClick={() => setRestTimerActive(false)}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors"
              >
                Skip Rest
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
