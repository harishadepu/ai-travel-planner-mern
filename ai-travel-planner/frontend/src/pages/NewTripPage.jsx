import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { MapPin, Calendar, DollarSign, Sparkles, Loader2, ArrowLeft, Check } from 'lucide-react';

const INTERESTS = [
  { id: 'food', label: '🍜 Food & Dining' },
  { id: 'culture', label: '🏛️ Culture & History' },
  { id: 'adventure', label: '🧗 Adventure' },
  { id: 'shopping', label: '🛍️ Shopping' },
  { id: 'nature', label: '🌿 Nature' },
  { id: 'nightlife', label: '🌙 Nightlife' },
  { id: 'art', label: '🎨 Art & Museums' },
  { id: 'relaxation', label: '🧘 Relaxation' },
  { id: 'sports', label: '⚽ Sports' },
  { id: 'photography', label: '📸 Photography' },
];

const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget', desc: 'Hostels, street food, free attractions', icon: '💚' },
  { value: 'medium', label: 'Moderate', desc: '3-star hotels, casual dining', icon: '💛' },
  { value: 'high', label: 'Luxury', desc: '5-star hotels, fine dining, premium experiences', icon: '💎' },
];

export default function NewTripPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    destination: '',
    numberOfDays: 5,
    budgetType: 'medium',
    interests: [],
    startDate: '',
  });

  const toggleInterest = (id) =>
    setForm((p) => ({
      ...p,
      interests: p.interests.includes(id) ? p.interests.filter((i) => i !== id) : [...p.interests, id],
    }));

  const handleGenerate = async () => {
    if (!form.destination.trim()) { toast.error('Please enter a destination'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/generate', {
        destination: form.destination.trim(),
        numberOfDays: parseInt(form.numberOfDays),
        budgetType: form.budgetType,
        interests: form.interests,
        startDate: form.startDate || undefined,
      });
      toast.success('Itinerary generated!');
      navigate(`/trips/${data.trip._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const budgetLabel = BUDGET_OPTIONS.find((b) => b.value === form.budgetType)?.label.toLowerCase();

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-6">
          <Link to="/dashboard" className="text-gray-400 hover:text-white inline-flex items-center gap-1 text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Plan a new trip</h1>
          <p className="text-gray-400 mt-1 text-sm">Tell us about your trip and AI will handle the rest.</p>
        </div>

        <div className="card space-y-6">
          {/* Destination */}
          <div>
            <label className="label flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400" /> Destination
            </label>
            <input type="text" className="input" placeholder="e.g. Tokyo, Japan • Paris, France • Bali"
              value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} />
          </div>

          {/* Days & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" /> Number of Days
              </label>
              <input type="number" className="input" min={1} max={30}
                value={form.numberOfDays} onChange={(e) => setForm((p) => ({ ...p, numberOfDays: e.target.value }))} />
            </div>
            <div>
              <label className="label">Start Date (optional)</label>
              <input type="date" className="input"
                value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="label flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand-400" /> Budget Preference
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BUDGET_OPTIONS.map((b) => (
                <button key={b.value} type="button"
                  onClick={() => setForm((p) => ({ ...p, budgetType: b.value }))}
                  className={`p-3 rounded-xl border text-left transition-all ${form.budgetType === b.value ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'}`}>
                  <div className="text-lg mb-1">{b.icon}</div>
                  <div className="font-semibold text-sm">{b.label}</div>
                  <div className="text-xs opacity-60 mt-0.5 leading-tight">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="label">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const selected = form.interests.includes(interest.id);
                return (
                  <button key={interest.id} type="button" onClick={() => toggleInterest(interest.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selected ? 'border-brand-500 bg-brand-500/20 text-brand-300' : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'}`}>
                    {selected && <Check className="w-3 h-3 inline mr-1" />}
                    {interest.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {form.destination && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-sm text-gray-300">
              Generating a <span className="text-white font-medium">{form.numberOfDays}-day {budgetLabel}</span> trip to{' '}
              <span className="text-brand-400 font-medium">{form.destination}</span>
              {form.interests.length > 0 && (
                <> focused on <span className="text-white font-medium">{form.interests.slice(0, 3).join(', ')}{form.interests.length > 3 ? ` +${form.interests.length - 3} more` : ''}</span></>
              )}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading || !form.destination.trim()}
            className="btn-primary w-full justify-center py-3 text-base">
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating your itinerary...</>
              : <><Sparkles className="w-5 h-5" /> Generate Itinerary with AI</>
            }
          </button>

          {loading && (
            <p className="text-center text-xs text-gray-500">
              This takes 15–30 seconds. AI is crafting your perfect trip ✨
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
