import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: '📝',
    title: 'Contribution tracking',
    description:
      'Record every member contribution and see paid, late, and missed status at a glance.',
  },
  {
    icon: '💰',
    title: 'Loan management',
    description:
      'Issue loans, track repayments, and let interest calculate itself automatically.',
  },
  {
    icon: '📊',
    title: 'Analytics dashboard',
    description:
      'Visualize savings trends and compliance rates to make confident group decisions.',
  },
  {
    icon: '🔔',
    title: 'Smart reminders',
    description:
      'Simulated SMS-style nudges keep members informed about upcoming and overdue payments.',
  },
  {
    icon: '🤖',
    title: 'AI assistant',
    description:
      'Members can ask about their savings, loans, and financial literacy — in English or Kinyarwanda.',
  },
  {
    icon: '📱',
    title: 'Built for low bandwidth',
    description:
      'A fast, lightweight interface designed to work smoothly on 3G connections.',
  },
];

const steps = [
  {
    step: '1',
    title: 'Record',
    description: 'The treasurer logs contributions and loan repayments during or after each meeting.',
  },
  {
    step: '2',
    title: 'Track',
    description: 'Every member sees their own savings, loans, and payment history in real time.',
  },
  {
    step: '3',
    title: 'Grow',
    description: 'Admins use analytics and reminders to keep the whole group on track and growing.',
  },
];

const roles = [
  { role: 'Group Admin', detail: 'Manages members, group rules, and reports' },
  { role: 'Treasurer', detail: 'Records contributions and loan repayments' },
  { role: 'Secretary', detail: 'Reviews analytics and exports reports' },
  { role: 'Member', detail: 'Tracks personal savings and loan status' },
];

const previewStats = [
  { label: 'Savings', value: '2.4M RWF', tone: 'bg-brand-600' },
  { label: 'Loans', value: '540K RWF', tone: 'bg-accent-500' },
  { label: 'Compliance', value: '92%', tone: 'bg-slate-900' },
];

const previewBars = [40, 65, 50, 80, 60, 95, 70];

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-400 px-6 py-12 sm:px-12 sm:py-16 lg:py-20">
          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-900">
                For Village Savings &amp; Loan Associations
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] text-slate-900 sm:text-5xl lg:text-6xl">
                Track your Ikimina, the smart way
              </h1>
              <p className="mt-5 max-w-md text-lg text-slate-800/80">
                Replace paper ledgers with a secure, digital-first platform for
                contributions, loans, and group finances — built for Rwanda&rsquo;s VSLAs.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800"
                >
                  Get started
                  <span aria-hidden>→</span>
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:underline"
                >
                  See how it works
                  <span aria-hidden>↓</span>
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm rotate-1 rounded-2xl bg-white p-5 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                This month
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {previewStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-slate-50 p-3">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${stat.tone}`}
                      aria-hidden
                    />
                    <p className="mt-2 text-sm font-bold text-slate-900">{stat.value}</p>
                    <p className="text-[11px] text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex h-24 items-end gap-2 rounded-xl bg-slate-50 p-3">
                {previewBars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-brand-500"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                Contributions collected per week
              </p>
            </div>
          </div>

          <div className="relative mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 rounded-2xl bg-white/90 p-6 text-left shadow-lg sm:grid-cols-4 lg:mt-16">
            {[
              ['100%', 'Free to run'],
              ['3G', 'Friendly & fast'],
              ['EN / RW', 'Bilingual UI'],
              ['5', 'Role-based views'],
            ].map(([stat, label]) => (
              <div key={label}>
                <p className="text-xl font-bold text-brand-700 sm:text-2xl">{stat}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">Everything your group needs</h2>
          <p className="mt-3 text-slate-500">
            One place to manage savings, loans, and communication — no spreadsheets required.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Card key={feature.title} className="p-6">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
                  i % 2 === 0 ? 'bg-brand-50' : 'bg-accent-50'
                }`}
              >
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-500">Three simple steps, every meeting cycle.</p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">A view for every role</h2>
          <p className="mt-3 text-slate-500">
            Everyone sees exactly what they need — nothing more, nothing less.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <Card key={r.role} className="p-5">
              <p className="font-semibold text-slate-900">{r.role}</p>
              <p className="mt-1 text-sm text-slate-500">{r.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900 px-6 py-16 text-center sm:px-12">
          <h2 className="text-3xl font-bold text-white">Ready to digitize your VSLA?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Set up your group in minutes and give every member a clear view of their savings.
          </p>
          <div className="mt-8">
            <Button href="/login" pill size="lg">
              Get started now
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-400 sm:px-6">
        <p>© {new Date().getFullYear()} Ikimina Smart Tracker. Built for VSLAs in Rwanda.</p>
        <Link href="/login" className="mt-1 inline-block text-brand-700 hover:underline">
          Sign in to your group
        </Link>
      </footer>
    </div>
  );
}
