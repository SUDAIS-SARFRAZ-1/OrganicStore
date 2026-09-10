import { Link } from 'react-router-dom';
import { Leaf, Award, ShieldCheck, HeartHandshake, Truck, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function About() {
  const stats = [
    { value: '100%', label: 'Certified Organic', sub: 'No artificial additives' },
    { value: '15,000+', label: 'Happy Customers', sub: 'Across nationwide delivery' },
    { value: '120+', label: 'Partner Farms', sub: 'Sourced from local fields' },
    { value: '24 hrs', label: 'Farm to Door', sub: 'Harvested daily' },
  ];

  const values = [
    {
      icon: Award,
      title: 'Certified Quality',
      desc: 'All our produce and grocery essentials meet the strictest international organic standards, free from synthetic pesticides, hormones, or GMOs.',
    },
    {
      icon: HeartHandshake,
      title: 'Fair Farm Partnerships',
      desc: 'We partner directly with sustainable local farmers, guaranteeing fair compensation while bringing you the freshest seasonal harvest.',
    },
    {
      icon: ShieldCheck,
      title: '100% Transparency',
      desc: 'Know exactly where your food comes from. Every fruit, vegetable, and cold-pressed juice is traceable back to its origin.',
    },
    {
      icon: Truck,
      title: 'Eco-Friendly Delivery',
      desc: 'From biodegradable packaging to optimized green delivery routes, we minimize our carbon footprint with every order.',
    },
  ];

  return (
    <div className="bg-[#f8f6f3] min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-[#111827] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80"
            alt="Organic Farm Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6a9739]/20 text-[#8bc34a] text-xs font-bold uppercase tracking-wider mb-6">
            <Leaf className="w-4 h-4" />
            Our Mission &amp; Purpose
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            We Bring <span className="text-[#8bc34a]">100% Pure Nature</span> Directly to Your Family Table
          </h1>
          <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Organic Store was founded on a simple principle: healthy, chemical-free food should be accessible, transparent, and harvested with care.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 bg-white border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#fbfbfb]">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#6a9739]">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-gray-900 mt-1">{stat.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80"
                alt="Fresh Organic Harvest"
                className="w-full h-[440px] object-cover"
              />
            </div>
            {/* Floating Quality Seal */}
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#6a9739]/10 text-[#6a9739]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Guarantee</div>
                <div className="text-sm font-extrabold text-gray-900">Zero Preservatives</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-widest text-[#6a9739]">
              <span>Behind the harvest</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              We Are Your Favourite Organic Grocery Store
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Founded by passionate agricultural advocates and healthy food enthusiasts, Organic Store connects conscious urban shoppers with family-owned certified organic farms.
            </p>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              We believe what you put in your body dictates how you feel and thrive. That is why every fruit, vegetable, cold-pressed juice, and pantry staple is curated with absolute integrity.
            </p>

            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-sm text-gray-800 font-medium">
                <CheckCircle2 className="w-5 h-5 text-[#6a9739] shrink-0" />
                <span>Pesticide-free, chemical fertilizer-free agricultural practices</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-800 font-medium">
                <CheckCircle2 className="w-5 h-5 text-[#6a9739] shrink-0" />
                <span>Harvested within 24 hours of dispatch for optimal nutrient retention</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-800 font-medium">
                <CheckCircle2 className="w-5 h-5 text-[#6a9739] shrink-0" />
                <span>Environmentally ethical farming methods preserving our soil</span>
              </li>
            </ul>

            <div className="pt-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
              >
                <span>Shop Fresh Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Grid */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-widest text-[#6a9739]">
              Why Choose Us
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
              Our Core Organic Values
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#f8f6f3] border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col items-start"
                >
                  <div className="p-3 rounded-xl bg-[#6a9739]/15 text-[#6a9739] mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
