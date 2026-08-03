import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🧾',
    title: 'GST Billing',
    description: 'Fast invoice creation with tax-ready billing for every pharmacy transaction.',
  },
  {
    icon: '📦',
    title: 'Inventory Management',
    description: 'Track stock levels, batches, and reorder points from one central dashboard.',
  },
  {
    icon: '👥',
    title: 'Customer Management',
    description: 'Maintain customer histories and loyalty details without extra spreadsheets.',
  },
  {
    icon: '🏪',
    title: 'Supplier Management',
    description: 'Manage suppliers, purchases, and payments with better visibility.',
  },
  {
    icon: '🧪',
    title: 'Batch Management',
    description: 'Monitor batch numbers and expiry dates with proactive alerts.',
  },
  {
    icon: '🚨',
    title: 'Expiry Alerts',
    description: 'Get notified before medicines expire to reduce wastage and losses.',
  },
  {
    icon: '📊',
    title: 'Sales Reports',
    description: 'Analyze invoices and sales trends with polished business reports.',
  },
  {
    icon: '🛒',
    title: 'Purchase Reports',
    description: 'Track purchases, margins, and stock movement with clear summaries.',
  },
  {
    icon: '📈',
    title: 'Dashboard Analytics',
    description: 'Turn daily operations into intuitive dashboards for smarter decisions.',
  },
  {
    icon: '☁️',
    title: 'Cloud Backup',
    description: 'Secure your pharmacy data with reliable, accessible cloud storage.',
  },
  {
    icon: '🧾',
    title: 'Invoice PDF',
    description: 'Generate professional invoices that are ready to print or share instantly.',
  },
  {
    icon: '🔐',
    title: 'Multi-Tenant Security',
    description: 'Keep every pharmacy workspace isolated with enterprise-grade security.',
  },
];

const reasons = [
  {
    title: 'Fast Billing',
    description: 'Create GST invoices in seconds with a simplified pharmacy workflow.',
  },
  {
    title: 'Secure Cloud Storage',
    description: 'Your data stays protected with secure cloud-based access and backup.',
  },
  {
    title: 'Automatic Reports',
    description: 'Daily summaries, purchases, and revenue insights arrive without manual work.',
  },
  {
    title: 'Simple Interface',
    description: 'An intuitive experience that your team can learn quickly and use confidently.',
  },
  {
    title: 'Reliable',
    description: 'Built to support busy pharmacy operations with dependable performance.',
  },
  {
    title: '24×7 Support',
    description: 'Get the guidance you need whenever your business needs it.',
  },
];

const pricingPlans = [
  {
    name: 'Monthly Plan',
    price: '₹499',
    cadence: '/ Month',
    featured: false,
    features: ['Unlimited Billing', 'Inventory', 'Reports', 'Customer Management', 'Supplier Management', 'Cloud Backup', 'Support'],
    action: 'Contact Sales',
  },
  {
    name: 'Yearly Plan',
    price: '₹3999',
    cadence: '/ Year',
    featured: true,
    savings: 'Save ₹1989 Every Year',
    features: ['Everything in Monthly', 'Priority Support', 'Annual Billing Advantage', 'Dedicated onboarding'],
    action: 'Contact Sales',
  },
];

const faqs = [
  {
    question: 'What is GenPharma?',
    answer: 'GenPharma is a cloud-based pharmacy management platform designed for fast billing, inventory visibility, and business reporting.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. GenPharma uses secure cloud infrastructure and role-based access controls to protect pharmacy data.',
  },
  {
    question: 'Can I access it from multiple computers?',
    answer: 'Absolutely. Your team can access GenPharma from any connected device with secure authentication.',
  },
  {
    question: 'Can I print GST invoices?',
    answer: 'Yes, GenPharma supports professional GST-ready invoices that can be printed or shared as PDF.',
  },
  {
    question: 'Do you provide support?',
    answer: 'We offer responsive support for onboarding, implementation, and day-to-day operations assistance.',
  },
  {
    question: 'How do I purchase?',
    answer: 'You can request a demo or contact sales to get started with a plan that fits your pharmacy.',
  },
];

const previewSlides = [
  {
    title: 'Dashboard',
    description: 'Real-time metrics and pharmacy health at a glance.',
    accent: 'from-sky-500 to-cyan-400',
  },
  {
    title: 'Billing',
    description: 'Fast GST billing with clean invoice creation.',
    accent: 'from-emerald-500 to-lime-400',
  },
  {
    title: 'Inventory',
    description: 'Stock movement, batches, and expiry visibility.',
    accent: 'from-violet-500 to-fuchsia-400',
  },
  {
    title: 'Reports',
    description: 'Actionable insights for sales and purchases.',
    accent: 'from-amber-500 to-orange-400',
  },
  {
    title: 'Customers',
    description: 'Customer history, balances, and service tracking.',
    accent: 'from-rose-500 to-pink-400',
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg text-slate-600">{description}</p>
    </div>
  );
}

