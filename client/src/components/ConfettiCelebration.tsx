// client/src/components/ConfettiCelebration.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
  intensity?: 'light' | 'medium' | 'heavy' | 'ultimate';
  duration?: number;
}

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  trigger,
  onComplete,
  intensity = 'ultimate',
  duration = 3000,
}) => {
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!trigger) return;

    // Trigger the celebration
    startCelebration();

    // Cleanup after duration
    const timeout = setTimeout(() => {
      stopCelebration();
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearTimeout(timeout);
      stopCelebration();
    };
  }, [trigger]);

  const stopCelebration = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startCelebration = () => {
    switch (intensity) {
      case 'light':
        triggerLightConfetti();
        break;
      case 'medium':
        triggerMediumConfetti();
        break;
      case 'heavy':
        triggerHeavyConfetti();
        break;
      case 'ultimate':
        triggerUltimateCelebration();
        break;
      default:
        triggerMediumConfetti();
    }
  };

  // Light confetti - single burst
  const triggerLightConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      startVelocity: 20,
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#ffac46', '#6fcf97'],
    });
  };

  // Medium confetti - dual burst
  const triggerMediumConfetti = () => {
    // Left cannon
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      startVelocity: 25,
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
    });
    
    // Right cannon
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      startVelocity: 25,
      colors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
    });
  };

  // Heavy confetti - multiple bursts
  const triggerHeavyConfetti = () => {
    // First wave
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      startVelocity: 25,
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#ffac46', '#6fcf97'],
    });
    
    // Second wave after delay
    setTimeout(() => {
      confetti({
        particleCount: 150,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.5 },
        startVelocity: 30,
      });
    }, 150);
    
    // Third wave
    setTimeout(() => {
      confetti({
        particleCount: 150,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.5 },
        startVelocity: 30,
      });
    }, 300);
  };

  // Ultimate celebration - full show with fireworks effect
  const triggerUltimateCelebration = () => {
    console.log("🎉 Ultimate celebration starting!");
    
    // Wave 1: Central burst
    confetti({
      particleCount: 250,
      spread: 120,
      origin: { y: 0.6, x: 0.5 },
      startVelocity: 28,
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#ffac46', '#6fcf97', '#88d8b0', '#ff6b6b', '#4ecdc4'],
      decay: 0.9,
      ticks: 200,
    });
    
    // Wave 2: Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 180,
        angle: 55,
        spread: 70,
        origin: { x: 0, y: 0.5 },
        startVelocity: 35,
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      });
    }, 100);
    
    // Wave 3: Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 180,
        angle: 125,
        spread: 70,
        origin: { x: 1, y: 0.5 },
        startVelocity: 35,
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      });
    }, 200); 

    
    // Wave 4: Multiple star bursts
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 360,
          origin: { y: 0.5, x: 0.15 + (i * 0.14) },
          startVelocity: 18,
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd700'],
          decay: 0.85,
        });
      }, 750 + (i * 100));
    }
    
    

  };

  // This component doesn't render any visible UI
  return null;
};

export default ConfettiCelebration;