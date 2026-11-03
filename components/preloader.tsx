'use client';

import { useEffect, useState, useCallback } from 'react';

// Word sequence matching the kinetic typography in the reference video
const SEQUENCE = [
  { text: 'METRICS', outlined: [1, 4], theme: 'light' },
  { text: 'REVENUE', outlined: [2, 5], theme: 'light' },
  { text: 'BRIGHTLOOP', outlined: [2, 6, 8], theme: 'dark' },
];

export default function Preloader() {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [destroyed, setDestroyed] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setDestroyed(true);
      try {
        sessionStorage.setItem('bl_preloaded', 'true');
      } catch {}
    }, 750);
  }, []);

  useEffect(() => {
    // If already preloaded in this session, destroy immediately
    try {
      if (sessionStorage.getItem('bl_preloaded') === 'true') {
        setDestroyed(true);
        return;
      }
    } catch {}

    document.body.classList.add('preloader-locked');

    // Cinematic word transitions
    const t1 = setTimeout(() => setStep(1), 480);
    const t2 = setTimeout(() => setStep(2), 960);
    const t3 = setTimeout(() => dismiss(), 1750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      document.body.classList.remove('preloader-locked');
    };
  }, [dismiss]);

  useEffect(() => {
    if (destroyed) {
      document.body.classList.remove('preloader-locked');
    }
  }, [destroyed]);

  if (destroyed) return null;

  const current = SEQUENCE[step] || SEQUENCE[0];
  const outlinedSet = new Set(current.outlined);
  const isFinalStep = step === 2;

  // IMPORTANT: Renders HTML on the server and client from frame 0
  // Zero hydration delay - never flashes landing page!
  return (
    <div
      id="bl-preloader"
      className={`bl-preloader ${exiting ? 'bl-preloader-exit' : ''}`}
      onClick={dismiss}
      role="status"
      aria-label="Loading Brightloop"
      suppressHydrationWarning
    >
      <div className="bl-preloader-center">
        <div className={`bl-preloader-word ${current.theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
          {current.text.split('').map((char, i) => {
            const isOutlined = outlinedSet.has(i);
            return (
              <span
                key={`${step}-${i}-${char}`}
                className={`bl-preloader-char ${isOutlined ? 'is-outlined' : 'is-solid'}`}
                style={{
                  animationDelay: `${i * 25}ms`,
                }}
              >
                {char}
              </span>
            );
          })}
          {isFinalStep && (
            <span
              className="bl-preloader-char bl-preloader-mark"
              style={{ animationDelay: `${current.text.length * 25}ms` }}
            >
              !
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
