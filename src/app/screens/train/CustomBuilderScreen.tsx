import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Search, GripVertical, X } from 'lucide-react';
import { motion } from 'motion/react';

export function CustomBuilderScreen() {
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const exerciseCategories = [
    { name: 'Push', exercises: ['Bench Press', 'Overhead Press', 'Push-ups', 'Dips'] },
    { name: 'Pull', exercises: ['Pull-ups', 'Rows', 'Lat Pulldown', 'Face Pulls'] },
    { name: 'Legs', exercises: ['Squats', 'Deadlifts', 'Lunges', 'Leg Press'] },
    { name: 'Core', exercises: ['Planks', 'Crunches', 'Russian Twists', 'Hanging Leg Raises'] },
  ];

  const addExercise = (exerciseName: string) => {
    setExercises([...exercises, {
      id: Date.now(),
      name: exerciseName,
      sets: 3,
      reps: '10',
      rest: 60
    }]);
    setShowExercisePicker(false);
  };

  const removeExercise = (id: number) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">Custom Workout</h1>
          <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm">
            Save
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Workout Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Workout Name</label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g. Upper Body Strength"
            className="w-full px-4 py-3 bg-card rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Exercises */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Exercises</h2>

          {exercises.length === 0 ? (
            <div className="text-center py-12 bg-secondary rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground mb-4">No exercises added yet</p>
              <button
                onClick={() => setShowExercisePicker(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
              >
                Add First Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold">{exercise.name}</h3>
                          <p className="text-sm text-muted-foreground">Exercise {index + 1}</p>
                        </div>
                        <button
                          onClick={() => removeExercise(exercise.id)}
                          className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Sets</label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => {
                              const newExercises = [...exercises];
                              newExercises[index].sets = parseInt(e.target.value);
                              setExercises(newExercises);
                            }}
                            className="w-full px-2 py-1 bg-secondary rounded-lg border border-border text-center mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Reps</label>
                          <input
                            type="text"
                            value={exercise.reps}
                            onChange={(e) => {
                              const newExercises = [...exercises];
                              newExercises[index].reps = e.target.value;
                              setExercises(newExercises);
                            }}
                            className="w-full px-2 py-1 bg-secondary rounded-lg border border-border text-center mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Rest (s)</label>
                          <input
                            type="number"
                            value={exercise.rest}
                            onChange={(e) => {
                              const newExercises = [...exercises];
                              newExercises[index].rest = parseInt(e.target.value);
                              setExercises(newExercises);
                            }}
                            className="w-full px-2 py-1 bg-secondary rounded-lg border border-border text-center mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <button
                onClick={() => setShowExercisePicker(true)}
                className="w-full py-4 bg-secondary hover:bg-secondary/80 rounded-xl border border-dashed border-border transition-colors flex items-center justify-center gap-2 font-medium text-muted-foreground"
              >
                <Plus className="w-5 h-5" />
                Add Exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-card rounded-t-3xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="sticky top-0 bg-card border-b border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Add Exercise</h2>
                <button
                  onClick={() => setShowExercisePicker(false)}
                  className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  className="w-full pl-10 pr-4 py-3 bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-4">
              {exerciseCategories.map((category) => (
                <div key={category.name} className="mb-6">
                  <h3 className="font-bold mb-3">{category.name}</h3>
                  <div className="space-y-2">
                    {category.exercises.map((exercise) => (
                      <button
                        key={exercise}
                        onClick={() => addExercise(exercise)}
                        className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors"
                      >
                        {exercise}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
