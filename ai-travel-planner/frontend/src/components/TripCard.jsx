import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Calendar, Heart, Trash2 } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

const BUDGET_LABELS = { low: 'Budget', medium: 'Moderate', high: 'Luxury' };
const BUDGET_COLORS = {
  low: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-brand-500/20 text-brand-400',
  high: 'bg-orange-500/20 text-orange-400',
};
const STATUS_DOT = {
  ready: 'bg-emerald-500',
  generating: 'bg-yellow-500 animate-pulse',
  error: 'bg-red-500',
};

export default function TripCard({ trip, onDelete, onFavorite }) {
  const [favoriting, setFavoriting] = useState(false);

  const handleFavorite = async (e) => {
    e.preventDefault();
    setFavoriting(true);
    try {
      await api.patch(`/trips/${trip._id}`, { isFavorite: !trip.isFavorite });
      onFavorite?.(trip._id, !trip.isFavorite);
    } catch {
      toast.error('Failed to update');
    } finally {
      setFavoriting(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!confirm(`Delete "${trip.title}"?`)) return;
    try {
      await api.delete(`/trips/${trip._id}`);
      onDelete?.(trip._id);
      toast.success('Trip deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <Link to={`/trips/${trip._id}`} className="block group">
      <div className="card-hover relative">
        <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${STATUS_DOT[trip.status] || 'bg-gray-500'}`} />

        <div className="flex items-center justify-between mb-2 pr-4">
          <div className="flex items-center gap-1.5 text-brand-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{trip.destination}</span>
          </div>
          <span className={`badge ${BUDGET_COLORS[trip.budgetType]}`}>
            {BUDGET_LABELS[trip.budgetType]}
          </span>
        </div>

        <h3 className="font-semibold text-white mb-3 group-hover:text-brand-300 transition-colors line-clamp-2">
          {trip.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.numberOfDays}d</span>
          {trip.budgetEstimate?.total > 0 && (
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${trip.budgetEstimate.total.toLocaleString()}</span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {trip.interests?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {trip.interests.slice(0, 3).map((i) => (
              <span key={i} className="badge bg-gray-800 text-gray-400">{i}</span>
            ))}
            {trip.interests.length > 3 && (
              <span className="badge bg-gray-800 text-gray-500">+{trip.interests.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <span className={`text-xs ${trip.status === 'ready' ? 'text-emerald-400' : trip.status === 'generating' ? 'text-yellow-400' : 'text-red-400'}`}>
            {trip.status === 'ready' ? '✓ Ready' : trip.status === 'generating' ? '⏳ Generating...' : '✗ Error'}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={handleFavorite} disabled={favoriting}
              className={`p-1.5 rounded-lg transition-colors ${trip.isFavorite ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}>
              <Heart className={`w-4 h-4 ${trip.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button onClick={handleDelete}
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
