import { Link } from "react-router-dom";
import { CheckCircle, X, Zap, Shield, CreditCard, HelpCircle, ArrowRight } from "lucide-react";

function PlanCard({ role, badge, price, sub, highlight, features, missing, cta, to, accent }) {
  return (
    <div className={`rounded-2xl border p-8 flex flex-col ${accent ? "bg-primary border-primary text-white shadow-2xl scale-[1.02]" : "bg-white border-slate-200 shadow-sm"}`}>
      <div className="mb-6">
        <span className={`text-xs font-bold font-heading uppercase tracking-widest px-3 py-1 rounded-full ${accent ? "bg-secondary/20 text-secondary" : "bg-slate-100 text-slate-600"}`}>
          {badge}
        </span>
        <p className={`font-heading text-2xl font-bold mt-4 mb-1 ${accent ? "text-white" : "text-slate-900"}`}>{role}</p>
        <p className={`text-sm ${accent ? "text-slate-400" : "text-slate-500"}`}>{sub}</p>
      </div>
      <div className={`rounded-xl p-5 mb-6 ${accent ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-200"}`}>
        <p className={`font-heading text-4xl font-black ${accent ? "text-white" : "text-primary"}`}>{price}</p>
        {highlight && <p className={`text-xs mt-1 ${accent ? "text-slate-400" : "text-slate-500"}`}>{highlight}</p>}
      </div>
      <ul className="space-y-3 flex-1 mb-8">
        {features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2.5 text-sm ${accent ? "text-slate-300" : "text-slate-700"}`}>
            <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${accent ? "text-secondary" : "text-teal-500"}`} />
            {f}
          </li>
        ))}
        {missing?.map((f, i) => (
          <li key={i} className={`flex items-start gap-2.5 text-sm ${accent ? "text-slate-500" : "text-slate-400"}`}>
            <X className="w-4 h-4 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link to={to}
        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-heading font-semibold text-sm transition-all ${
          accent ? "bg-secondary text-white hover:opacity-90" : "border border-slate-300 text-slate-900 hover:bg-slate-50"
        }`}>
        {cta} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function FeeRow({ label, value, note }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-200 last:border-0 gap-4">
      <div>
        <p className="font-medium text-slate-900 text-sm">{label}</p>
        {note && <p className="text-xs text-slate-500 mt-0.5">{note}</p>}
      </div>
      <p className="font-heading font-bold text-slate-900 shrink-0 text-sm">{value}</p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="bg-primary text-white py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-bold font-heading text-secondary border border-secondary/30 bg-secondary/10 px-3 py-1 rounded-full mb-6">
            TRANSPARENT PRICING
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-5">Simple, Performance-Based Fees</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            No monthly subscriptions. No setup costs. trakvora earns only when you earn — a small percentage taken only on completed, confirmed deliveries.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            <PlanCard
              badge="Shippers"
              role="Ship Cargo"
              sub="For businesses and individuals moving freight"
              price="3%"
              highlight="of load value per successful delivery"
              cta="Post a Load"
              to="/register?role=shipper"
              features={[
                "Unlimited load postings",
                "Fixed-price and auction bidding modes",
                "Full escrow payment protection",
                "Real-time GPS shipment tracking",
                "Bid comparison dashboard",
                "Auto-generated consignment notes",
                "Dispute resolution support",
                "Full shipment history & reports",
              ]}
            />

            <PlanCard
              accent
              badge="Most Popular"
              role="Fleet Owners"
              sub="For licensed carriers with one or more trucks"
              price="7%"
              highlight="of freight value per accepted job"
              cta="Register Your Fleet"
              to="/register?role=owner"
              features={[
                "List unlimited trucks",
                "Bid on any available load",
                "Assign and monitor drivers",
                "Live fleet tracking dashboard",
                "Wallet with M-Pesa / bank payouts",
                "Priority placement in search results",
                "NTSA compliance documentation",
                "Consignment notes & dispute protection",
                "Dedicated account support",
              ]}
            />

            <PlanCard
              badge="Drivers"
              role="Drive & Earn"
              sub="For licensed drivers seeking freight jobs"
              price="Free"
              highlight="to join — earn per delivery"
              cta="Create Driver Profile"
              to="/register?role=driver"
              features={[
                "Create a full verified profile",
                "Browse the job feed unlimited",
                "Set route and truck preferences",
                "Accept jobs directly from owners",
                "KES earnings wallet",
                "M-Pesa payout support",
                "Rating and review system",
              ]}
              missing={[
                "Cannot bid independently (linked to owner)",
              ]}
            />

          </div>
        </div>
      </section>

      {/* Fee breakdown */}
      <section className="py-20 bg-white border-y border-slate-200 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-primary mb-3">Fee Breakdown</h2>
            <p className="text-slate-600">Exactly how fees are calculated on a completed shipment.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
            <p className="font-heading font-bold text-slate-900 mb-1">Example: KES 150,000 Nairobi → Mombasa load</p>
            <p className="text-sm text-slate-500 mb-5">Booked at fixed price, delivery confirmed.</p>
            <FeeRow label="Gross freight value"     value="KES 150,000" />
            <FeeRow label="Platform fee (3%)"       value="KES 4,500"   note="Deducted from shipper's escrow" />
            <FeeRow label="Carrier receives (7% deducted from carrier side)" value="KES 139,500" note="Fleet owner's wallet" />
            <FeeRow label="trakvora revenue"        value="KES 10,500"  note="3% from shipper + 7% of carrier payout = combined margin" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Zap,       title: "Instant release",       desc: "Funds released to carrier wallet within seconds of delivery confirmation." },
              { icon: Shield,    title: "No hidden charges",     desc: "The percentages above are the only fees. No listing fees, no monthly charges." },
              { icon: CreditCard, title: "KES 15,000 cap",       desc: "Platform fee is capped at KES 15,000 per shipment regardless of load value." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-5">
                <Icon className="w-5 h-5 text-secondary mb-3" />
                <p className="font-heading font-semibold text-slate-900 mb-1 text-sm">{title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-primary mb-10 text-center">Platform Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 pr-4 font-heading font-semibold text-slate-600 w-1/2">Feature</th>
                  <th className="text-center py-3 px-3 font-heading font-semibold text-slate-600">Shippers</th>
                  <th className="text-center py-3 px-3 font-heading font-semibold text-secondary">Fleet Owners</th>
                  <th className="text-center py-3 px-3 font-heading font-semibold text-slate-600">Drivers</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Post loads",                 true,  false, false],
                  ["Browse load marketplace",    false, true,  true],
                  ["Submit bids",                false, true,  false],
                  ["Real-time GPS tracking",     true,  true,  true],
                  ["Escrow payment protection",  true,  true,  false],
                  ["KES wallet",                 true,  true,  true],
                  ["M-Pesa payouts",             false, true,  true],
                  ["Consignment notes",          true,  true,  true],
                  ["Driver management",          false, true,  false],
                  ["Fleet dashboard",            false, true,  false],
                  ["Shipment history",           true,  true,  true],
                  ["Dispute resolution",         true,  true,  true],
                  ["Return window listings",     false, true,  true],
                  ["NTSA verification",          false, true,  true],
                ].map(([feature, shipper, owner, driver]) => (
                  <tr key={feature} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-4 text-slate-700">{feature}</td>
                    {[shipper, owner, driver].map((has, i) => (
                      <td key={i} className="text-center py-3 px-3">
                        {has
                          ? <CheckCircle className="w-4 h-4 text-teal-500 inline" />
                          : <X className="w-4 h-4 text-slate-300 inline" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white border-t border-slate-200 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-primary mb-10 text-center">Pricing FAQs</h2>
          {[
            { q: "Is there a free trial?", a: "Yes — all three role types can create accounts and explore the platform at no cost. Fees only apply once a load is posted and a delivery is successfully completed." },
            { q: "What if a delivery is disputed?", a: "Disputed deliveries enter a hold state. Our resolution team reviews evidence from both parties. If unresolved in favour of the carrier, the shipper is refunded from escrow." },
            { q: "Can I cancel a load after posting?", a: "Yes, before a bid is accepted. Once a bid is accepted and escrow is locked, cancellation incurs a cancellation fee (5% of load value) to compensate the carrier." },
            { q: "Are there volume discounts?", a: "Enterprise shippers with 50+ loads per month qualify for a reduced platform fee. Contact our team at enterprise@trakvora.com for custom rates." },
            { q: "How are payouts processed?", a: "Payouts hit your trakvora wallet immediately on confirmed delivery. You can withdraw to M-Pesa or a registered bank account at any time. Withdrawals process within 24 hours." },
          ].map(({ q, a }) => (
            <div key={q} className="flex gap-4 border-b border-slate-200 py-5">
              <HelpCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-semibold text-slate-900 mb-1">{q}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white text-center px-6">
        <div className="max-w-xl mx-auto">
          <h2 className="font-heading text-3xl font-bold mb-4">No Risk to Get Started</h2>
          <p className="text-slate-400 mb-8">Create your account in minutes. You only pay when a delivery is completed.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-secondary text-white px-10 py-4 rounded-xl font-heading font-bold hover:opacity-90 transition-opacity shadow-lg">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
