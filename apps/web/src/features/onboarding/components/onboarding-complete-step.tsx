/**
 * onboarding complete step module.
 * enhanced documentation for clarity and maintenance.
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Sparkles, ArrowRight, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';

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
      title: 'create your first vibe',
      description: 'share something that inspires you',
      action: 'create vibe',
      href: '/vibes/create',
    },
    {
      icon: Sparkles,
      title: 'explore the community',
      description: 'discover vibes from other creators',
      action: 'browse vibes',
      href: '/discover',
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
          <div className="from-theme-primary to-theme-secondary flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r">
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
            className="border-primary/30 absolute inset-0 rounded-full border-4"
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
            className="border-theme-secondary/30 absolute inset-0 rounded-full border-4"
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
        <h1 className="from-theme-primary to-theme-secondary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
          you're all set
        </h1>
        <p className="text-muted-foreground text-xl">
          welcome to the viberatr community!
          <br />
          you're ready to start discovering and sharing vibes.
        </p>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="space-y-4"
      >
        <h2 className="text-foreground text-xl font-semibold">what's next?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {nextSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
            >
              <Link to={step.href} className="block">
                <Card className="border-border/50 group hover:border-primary/20 cursor-pointer border-2 transition-colors">
                  <CardContent className="space-y-3 p-6 text-center">
                    <div className="from-theme-primary/10 to-theme-secondary/10 dark:from-theme-primary/20 dark:to-theme-secondary/20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r transition-transform group-hover:scale-110">
                      <step.icon className="text-primary h-6 w-6" />
                    </div>
                    <h3 className="text-foreground font-semibold">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                    <div className="text-primary flex items-center justify-center text-sm font-medium transition-all group-hover:gap-2">
                      <span>{step.action}</span>
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
          className="from-theme-primary to-theme-secondary text-primary-foreground hover:from-theme-primary/90 hover:to-theme-secondary/90 bg-gradient-to-r px-8 py-3 text-lg"
        >
          {isLoading ? 'finishing setup...' : 'start vibing'}
        </Button>

        <p className="text-muted-foreground text-sm">
          you can always access these features from the main navigation
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
            className="from-theme-primary/80 to-theme-secondary/80 absolute h-3 w-3 rounded-full bg-gradient-to-r"
          />
        ))}
      </motion.div>
    </div>
  );
}
