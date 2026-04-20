import { Link, useLocation } from 'react-router';
import { Home, Dumbbell, Calendar, Trophy, User } from 'lucide-react';
import { motion } from 'motion/react';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/train', icon: Dumbbell, label: 'Train' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/arena', icon: Trophy, label: 'Arena' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-2xl border-t border-border/50 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-3">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center gap-1.5 py-2 px-4 rounded-2xl transition-all"
            >
              {/* Active indicator with glow */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary)15, var(--primary)08)',
                    border: '1px solid var(--primary)30',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon with glow on active */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="relative"
              >
                <Icon
                  className="w-6 h-6 relative z-10"
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                    filter: isActive ? 'drop-shadow(0 0 8px var(--primary))' : 'none',
                  }}
                />
              </motion.div>

              {/* Label */}
              <span
                className="text-xs font-bold relative z-10 uppercase tracking-wider"
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom gradient accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-50"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--primary)40, transparent)',
        }}
      />
    </nav>
  );
}
