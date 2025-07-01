import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Sparkles, ArrowRight, Plus } from 'lucide-react';

interface OnboardingCompleteStepProps {
  onComplete: () => void;
  isLoading?: boolean;
}

export function OnboardingCompleteStep({
  onComplete,
  isLoading = false,
}: OnboardingCompleteStepProps) {
  const nextSteps = [
    {
      icon: Plus,
      title: 'Create Your First Vibe',
      description: 'Share something that inspires you',
      action: 'Create Vibe',
    },
    {
      icon: Sparkles,
      title: 'Explore the Community',
      description: 'Discover vibes from other creators',
      action: 'Browse Vibes',
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8 text-center">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.2,
        }}
        className="flex justify-center"
      >
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-orange-500">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          {/* Animated rings */}
          <motion.div
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute inset-0 rounded-full border-4 border-pink-300"
          />
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
            className="absolute inset-0 rounded-full border-4 border-orange-300"
          />
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-4"
      >
        <h1 className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-4xl font-bold text-transparent">
          You're All Set!
        </h1>
        <p className="text-muted-foreground text-xl">
          Welcome to the vibechecc community! You're ready to start discovering
          and sharing amazing vibes.
        </p>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="space-y-4"
      >
        <h2 className="text-foreground text-xl font-semibold">What's Next?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {nextSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
            >
              <Card className="border-border/50 group cursor-pointer border-2 transition-colors hover:border-pink-200">
                <CardContent className="space-y-3 p-6 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-100 to-orange-100 transition-transform group-hover:scale-110 dark:from-pink-900 dark:to-orange-900">
                    <step.icon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-foreground font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                  <div className="flex items-center justify-center text-sm font-medium text-pink-600 transition-all group-hover:gap-2 dark:text-pink-400">
                    <span>{step.action}</span>
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="space-y-4"
      >
        <Button
          onClick={onComplete}
          disabled={isLoading}
          size="lg"
          className="bg-gradient-to-r from-pink-500 to-orange-500 px-8 py-3 text-lg text-white hover:from-pink-600 hover:to-orange-600"
        >
          {isLoading ? 'Finishing Setup...' : 'Start Exploring vibechecc!'}
        </Button>

        <p className="text-muted-foreground text-sm">
          You can always access these features from the main navigation
        </p>
      </motion.div>

      {/* Confetti Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              y: -100,
              x: Math.random() * window.innerWidth,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: 360,
              opacity: 0,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              ease: 'easeOut',
            }}
            className="absolute h-3 w-3 rounded-full bg-gradient-to-r from-pink-400 to-orange-400"
          />
        ))}
      </motion.div>
    </div>
  );
}
