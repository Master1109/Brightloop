'use client';

import { useEffect, useState, useCallback } from 'react';

// Word sequence matching the kinetic typography in the reference video
const WORD_SEQUENCE = [
  { text: 'METRICS', outlined: [1, 4] },
  { text: 'BILLING', outlined: [2, 5] },
  { text: 'REVENUE', outlined: [1, 3] },
  { text: 'BRIGHTLOOP', outlined: [2, 5, 8] },
];

export default function Preloader() {
  const [mounted, setMounted] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [letters, setLetters] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [destroyed, setDestroyed] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setDestroyed(true);
      try {
        sessionStorage.setItem('bl_preloaded', 'true');
      } catch {}
    }, 800);
  }, []);

  useEffect(() => {
    // Check if already shown in this session
    try {
      if (sessionStorage.getItem('bl_preloaded') === 'true') {
        setDestroyed(true);
        return;
      }
    } catch {}

    setMounted(true);

    // Lock body scroll during preloader
    document.body.classList.add('preloader-locked');

    // Progress counter ticker
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 35);

    // Word cycling sequence (timing: ~450ms per word)
    const timers: NodeJS.Timeout[] = [];

    // Word 0: METRICS
    setLetters(WORD_SEQUENCE[0].text.split(''));

    // Word 1: BILLING (at 500ms)
    timers.push(
      setTimeout(() => {
        setWordIdx(1);
        setLetters(WORD_SEQUENCE[1].text.split(''));
      }, 500)
    );

    // Word 2: REVENUE (at 1000ms)
    timers.push(
      setTimeout(() => {
        setWordIdx(2);
        setLetters(WORD_SEQUENCE[2].text.split(''));
      }, 1000)
    );

    // Word 3: BRIGHTLOOP (at 1500ms)
    timers.push(
      setTimeout(() => {
        setWordIdx(3);
        setLetters(WORD_SEQUENCE[3].text.split(''));
      }, 1500)
    );

    // Exit transition (at 2300ms)
    timers.push(
      setTimeout(() => {
        dismiss();
      }, 2300)
    );

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
      document.body.classList.remove('preloader-locked');
    };
  }, [dismiss]);

  useEffect(() => {
    if (destroyed) {
      document.body.classList.remove('preloader-locked');
    }
  }, [destroyed]);

  if (!mounted || destroyed) return null;

  const currentObj = WORD_SEQUENCE[wordIdx] || WORD_SEQUENCE[0];
  const outlinedIndices = new Set(currentObj.outlined);

  return (
    <div
      className={`bl-preloader ${exiting ? 'bl-preloader-exit' : ''}`}
      onClick={dismiss}
      role="status"
      aria-live="polite"
      aria-label="Loading Brightloop"
    >
      {/* Background glow and grain accents */}
      <div className="bl-preloader-glow" />

      {/* Top bar info */}
      <div className="bl-preloader-top">
        <span className="bl-preloader-brand">
          <span className="bl-preloader-dot" />
          BRIGHTLOOP®
        </span>
        <span className="bl-preloader-skip">Click anywhere to skip</span>
      </div>

      {/* Center stage kinetic typography */}
      <div className="bl-preloader-center">
        <div className="bl-preloader-word">
          {letters.map((char, i) => {
            const isOutlined = outlinedIndices.has(i);
            return (
              <span
                key={`${wordIdx}-${i}-${char}`}
                className={`bl-preloader-char ${isOutlined ? 'is-outlined' : 'is-solid'}`}
                style={{
                  animationDelay: `${i * 35}ms`,
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom bar telemetry */}
      <div className="bl-preloader-bot">
        <span className="bl-preloader-tag">REVENUE &amp; SUBSCRIPTION INTELLIGENCE</span>
        <div className="bl-preloader-meter">
          <div className="bl-preloader-bar-bg">
            <div
              className="bl-preloader-bar"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <span className="bl-preloader-percent">
            {String(Math.min(100, progress)).padStart(2, '0')}%
          </span>
        </div>
      </div>
    </div>
  );
}
