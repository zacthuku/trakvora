import { useState } from "react";
import {
  HelpCircle, MessageSquare, Phone, Mail, ChevronDown, ChevronUp,
  Briefcase, CreditCard, Navigation2, Shield, Send, CheckCircle2,
  Clock, Zap, FileText,
} from "lucide-react";

const inputCls =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors bg-white text-slate-800 placeholder:text-slate-400";

const FAQ_SECTIONS = [
  {
    icon: Briefcase,
    iconColor: "text-secondary",
    title: "Finding & Bidding on Jobs",
    items: [
      {
        q: "How do I find loads that match my truck?",
        a: "Open the Job Feed page. Loads are automatically filtered by your registered truck type. You can further narrow results by corridor, date, and cargo type using the filter bar at the top.",
      },
      {
        q: "How do I place a bid on a load?",
        a: "On the Job Feed, tap a load card to expand it. Enter your bid amount in KES and tap Submit Bid. You'll receive a notification once the shipper reviews your offer.",
      },
      {
        q: "Can I edit or withdraw a bid?",
        a: "You can withdraw a pending bid before it is accepted. Go to the load card on your Job Feed, expand it, and select Withdraw Bid. Once accepted, bids are binding.",
      },
      {
        q: "Why isn't my truck showing eligible loads?",
        a: "Make sure your truck is marked active in Fleet settings and that your truck type (flatbed, reefer, tanker, etc.) is correctly registered. Loads are matched by truck type.",
      },
    ],
  },
  {
    icon: Navigation2,
    iconColor: "text-sky-600",
    title: "Active Jobs & Delivery",
    items: [
      {
        q: "How do I update my delivery status?",
        a: "On the Active Job page, use the status update buttons: Confirm Pickup, Mark Loaded, and Confirm Delivery. Each step triggers a notification to the shipper and updates the shipment timeline.",
      },
      {
        q: "What happens if I'm running late?",
        a: "Tap Report Delay on the Active Job page and enter an estimated delay time and reason. The shipper will be notified automatically and the ETA will be updated on their tracking view.",
      },
      {
        q: "I completed a delivery but payment hasn't released.",
        a: "Payment is held in escrow until the shipper confirms delivery on their end. This usually happens within 2 hours. If it exceeds 24 hours after your Confirm Delivery tap, contact support below.",
      },
    ],
  },
  {
    icon: CreditCard,
    iconColor: "text-teal-600",
    title: "Earnings & Wallet",
    items: [
      {
        q: "When is payment released to my wallet?",
        a: "Funds are released from escrow within 2–4 hours after the shipper confirms delivery. You'll receive an Earnings Update notification when the funds land.",
      },
      {
        q: "How do I withdraw my earnings?",
        a: "Go to Earnings → Wallet. Enter the amount and select M-Pesa or your linked bank account. Withdrawals are processed within 1 business day.",
      },
      {
        q: "Are there any platform fees?",
        a: "trakvora charges a 3% service fee on the agreed bid amount. This is deducted from the escrow before funds are released to your wallet.",
      },
    ],
  },
  {
    icon: Shield,
    iconColor: "text-violet-600",
    title: "Account & Safety",
    items: [
      {
        q: "How do I update my truck documents?",
        a: "Document uploads are managed by the fleet owner. If you notice an expired document on your profile, contact your fleet owner to upload the updated certificate.",
      },
      {
        q: "What should I do if I'm in an accident or emergency?",
        a: "First ensure your safety and call 999 if needed. Then open trakvora and tap the Safety Alert button on your Active Job page. Our support team will be notified immediately.",
      },
      {
        q: "How do I report a shipper for misconduct?",
        a: "After completing or cancelling a job, you'll be prompted to rate the shipper. Tap Report Issue in that screen and describe the incident. Our trust team reviews all reports within 48 hours.",
      },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3.5 text-left gap-4"
      >
        <span className="text-sm font-medium text-slate-800">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && <p className="text-sm text-slate-500 pb-4 leading-relaxed pr-6">{a}</p>}
    </div>
  );
}

