import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function PlateCalculatorScreen() {
  const navigate = useNavigate();
  const [targetWeight, setTargetWeight] = useState('');
  const [barWeight, setBarWeight] = useState(20);

  const calculatePlates = () => {
    const target = parseFloat(targetWeight) || 0;
    const weightPerSide = (target - barWeight) / 2;

    const plates = [20, 15, 10, 5, 2.5, 1.25];
    const result: { [key: number]: number } = {};
    let remaining = weightPerSide;

    for (const plate of plates) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        result[plate] = count;
        remaining -= count * plate;
      }
    }

    return result;
  };

  const plateResult = calculatePlates();

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
          <h1 className="font-bold text-lg">Plate Calculator</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-card rounded-xl p-6 border border-border mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Target Weight (kg)</label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="Enter weight"
              className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none transition-colors text-center text-2xl font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bar Weight (kg)</label>
            <select
              value={barWeight}
              onChange={(e) => setBarWeight(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-secondary rounded-lg border border-border focus:border-primary focus:outline-none transition-colors"
            >
              <option value={20}>20 kg (Standard)</option>
              <option value={15}>15 kg (Women's)</option>
              <option value={10}>10 kg (Training)</option>
            </select>
          </div>
        </div>

        {targetWeight && (
          <div className="bg-gradient-to-br from-primary/10 to-vitality/10 rounded-xl p-6 border border-primary/20">
            <h3 className="font-bold mb-4">Plates per side</h3>
            <div className="space-y-3">
              {Object.entries(plateResult).map(([weight, count]) => (
                <div key={weight} className="flex items-center justify-between">
                  <span className="font-medium">{weight}kg plate</span>
                  <span className="px-3 py-1 bg-primary/10 rounded-full font-bold" style={{ color: 'var(--primary)' }}>
                    × {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
