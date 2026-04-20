import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { TrainScreen } from './screens/train/TrainScreen';
import { StartWorkoutScreen } from './screens/train/StartWorkoutScreen';
import { CustomBuilderScreen } from './screens/train/CustomBuilderScreen';
import { ExerciseLibraryScreen } from './screens/train/ExerciseLibraryScreen';
import { PlateCalculatorScreen } from './screens/train/PlateCalculatorScreen';
import { WorkoutHistoryScreen } from './screens/train/WorkoutHistoryScreen';
import { CalendarScreen } from './screens/calendar/CalendarScreen';
import { ArenaScreen } from './screens/arena/ArenaScreen';
import { SquadDetailScreen } from './screens/arena/SquadDetailScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { WaliAIScreen } from './screens/profile/WaliAIScreen';
import { SettingsScreen } from './screens/profile/SettingsScreen';
import { NotificationsScreen } from './screens/profile/NotificationsScreen';
import { WaliRunScreen } from './screens/run/WaliRunScreen';
import { RunStatsScreen } from './screens/run/RunStatsScreen';
import { NutritionLogScreen } from './screens/NutritionLogScreen';
import { BottomNav } from './components/BottomNav';
import { OnboardingScreen } from './screens/OnboardingScreen';

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  if (!onboardingComplete) {
    return <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-background overflow-hidden max-w-md mx-auto">
        <div className="flex-1 overflow-y-auto pb-20">
          <Routes>
            {/* Home */}
            <Route path="/" element={<HomeScreen />} />

            {/* Train Section */}
            <Route path="/train" element={<TrainScreen />} />
            <Route path="/train/start/:workoutId" element={<StartWorkoutScreen />} />
            <Route path="/train/custom" element={<CustomBuilderScreen />} />
            <Route path="/train/exercises" element={<ExerciseLibraryScreen />} />
            <Route path="/train/plate-calculator" element={<PlateCalculatorScreen />} />
            <Route path="/train/history" element={<WorkoutHistoryScreen />} />

            {/* Calendar */}
            <Route path="/calendar" element={<CalendarScreen />} />

            {/* Arena */}
            <Route path="/arena" element={<ArenaScreen />} />
            <Route path="/arena/squad/:squadId" element={<SquadDetailScreen />} />

            {/* Profile */}
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/profile/wali-ai" element={<WaliAIScreen />} />
            <Route path="/profile/settings" element={<SettingsScreen />} />
            <Route path="/profile/notifications" element={<NotificationsScreen />} />

            {/* Run */}
            <Route path="/run" element={<WaliRunScreen />} />
            <Route path="/run/stats/:runId" element={<RunStatsScreen />} />

            {/* Nutrition */}
            <Route path="/nutrition" element={<NutritionLogScreen />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
