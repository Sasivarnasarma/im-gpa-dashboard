import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

// Floating scroll-to-top trigger. Self-contained: owns the scroll listener
// that drives both its visibility (past 400px) and the circular progress
// ring drawn around the arrow.
export default function ScrollTopButton() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Sync scroll listener for Circular progress arrow indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Programmatic scrolling ignores the CSS scroll-behavior override, so the
  // reduced-motion preference has to be consulted here directly.
  const scrollToTop = () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    window.scrollTo({ top: 0, behavior });
  };

  return (
    <AnimatePresence>
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 h-10 w-10 bg-surface-soft rounded-full flex items-center justify-center cursor-pointer transition-transform shadow-2xl z-40 hover:scale-110"
        >
          <svg className="w-10 h-10 transform -rotate-90 absolute">
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1.5"
              fill="transparent"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke="#0066b1"
              strokeWidth="1.5"
              fill="transparent"
              strokeDasharray="113.1"
              strokeDashoffset={113.1 - (scrollProgress / 100) * 113.1}
            />
          </svg>
          <ArrowUp className="w-3.5 h-3.5 relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
