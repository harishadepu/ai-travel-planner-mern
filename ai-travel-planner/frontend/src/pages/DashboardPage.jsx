import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import TripCard from '../components/TripCard';
import api from '../lib/api';
import { PlusCircle, MapPin, Heart, Globe, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, statsRes] = await Promise.all([
        api.get('/trips?limit=20'),
        api.get('/trips/stats'),
      ]);
      setTrips(tripsRes.data.trips);
      setStats(statsRes.data.stats);
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => setTrips((p) => p.filter((t) => t._id !== id));
  const handleFavorite = (id, isFavorite) =>
    setTrips((p) => p.map((t) => (t._id === id ? { ...t, isFavorite } : t)));

  const filtered = filter === 'favorites' ? trips.filter((t) => t.isFavorite) : trips;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const statCards = [
    { label: 'Total Trips', value: stats?.totalTrips ?? '—', icon: MapPin, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Favorites', value: stats?.favoriteTrips ?? '—', icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Destinations', value: stats?.uniqueDestinations ?? '—', icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> ✈️
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Where are you heading next?</p>
          </div>
          <Link to="/trips/new" className="btn-primary">
            <PlusCircle className="w-4 h-4" /> New Trip
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="card flex items-center gap-4">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trips */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Your Trips</h2>
            <div className="flex gap-2">
              {['all', 'favorites'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {f === 'all' ? 'All' : '♥ Favorites'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-16">
              <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {filter === 'favorites' ? 'No favorites yet' : 'No trips planned yet'}
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                {filter === 'favorites' ? 'Heart a trip to save it here.' : 'Create your first AI-powered itinerary.'}
              </p>
              {filter === 'all' && (
                <Link to="/trips/new" className="btn-primary inline-flex">
                  <PlusCircle className="w-4 h-4" /> Plan your first trip
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((trip) => (
                <TripCard key={trip._id} trip={trip} onDelete={handleDelete} onFavorite={handleFavorite} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
