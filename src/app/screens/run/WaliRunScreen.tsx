import { useNavigate } from 'react-router';
import { ArrowLeft, Play } from 'lucide-react';

export function WaliRunScreen() {
  const navigate = useNavigate();

  const distances = ['1 Mile', '2 Mile', '3 Mile', '2K', '5K', 'Free Run'];

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
          <h1 className="font-bold text-lg">WaliRun</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <h2 className="text-lg font-bold mb-4">Select Distance</h2>
        <div className="grid grid-cols-2 gap-3">
          {distances.map((distance) => (
            <button
              key={distance}
              className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{distance}</span>
                <Play className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
