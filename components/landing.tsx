'use client';
import { useEffect, useState } from 'react';
import {
  ArrowRight, ChevronDown, Menu, Play, Plus, Star, X, BarChart3, CreditCard, LineChart,
  PieChart, Wallet, Receipt, Landmark, Target, Sparkles, Users, TrendingUp,
} from 'lucide-react';
import { CountUp, HeroPanel, Logo, Pixels, Reveal, useInView } from './bl-shared';

const logos = ['HashiCorp', 'Culture Amp', 'Airwallex', 'Entrata', 'Dataminr', 'Attentive'];

const faqs = [
  { q: 'Can I use Brightloop for commercial purposes?', a: 'Yes. Brightloop is built for businesses of every size that sell on a recurring basis. Track subscriptions, invoices and payments for all your customers in one workspace.' },
  { q: 'How does billing automation work?', a: 'Invoices are generated from each subscription’s schedule. Billing runs hourly, catches up on missed periods, and applies taxes, discounts and partial payments for you.' },
  { q: 'Can I connect my existing tools?', a: 'Brightloop exposes a REST API that works with your payment gateways, accounting software and CRM, and webhooks keep everything in sync.' },
  { q: 'Is my financial data secure?', a: 'Yes. Sessions use JWT authentication, access is role-based, and every billing change runs inside a locked database transaction.' },
];

const testimonials = [
  { n: 'Selma Knight', r: 'COO and Founder at Lakeo', t: 'Renewals finally have an owner', q: 'We see every upcoming renewal and failed charge in one place, so nothing slips past us at month end.' },
  { n: 'Mavis Barry', r: 'COO and Founder at Lakeo', t: 'Churn reasons in plain sight', q: 'Cancellation reasons are grouped by revenue lost, which made our retention priorities obvious in a single meeting.' },
  { n: 'Priya Shah', r: 'Head of Revenue at Layers', t: 'Forecasts the team trusts', q: 'The forecast uses real subscription data, so hiring and budget talks start from numbers everyone agrees on.' },
  { n: 'James Wilson', r: 'VP Finance at Northstar', t: 'Invoices without the chasing', q: 'Automated invoices and payment recovery cut our manual follow-ups to almost nothing within the first month.' },
  { n: 'Alex Morgan', r: 'COO at Forma Digital', t: 'Setup took an afternoon', q: 'Plans, taxes and discounts were configured the same day, and our first cycle billed correctly.' },
  { n: 'Maya Patel', r: 'Director at Mint & Co', t: 'One dashboard for everyone', q: 'Finance, sales and support all read the same dashboard now, so we stopped reconciling spreadsheets.' },
];

const pastel = ['#ffd9cc', '#d9d4ff', '#cfe8ff', '#ffe7b8'];

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="bl-pill"><i />{children}</span>;
}

function Segments({ total, filled, color, seen }: { total: number; filled: number; color: 'orange' | 'purple'; seen: boolean }) {
  return (
    <div className={`bl-seg bl-seg-${color} ${seen ? 'is-in' : ''}`} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < filled ? 'on' : ''} style={{ ['--i' as any]: i }} />
      ))}
    </div>
  );
}

