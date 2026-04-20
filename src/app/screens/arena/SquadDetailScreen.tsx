import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Users, MessageCircle } from 'lucide-react';

export function SquadDetailScreen() {
  const navigate = useNavigate();
  const { squadId } = useParams();

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
          <h1 className="font-bold text-lg">Morning Warriors</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-card rounded-xl p-6 border border-border mb-6">
          <h3 className="font-bold mb-4">Squad Members</h3>
          <div className="text-center py-8 text-muted-foreground">
            12 members in this squad
          </div>
        </div>

        <button className="w-full bg-primary text-white rounded-xl p-4 font-medium flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Group Chat
        </button>
      </div>
    </div>
  );
}
