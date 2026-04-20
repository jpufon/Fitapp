import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function NotificationsScreen() {
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
          <h1 className="font-bold text-lg">Notifications</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-medium">Workout Reminders</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-medium">Hydration Nudges</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-medium">Squad Activity</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
