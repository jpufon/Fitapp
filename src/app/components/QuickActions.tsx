import { MessageCircle, Users, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: MessageCircle,
      label: 'Wali AI',
      color: '#a78bfa',
      glow: '#8b5cf6',
      description: 'Get coaching',
      path: '/profile/wali-ai'
    },
    {
      icon: Users,
      label: 'Squad',
      color: '#60a5fa',
      glow: '#3b82f6',
      description: '5 active now',
      path: '/arena'
    },
    {
      icon: TrendingUp,
      label: 'Progress',
      color: '#10b981',
      glow: '#059669',
      description: 'View stats',
      path: '/calendar'
    },
    {
      icon: Plus,
      label: 'Quick Log',
      color: '#fbbf24',
      glow: '#f59e0b',
      description: 'Add workout',
      path: '/train/custom'
    }
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{
              scale: 1.05,
              borderColor: action.color + '60',
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-card/50 rounded-2xl p-5 border border-border/50 backdrop-blur-xl hover:shadow-xl transition-all text-left relative overflow-hidden group"
            onClick={() => navigate(action.path)}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-2xl"
              style={{ background: `radial-gradient(circle at 30% 30%, ${action.glow}, transparent)` }}
            />

            <div className="relative">
              {/* Icon with glow effect */}
              <motion.div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative"
                style={{
                  background: `linear-gradient(135deg, ${action.color}20, ${action.color}10)`,
                  border: `1px solid ${action.color}30`,
                }}
                whileHover={{
                  boxShadow: `0 0 25px ${action.glow}40`,
                }}
              >
                <action.icon
                  className="w-7 h-7"
                  style={{
                    color: action.color,
                    filter: `drop-shadow(0 0 6px ${action.glow}80)`,
                  }}
                />
              </motion.div>

              {/* Label */}
              <h3 className="font-bold text-base mb-1.5">{action.label}</h3>
              <p className="text-xs text-muted-foreground font-medium">{action.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
