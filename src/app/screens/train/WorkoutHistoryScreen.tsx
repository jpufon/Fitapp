import { useNavigate } from 'react-router';
import { ArrowLeft, Calendar } from 'lucide-react';

export function WorkoutHistoryScreen() {
  const navigate = useNavigate();

  const history = [
    { id: 1, date: 'Today', workout: 'Upper Body Strength', duration: '45 min', completed: true },
    { id: 2, date: 'Yesterday', workout: 'Easy 5K Run', duration: '30 min', completed: true },
    { id: 3, date: 'Monday', workout: 'Lower Body Strength', duration: '50 min', completed: true },
    { id: 4, date: 'Sunday', workout: 'Rest Day', duration: '-', completed: true },
    { id: 5, date: 'Saturday', workout: 'Full Body Conditioning', duration: '40 min', completed: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">Workout History</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-3">
          {history.map((item) => (
            <button
              key={item.id}
              className="w-full bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {item.date}
                </div>
                {item.completed && (
                  <div className="w-6 h-6 rounded-full bg-vitality/10 flex items-center justify-center">
                    <svg className="w-4 h-4" style={{ color: 'var(--vitality)' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="font-bold mb-1">{item.workout}</h3>
              <p className="text-sm text-muted-foreground">{item.duration}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
