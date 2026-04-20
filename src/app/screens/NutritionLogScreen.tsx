import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus } from 'lucide-react';

export function NutritionLogScreen() {
  const navigate = useNavigate();
  const [protein, setProtein] = useState('');
  const [hydration, setHydration] = useState(6);

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
          <h1 className="font-bold text-lg">Nutrition Log</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Protein */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-bold mb-4">Protein Today</h3>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="Enter grams"
              className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none transition-colors text-center text-2xl font-bold mb-2"
            />
            <p className="text-sm text-muted-foreground text-center">Target: 150g</p>
          </div>

          {/* Hydration */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-bold mb-4">Water Today</h3>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>{hydration}</span>
              <span className="text-xl text-muted-foreground"> / 8 glasses</span>
            </div>
            <button
              onClick={() => setHydration(hydration + 1)}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Glass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
