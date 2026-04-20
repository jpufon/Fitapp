import { User, Settings, MessageCircle, TrendingUp, Award, Bell, Shield, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

export function ProfileScreen() {
  const navigate = useNavigate();

  const user = {
    name: 'Alex Rivera',
    email: 'alex@example.com',
    memberSince: 'March 2026',
    avatar: '⚡'
  };

  const stats = [
    { label: 'Total Workouts', value: '47', icon: TrendingUp, color: '#0891b2' },
    { label: 'Current Streak', value: '12', icon: Award, color: '#f97316' },
    { label: 'PRs This Month', value: '8', icon: Award, color: '#16a34a' },
  ];

  const settings = [
    { icon: MessageCircle, label: 'Chat with Wali AI', description: 'Get personalized coaching', color: '#8b5cf6', path: '/profile/wali-ai' },
    { icon: TrendingUp, label: 'Progress & Analytics', description: 'View your stats', color: '#0891b2', path: null },
    { icon: Bell, label: 'Notifications', description: 'Manage preferences', color: '#f59e0b', path: '/profile/notifications' },
    { icon: User, label: 'Account Settings', description: 'Profile & preferences', color: '#64748b', path: '/profile/settings' },
    { icon: Shield, label: 'Privacy & Legal', description: 'Terms, privacy, AI disclosure', color: '#78716c', path: null },
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <button className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* User info card */}
        <div className="bg-gradient-to-br from-primary/10 to-vitality/10 rounded-2xl p-6 border border-primary/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-vitality flex items-center justify-center text-4xl">
              {user.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
              <p className="text-xs text-muted-foreground">Member since {user.memberSince}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="bg-card/50 backdrop-blur rounded-lg p-3 text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="text-xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="px-6 pb-8 space-y-3">
        {settings.map((setting, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-full bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-all text-left"
            onClick={() => setting.path && navigate(setting.path)}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${setting.color}15` }}
              >
                <setting.icon className="w-6 h-6" style={{ color: setting.color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">{setting.label}</h3>
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        ))}

        {/* Logout */}
        <button className="w-full bg-card rounded-xl p-5 border border-border hover:border-destructive/50 transition-all text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-destructive">Log Out</h3>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
          </div>
        </button>

        {/* App version */}
        <div className="text-center pt-6">
          <p className="text-xs text-muted-foreground">waliFit v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Build the loop. Grow the tree. Compete with the world.</p>
        </div>
      </div>
    </div>
  );
}
