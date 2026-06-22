import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Zap, BarChart2, Hotel, Sparkles, ArrowRight, Globe, Shield, Backpack } from 'lucide-react';

const features = [
  { icon: Zap, title: 'AI Itineraries', desc: 'Day-by-day plans built around your interests and budget, generated in seconds.', color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { icon: BarChart2, title: 'Budget Estimates', desc: 'Realistic cost breakdowns for flights, hotels, food, and activities.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Hotel, title: 'Hotel Picks', desc: 'Curated recommendations across budget, mid-range, and luxury tiers.', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { icon: Sparkles, title: 'Live Editing', desc: 'Remove activities, add your own, or regenerate any day with a custom prompt.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Backpack, title: 'Packing Lists', desc: 'Smart packing lists tailored to your destination, activities, and climate.', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { icon: Shield, title: 'Fully Private', desc: 'Strict data isolation — only you can ever see your trips.', color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-emerald-400 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">WanderAI</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm">Dashboard <ArrowRight className="w-4 h-4" /></Link>
            ) : (
              <>
                <Link to="/auth" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Sign In</Link>
                <Link to="/auth?mode=register" className="btn-primary text-sm">Get Started <ArrowRight className="w-4 h-4" /></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Claude AI
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Plan your dream trip<br />
            <span className="gradient-text">in under a minute</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Tell WanderAI where you want to go, your budget, and what you love — get a complete itinerary, budget breakdown, hotel picks, and packing list instantly.
          </p>
          <Link to={user ? '/dashboard' : '/auth?mode=register'} className="btn-primary text-base px-8 py-3">
            Plan my trip <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mt-16">
            {[{ v: '190+', l: 'Destinations' }, { v: '<30s', l: 'Generation time' }, { v: '5 tabs', l: 'Per trip' }].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-2xl font-bold text-white">{s.v}</div>
                <div className="text-xs text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything in one place</h2>
          <p className="text-gray-400">One tool to plan, edit, and manage all your trips.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card hover:border-gray-700 transition-all">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="card text-center bg-gradient-to-br from-brand-900/40 to-emerald-900/20 border-brand-800/40">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to explore?</h2>
          <p className="text-gray-400 mb-6">Join travelers who plan smarter with WanderAI.</p>
          <Link to={user ? '/dashboard' : '/auth?mode=register'} className="btn-primary">
            Start planning free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-6 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} WanderAI — MERN Stack + Tailwind CSS
      </footer>
    </div>
  );
}
