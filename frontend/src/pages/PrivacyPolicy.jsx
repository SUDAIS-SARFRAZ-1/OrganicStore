import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-[#f8f6f3] min-h-screen py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#6a9739] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-8 sm:p-12">
          {/* Header */}
          <div className="border-b border-gray-100 pb-8 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6a9739]/10 text-[#6a9739] text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-4 h-4" />
              Customer Trust &amp; Data Protection
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-500">
              Last updated: September 2026 &bull; Effective immediately for all Organic Store customers
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#6a9739]" />
                1. Information We Collect
              </h2>
              <p>
                When you browse Organic Store, register an account, or complete an order, we collect details necessary to process your deliveries and provide high quality customer service:
              </p>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-gray-700">
                <li>Personal details: Name, email address, and verified contact phone number.</li>
                <li>Delivery data: Street addresses, city, postal code, and delivery notes.</li>
                <li>Order history: Items purchased, coupon redemptions, and order status timestamps.</li>
                <li>Technical data: IP address, device type, and encrypted session cookies for authentication.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#6a9739]" />
                2. How We Protect Your Payment Information
              </h2>
              <p>
                Security is fundamental to our architecture. We never store raw credit/debit card numbers on our servers. Online payments are tokenized and processed directly by Stripe using bank-level 256-bit SSL encryption (PCI-DSS Level 1 certified).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6a9739]" />
                3. Sharing with Third Parties
              </h2>
              <p>
                We do not sell, rent, or trade your personal information. We share data solely with trusted operational partners required to complete your service:
              </p>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-gray-700">
                <li>Logistics &amp; Courier partners for doorstep grocery delivery.</li>
                <li>Stripe for secure payment verification.</li>
                <li>Transactional email providers for OTP and order receipts.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6a9739]" />
                4. Your Rights and Preferences
              </h2>
              <p>
                You can review, update, or delete your account information and saved delivery addresses anytime via your Account Profile. If you have any inquiries regarding data retention or requests for account deletion, please contact our support team at <span className="font-semibold text-gray-900">support@organicstore.com</span>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
