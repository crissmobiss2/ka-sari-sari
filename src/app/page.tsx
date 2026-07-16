import Link from "next/link";
import {
  ArrowRight, CheckCircle2, Package, Truck, BarChart3,
  ShoppingBasket, Store, Clock, Star, Shield, Zap,
  PhilippinePeso, ChevronRight
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/public-nav";
import { CATEGORIES } from "@/lib/mock-data";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Register your store",
    description: "Sign up with your phone number, add your store details, and activate your free account — your first year is completely free.",
    icon: Store,
  },
  {
    step: "02",
    title: "Browse and order",
    description: "See live warehouse stock and pricing. Add products to your cart and check out in minutes, no haggling, no back-and-forth.",
    icon: ShoppingBasket,
  },
  {
    step: "03",
    title: "We deliver to your store",
    description: "Your order is picked, packed, and delivered to your sari-sari store. Track it every step of the way.",
    icon: Truck,
  },
];

const BENEFITS = [
  { icon: PhilippinePeso, title: "Fair warehouse pricing", description: "Direct from our warehouse. No middleman markups, no price surprises." },
  { icon: Package, title: "Real-time stock visibility", description: "See exactly what's available before you order. No more backorders on products you needed." },
  { icon: Clock, title: "Reorder in under 60 seconds", description: "One tap to reorder your regular products. Your order history is your shortcut." },
  { icon: Truck, title: "Reliable delivery", description: "Scheduled, trackable deliveries straight to your store. No need to fetch it yourself." },
  { icon: BarChart3, title: "Know your store better", description: "See your ordering history, spending trends, and popular products across your store." },
  { icon: Shield, title: "Trustworthy and secure", description: "Your payments, your store data, your orders, all handled with full transparency." },
];

const TESTIMONIALS = [
  { name: "Maria Santos", location: "Caloocan City", text: "Hindi na ako kailangan pumunta sa palengke at makipagsabunutan sa mga supplier. Lahat na nasa Ka Sari-Sari." },
  { name: "Jun Dela Cruz", location: "Marikina City", text: "Mas mura pa dito kaysa sa aming dating supplier. At nandoon lahat ng brand na kailangan ko." },
  { name: "Nena Reyes", location: "Quezon City", text: "Ang daling mag-reorder. Minsan isang minuto lang, tapos na ang order ko. Grabe ang convenience." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-card px-4 py-20 sm:py-28 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 to-transparent dark:from-brand-950/20" />
        <div className="relative mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 mb-8">
            <Zap className="h-3.5 w-3.5" />
            Built for sari-sari store owners
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Order warehouse stock<br className="hidden sm:block" />{" "}
            <span className="text-brand-500">without leaving your store.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ka Sari-Sari connects your sari-sari store directly to our warehouse.
            Browse real stock, order at fair prices, and get it delivered. No suppliers to chase, no markets to visit.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <ButtonLink size="lg" href="/register" className="w-full sm:w-auto">
                Start for free
                <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink variant="outline" size="lg" href="/#how-it-works" className="w-full sm:w-auto">
              See how it works
            </ButtonLink>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free for your first year. Then just ₱200/month per store.
          </p>
        </div>

        {/* Stats */}
        <div className="relative mx-auto mt-16 max-w-3xl grid grid-cols-3 gap-6 border-t border-border pt-10">
          {[
            { value: "300+", label: "Active sari-sari stores" },
            { value: "500+", label: "Products in stock" },
            { value: "2–3 days", label: "Average delivery time" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-2">Simple process</p>
            <h2 className="font-display text-3xl font-bold text-foreground">Stock your store in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative flex flex-col items-start p-6 rounded-2xl border border-border bg-card shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-2xl font-bold text-surface-200 leading-none">{step.step}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories preview */}
      <section className="py-16 px-4 bg-surface-50">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-1">What we carry</p>
              <h2 className="font-display text-2xl font-bold text-foreground">Popular categories</h2>
            </div>
            <Link href="/register" className="flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.slice(0, 8).map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-card hover:shadow-card-md transition-shadow cursor-pointer">
                <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Package className="h-4.5 w-4.5 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.productCount} items</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-2">Why Ka Sari-Sari</p>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Everything your store needs, in one place
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex gap-4 p-5 rounded-2xl border border-border bg-card shadow-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-surface-50">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-2">Simple pricing</p>
          <h2 className="font-display text-3xl font-bold text-surface-900 mb-4">Simple pricing. No surprises.</h2>
          <div className="rounded-2xl border border-border bg-card shadow-card-md p-8 text-left mt-8">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-display text-4xl font-bold text-brand-500">FREE</p>
                <p className="text-sm text-muted-foreground mt-1">for your first year</p>
              </div>
              <span className="rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-medium text-brand-600">
                No credit card needed
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Then ₱200/month per store from Year 2. Cancel anytime.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited orders from our warehouse",
                "Live stock visibility",
                "Order tracking and history",
                "Fast reorder from past purchases",
                "Dedicated customer support",
                "Price transparency, no hidden fees",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <ButtonLink size="lg" href="/register" className="w-full">
              Register your store — it&apos;s free <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-2">Store owners love it</p>
            <h2 className="font-display text-3xl font-bold text-foreground">What tinderas are saying</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl border border-border bg-card shadow-card">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-brand-400 text-brand-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand-500">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Ready to stock your store the smarter way?
          </h2>
          <p className="text-brand-100 text-base mb-8">
            Join hundreds of sari-sari store owners already ordering directly from our warehouse.
          </p>
          <ButtonLink size="lg" variant="secondary" href="/register">
            Get started — free for your first year
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500">
              <ShoppingBasket className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Ka Sari-Sari. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
