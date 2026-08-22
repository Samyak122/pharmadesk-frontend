import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const imageModules = import.meta.glob('../assets/images/landing/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });

const featureCards = [
  { icon: '🧾', title: 'GST Billing', description: 'Create invoices quickly and keep every transaction compliant.' },
  { icon: '📦', title: 'Inventory Management', description: 'Track stock movement, batches and restocks without friction.' },
  { icon: '👥', title: 'Customer Management', description: 'Keep every customer history and balance in one place.' },
  { icon: '🏪', title: 'Supplier Management', description: 'Manage supplier records and purchases with better visibility.' },
  { icon: '🛒', title: 'Purchase Management', description: 'Monitor procurement and supplier activity with confidence.' },
  { icon: '📊', title: 'Reports', description: 'Share professional sales and purchase summaries for decision-making.' },
  { icon: '📈', title: 'Dashboard Analytics', description: 'Review key business metrics from a clear dashboard view.' },
  { icon: '🚨', title: 'Expiry Alerts', description: 'Stay ahead of stock expiry with proactive notifications.' },
  { icon: '🧪', title: 'Batch Tracking', description: 'Track batches and maintain medicine quality with ease.' },
  { icon: '☁️', title: 'Cloud Backup', description: 'Keep pharmacy data safe and available from any connected device.' },
  { icon: '🧾', title: 'Invoice PDF', description: 'Generate polished invoices ready for print or sharing.' },
  { icon: '👨‍👩‍👧‍👦', title: 'Multi-User Support', description: 'Support your team with structured access and shared workflows.' },
];

const whyChoose = [
  { title: 'Cloud Based', description: 'Access the application securely from any location with reliable uptime.' },
  { title: 'GST Ready', description: 'Keep invoicing and records aligned with GST requirements.' },
  { title: 'Secure Multi-Tenant', description: 'Maintain clean separation and protected access for every pharmacy workspace.' },
  { title: 'Fast Billing', description: 'Reduce manual effort with a streamlined billing experience.' },
  { title: 'Inventory Automation', description: 'Stay ahead of stock movement and procurement with live insights.' },
  { title: 'Professional Reports', description: 'Turn operations into clear, accurate insights for your team.' },
];

const pricingPlans = [
  {
    name: 'Monthly',
    price: '₹499',
    cadence: '/month',
    featured: false,
    features: ['Unlimited Billing', 'Inventory Management', 'Reports', 'Customer & Supplier Management', 'Cloud Backup', 'Support'],
    action: 'Contact Sales',
  },
  {
    name: 'Yearly',
    price: '₹3999',
    cadence: '/year',
    featured: true,
    savings: 'Save ₹1989/year',
    note: 'Only ₹333/month',
    features: ['Everything in Monthly', 'Priority Support', 'Annual Billing Advantage', 'Dedicated onboarding'],
    action: 'Request Demo',
  },
];

const testimonials = [
  {
    name: 'Ramesh Sharma',
    role: 'Owner, Carewell Pharmacy',
    quote: 'GenPharma helped us replace manual work with a cleaner billing and reporting experience.' ,
  },
  {
    name: 'Anjali Mehta',
    role: 'Manager, MedPlus Corner',
    quote: 'The dashboards and reporting views give our team confidence in every stock and billing decision.',
  },
  {
    name: 'Vikram Desai',
    role: 'Partner, Nova Pharmacy',
    quote: 'The workflow feels polished and fast, and our team adopted it quickly.',
  },
];

const faqs = [
  {
    question: 'What is GenPharma?',
    answer: 'GenPharma is a cloud-based pharmacy management platform designed for billing, inventory, customers, suppliers, reports and analytics.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. The system uses secure cloud access and protected multi-tenant workflows for pharmacy operations.',
  },
  {
    question: 'Can I access it from multiple devices?',
    answer: 'Absolutely. Your team can use GenPharma from connected desktops and workstations with consistent access.',
  },
  {
    question: 'Can I print GST invoices?',
    answer: 'Yes. The platform supports polished billing views that are ready for GST-ready invoicing and print workflows.',
  },
  {
    question: 'Do you provide support?',
    answer: 'Yes. We provide onboarding and support guidance for teams adopting the platform.',
  },
  {
    question: 'How do I purchase?',
    answer: 'You can contact our team for a demo, pricing details and implementation support.',
  },
];

const screenshotMeta = {
  dashboard: { title: 'Dashboard', description: 'Real-time performance overview for daily pharmacy operations.' },
  billing: { title: 'Billing', description: 'Fast invoice workflows for modern pharmacy billing.' },
  inventory: { title: 'Inventory', description: 'Clear visibility into stock movement and expiry control.' },
  customer: { title: 'Customers', description: 'Customer records and activity review in one view.' },
  sales: { title: 'Sales', description: 'Daily sales tracking with a polished business view.' },
  'medicine catalog': { title: 'Medicine Catalog', description: 'A structured medicine view for inventory and product management.' },
  landing: { title: 'Product Overview', description: 'A premium presentation of the GenPharma experience.' },
};

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
  const [activePreview, setActivePreview] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);

  const previewScreenshots = useMemo(() => {
    return Object.entries(imageModules)
      .map(([path, src]) => {
        const name = path.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image';
        const key = name.toLowerCase();
        return {
          key,
          src,
          title: screenshotMeta[key]?.title || name.replace(/_/g, ' '),
          description: screenshotMeta[key]?.description || 'GenPharma application view.',
        };
      })
      .sort((left, right) => left.title.localeCompare(right.title));
  }, []);

  const heroImage = previewScreenshots.find((item) => item.key === 'dashboard') || previewScreenshots[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-semibold text-slate-900">GenPharma</Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">Features</a>
            <a href="#preview" className="transition hover:text-slate-900">Preview</a>
            <a href="#pricing" className="transition hover:text-slate-900">Pricing</a>
            <a href="#faq" className="transition hover:text-slate-900">FAQ</a>
            <a href="/contact" className="transition hover:text-slate-900">Contact</a>
            <Link to="/login" className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700">Login</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Professional Pharmacy Management Software
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                GenPharma for modern pharmacy operations
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                GenPharma is a cloud-based pharmacy management system for billing, inventory, customers, suppliers, GST, expiry tracking, reports and analytics.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="rounded-full bg-slate-900 px-6 py-3 text-center font-semibold text-white transition hover:bg-slate-700">Login</Link>
                <Link to="/contact" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Request Demo</Link>
                <a href="#pricing" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Pricing</a>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">GST Ready</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">Cloud Based</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">Expiry Tracking</span>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.35)]">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <img
                  src={heroImage?.src}
                  alt={heroImage?.title || 'GenPharma dashboard preview'}
                  loading="lazy"
                  onClick={() => setLightboxImage(heroImage)}
                  className="w-full cursor-zoom-in object-contain transition duration-300 hover:scale-[1.01]"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="preview" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Product Preview"
              title="See the real GenPharma experience"
              description="Each screen below comes directly from the existing product screenshots already available in the landing assets folder."
            />

            <div className="mt-10 flex flex-wrap gap-2">
              {previewScreenshots.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePreview(index)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${activePreview === index ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_0.95fr] lg:items-start">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-3 shadow-sm">
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                  <img
                    src={previewScreenshots[activePreview]?.src}
                    alt={previewScreenshots[activePreview]?.title}
                    loading="lazy"
                    onClick={() => setLightboxImage(previewScreenshots[activePreview])}
                    className="w-full cursor-zoom-in object-contain transition duration-300 hover:scale-[1.01]"
                  />
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Interactive Preview</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">{previewScreenshots[activePreview]?.title}</h3>
                <p className="mt-3 text-base leading-8 text-slate-600">{previewScreenshots[activePreview]?.description}</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {previewScreenshots.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActivePreview(index)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${activePreview === index ? 'border-emerald-300 bg-emerald-50 text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                    >
                      <span className="block font-semibold">{item.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">Open preview</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Features"
              title="Built for the full pharmacy workflow"
              description="The same product experience you will use after purchase, presented clearly for public visitors."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature) => (
                <div key={feature.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">{feature.icon}</div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Why Choose GenPharma"
              title="A premium experience for pharmacy teams"
              description="Built to feel as confident and polished as the operational dashboard itself."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {whyChoose.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="text-2xl font-semibold text-emerald-600">•</div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Pricing"
              title="Choose a plan that fits your pharmacy"
              description="Premium pricing cards designed to match the same application style as the dashboard."
            />
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {pricingPlans.map((plan) => (
                <div key={plan.name} className={`rounded-[32px] border p-8 shadow-sm ${plan.featured ? 'border-emerald-300 bg-emerald-50 shadow-lg' : 'border-slate-200 bg-white'}`}>
                  {plan.featured ? <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">Best Value</div> : null}
                  <h3 className="mt-5 text-2xl font-semibold text-slate-900">{plan.name}</h3>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-semibold text-slate-900">{plan.price}</span>
                    <span className="pb-1 text-slate-600">{plan.cadence}</span>
                  </div>
                  {plan.savings ? <p className="mt-3 text-sm font-medium text-emerald-700">{plan.savings}</p> : null}
                  {plan.note ? <p className="mt-2 text-sm text-slate-600">{plan.note}</p> : null}
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

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Testimonials"
              title="Trusted by pharmacy owners"
              description="Professional reviews from teams who use GenPharma as their daily operating system."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {testimonials.map((item) => (
                <div key={item.name} className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <p className="text-sm leading-8 text-slate-600">“{item.quote}”</p>
                  <div className="mt-6">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              eyebrow="FAQ"
              title="Frequently asked questions"
              description="A straightforward overview of the GenPharma experience and purchasing process."
            />
            <div className="mt-12 space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between px-6 py-5 text-left">
                    <span className="text-lg font-semibold text-slate-900">{faq.question}</span>
                    <span className="text-2xl text-slate-400">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  {openFaq === index ? <p className="px-6 pb-6 text-sm leading-7 text-slate-600">{faq.answer}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-sm lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Contact</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">Ready to see GenPharma in action?</h2>
                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">Schedule a walkthrough and discover how the platform supports billing, inventory and reports for modern pharmacies.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <Link to="/contact" className="inline-flex rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700">Get in touch</Link>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <p>📧 gen.pharma.official@gmail.com</p>
                  <p>📞 +91 7620604870</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 px-4 py-12 text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <h3 className="text-xl font-semibold text-white">GenPharma</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-slate-400">A cloud-based pharmacy management platform for billing, inventory, reporting and growth.</p>
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
              <li>gen.pharma.official@gmail.com</li>
              <li>+91 7620604870</li>
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

      {lightboxImage ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => setLightboxImage(null)}>
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{lightboxImage.title}</p>
                <p className="text-sm text-slate-500">{lightboxImage.description}</p>
              </div>
              <button type="button" onClick={() => setLightboxImage(null)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">Close</button>
            </div>
            <img src={lightboxImage.src} alt={lightboxImage.title} className="max-h-[75vh] w-full object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
