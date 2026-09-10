import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, MessageSquare, HelpCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Reset form after short display
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: '',
      });
    }, 1000);
  };

  const contactCards = [
    {
      icon: Phone,
      title: 'Phone & WhatsApp',
      detail: '+92 300 1234567',
      subtext: 'Mon-Sat from 8:00 AM to 8:00 PM',
      action: 'tel:+923001234567',
    },
    {
      icon: Mail,
      title: 'Email Support',
      detail: 'support@organicstore.com',
      subtext: 'Online support 24/7 with rapid response',
      action: 'mailto:support@organicstore.com',
    },
    {
      icon: MapPin,
      title: 'Our Store & Farm Hub',
      detail: 'F-7 Markaz, Islamabad',
      subtext: 'Fresh produce dispatch center',
      action: '#',
    },
    {
      icon: Clock,
      title: 'Store Timings',
      detail: '8:00 AM - 9:00 PM',
      subtext: 'Open 7 days a week for deliveries',
      action: '#',
    },
  ];

  const faqs = [
    {
      q: 'How fast is the farm-to-table delivery?',
      a: 'We harvest every morning and dispatch through climate-controlled delivery routes. Most orders within major urban zones are delivered same-day or within 24 hours.',
    },
    {
      q: 'What makes your produce 100% certified organic?',
      a: 'Our partner farms are audited and certified by leading standards including USDA Organic and EcoCert. We do not use any artificial pesticides or chemical fertilizers.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We support Cash on Delivery (COD) for all orders, as well as upcoming direct payment gateways. You can inspect your produce upon delivery.',
    },
    {
      q: 'What is your freshness & return policy?',
      a: 'If any produce does not meet your freshness expectations, contact us within 24 hours of delivery and we will issue an immediate replacement or full refund.',
    },
  ];

  return (
    <div className="bg-[#f8f6f3] min-h-screen">
      {/* Hero Header */}
      <section className="py-16 lg:py-20 bg-[#111827] text-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6a9739]/20 text-[#8bc34a] text-xs font-bold uppercase tracking-wider mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            We’d Love to Hear From You
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Get in Touch With <span className="text-[#8bc34a]">Organic Store</span>
          </h1>
          <p className="mt-4 text-base text-gray-300 max-w-xl mx-auto">
            Have questions about our harvest, custom corporate grocery orders, or delivery timing? Our team is always here to assist you.
          </p>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <a
                key={i}
                href={card.action}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200 flex flex-col items-center text-center group cursor-pointer"
              >
                <div className="p-3.5 rounded-full bg-[#6a9739]/10 text-[#6a9739] group-hover:bg-[#6a9739] group-hover:text-white transition-colors duration-200 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{card.title}</h3>
                <div className="font-extrabold text-[#6a9739] mt-1 text-sm">{card.detail}</div>
                <p className="text-xs text-gray-400 mt-1">{card.subtext}</p>
              </a>
            );
          })}
        </div>
      </section>

      {/* Main Form & FAQ Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl shadow-xs border border-gray-100">
            <div className="mb-8">
              <span className="text-xs uppercase font-bold tracking-widest text-[#6a9739]">
                Send a Message
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                How Can We Help You?
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Fill out the form below and an organic specialist will get back to you shortly.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-xl bg-[#6a9739]/10 border border-[#6a9739]/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#6a9739] text-white flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Message Received!</h3>
                <p className="text-sm text-gray-600">
                  Thank you for reaching out. A member of our organic team will respond to your email shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 px-4 py-2 bg-[#6a9739] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#58802d]"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sara Ahmed"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#6a9739] focus:ring-1 focus:ring-[#6a9739] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. sara@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#6a9739] focus:ring-1 focus:ring-[#6a9739] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +92 300 1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#6a9739] focus:ring-1 focus:ring-[#6a9739] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Topic / Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#6a9739] focus:ring-1 focus:ring-[#6a9739] text-sm bg-white"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order Status">Order Status &amp; Delivery</option>
                      <option value="Wholesale">Wholesale &amp; Bulk Orders</option>
                      <option value="Farmer Partnership">Farming / Sourcing Partnership</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what you need..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-hidden focus:border-[#6a9739] focus:ring-1 focus:ring-[#6a9739] text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Inquiry</span>
                </button>
              </form>
            )}
          </div>

          {/* Frequently Asked Questions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-[#6a9739]">
              <HelpCircle className="w-4 h-4" />
              <span>Common Questions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Quick Answers
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs space-y-2"
                >
                  <h4 className="font-bold text-sm text-gray-900">{faq.q}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
