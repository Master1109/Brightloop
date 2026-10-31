'use client';
import { useState, useEffect, useRef } from 'react';
import { Layers, ArrowUpRight, Play, BarChart3, CreditCard, TrendingUp, Shield, Zap, Users, ChevronDown, Star, Check, ArrowRight, Menu, X } from 'lucide-react';

const logos = ['HashiCorp', 'Culture Amp', 'Airwallex', 'Entrata', 'Dataminr', 'Attentive'];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2000;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`landing-fade ${visible ? 'landing-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const faqs = [
    { q: 'Can I use Brightloop for commercial purposes?', a: 'Yes! Brightloop is designed for businesses of all sizes. Our subscription management platform helps you track, analyze, and optimize your recurring revenue streams with professional-grade tools.' },
    { q: 'How does the billing automation work?', a: 'Brightloop automatically generates invoices based on your subscription schedules. Billing runs hourly, catches up missed periods, and handles tax calculations, discounts, and partial payments seamlessly.' },
    { q: 'Can I integrate with my existing tools?', a: 'Brightloop provides a comprehensive REST API that integrates with your existing payment gateways, accounting software, and CRM systems. Our webhook system keeps everything in sync.' },
    { q: 'Is my financial data secure?', a: 'Absolutely. We use bank-grade encryption, PostgreSQL with transaction-level locking, JWT authentication, and role-based access control. Your data never leaves your infrastructure.' },
  ];

  return (
    <div className="landing">
      {/* ── Navigation ── */}
      <header className={`landing-nav ${scrolled ? 'landing-nav-scrolled' : ''}`}>
        <div className="landing-container landing-nav-inner">
          <button className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="landing-logo-icon"><Layers size={20} /></span>
            Brightloop
          </button>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#solutions">Solutions</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="landing-nav-actions">
            <button className="landing-btn-ghost" onClick={onGetStarted}>Sign in</button>
            <button className="landing-btn-primary" onClick={onGetStarted}>
              Get started <ArrowUpRight size={16} />
            </button>
          </div>
          <button className="landing-mobile-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle menu">
            {mobileNav ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileNav && (
          <div className="landing-mobile-menu">
            <a href="#features" onClick={() => setMobileNav(false)}>Features</a>
            <a href="#solutions" onClick={() => setMobileNav(false)}>Solutions</a>
            <a href="#testimonials" onClick={() => setMobileNav(false)}>Testimonials</a>
            <a href="#pricing" onClick={() => setMobileNav(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMobileNav(false)}>FAQ</a>
            <button className="landing-btn-primary" onClick={() => { setMobileNav(false); onGetStarted(); }}>
              Get started <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="landing-hero">
        <div className="landing-container">
          <FadeIn className="landing-hero-content">
            <span className="landing-pill">
              <Star size={12} /> #1 Analytics platform
            </span>
            <h1 className="landing-hero-title">
              Boost business<br />with subscription<br />analytics
            </h1>
            <p className="landing-hero-desc">
              Brightloop subscription analytics software is the easiest way to get the insights
              you need to understand your performance and grow your recurring revenue.
            </p>
            <div className="landing-hero-buttons">
              <button className="landing-btn-primary landing-btn-lg" onClick={onGetStarted}>
                Get started <ArrowUpRight size={18} />
              </button>
              <button className="landing-btn-outline landing-btn-lg" onClick={onGetStarted}>
                Contact sales <ArrowRight size={18} />
              </button>
            </div>
            <div className="landing-hero-video-link">
              <span className="landing-play-btn"><Play size={14} /></span>
              <span>Want to see for yourself? Check<br />out our live preview.</span>
            </div>
          </FadeIn>
          <FadeIn className="landing-hero-visual" delay={200}>
            <div className="landing-dashboard-card">
              <div className="landing-dash-header">
                <span>Monthly recurring revenue</span>
                <span className="landing-dash-dots"><i /><i /><i /></span>
              </div>
              <div className="landing-dash-amount">
                <strong>$89,515</strong>
                <span className="landing-dash-growth"><TrendingUp size={14} /> +20.20%</span>
              </div>
              <div className="landing-dash-chart">
                <svg viewBox="0 0 400 120" className="landing-chart-svg">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#176ff2" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#176ff2" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,90 C30,85 60,80 100,70 C140,60 160,75 200,50 C240,25 270,40 300,20 C330,10 370,15 400,5 L400,120 L0,120Z" fill="url(#chartGrad)" />
                  <path d="M0,90 C30,85 60,80 100,70 C140,60 160,75 200,50 C240,25 270,40 300,20 C330,10 370,15 400,5" fill="none" stroke="#176ff2" strokeWidth="2.5" />
                  <circle cx="300" cy="20" r="5" fill="#176ff2" />
                  <circle cx="300" cy="20" r="9" fill="#176ff2" opacity="0.2" className="landing-pulse-dot" />
                </svg>
                <div className="landing-chart-labels">
                  {['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
              <div className="landing-dash-legend">
                <span><i style={{ background: '#176ff2' }} /> Subs</span>
                <span><i style={{ background: '#bca9ed' }} /> Trials</span>
                <span><i style={{ background: '#f0a5cc' }} /> Churn</span>
              </div>
            </div>
            <div className="landing-floating-card landing-float-1">
              <span className="landing-float-icon" style={{ background: '#e1f8eb', color: '#3b8862' }}><TrendingUp size={16} /></span>
              <div>
                <small>Revenue Growth</small>
                <strong>+24.5%</strong>
              </div>
            </div>
            <div className="landing-floating-card landing-float-2">
              <span className="landing-float-icon" style={{ background: '#eaf2ff', color: '#176ff2' }}><Users size={16} /></span>
              <div>
                <small>New Customers</small>
                <strong>+148</strong>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Trusted By ── */}
      <section className="landing-trusted">
        <div className="landing-container">
          <FadeIn>
            <p className="landing-trusted-text">
              <strong>+900 companies</strong> using Brightloop for growth
            </p>
            <div className="landing-logos">
              {logos.map(logo => (
                <span key={logo} className="landing-logo-item">{logo}</span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="landing-features" id="features">
        <div className="landing-container">
          <FadeIn className="landing-features-header">
            <span className="landing-pill"><Star size={12} /> Features</span>
            <h2 className="landing-section-title">
              Make more by knowing<br />what drives growth
            </h2>
            <p className="landing-section-desc">
              We're sick of the seemingly endless number of stale charts and graphs,
              so we work to make our design and interface lively and inspiring.
            </p>
          </FadeIn>
          <div className="landing-features-grid">
            {[
              { icon: BarChart3, title: 'Subscription Analytics', desc: 'Track, analyze, and improve your subscription business with real-time dashboards and intelligent insights.', color: '#176ff2' },
              { icon: CreditCard, title: 'Payment Recovery', desc: 'Get help with failing charges and recover revenue. Track, analyze, and improve your subscription business.', color: '#bca9ed' },
              { icon: Shield, title: 'Cancellation Insights', desc: 'Understand why customers cancel with detailed analytics, automated surveys, and personalized win-back campaigns.', color: '#f0a5cc' },
              { icon: TrendingUp, title: 'Financial Forecasting', desc: 'Make well informed projections for hiring, expansion, and infrastructure improvements using key metrics.', color: '#20a466' },
            ].map((f, i) => (
              <FadeIn key={f.title} className="landing-feature-card" delay={i * 100}>
                <span className="landing-feature-icon" style={{ background: f.color + '15', color: f.color }}>
                  <f.icon size={24} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="landing-feature-metric">
                  <div className="landing-feature-bar">
                    <div className="landing-feature-bar-fill" style={{ width: `${65 + i * 8}%`, background: f.color }} />
                  </div>
                  <div className="landing-feature-stat">
                    <span>Total cancellations</span>
                    <strong>{34 + i * 12}</strong>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solutions / Data-Driven ── */}
      <section className="landing-solutions" id="solutions">
        <div className="landing-container">
          <FadeIn className="landing-solutions-header">
            <span className="landing-pill"><Zap size={12} /> More solutions</span>
            <h2 className="landing-section-title">
              Make more by making data-<br />driven decisions
            </h2>
            <p className="landing-section-desc">
              We're sick of the seemingly endless number of stale charts and graphs,
              so we work to make our design and interface lively and inspiring.
            </p>
          </FadeIn>
          <div className="landing-solutions-grid">
            {[
              { title: 'Revenue churn', value: '5.8%', desc: 'Monitor and reduce revenue churn with detailed cohort analysis.' },
              { title: 'Goals', value: '$89,596', desc: 'Track progress towards goals and rally the team to meet them.' },
              { title: 'Trials conversion rate', value: '64%', desc: 'Convert more trial users with data-driven optimization.' },
              { title: 'Benchmark', value: '1,228', desc: 'Get your metrics in the right context by looking at how you compare.' },
              { title: 'Control centre', value: 'Live', desc: 'The lifeblood of your business — both visible at a glance and thoroughly detailed.' },
              { title: 'Dashboards', value: '12+', desc: 'Dig deep into what\'s driving growth and how it compares to previous months.' },
            ].map((s, i) => (
              <FadeIn key={s.title} className="landing-solution-card" delay={i * 80}>
                <h4>{s.title}</h4>
                <strong>{s.value}</strong>
                <p>{s.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Easy Track Banner ── */}
      <section className="landing-banner">
        <div className="landing-container">
          <FadeIn className="landing-banner-inner">
            <div className="landing-banner-content">
              <h2>Easily track your<br />business with a<br />single click</h2>
              <p>
                Brightloop is a SaaS for SaaS subscription analytics and revenue
                optimization built to help growing subscription businesses.
              </p>
              <button className="landing-btn-primary landing-btn-lg" onClick={onGetStarted}>
                Get started <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="landing-banner-visual">
              <div className="landing-banner-cards">
                <div className="landing-mini-stat">
                  <small>Monthly Revenue</small>
                  <strong>$89,596</strong>
                  <span className="landing-dash-growth"><TrendingUp size={12} /> +18.2%</span>
                </div>
                <div className="landing-mini-stat">
                  <small>Active Subscriptions</small>
                  <strong>2,451</strong>
                  <span className="landing-dash-growth"><TrendingUp size={12} /> +12.8%</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="landing-testimonials" id="testimonials">
        <div className="landing-container">
          <FadeIn>
            <span className="landing-pill"><Star size={12} /> Client satisfaction</span>
            <h2 className="landing-section-title">What our clients say</h2>
          </FadeIn>
          <div className="landing-testimonials-grid">
            {[
              { name: 'Selma Knight', role: 'CTO at Finops Inc', quote: 'Dig deep into the details of what\'s driving growth and how it compares to previous months.' },
              { name: 'Mavis Barry', role: 'CEO and Founder at Orbit', quote: 'Dig deep into the details of what\'s driving growth and how it compares to previous months.' },
              { name: 'Priya Shah', role: 'Head of Revenue at Layers', quote: 'Dig deep into the details of what\'s driving growth and how it compares to previous months.' },
              { name: 'James Wilson', role: 'VP Finance at Northstar', quote: 'Dig deep into the details of what\'s driving growth and how it compares to previous months.' },
              { name: 'Alex Morgan', role: 'COO at Forma Digital', quote: 'Dig deep into the details of what\'s driving growth and how it compares to previous months.' },
              { name: 'Maya Patel', role: 'Director at Mint & Co', quote: 'Dig deep into the details of what\'s driving growth and how it compares to previous months.' },
            ].map((t, i) => (
              <FadeIn key={t.name} className="landing-testimonial" delay={i * 80}>
                <div className="landing-testimonial-header">
                  <span className={`landing-testimonial-avatar pastel-${i % 4}`}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </span>
                  <div>
                    <strong>{t.name}</strong>
                    <small>{t.role}</small>
                  </div>
                </div>
                <p className="landing-testimonial-title">&ldquo;DIG DEEP INTO THE DETAILS&rdquo;</p>
                <p className="landing-testimonial-text">&ldquo;{t.quote}&rdquo;</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Case Study ── */}
      <section className="landing-casestudy">
        <div className="landing-container">
          <FadeIn className="landing-casestudy-inner">
            <div className="landing-casestudy-content">
              <span className="landing-pill"><Zap size={12} /> Case study</span>
              <h2>Learn why your<br />customers cancel<br />Subscriptions</h2>
              <p>
                Start collecting valuable feedback in minutes, learn how much
                revenue you're losing to each reason, then automatically send
                personalized emails to bring them back.
              </p>
              <div className="landing-casestudy-buttons">
                <button className="landing-btn-outline" onClick={onGetStarted}>View case study <ArrowRight size={16} /></button>
                <button className="landing-btn-ghost" onClick={onGetStarted}>Contact sales <ArrowRight size={16} /></button>
              </div>
              <div className="landing-casestudy-quote">
                <p>&ldquo;The Cancellation Insights feature is a no-brainer. It replaced our in-house solution in less than an hour, and it provides exactly the insights we need.&rdquo;</p>
                <div className="landing-casestudy-author">
                  <span className="landing-testimonial-avatar pastel-2">RF</span>
                  <div>
                    <strong>Rose Flores</strong>
                    <small>COO, Partner at Artemis Group</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-casestudy-visual">
              <div className="landing-cancel-chart">
                <div className="landing-cancel-label">Process</div>
                <div className="landing-cancel-circle">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#eceef2" strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#176ff2" strokeWidth="8"
                      strokeDasharray={`${52 * 2 * Math.PI * 0.5} ${52 * 2 * Math.PI * 0.5}`}
                      strokeLinecap="round" transform="rotate(-90 60 60)" className="landing-circle-anim" />
                  </svg>
                  <span>50%</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Trusted Worldwide ── */}
      <section className="landing-worldwide" id="pricing">
        <div className="landing-container">
          <FadeIn>
            <span className="landing-pill"><Star size={12} /> Review rating</span>
            <h2 className="landing-section-title">Trusted Worldwide</h2>
            <p className="landing-section-desc">
              Brightloop is a highly-rated platform loved by users for its exceptional reliability,
              performance, and user-friendly design.
            </p>
          </FadeIn>
          <div className="landing-reviews-grid">
            {[
              { name: 'Airwallex', quote: 'This is exactly what our product team needed. We have great achievements made together.' },
              { name: 'Covetrus', quote: 'I\'m a product designer and a frontend professional. Focused on the development of products and services.' },
              { name: 'Fanduel', quote: 'We could never have imagined that the Agency wasn\'t gameplay that led this agency aren\'t the same.' },
            ].map((r, i) => (
              <FadeIn key={r.name} className="landing-review-card" delay={i * 100}>
                <div className="landing-review-stars">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="#f5af32" color="#f5af32" />)}
                </div>
                <strong>{r.name}</strong>
                <p>&ldquo;{r.quote}&rdquo;</p>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="landing-stats-row">
            <div className="landing-stat">
              <strong><AnimatedCounter target={45} suffix="+" /></strong>
              <span>Happy customers</span>
            </div>
            <div className="landing-stat">
              <strong><AnimatedCounter target={5} suffix="K+" /></strong>
              <span>Active subscriptions</span>
            </div>
            <div className="landing-stat">
              <strong><AnimatedCounter target={4} suffix=".8" /></strong>
              <div className="landing-stat-stars">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill="#f5af32" color="#f5af32" />)}
              </div>
              <span>Average rating</span>
            </div>
            <div className="landing-stat">
              <strong>4.8</strong>
              <div className="landing-stat-stars">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill="#f5af32" color="#f5af32" />)}
              </div>
              <span>User satisfaction</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="landing-faq" id="faq">
        <div className="landing-container">
          <FadeIn className="landing-faq-header">
            <span className="landing-pill"><Zap size={12} /> Frequently asked questions</span>
            <h2 className="landing-section-title">Questions &amp; answer</h2>
            <p className="landing-section-desc">Can't find what you're looking for?</p>
            <button className="landing-btn-primary" onClick={onGetStarted}>Contact us</button>
          </FadeIn>
          <FadeIn className="landing-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`landing-faq-item ${activeFaq === i ? 'landing-faq-open' : ''}`}>
                <button className="landing-faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <ChevronDown size={20} className={`landing-faq-chevron ${activeFaq === i ? 'landing-faq-rotated' : ''}`} />
                </button>
                <div className="landing-faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-container">
          <FadeIn className="landing-cta-inner">
            <h2>Get Brightloop for your company</h2>
            <p>Metrics, tracking, and engagement tools for SaaS &amp; subscription businesses.</p>
            <button className="landing-btn-primary landing-btn-lg" onClick={onGetStarted}>
              Get started <ArrowUpRight size={18} />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <button className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <span className="landing-logo-icon"><Layers size={18} /></span>
                Brightloop
              </button>
              <p>Subscription analytics and revenue optimization for modern businesses.</p>
            </div>
            {[
              { title: 'Features', links: ['Analytics', 'Recovery', 'Forecasting', 'Reports'] },
              { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
              { title: 'Support', links: ['Help Center', 'API Docs', 'Status', 'Contact'] },
            ].map(col => (
              <div key={col.title} className="landing-footer-col">
                <h4>{col.title}</h4>
                {col.links.map(l => <a key={l} href="#">{l}</a>)}
              </div>
            ))}
          </div>
          <div className="landing-footer-bottom">
            <span>© 2026 Brightloop Inc.</span>
            <span>Built with clarity in mind. <a href="#">Back to top ↑</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