export function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % previewSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-semibold text-white">GenPharma</Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
            <a href="/contact" className="transition hover:text-white">Contact</a>
            <Link to="/login" className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-200">Login</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.3),_transparent_35%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 shadow-lg shadow-emerald-500/10">
                Healthcare • Minimal • Modern SaaS
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Complete Pharmacy Management Software
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Manage GST billing, inventory, customers, suppliers, purchases and reports from one secure cloud platform.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="rounded-full bg-emerald-500 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">Login</Link>
                <Link to="/contact" className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/20">Request Demo</Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-4 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Secure Cloud</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">GST Ready</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Real-Time Insights</span>
              </div>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-[28px] border border-white/10 bg-slate-950 p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-white">GenPharma Control Center</p>
                    <p className="text-sm text-slate-400">Daily operations overview</p>
                  </div>
                  <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">Live</div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Revenue</p>
                    <p className="mt-2 text-3xl font-semibold text-white">₹4.8L</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Stock Alerts</p>
                    <p className="mt-2 text-3xl font-semibold text-white">12</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900 p-4 sm:col-span-2">
                    <p className="text-sm text-slate-400">Today’s Billing</p>
                    <div className="mt-4 flex items-end gap-2">
                      <div className="h-16 w-8 rounded-t-full bg-emerald-500" />
                      <div className="h-24 w-8 rounded-t-full bg-sky-500" />
                      <div className="h-12 w-8 rounded-t-full bg-violet-500" />
                      <div className="h-28 w-8 rounded-t-full bg-amber-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Platform Features"
              title="Everything your pharmacy team needs"
              description="A polished workspace designed for billing, inventory, and compliance in one place."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl shadow-sm">{feature.icon}</div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Product Preview"
              title="A clearer view of daily pharmacy operations"
              description="Explore the dashboard, billing, inventory, and reports through a polished product experience."
            />
            <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
                <div className={`rounded-[24px] bg-gradient-to-br ${previewSlides[activeSlide].accent} p-8`}>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Preview</p>
                  <h3 className="mt-3 text-3xl font-semibold">{previewSlides[activeSlide].title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-white/90">{previewSlides[activeSlide].description}</p>
                  <div className="mt-8 rounded-2xl border border-white/30 bg-white/20 p-4 backdrop-blur">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-950/40 p-4">
                        <p className="text-sm text-white/70">Key metric</p>
                        <p className="mt-2 text-2xl font-semibold">+18%</p>
                      </div>
                      <div className="rounded-2xl bg-slate-950/40 p-4">
                        <p className="text-sm text-white/70">Daily activity</p>
                        <p className="mt-2 text-2xl font-semibold">84 visits</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="space-y-3">
                  {previewSlides.map((slide, index) => (
                    <button
                      key={slide.title}
                      onClick={() => setActiveSlide(index)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${activeSlide === index ? 'border-emerald-300 bg-emerald-50 text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                    >
                      <span className="font-semibold">{slide.title}</span>
                      <span className="text-sm">View</span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                  <span>Auto-rotating preview</span>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveSlide((activeSlide - 1 + previewSlides.length) % previewSlides.length)} className="rounded-full border border-slate-200 bg-white px-3 py-2">←</button>
                    <button onClick={() => setActiveSlide((activeSlide + 1) % previewSlides.length)} className="rounded-full border border-slate-200 bg-white px-3 py-2">→</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Why Choose GenPharma"
              title="Built for modern pharmacy businesses"
              description="A reliable and refined platform that keeps your operations moving smoothly."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {reasons.map((reason) => (
                <div key={reason.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="text-2xl font-semibold text-emerald-600">✓</div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{reason.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Simple Pricing"
              title="Choose the plan that suits your pharmacy"
              description="Flexible options for growing businesses that want dependable software."
            />
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {pricingPlans.map((plan) => (
                <div key={plan.name} className={`rounded-[32px] border p-8 shadow-sm ${plan.featured ? 'border-emerald-300 bg-emerald-50 shadow-xl' : 'border-slate-200 bg-white'}`}>
                  {plan.featured ? <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">Best Value</div> : null}
                  <h3 className="mt-4 text-2xl font-semibold text-slate-900">{plan.name}</h3>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-semibold text-slate-900">{plan.price}</span>
                    <span className="pb-1 text-slate-600">{plan.cadence}</span>
                  </div>
                  {plan.savings ? <p className="mt-3 text-sm font-medium text-emerald-700">{plan.savings}</p> : null}
                  <p className="mt-6 text-sm text-slate-600">Only ₹333/month</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <span className="text-emerald-600">●</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/contact" className={`mt-8 inline-flex rounded-full px-5 py-3 font-semibold transition ${plan.featured ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{plan.action}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              eyebrow="FAQ"
              title="Common questions about GenPharma"
              description="Everything you need to know before getting started with your new pharmacy platform."
            />
            <div className="mt-12 space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between px-6 py-5 text-left">
                    <span className="text-lg font-semibold text-slate-900">{faq.question}</span>
                    <span className="text-2xl text-slate-400">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  {openFaq === index ? <p className="px-6 pb-6 text-sm leading-7 text-slate-600">{faq.answer}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-12 text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <h3 className="text-xl font-semibold text-white">GenPharma</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-400">Professional pharmacy management software built for efficiency, accuracy, and growth.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Support</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>support@genpharma.com</li>
              <li>+91 98765 43210</li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Social</h4>
            <div className="mt-4 flex gap-3 text-sm">
              <a href="https://www.linkedin.com" className="hover:text-white">LinkedIn</a>
              <a href="https://www.twitter.com" className="hover:text-white">X</a>
              <a href="https://www.instagram.com" className="hover:text-white">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
