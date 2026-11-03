'use client';
import { useEffect, useRef, useState } from 'react';
import { Infinity as LoopIcon } from 'lucide-react';
import './bl-theme.css';

/** Fires once when the element scrolls into view. */
export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, seen };
}

/** Wrapper that adds `is-in` once visible, so CSS can drive the animation. */
export function Reveal({
  children, className = '', delay = 0, as: Tag = 'div',
}: { children: React.ReactNode; className?: string; delay?: number; as?: any }) {
  const { ref, seen } = useInView<HTMLDivElement>(0.15);
  return (
    <Tag ref={ref} className={`bl-reveal ${seen ? 'is-in' : ''} ${className}`} style={{ ['--d' as any]: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Counts up to `to` when `run` becomes true. */
export function CountUp({
  to, run = true, decimals = 0, prefix = '', suffix = '', duration = 1600,
}: { to: number; run?: boolean; decimals?: number; prefix?: string; suffix?: string; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    let raf = 0; let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / duration, 1);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, duration]);
  const text = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <>{prefix}{text}{suffix}</>;
}

export function Logo({ onClick, light = false }: { onClick?: () => void; light?: boolean }) {
  return (
    <button type="button" className={`bl-logo ${light ? 'bl-logo-light' : ''}`} onClick={onClick} aria-label="Brightloop home">
      <span className="bl-logo-mark"><img src="/logo.png" alt="Brightloop" width={28} height={28} style={{ objectFit: 'contain', width: '100%', height: '100%', display: 'block' }} /></span>
      Brightloop
    </button>
  );
}

/** Decorative scattered squares, like the pixel blocks in the reference. */
export function Pixels({ items }: { items: { x: string; y: string; s: number; d?: number }[] }) {
  return (
    <>
      {items.map((p, i) => (
        <i key={i} className="bl-pixel" aria-hidden style={{ left: p.x, top: p.y, width: p.s, height: p.s, animationDelay: `${p.d ?? i * 0.7}s` }} />
      ))}
    </>
  );
}

const BARS = [
  { m: 'Aug', h: 66 }, { m: 'Sep', h: 88 }, { m: 'Oct', h: 78 }, { m: 'Nov', h: 150 },
  { m: 'Dec', h: 84 }, { m: 'Jan', h: 92 }, { m: 'Feb', h: 78 }, { m: 'Mar', h: 98 },
];
const LINE = [92, 72, 80, 44, 76, 66, 82, 58];
const K = 1.3; // vertical scale
const BASE = 206;
const ly = (y: number) => BASE - (160 - y) * K;

/** Gradient glass panel with the MRR card, animated bar + line chart and orbit ring. */
export function HeroPanel({ compact = false }: { compact?: boolean }) {
  const { ref, seen } = useInView<HTMLDivElement>(0.1);
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 150); return () => clearTimeout(t); }, []);
  const run = go || seen;
  const pts = LINE.map((y, i) => [34 + i * 44, ly(y)] as const);
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  return (
    <div ref={ref} className={`bl-panel ${compact ? 'bl-panel-compact' : ''} ${run ? 'is-in' : ''}`}>
      <Pixels items={[{ x: '8%', y: '12%', s: 16 }, { x: '86%', y: '70%', s: 12 }, { x: '14%', y: '82%', s: 10 }, { x: '90%', y: '16%', s: 8 }]} />
      <div className="bl-orbit" aria-hidden>
        <span className="bl-orbit-spin"><b /></span>
        <span className="bl-orbit-dot" />
      </div>

      <div className="bl-mrr">
        <div className="bl-mrr-label">Monthly recurring revenue</div>
        <div className="bl-mrr-row">
          <strong>$<CountUp to={89515} run={run} /></strong>
          <span className="bl-up"><i />+<CountUp to={20.2} run={run} decimals={2} />%</span>
        </div>
      </div>

      <div className="bl-chart-card">
        <div className="bl-chart-tip">
          <small>November 2026</small>
          <span><i style={{ background: '#5b4bff' }} />Goal</span>
          <span><i style={{ background: '#ff6b3d' }} />Month</span>
        </div>
        <svg viewBox="0 0 380 238" role="img" aria-label="Monthly recurring revenue by month">
          <defs>
            <linearGradient id="blBarHi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7a6cff" /><stop offset="1" stopColor="#c9c3ff" />
            </linearGradient>
            <linearGradient id="blBarLo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ececf2" /><stop offset="1" stopColor="#f7f7fa" />
            </linearGradient>
          </defs>
          {BARS.map((b, i) => (
            <rect key={b.m} className="bl-bar" x={20 + i * 44} y={BASE - b.h * K} width={28} height={b.h * K} rx={6}
              fill={b.m === 'Nov' ? 'url(#blBarHi)' : 'url(#blBarLo)'} style={{ animationDelay: `${0.25 + i * 0.07}s` }} />
          ))}
          <path className="bl-line" d={path} pathLength={1} fill="none" stroke="#ff6b3d" strokeWidth={2} strokeLinejoin="round" />
          {pts.map(([x, y], i) => (
            <circle key={i} className="bl-dot" cx={x} cy={y} r={i === 3 ? 5 : 3.4} fill="#fff" stroke="#ff6b3d" strokeWidth={2}
              style={{ animationDelay: `${0.9 + i * 0.06}s` }} />
          ))}
          {BARS.map((b, i) => (
            <text key={b.m} x={34 + i * 44} y={230} textAnchor="middle" fontSize={10} fill="#9a98b5">{b.m}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}
