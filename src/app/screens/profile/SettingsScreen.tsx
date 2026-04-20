import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function SettingsScreen() {
  const navigate = useNavigate();

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
          <h1 className="font-bold text-lg">Settings</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="text-center py-12 text-muted-foreground">
          Settings screen coming soon
        </div>
      </div>
    </div>
  );
}
