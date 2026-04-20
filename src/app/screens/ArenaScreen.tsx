import { useState } from 'react';
import { Users, Trophy, TrendingUp, MessageCircle, Medal, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

export function ArenaScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'squads' | 'leaderboard'>('feed');

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-bold mb-2">The Arena</h1>
        <p className="text-muted-foreground">Compete and connect</p>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 p-1 bg-secondary rounded-xl">
          <TabButton
            active={activeTab === 'feed'}
            onClick={() => setActiveTab('feed')}
            icon={Trophy}
            label="PR Feed"
          />
          <TabButton
            active={activeTab === 'squads'}
            onClick={() => setActiveTab('squads')}
            icon={Users}
            label="Squads"
          />
          <TabButton
            active={activeTab === 'leaderboard'}
            onClick={() => setActiveTab('leaderboard')}
            icon={TrendingUp}
            label="Ranks"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        {activeTab === 'feed' && <PRFeed />}
        {activeTab === 'squads' && <SquadsTab navigate={navigate} />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all"
      style={{
        background: active ? 'var(--card)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--muted-foreground)',
      }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function PRFeed() {
  const prEvents = [
    {
      user: 'Sarah M.',
      avatar: '💪',
      event: 'New PR',
      exercise: 'Deadlift',
      value: '140kg',
      improvement: '+5kg',
      time: '2h ago',
      cheers: 12
    },
    {
      user: 'Mike T.',
      avatar: '🏃',
      event: 'Run PR',
      exercise: '5K',
      value: '24:31',
      improvement: '-45s',
      time: '5h ago',
      cheers: 8
    },
    {
      user: 'Emma K.',
      avatar: '🔥',
      event: 'Streak Milestone',
      exercise: '30 Day Streak',
      value: 'Longest ever',
      improvement: null,
      time: '1d ago',
      cheers: 24
    },
    {
      user: 'You',
      avatar: '⚡',
      event: 'Workout Complete',
      exercise: 'Upper Body Strength',
      value: '4 exercises',
      improvement: null,
      time: 'Today',
      cheers: 5
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Recent Activity</h2>
        <button className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
          Filter
        </button>
      </div>

      {prEvents.map((event, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-card rounded-xl p-5 border border-border"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-vitality/20 flex items-center justify-center text-2xl flex-shrink-0">
              {event.avatar}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="font-bold">{event.user}</div>
                  <div className="text-sm text-muted-foreground">{event.event}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{event.time}</div>
              </div>

              <div className="bg-secondary rounded-lg p-3 mb-3">
                <div className="text-sm text-muted-foreground mb-1">{event.exercise}</div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{event.value}</div>
                  {event.improvement && (
                    <div className="text-sm font-medium" style={{ color: 'var(--vitality)' }}>
                      {event.improvement}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-energy transition-colors">
                  <Flame className="w-4 h-4" />
                  <span>{event.cheers}</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Comment</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SquadsTab({ navigate }: { navigate: (path: string) => void }) {
  const squads = [
    {
      id: 'morning-warriors',
      name: 'Morning Warriors',
      type: 'Workout Squad',
      members: 12,
      activeToday: 8,
      forestHealth: 85,
      rank: 3
    },
    {
      id: '5k-crushers',
      name: '5K Crushers',
      type: 'Run Club',
      members: 8,
      activeToday: 5,
      forestHealth: 92,
      rank: 1
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">My Squads</h2>
        <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm">
          + Join Squad
        </button>
      </div>

      {squads.map((squad, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="w-full bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all text-left"
          onClick={() => navigate(`/arena/squad/${squad.id}`)}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{squad.name}</h3>
              <div className="text-sm text-muted-foreground">{squad.type}</div>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-energy/10">
              <Medal className="w-4 h-4" style={{ color: 'var(--energy)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--energy)' }}>#{squad.rank}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Members</div>
              <div className="text-lg font-bold">{squad.members}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Active Today</div>
              <div className="text-lg font-bold" style={{ color: 'var(--vitality)' }}>{squad.activeToday}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Forest Health</div>
              <div className="text-lg font-bold" style={{ color: 'var(--vitality)' }}>{squad.forestHealth}%</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${squad.forestHealth}%`,
                  background: 'var(--vitality)'
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{squad.forestHealth}%</span>
          </div>
        </motion.button>
      ))}

      <div className="bg-gradient-to-r from-primary/10 to-vitality/10 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Create Your Squad</h3>
            <p className="text-sm text-muted-foreground">Train together, grow together</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardTab() {
  const leaderboard = [
    { rank: 1, name: 'Sarah M.', score: 2450, streak: 45, avatar: '💪' },
    { rank: 2, name: 'Mike T.', score: 2380, streak: 38, avatar: '🏃' },
    { rank: 3, name: 'You', score: 2210, streak: 12, avatar: '⚡', isYou: true },
    { rank: 4, name: 'Emma K.', score: 2150, streak: 30, avatar: '🔥' },
    { rank: 5, name: 'Tom R.', score: 2090, streak: 22, avatar: '💯' },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-2">Squad Leaderboard</h2>
        <p className="text-sm text-muted-foreground">Based on this week's vitality scores</p>
      </div>

      {leaderboard.map((user, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-xl p-5 border transition-all"
          style={{
            borderColor: user.isYou ? 'var(--primary)' : 'var(--border)',
            background: user.isYou ? 'var(--primary)' + '05' : 'var(--card)'
          }}
        >
          <div className="flex items-center gap-4">
            {/* Rank */}
            <div className="w-8 text-center">
              {user.rank <= 3 ? (
                <Medal className="w-6 h-6 mx-auto" style={{
                  color: user.rank === 1 ? '#fbbf24' : user.rank === 2 ? '#94a3b8' : '#c2410c'
                }} />
              ) : (
                <div className="text-lg font-bold text-muted-foreground">#{user.rank}</div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-vitality/20 flex items-center justify-center text-2xl">
              {user.avatar}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="font-bold">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.streak} day streak</div>
            </div>

            {/* Score */}
            <div className="text-right">
              <div className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{user.score}</div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
