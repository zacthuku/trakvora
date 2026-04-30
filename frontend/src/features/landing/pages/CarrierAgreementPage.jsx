import { Link } from "react-router-dom";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="font-heading text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function Req({ children }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

function Warn({ children }) {
  return (
    <li className="flex items-start gap-2.5">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

export default function CarrierAgreementPage() {
  return (
    <div className="bg-surface">
      <section className="bg-primary text-white py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-secondary text-xs font-bold font-heading uppercase tracking-widest mb-3">Legal</p>
          <h1 className="font-heading text-4xl font-bold mb-3">Carrier Agreement</h1>
          <p className="text-slate-400 text-sm">Applicable to all Fleet Owners and Drivers · Last updated: 29 April 2026</p>
          <div className="flex items-center gap-2 mt-4">
            <Shield className="w-5 h-5 text-teal-400" />
            <span className="text-teal-400 text-sm font-medium">NTSA Compliance Required</span>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10 text-sm text-amber-800">
          <strong>Carrier Agreement:</strong> This agreement applies to all Fleet Owners and Drivers ("Carriers") who register on the trakvora platform. By completing registration, you confirm you have read, understood, and agree to the terms below. This agreement supplements our <Link to="/terms" className="font-semibold underline">Terms of Service</Link>.
        </div>

        <Section title="1. Eligibility Requirements">
          <p>To operate as a Carrier on trakvora, you must meet all of the following requirements at all times:</p>
          <ul className="space-y-2 mt-3">
            <Req>Hold a valid Kenya driving licence of the appropriate class for the vehicles you operate (Class B, C, CE, or BCE as applicable)</Req>
            <Req>Hold a valid PSV (Public Service Vehicle) badge where required by law for the cargo or route</Req>
            <Req>Be registered with the National Transport and Safety Authority (NTSA) Kenya</Req>
            <Req>Maintain valid third-party motor vehicle insurance at minimum; cargo insurance strongly recommended</Req>
            <Req>For cross-border operations, hold a valid COMESA Yellow Card or equivalent international transit permit</Req>
            <Req>Provide a valid police clearance certificate not older than 12 months at time of registration</Req>
            <Req>Provide a certificate of good conduct issued by the Kenya Police Service</Req>
            <Req>For Fleet Owners: hold a valid National Transport and Safety Authority carrier licence</Req>
          </ul>
        </Section>

        <Section title="2. Vehicle Standards">
          <p>All vehicles used on the trakvora platform must:</p>
          <ul className="space-y-2 mt-3">
            <Req>Hold a valid NTSA inspection certificate (annually renewed)</Req>
            <Req>Be roadworthy and mechanically fit for the cargo type and weight being transported</Req>
            <Req>Be equipped with functional speedometer, mirrors, lights, brakes, and safety equipment</Req>
            <Req>Have a functional mobile device capable of running the trakvora driver app for GPS tracking</Req>
            <Req>For reefer loads: cooling unit maintained and calibrated to deliver the required temperature range</Req>
            <Req>For tankers: proper manifold and valve sealing certified by the relevant authority</Req>
            <Req>For hazardous materials: KEBS-approved containment and placarding as per ADR standards</Req>
          </ul>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <ul className="space-y-2">
              <Warn>Vehicles with expired NTSA inspection certificates will be suspended from the platform without notice</Warn>
              <Warn>Operating a vehicle that is unroadworthy and causing cargo damage may result in permanent account termination</Warn>
            </ul>
          </div>
        </Section>

        <Section title="3. Operational Obligations">
          <p>As a Carrier, you agree to:</p>
          <ul className="space-y-2 mt-3">
            <Req>Accept only loads you are equipped and licensed to carry</Req>
            <Req>Arrive at the pickup location within the agreed pickup window</Req>
            <Req>Inspect cargo at pickup and document any pre-existing damage with photographs before loading</Req>
            <Req>Sign (or accept digitally) the trakvora consignment note before departing the pickup location</Req>
            <Req>Update shipment status in real time via the trakvora app: en route → loaded → in transit → delivered</Req>
            <Req>Maintain GPS location sharing throughout the active shipment</Req>
            <Req>Deliver cargo in the same condition as received, within the agreed timeframe</Req>
            <Req>Notify the Platform immediately of any accident, breakdown, or delay exceeding 2 hours</Req>
            <Req>Not consume alcohol or controlled substances while operating a vehicle</Req>
            <Req>Adhere to Kenyan road traffic regulations including posted speed limits</Req>
          </ul>
        </Section>

        <Section title="4. Payment and Fee Structure">
          <p>Carriers receive freight payment as follows:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Gross freight value is escrowed by the Shipper upon bid acceptance</li>
            <li>A <strong>7% platform fee</strong> is deducted from the gross freight value</li>
            <li>The net amount is credited to the Carrier's trakvora wallet upon confirmed delivery</li>
            <li>The platform fee is capped at KES 15,000 per shipment</li>
            <li>Wallet withdrawals to M-Pesa or bank are processed within 24 hours</li>
          </ul>
          <p className="mt-3">For disputed deliveries, payment is held pending resolution. trakvora's decision on escrowed funds is binding (see Terms of Service §8).</p>
        </Section>

        <Section title="5. Insurance and Liability">
          <p>Carriers are solely responsible for:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Third-party liability arising from vehicle operation</li>
            <li>Cargo loss, damage, or theft whilst in their care and custody</li>
            <li>Any fines, penalties, or seizures arising from non-compliance with applicable laws</li>
            <li>Fuel, accommodation, and all operational costs of the journey</li>
          </ul>
          <p className="mt-3">trakvora strongly recommends Carriers obtain goods-in-transit insurance. Proof of coverage may be required for high-value or hazardous loads. trakvora does not provide or arrange cargo insurance.</p>
          <p className="mt-2">trakvora's aggregate liability to any Carrier is limited to platform fees paid by that Carrier in the preceding 3 months.</p>
        </Section>

        <Section title="6. Prohibited Conduct">
          <p>Carriers must not:</p>
          <div className="mt-3">
            <ul className="space-y-2">
              <Warn>Subcontract or relay a load to a third party without the Shipper's express written consent</Warn>
              <Warn>Falsify GPS data, consignment signatures, or delivery photos</Warn>
              <Warn>Demand payment outside the trakvora platform from any Shipper</Warn>
              <Warn>Transport prohibited goods (see Terms of Service §6)</Warn>
              <Warn>Open cargo unless required by a legitimate customs or regulatory inspection</Warn>
              <Warn>Solicit Shippers to conduct freight business outside trakvora after meeting through the platform</Warn>
              <Warn>Create multiple accounts to circumvent suspension or rating penalties</Warn>
            </ul>
          </div>
          <p className="mt-4">Violation of any item above may result in immediate account suspension, forfeiture of escrowed payments, and referral to NTSA or law enforcement authorities.</p>
        </Section>

        <Section title="7. Ratings and Performance">
          <p>Shippers rate Carriers after every delivery on a 1–5 star scale. Your rating affects your visibility in load matching and search rankings. trakvora may suspend accounts that:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Fall below a 3.0 rating average (calculated over the last 10 trips)</li>
            <li>Accumulate 3 or more cancellations in a 30-day period after bid acceptance</li>
            <li>Receive 2 or more upheld disputes in a 90-day period</li>
          </ul>
          <p className="mt-2">Suspended Carriers may appeal by contacting <a href="mailto:carriers@trakvora.com" className="text-secondary hover:underline font-semibold">carriers@trakvora.com</a>.</p>
        </Section>

        <Section title="8. Document Renewal">
          <p>Carriers are responsible for keeping all required documents current. trakvora will send renewal reminders 30 days before document expiry based on the dates on file. Expired documents will result in automatic suspension until updated copies are provided and verified.</p>
        </Section>

        <Section title="9. Termination">
          <p>Either party may terminate this Agreement by closing the trakvora account. trakvora may terminate immediately for serious breach, including criminal conduct, fraud, or repeated safety violations. Upon termination, any escrowed funds for completed deliveries will be released; funds for disputed or incomplete deliveries will be resolved per the dispute process.</p>
        </Section>

        <Section title="10. Governing Law">
          <p>This Agreement is governed by the laws of Kenya. Disputes are subject to arbitration in Nairobi under the Arbitration Act, Cap. 49 of the Laws of Kenya. For regulatory matters, NTSA rules and the Traffic Act (Cap. 403) apply.</p>
        </Section>

        <div className="mt-10 p-6 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="font-heading font-semibold text-primary mb-2">Carrier Support</p>
          <p className="text-sm text-slate-600 mb-3">Questions about this agreement or your obligations on the platform?</p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:carriers@trakvora.com" className="text-sm font-semibold text-secondary hover:underline">carriers@trakvora.com</a>
            <Link to="/help" className="text-sm font-semibold text-secondary hover:underline">Help Center</Link>
            <Link to="/register?role=driver" className="text-sm font-semibold text-secondary hover:underline">Register as Driver</Link>
            <Link to="/register?role=owner" className="text-sm font-semibold text-secondary hover:underline">Register Fleet</Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-6 text-xs text-slate-500">
          <Link to="/terms"   className="hover:text-secondary transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
          <Link to="/help"    className="hover:text-secondary transition-colors">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