export default function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  const [menu, setMenu] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);
  const feat = useInView<HTMLDivElement>(0.25);
  const rec = useInView<HTMLDivElement>(0.3);
  const canc = useInView<HTMLDivElement>(0.3);
  const cs = useInView<HTMLDivElement>(0.35);
  const stats = useInView<HTMLDivElement>(0.4);

  useEffect(() => {
    const on = () => setStuck(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const links: [string, string][] = [['Features', '#features'], ['Solutions', '#solutions'], ['Testimonials', '#testimonials'], ['Pricing', '#pricing'], ['FAQ', '#faq']];

  return (
    <div className="bl">
      {/* ───────── Nav ───────── */}
      <header className={`bl-nav ${stuck ? 'is-stuck' : ''}`}>
        <div className="bl-wrap bl-nav-in">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <nav className="bl-nav-links" aria-label="Primary">
            {links.map(([l, h]) => <a key={l} href={h}>{l}</a>)}
          </nav>
          <div className="bl-nav-cta">
            <button className="bl-link" onClick={onGetStarted}>Sign in</button>
            <button className="bl-btn bl-btn-dark bl-btn-sm" onClick={onGetStarted}>Get started <ArrowRight size={14} /></button>
          </div>
          <button className="bl-burger" aria-label="Toggle menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menu && (
          <div className="bl-drawer">
            {links.map(([l, h]) => <a key={l} href={h} onClick={() => setMenu(false)}>{l}</a>)}
            <button className="bl-btn bl-btn-dark" onClick={() => { setMenu(false); onGetStarted(); }}>Get started <ArrowRight size={16} /></button>
          </div>
        )}
      </header>

      {/* ───────── Hero ───────── */}
      <section className="bl-hero">
        <Pixels items={[{ x: '47%', y: '8%', s: 34 }, { x: '3%', y: '26%', s: 26 }, { x: '44%', y: '52%', s: 22 }, { x: '40%', y: '30%', s: 18 }, { x: '8%', y: '70%', s: 30 }]} />
        <div className="bl-wrap bl-hero-grid">
          <div className="bl-hero-copy">
            <Pill>#1 Analytics platform</Pill>
            <h1>
              <span>Boost business</span>
              <span>with subscription</span>
              <span>analytics</span>
            </h1>
            <p>Brightloop subscription analytics software is the easiest way to get the insights you need to understand your performance and grow recurring revenue.</p>
            <div className="bl-hero-btns">
              <button className="bl-btn bl-btn-dark" onClick={onGetStarted}>Get started</button>
              <button className="bl-btn bl-btn-light" onClick={onGetStarted}>Contact sales <ArrowRight size={14} /></button>
            </div>
            <button className="bl-preview" onClick={onGetStarted}>
              <span className="bl-preview-txt">Want to see for yourself? Check out our live preview.</span>
              <span className="bl-play"><Play size={14} fill="currentColor" /></span>
            </button>
          </div>
          <div className="bl-hero-visual">
            <div className="bl-hero-signin">
              <button className="bl-link" onClick={onGetStarted}>Sign in</button>
              <button className="bl-btn bl-btn-dark bl-btn-xs" onClick={onGetStarted}>Get started <ArrowRight size={12} /></button>
            </div>
            <HeroPanel />
          </div>
        </div>
      </section>

      {/* ───────── Logos ───────── */}
      <section className="bl-logos">
        <Reveal className="bl-wrap">
          <p><strong>+900 companies</strong> using Brightloop for growth</p>
          <div className="bl-logo-row">
            {logos.map(l => <span key={l}>{l}</span>)}
          </div>
        </Reveal>
      </section>

      {/* ───────── Features ───────── */}
      <section className="bl-section" id="features">
        <div className="bl-wrap">
          <Reveal className="bl-head bl-head-split">
            <div>
              <Pill>Features</Pill>
              <h2>Make more by knowing what drives growth</h2>
            </div>
            <p>We’re tired of endless stale charts and graphs, so we designed Brightloop to feel lively and to show what is actually moving your revenue.</p>
          </Reveal>

          <div className="bl-feat-grid" ref={feat.ref}>
            <Reveal className="bl-card bl-card-a">
              <div className="bl-card-stage">
                <span className="bl-chip">Real time analytics</span>
                <div className="bl-mini">
                  <div className="bl-mini-top"><small>Active subscriptions</small></div>
                  <div className="bl-mini-num"><CountUp to={1228} run={feat.seen} /><span>/1,928</span></div>
                  <Segments total={34} filled={22} color="orange" seen={feat.seen} />
                  <div className="bl-mini-top bl-gap"><small>Trials running</small></div>
                  <div className="bl-mini-num"><CountUp to={600} run={feat.seen} /><span>/1,928</span></div>
                  <Segments total={34} filled={11} color="purple" seen={feat.seen} />
                </div>
              </div>
              <h3>Subscription Analytics</h3>
              <p>Track, analyze and improve your subscription business with live dashboards.</p>
              <span className="bl-corner"><BarChart3 size={16} /></span>
            </Reveal>

            <Reveal className="bl-card bl-card-b" delay={90}>
              <div className="bl-card-stage" ref={rec.ref}>
                <div className="bl-mini bl-mini-wide">
                  <div className="bl-mini-top"><small>Lifetime</small><span className="bl-select">Yearly <ChevronDown size={10} /></span></div>
                  <div className="bl-recover">
                    <div>
                      <div className="bl-money">$<CountUp to={289265.22} run={rec.seen} decimals={2} /></div>
                      <small>Failed charges</small>
                    </div>
                    <div className={`bl-donut ${rec.seen ? 'is-in' : ''}`}>
                      <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="16" className="t" /><circle cx="22" cy="22" r="16" className="a" pathLength={100} /></svg>
                      <b>80%</b>
                    </div>
                  </div>
                  <ul className="bl-reasons">
                    <li><span>Declined</span><i style={{ ['--w' as any]: '86%' }} /></li>
                    <li><span>Insufficient</span><i style={{ ['--w' as any]: '54%' }} /></li>
                  </ul>
                </div>
              </div>
              <h3>Payment Recovery</h3>
              <p>Get help with failing charges and win back revenue you would otherwise lose.</p>
              <span className="bl-corner"><CreditCard size={16} /></span>
            </Reveal>

            <Reveal className="bl-card bl-card-c">
              <div className="bl-card-stage" ref={canc.ref}>
                <div className="bl-split">
                  <div className="bl-mini">
                    <small>Total cancellations</small>
                    <div className="bl-mini-num">34<span>/100</span></div>
                    <div className={`bl-hbars ${canc.seen ? 'is-in' : ''}`}>
                      <div><i className="p" style={{ ['--w' as any]: '47%' }} /><b>47%</b></div>
                      <div><i style={{ ['--w' as any]: '30%' }} /><b>17.8%</b></div>
                      <div><i style={{ ['--w' as any]: '18%' }} /><b>16.8%</b></div>
                    </div>
                  </div>
                  <div className="bl-mini">
                    <small>Total income</small>
                    <div className="bl-mini-num">$8,105</div>
                    <svg viewBox="0 0 160 60" className={`bl-spark ${canc.seen ? 'is-in' : ''}`}>
                      <path d="M0,44 C20,40 30,20 52,26 S86,52 106,30 S140,8 160,16" pathLength={1} />
                    </svg>
                  </div>
                </div>
              </div>
              <h3>Cancellation Insights</h3>
              <p>Gain insights into why customers cancel and reduce churn with every release.</p>
              <span className="bl-corner"><PieChart size={16} /></span>
            </Reveal>

            <Reveal className="bl-card bl-card-d" delay={90}>
              <div className="bl-card-stage">
                <div className="bl-tiles">
                  <span><Landmark size={18} /><small>Balance sheets</small></span>
                  <span><Wallet size={18} /><small>Cash flow</small></span>
                  <span><Receipt size={18} /><small>Profit and loss</small></span>
                </div>
              </div>
              <h3>Financial Forecasting</h3>
              <p>Make future planning simple with accurate financial forecasts.</p>
              <span className="bl-corner"><LineChart size={16} /></span>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Banner ───────── */}
      <section className="bl-banner">
        <Pixels items={[{ x: '6%', y: '20%', s: 36 }, { x: '14%', y: '64%', s: 22 }, { x: '90%', y: '30%', s: 28 }]} />
        <Reveal className="bl-wrap bl-banner-in">
          <h2>Easily track your business with a single click</h2>
          <div className="bl-banner-form">
            <p>We’re building the subscription platform you’ve always wanted. One click and you get hundreds of insights.</p>
            <label htmlFor="bl-notify">Get notified on new integrations</label>
            <form onSubmit={e => { e.preventDefault(); if (email) setNotified(true); }}>
              <input id="bl-notify" type="email" required placeholder="Enter your email" value={email} onChange={e => { setEmail(e.target.value); setNotified(false); }} />
              <button className="bl-btn bl-btn-brand" type="submit">{notified ? 'You’re on the list' : 'Notify me'}</button>
            </form>
          </div>
        </Reveal>
        <div className="bl-wrap bl-banner-logos">{logos.map(l => <span key={l}>{l}</span>)}</div>
      </section>

      {/* ───────── Solutions ───────── */}
      <section className="bl-section" id="solutions">
        <div className="bl-wrap">
          <Reveal className="bl-head bl-head-center">
            <Pill>More solutions</Pill>
            <h2>Make more by making data-driven decisions</h2>
            <p>We’re tired of endless stale charts and graphs, so we designed Brightloop to be lively, clear and easy to act on.</p>
          </Reveal>
          <div className="bl-sol-grid">
            <Reveal className="bl-card bl-sol">
              <div className="bl-card-stage">
                <div className="bl-mini">
                  <div className="bl-mini-top"><small>Revenue churn</small><span className="bl-up bl-up-sm"><i />5.8%</span></div>
                  <div className="bl-stack">
                    <span className="a" /><span className="b" /><span className="c" />
                  </div>
                </div>
              </div>
              <h3>Benchmark</h3>
              <p>Get your metrics in the right context by looking at how you compare with other companies like you.</p>
            </Reveal>
            <Reveal className="bl-card bl-sol" delay={80}>
              <div className="bl-card-stage">
                <div className="bl-mini">
                  <div className="bl-mini-top"><small>Goal</small><b className="bl-goal">$450,000</b></div>
                  <div className="bl-meter"><i /></div>
                  <div className="bl-mini-num bl-mt">$89,596</div>
                  <small>Monthly recurring revenue</small>
                </div>
              </div>
              <h3>Goals</h3>
              <p>Track progress towards your goals and rally the team to meet them.</p>
            </Reveal>
            <Reveal className="bl-card bl-sol" delay={160}>
              <div className="bl-card-stage bl-center">
                <div className="bl-cross"><Plus size={26} strokeWidth={2.4} /></div>
                <div className="bl-trio"><span><b>8.5%</b><small>Conversion</small></span><span><b>13d</b><small>Avg. trial</small></span><span><b>225</b><small>Trials</small></span></div>
              </div>
              <h3>Trials insights</h3>
              <p>Add notes to see how well new campaigns, experiments and enhancements improve key metrics.</p>
            </Reveal>
            <Reveal className="bl-card bl-sol">
              <div className="bl-card-stage">
                <div className="bl-events">
                  <div><span className="e1"><Sparkles size={13} /></span><p><b>New trial</b><small>Signed up for enterprise</small></p></div>
                  <div><span className="e2"><CreditCard size={13} /></span><p><b>Payment</b><small>Received for $53.00</small></p></div>
                </div>
              </div>
              <h3>Control centre</h3>
              <p>The lifeblood of your business, visible at a glance and thoroughly detailed.</p>
            </Reveal>
            <Reveal className="bl-card bl-sol" delay={80}>
              <div className="bl-card-stage">
                <div className="bl-mini">
                  <small>Rating point</small>
                  <div className="bl-mini-num">1,228<span>/1,928</span></div>
                  <svg viewBox="0 0 220 60" className="bl-wave"><path d="M0,34 C28,34 36,14 62,18 S100,50 128,34 S176,6 220,22" pathLength={1} /></svg>
                </div>
              </div>
              <h3>Dashboards</h3>
              <p>Dig into the details of what’s driving growth and how it compares to previous months.</p>
            </Reveal>
            <Reveal className="bl-card bl-sol" delay={160}>
              <div className="bl-card-stage bl-center">
                <div className="bl-forecast">
                  <span className="bl-fc-main"><Users size={20} /></span>
                  <em style={{ ['--a' as any]: '-100px' }}>Cash flow</em>
                  <em style={{ ['--a' as any]: '100px' }}>Hiring</em>
                </div>
              </div>
              <h3>Forecast</h3>
              <p>Make well-informed projections for hiring, expansion and departmental budgets.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section className="bl-section bl-soft" id="testimonials">
        <Pixels items={[{ x: '4%', y: '14%', s: 28 }, { x: '94%', y: '40%', s: 22 }]} />
        <div className="bl-wrap">
          <Reveal className="bl-head bl-head-center">
            <Pill>Client satisfaction</Pill>
            <h2>What our clients say</h2>
          </Reveal>
          <div className="bl-quotes">
            {testimonials.map((t, i) => (
              <Reveal key={t.n} className="bl-quote" delay={(i % 3) * 90}>
                <div className="bl-quote-who">
                  <span className="bl-ava" style={{ background: pastel[i % 4] }}>{t.n.split(' ').map(x => x[0]).join('')}</span>
                  <p><b>{t.n}</b><small>{t.r}</small></p>
                </div>
                <h4>{t.t}</h4>
                <p className="bl-quote-body">“{t.q}”</p>
              </Reveal>
            ))}
          </div>
          <div className="bl-center-btn"><button className="bl-btn bl-btn-dark bl-btn-sm" onClick={onGetStarted}>Get started now</button></div>
        </div>
      </section>

      {/* ───────── Case study ───────── */}
      <section className="bl-section">
        <div className="bl-wrap">
          <Reveal className="bl-case">
            <div className="bl-case-copy">
              <Pill>Case study</Pill>
              <h2>Learn why your customers cancel subscriptions</h2>
              <p>Start collecting feedback in minutes, see how much revenue you lose to each reason, then send personalised emails that bring customers back.</p>
              <div className="bl-hero-btns">
                <button className="bl-btn bl-btn-dark bl-btn-sm" onClick={onGetStarted}>View case study</button>
                <button className="bl-btn bl-btn-light bl-btn-sm" onClick={onGetStarted}>Contact sales <ArrowRight size={13} /></button>
              </div>
              <blockquote>
                “The Cancellation Insights feature is a no-brainer. It replaced our in-house solution in under an hour and gives us exactly the insight we need.”
                <footer><span className="bl-ava" style={{ background: pastel[1] }}>RH</span><p><b>Rose Hines</b><small>COO and Founder at Artemis Group</small></p></footer>
              </blockquote>
            </div>
            <div className="bl-case-visual" ref={cs.ref}>
              <Pixels items={[{ x: '10%', y: '14%', s: 14 }, { x: '84%', y: '78%', s: 18 }]} />
              <div className="bl-phone">
                <div className="bl-phone-top"><span /><small>Process</small><span /></div>
                <div className={`bl-ring ${cs.seen ? 'is-in' : ''}`}>
                  <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" className="t" /><circle cx="60" cy="60" r="50" className="a" pathLength={100} /></svg>
                  <b><CountUp to={50} run={cs.seen} suffix="%" /></b>
                </div>
                <div className="bl-confirm">
                  <p>Are you sure you want to cancel the process?</p>
                  <div><span>Cancel</span><span className="go">Proceed</span></div>
                </div>
                <span className="bl-x"><X size={16} /></span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Trusted worldwide ───────── */}
      <section className="bl-section" id="pricing">
        <div className="bl-wrap">
          <Reveal className="bl-head bl-head-split">
            <div>
              <Pill>Review rating</Pill>
              <h2>Trusted Worldwide</h2>
            </div>
            <p>Brightloop is a highly rated platform, loved by users for its reliability, performance and user-friendly design.</p>
          </Reveal>
          <div className="bl-rev-grid">
            {[
              { n: 'Airwallex', q: 'Clear, creative and strategic. We have achieved great things together and we’re looking forward to more.' },
              { n: 'Sisense', q: 'An incredible group of people and talented, professional teammates who bring flexible ideas to every call.' },
              { n: 'Tanium', q: 'A truly innovative approach to the work that sets this agency apart from its peers.' },
            ].map((r, i) => (
              <Reveal key={r.n} className="bl-card bl-rev" delay={i * 90}>
                <b className="bl-rev-name">{r.n}</b>
                <p>“{r.q}”</p>
                <div className="bl-stars">{[0, 1, 2, 3, 4].map(s => <Star key={s} size={13} fill="#ff6b3d" stroke="#ff6b3d" />)}<small>4.5 / 5 Rating</small></div>
              </Reveal>
            ))}
          </div>
          <div className="bl-stats" ref={stats.ref}>
            {[
              { icon: Users, to: 45, suf: '+', dec: 0, l: 'Happy customers' },
              { icon: Target, to: 5, suf: 'k+', dec: 0, l: 'Active subscriptions' },
              { icon: Star, to: 4.8, suf: '', dec: 1, l: 'Review rate' },
              { icon: TrendingUp, to: 4.8, suf: '', dec: 1, l: 'User satisfaction' },
            ].map(s => (
              <div key={s.l} className="bl-stat">
                <span><s.icon size={16} /></span>
                <b><CountUp to={s.to} decimals={s.dec} suffix={s.suf} run={stats.seen} /></b>
                <small>{s.l}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="bl-section" id="faq">
        <div className="bl-wrap bl-faq">
          <Reveal className="bl-faq-head">
            <Pill>Frequently asked questions</Pill>
            <h2>Questions &amp; answers</h2>
            <p>Can’t find what you’re looking for?</p>
            <button className="bl-btn bl-btn-dark bl-btn-sm" onClick={onGetStarted}>Contact us</button>
          </Reveal>
          <Reveal className="bl-faq-list">
            {faqs.map((f, i) => (
              <div key={f.q} className={`bl-faq-item ${open === i ? 'is-open' : ''}`}>
                <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                  <small>{String(i + 1).padStart(3, '0')}</small>
                  <span>{f.q}</span>
                  <Plus size={16} />
                </button>
                <div className="bl-faq-a"><p>{f.a}</p></div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="bl-cta">
        <Pixels items={[{ x: '12%', y: '30%', s: 30 }, { x: '86%', y: '56%', s: 36 }, { x: '70%', y: '14%', s: 16 }]} />
        <Reveal className="bl-wrap">
          <h2>Get Brightloop for your company</h2>
          <p>Metrics, dunning and engagement tools for SaaS and subscription businesses.</p>
          <button className="bl-btn bl-btn-dark" onClick={onGetStarted}>Get started</button>
        </Reveal>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="bl-footer">
        <div className="bl-wrap">
          <div className="bl-foot-grid">
            <div className="bl-foot-brand">
              <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <p>Subscription analytics and revenue management for modern businesses.</p>
            </div>
            {[
              { t: 'Features', l: ['Control Center', 'People Insights', 'Smart Dashboards', 'Recover'] },
              { t: 'Compare', l: ['ProfitWell', 'ChartMogul', 'FirstOffice', 'SaaSOptics'] },
              { t: 'Company', l: ['About', 'Careers', 'Customers', 'Plans & Pricing'] },
              { t: 'Support', l: ['Developers', 'Help Center', 'Status'] },
            ].map(c => (
              <div key={c.t} className="bl-foot-col">
                <h5>{c.t}</h5>
                {c.l.map(x => <a key={x} href="#">{x}</a>)}
              </div>
            ))}
          </div>
          <div className="bl-wordmark" aria-hidden>Brightloop</div>
          <div className="bl-foot-bot">
            <span>© 2026 Brightloop Inc.</span>
            <a href="#top" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
