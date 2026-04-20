import { useState } from 'react';
import { TreeDeciduous, Target, Calendar, Dumbbell, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});

  const steps = [
    {
      icon: TreeDeciduous,
      title: 'Welcome to waliFit',
      description: 'Your hybrid athlete operating system. Train smarter, grow consistently, compete with your squad.',
      color: '#10b981',
      glow: '#059669'
    },
    {
      icon: Target,
      title: 'What is Your Goal?',
      description: 'Choose your primary training focus to get personalized AI coaching.',
      color: '#60a5fa',
      glow: '#3b82f6',
      options: ['Strength', 'Hybrid Performance', 'Fat Loss', 'Muscle Gain', 'Conditioning']
    },
    {
      icon: Calendar,
      title: 'Training Schedule',
      description: 'How many days per week can you train?',
      color: '#fbbf24',
      glow: '#f59e0b',
      options: ['3 days', '4 days', '5 days', '6 days', '7 days']
    },
    {
      icon: Dumbbell,
      title: 'Equipment Access',
      description: 'What equipment do you have available?',
      color: '#a78bfa',
      glow: '#8b5cf6',
      options: ['Full Gym', 'Home Gym', 'Minimal Equipment', 'Bodyweight Only']
    }
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  const handleNext = (option?: string) => {
    if (option) {
      setSelectedOptions({ ...selectedOptions, [step]: option });
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[150px]"
          animate={{
            x: ['-50%', '150%'],
            y: ['0%', '100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
          style={{
            background: `radial-gradient(circle, ${currentStep.color}40 0%, transparent 70%)`,
            top: '10%',
            left: '0%',
          }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px]"
          animate={{
            x: ['100%', '-50%'],
            y: ['100%', '0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
          style={{
            background: `radial-gradient(circle, ${currentStep.glow}30 0%, transparent 70%)`,
            bottom: '20%',
            right: '0%',
          }}
        />
      </div>

      {/* Progress indicator */}
      <div className="px-6 pt-8 pb-6 relative z-10">
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted/20"
              initial={false}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: i <= step ? `linear-gradient(90deg, ${s.color}, ${s.glow})` : 'transparent',
                  boxShadow: i === step ? `0 0 10px ${s.glow}` : 'none',
                }}
                initial={{ width: '0%' }}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md text-center"
          >
            {/* Icon with glow */}
            <div className="mb-8 relative">
              <motion.div
                className="absolute inset-0 blur-3xl opacity-40"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{
                  background: `radial-gradient(circle, ${currentStep.glow}, transparent)`,
                }}
              />
              <motion.div
                className="w-36 h-36 mx-auto rounded-3xl flex items-center justify-center mb-6 relative backdrop-blur-xl border"
                style={{
                  background: `linear-gradient(135deg, ${currentStep.color}15, ${currentStep.glow}10)`,
                  borderColor: `${currentStep.color}30`,
                  boxShadow: `0 0 40px ${currentStep.glow}20`,
                }}
                animate={{
                  boxShadow: [
                    `0 0 40px ${currentStep.glow}20`,
                    `0 0 60px ${currentStep.glow}30`,
                    `0 0 40px ${currentStep.glow}20`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <StepIcon
                  className="w-20 h-20"
                  style={{
                    color: currentStep.color,
                    filter: `drop-shadow(0 0 10px ${currentStep.glow})`,
                  }}
                  strokeWidth={1.5}
                />
              </motion.div>
            </div>

            {/* Title & Description */}
            <motion.h1
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentStep.title}
            </motion.h1>
            <motion.p
              className="text-muted-foreground mb-10 text-lg font-medium leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {currentStep.description}
            </motion.p>

            {/* Options */}
            {currentStep.options && (
              <div className="space-y-3 mb-8">
                {currentStep.options.map((option, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    whileHover={{
                      scale: 1.02,
                      borderColor: currentStep.color + '60',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNext(option)}
                    className="w-full bg-card/50 backdrop-blur-xl rounded-2xl p-5 border border-border/50 hover:bg-card/80 transition-all text-left font-bold relative overflow-hidden group"
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                      style={{ background: `linear-gradient(135deg, ${currentStep.color}, ${currentStep.glow})` }}
                    />
                    <span className="relative">{option}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Actions */}
            {!currentStep.options && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <motion.button
                  onClick={() => handleNext()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-5 px-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${currentStep.color}, ${currentStep.glow})`,
                    color: 'black',
                    boxShadow: `0 0 40px ${currentStep.glow}40`,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                    style={{
                      background: 'linear-gradient(135deg, transparent 30%, white 50%, transparent 70%)',
                      backgroundSize: '200% 200%',
                    }}
                  />
                  <span className="relative">{step === steps.length - 1 ? 'Get Started' : 'Continue'}</span>
                  <ArrowRight className="w-6 h-6 relative" />
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip button */}
      <div className="px-6 pb-8 relative z-10">
        <motion.button
          onClick={handleSkip}
          whileHover={{ scale: 1.02 }}
          className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          Skip for now
        </motion.button>
      </div>
    </div>
  );
}