function FaqSection({ icon: Icon, iconColor, title, items }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h3 className="font-heading font-semibold text-slate-900 text-sm">{title}</h3>
      </div>
      <div className="px-6">
        {items.map((item, i) => <FaqItem key={i} {...item} />)}
      </div>
    </div>
  );
}

function TicketForm() {
  const [form, setForm] = useState({ type: "", subject: "", load_id: "", message: "" });
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.type && form.subject && form.message.length >= 20;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-teal-600" />
        </div>
        <div>
          <p className="font-heading font-semibold text-slate-900">Ticket submitted</p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">We'll respond to your registered email within 4 business hours.</p>
        </div>
        <button onClick={() => { setSent(false); setForm({ type: "", subject: "", load_id: "", message: "" }); }}
          className="text-sm text-secondary font-semibold hover:underline">
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Issue Type</label>
          <select value={form.type} onChange={set("type")} className={inputCls}>
            <option value="">Select type</option>
            <option>Payment / Earnings</option>
            <option>Job / Bid Issue</option>
            <option>Active Delivery</option>
            <option>Account / Profile</option>
            <option>Technical Problem</option>
            <option>Safety / Emergency</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Load ID (optional)</label>
          <input value={form.load_id} onChange={set("load_id")} placeholder="e.g. LD-00123" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Subject</label>
        <input value={form.subject} onChange={set("subject")} placeholder="Brief description of your issue" className={inputCls} />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Message</label>
        <textarea value={form.message} onChange={set("message")} rows={5}
          placeholder="Describe your issue in detail — include dates, amounts, and any error messages you saw."
          className={inputCls + " resize-none"} />
        <p className="text-[11px] text-slate-400 mt-1">{form.message.length} / 20 min characters</p>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={!valid}
          className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">
          <Send className="w-4 h-4" /> Send Ticket
        </button>
      </div>
    </form>
  );
}

export default function DriverSupportPage() {
  const [tab, setTab] = useState("faq");

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-7">
        <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Help & Support</h1>
        <p className="text-slate-500 text-sm mt-1">Find answers to common questions or reach our driver support team.</p>
      </div>

      {/* Response time banner */}
      <div className="flex items-center gap-3 bg-[#4fdbcc]/10 border border-[#4fdbcc]/30 rounded-xl px-5 py-3.5 mb-6">
        <Clock className="w-4 h-4 text-teal-600 shrink-0" />
        <p className="text-sm text-teal-800 font-medium">Average response time: <span className="font-bold">under 4 hours</span> — Mon–Sat, 7am–10pm EAT</p>
      </div>

      {/* Contact channels */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: MessageSquare, iconBg: "bg-secondary/10", iconColor: "text-secondary", title: "Live Chat", sub: "Chat with a driver specialist", action: "Start Chat", badge: "Fastest" },
          { icon: Phone, iconBg: "bg-sky-50", iconColor: "text-sky-600", title: "Call Us", sub: "+254 700 123 456", action: "Call Now", badge: null },
          { icon: Mail, iconBg: "bg-violet-50", iconColor: "text-violet-600", title: "Email", sub: "drivers@trakvora.com", action: "Send Email", badge: null },
        ].map(({ icon: Icon, iconBg, iconColor, title, sub, action, badge }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:border-secondary/40 transition-colors">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">{badge}</span>
              )}
            </div>
            <div>
              <p className="font-heading font-semibold text-slate-900 text-sm">{title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
            <button className="text-[11px] font-semibold text-secondary hover:underline text-left uppercase tracking-wider">{action} →</button>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
        {[
          { id: "faq",    icon: HelpCircle,    label: "FAQ"         },
          { id: "ticket", icon: FileText,       label: "Open Ticket" },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "faq" && (
        <div>
          {FAQ_SECTIONS.map((s) => <FaqSection key={s.title} {...s} />)}
        </div>
      )}

      {tab === "ticket" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-slate-900">Open a Support Ticket</h2>
              <p className="text-xs text-slate-500 mt-0.5">We'll respond to your registered email within 4 business hours.</p>
            </div>
          </div>
          <div className="px-6 py-5">
            <TicketForm />
          </div>
        </div>
      )}
    </div>
  );
}
