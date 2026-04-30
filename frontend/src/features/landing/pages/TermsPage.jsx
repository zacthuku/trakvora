import { Link } from "react-router-dom";

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="font-heading text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function Sub({ title, children }) {
  return (
    <div className="mt-4">
      <h3 className="font-heading font-semibold text-slate-800 mb-2">{title}</h3>
      <div className="text-slate-600 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="bg-surface">
      {/* Header */}
      <section className="bg-primary text-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-secondary text-xs font-bold font-heading uppercase tracking-widest mb-3">Legal</p>
          <h1 className="font-heading text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: 29 April 2026 · Effective: 29 April 2026</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Intro */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10 text-sm text-amber-800">
          <strong>Important:</strong> These Terms of Service ("Terms") constitute a legally binding agreement between you and trakvora Technologies Ltd. By accessing or using our platform, you agree to be bound by these Terms. Please read them carefully.
        </div>

        <Section title="1. The Platform and Parties">
          <p>trakvora Technologies Ltd ("trakvora", "we", "us", or "our"), incorporated in Kenya, operates an online freight exchange platform accessible at trakvora.com and via mobile applications ("the Platform").</p>
          <p>The Platform facilitates freight transactions between:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Shippers</strong> — individuals or entities posting cargo for transport</li>
            <li><strong>Fleet Owners</strong> — licensed operators offering truck capacity and drivers</li>
            <li><strong>Drivers</strong> — licensed individuals operating vehicles to transport cargo</li>
          </ul>
          <p className="mt-3">trakvora is a technology platform and marketplace operator. We are not a freight forwarder, carrier, logistics provider, or party to any freight contract between a Shipper and a Carrier. The freight contract is formed directly between the Shipper and the Fleet Owner/Driver upon bid acceptance.</p>
        </Section>

        <Section title="2. Eligibility and Account Registration">
          <p>To use the Platform you must: (a) be at least 18 years of age; (b) have legal capacity to enter into binding contracts under Kenyan law; (c) for Drivers and Fleet Owners, hold all required licences, permits, and authorisations required by Kenyan law and the laws of any country in which you operate.</p>
          <Sub title="2.1 Account Security">
            You are responsible for maintaining the confidentiality of your account credentials. You must immediately notify trakvora of any unauthorised use of your account. trakvora will not be liable for any loss arising from unauthorised access resulting from your failure to secure your credentials.
          </Sub>
          <Sub title="2.2 Account Verification">
            Drivers and Fleet Owners must complete NTSA verification before transacting on the Platform. trakvora reserves the right to suspend accounts that provide false, misleading, or outdated documentation.
          </Sub>
        </Section>

        <Section title="3. Platform Fees and Payment">
          <p>trakvora charges the following fees on successfully completed deliveries:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Shipper Platform Fee:</strong> 3% of the agreed load value, capped at KES 15,000 per shipment</li>
            <li><strong>Carrier Platform Fee:</strong> 7% of the agreed load value, deducted from the carrier payout</li>
          </ul>
          <p className="mt-3">Fees are non-refundable for completed deliveries. In cases of dispute, fees may be held pending resolution.</p>
          <Sub title="3.1 Escrow">
            Upon bid acceptance, the Shipper's payment is held in escrow by trakvora. Funds are released to the Carrier upon confirmed delivery. trakvora does not earn interest on escrowed funds. Escrow is not a deposit-taking activity and trakvora is not a bank or financial institution.
          </Sub>
          <Sub title="3.2 Cancellation Fees">
            Cancellation of a load after bid acceptance incurs a 5% cancellation fee on the load value, payable to the Carrier as compensation for reserved capacity. Cancellations before bid acceptance are free of charge.
          </Sub>
        </Section>

        <Section title="4. Carrier Obligations">
          <p>Fleet Owners and Drivers agree to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Maintain valid NTSA registration, vehicle insurance (minimum third-party), and all applicable permits</li>
            <li>Ensure trucks are roadworthy and suitable for the cargo type accepted</li>
            <li>Comply with weight limits, hazardous material regulations, and cross-border transit rules</li>
            <li>Maintain real-time GPS availability during active shipments</li>
            <li>Not subcontract freight without the Shipper's prior written consent</li>
            <li>Deliver cargo in the condition received, within the agreed timeframe</li>
          </ul>
        </Section>

        <Section title="5. Shipper Obligations">
          <p>Shippers agree to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Accurately describe cargo type, weight, dimensions, and any hazardous or sensitive characteristics</li>
            <li>Ensure cargo is properly packaged and labelled for transport</li>
            <li>Maintain sufficient wallet balance to cover the agreed load value before bid acceptance</li>
            <li>Confirm or dispute delivery within 48 hours of the driver marking a shipment as delivered</li>
            <li>Not use the Platform to move prohibited goods (see Section 7)</li>
          </ul>
        </Section>

        <Section title="6. Prohibited Goods">
          <p>The Platform may not be used to transport: (a) illegal narcotics or controlled substances; (b) weapons, ammunition, or explosives without required licences; (c) counterfeit goods; (d) live animals without veterinary certification; (e) currency or negotiable instruments above KES 1,000,000 without declaration; (f) any goods prohibited by Kenyan law or the laws of transit countries.</p>
          <p className="mt-2">trakvora may report suspected illegal activity to relevant authorities without prior notice.</p>
        </Section>

        <Section title="7. Liability and Indemnification">
          <Sub title="7.1 Platform Liability">
            trakvora's liability to any party is limited to the platform fees paid by that party in the 3 months preceding the event giving rise to the claim. trakvora is not liable for: cargo loss or damage; delays; personal injury; or consequential, indirect, or punitive damages arising from any freight contract between a Shipper and Carrier.
          </Sub>
          <Sub title="7.2 Indemnification">
            You agree to indemnify trakvora against any claims, losses, or expenses (including legal fees) arising from your breach of these Terms, your negligence, or your violation of any applicable law.
          </Sub>
        </Section>

        <Section title="8. Dispute Resolution">
          <p>Disputes between Shippers and Carriers are handled through trakvora's in-platform dispute resolution process. trakvora may, at its discretion, review evidence and make a determination as to fund distribution. Such determinations are final in respect of escrowed funds but do not waive either party's right to pursue legal remedies.</p>
          <p className="mt-2">These Terms are governed by the laws of Kenya. Any dispute not resolved through the Platform process shall be referred to arbitration in Nairobi under the Arbitration Act, Cap. 49 of the Laws of Kenya.</p>
        </Section>

        <Section title="9. Privacy">
          <p>Your use of the Platform is subject to our <Link to="/privacy" className="text-secondary hover:underline font-semibold">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>trakvora may update these Terms at any time. We will notify registered users by email and in-platform notice at least 14 days before material changes take effect. Continued use of the Platform after the effective date constitutes acceptance of the revised Terms.</p>
        </Section>

        <Section title="11. Contact">
          <p>trakvora Technologies Ltd<br />
          Nairobi, Kenya<br />
          Email: <a href="mailto:legal@trakvora.com" className="text-secondary hover:underline">legal@trakvora.com</a><br />
          Phone: +254 700 000 000</p>
        </Section>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-6 text-xs text-slate-500">
          <Link to="/privacy"           className="hover:text-secondary transition-colors">Privacy Policy</Link>
          <Link to="/carrier-agreement" className="hover:text-secondary transition-colors">Carrier Agreement</Link>
          <Link to="/help"              className="hover:text-secondary transition-colors">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
