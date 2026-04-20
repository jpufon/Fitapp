import { useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function RunStatsScreen() {
  const navigate = useNavigate();
  const { runId } = useParams();

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
          <h1 className="font-bold text-lg">Run Stats</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-2xl font-bold mb-4">5K Run</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="text-xl font-bold">5.0 km</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="text-xl font-bold">24:31</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pace</p>
              <p className="text-xl font-bold">4:54/km</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">vs PR</p>
              <p className="text-xl font-bold text-vitality">-45s</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
