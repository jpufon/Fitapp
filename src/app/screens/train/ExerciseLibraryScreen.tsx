import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search } from 'lucide-react';

export function ExerciseLibraryScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Push', count: 24 },
    { name: 'Pull', count: 28 },
    { name: 'Legs', count: 32 },
    { name: 'Core', count: 18 },
    { name: 'Cardio', count: 15 },
    { name: 'Olympic', count: 12 },
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
          <h1 className="font-bold text-lg">Exercise Library</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-12 pr-4 py-4 bg-card rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <button
              key={category.name}
              className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all text-left"
            >
              <h3 className="font-bold mb-1">{category.name}</h3>
              <p className="text-sm text-muted-foreground">{category.count} exercises</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
