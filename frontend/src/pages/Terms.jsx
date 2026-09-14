import { Link } from 'react-router-dom';
import { Scale, CheckCircle2, AlertCircle, ShoppingBag, Truck, ArrowLeft } from 'lucide-react';

export default function Terms() {
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
              <Scale className="w-4 h-4" />
              Service Terms &amp; Conditions
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-500">
              Last updated: September 2026 &bull; Please read carefully before purchasing
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#6a9739]" />
                1. Product Quality &amp; Freshness Guarantee
              </h2>
              <p>
                Organic Store guarantees that all items sold under our certified organic catalog meet natural and organic standards. Due to the seasonal nature of fresh produce, slight natural variations in appearance, size, or color are completely normal and indicate genuine, preservative-free cultivation.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#6a9739]" />
                2. Order Fulfillment, Pricing &amp; Delivery
              </h2>
              <p>
                Orders are dispatched within 24 hours of placement to preserve maximum farm-fresh nutrient density:
              </p>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-gray-700">
                <li>All prices are stated in PKR and are inclusive of standard local packaging.</li>
                <li>Free delivery applies to all orders totaling ₨ 1,000 or greater. Standard delivery charges apply otherwise.</li>
                <li>Cash on Delivery (COD) orders require a valid recipient phone confirmation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6a9739]" />
                3. Coupon Usage &amp; Promotions
              </h2>
              <p>
                Promotional coupons and discounts are subject to specific minimum order criteria, validity windows, and usage caps. Coupons are strictly limited to one redemption per household/account unless expressly stated otherwise in promotional materials.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#6a9739]" />
                4. Cancellation &amp; Refund Policy
              </h2>
              <p>
                You may cancel your order free of charge before it transitions to the <span className="font-semibold text-gray-900">PROCESSING</span> stage. If any delivered perishable produce arrives damaged or unsatisfactory, notify our team within 12 hours of delivery for an immediate replacement or full refund credit.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
