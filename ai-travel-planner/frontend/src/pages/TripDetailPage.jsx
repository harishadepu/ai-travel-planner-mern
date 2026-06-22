import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  MapPin, Clock, DollarSign, Hotel, Lightbulb, RefreshCw, Plus, Trash2,
  Loader2, ArrowLeft, Heart, ChevronDown, ChevronUp, Star, Sparkles,
  AlertCircle, CloudSun, Wand2, Backpack, Check,
} from 'lucide-react';

const CATEGORY_COLORS = {
  food: 'bg-orange-500/20 text-orange-400',
  culture: 'bg-purple-500/20 text-purple-400',
  adventure: 'bg-emerald-500/20 text-emerald-400',
  shopping: 'bg-brand-500/20 text-brand-400',
  transport: 'bg-gray-700 text-gray-300',
  accommodation: 'bg-yellow-500/20 text-yellow-300',
  other: 'bg-gray-700 text-gray-300',
};
const CATEGORY_ICONS = {
  food: '🍽️', culture: '🏛️', adventure: '🧗', shopping: '🛍️',
  transport: '🚌', accommodation: '🏨', other: '📍',
};
const HOTEL_TIER = {
  budget: { color: 'bg-emerald-500/20 text-emerald-400', label: '💚 Budget' },
  'mid-range': { color: 'bg-brand-500/20 text-brand-400', label: '💛 Mid-Range' },
  luxury: { color: 'bg-orange-500/20 text-orange-400', label: '💎 Luxury' },
};

const TABS = [
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'budget', label: 'Budget' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'packing', label: '🎒 Packing' },
  { id: 'insights', label: 'AI Insights' },
];

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [expandedDays, setExpandedDays] = useState({ 1: true });
  const [regeneratingDay, setRegeneratingDay] = useState(null);
  const [regenModal, setRegenModal] = useState(null);
  const [regenPrompt, setRegenPrompt] = useState('');
  const [addingDay, setAddingDay] = useState(null);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', time: '', location: '', estimatedCost: 0 });
  const [suggestingDay, setSuggestingDay] = useState(null);
  const [favoriting, setFavoriting] = useState(false);
  const [packingList, setPackingList] = useState(null);
  const [loadingPacking, setLoadingPacking] = useState(false);
  const [checked, setChecked] = useState({});

  useEffect(() => { fetchTrip(); }, [id]);

  const fetchTrip = async () => {
    try {
      const { data } = await api.get(`/trips/${id}`);
      setTrip(data.trip);
    } catch {
      toast.error('Trip not found.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => setExpandedDays((p) => ({ ...p, [day]: !p[day] }));

  const handleFavorite = async () => {
    setFavoriting(true);
    try {
      const { data } = await api.patch(`/trips/${id}`, { isFavorite: !trip.isFavorite });
      setTrip(data.trip);
      toast.success(data.trip.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch { toast.error('Failed to update'); } finally { setFavoriting(false); }
  };

  const handleRegenDay = async () => {
    const day = regenModal;
    setRegeneratingDay(day);
    setRegenModal(null);
    try {
      const { data } = await api.post(`/ai/regenerate-day/${id}/${day}`, { customRequest: regenPrompt || undefined });
      setTrip(data.trip);
      setExpandedDays((p) => ({ ...p, [day]: true }));
      toast.success(`Day ${day} regenerated!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Regeneration failed');
    } finally { setRegeneratingDay(null); setRegenPrompt(''); }
  };

  const handleRemoveActivity = async (day, actId) => {
    if (!confirm('Remove this activity?')) return;
    try {
      const { data } = await api.delete(`/trips/${id}/itinerary/${day}/activities/${actId}`);
      setTrip(data.trip);
      toast.success('Removed');
    } catch { toast.error('Failed'); }
  };

  const handleAddActivity = async (day) => {
    if (!newActivity.title.trim()) { toast.error('Title required'); return; }
    try {
      const { data } = await api.post(`/trips/${id}/itinerary/${day}/activities`, newActivity);
      setTrip(data.trip);
      setAddingDay(null);
      setNewActivity({ title: '', description: '', time: '', location: '', estimatedCost: 0 });
      toast.success('Activity added');
    } catch { toast.error('Failed to add'); }
  };

  const handleSuggest = async (day) => {
    setSuggestingDay(day);
    try {
      const { data } = await api.post(`/ai/suggest-activity/${id}/${day}`);
      const res = await api.post(`/trips/${id}/itinerary/${day}/activities`, data.suggestion);
      setTrip(res.data.trip);
      toast.success('AI added a suggestion!');
    } catch { toast.error('Failed to suggest'); } finally { setSuggestingDay(null); }
  };

  const handleGeneratePacking = async () => {
    setLoadingPacking(true);
    try {
      const { data } = await api.post(`/ai/packing-list/${id}`);
      setPackingList(data.packingList);
      setChecked({});
      toast.success('Packing list ready!');
    } catch { toast.error('Failed to generate'); } finally { setLoadingPacking(false); }
  };

  const toggleCheck = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setChecked((p) => ({ ...p, [key]: !p[key] }));
  };

  const packedCount = Object.values(checked).filter(Boolean).length;
  const totalItems = packingList?.categories?.reduce((acc, c) => acc + c.items.length, 0) || 0;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  );
  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

        {/* Header */}
        <div className="mb-6">
          <Link to="/dashboard" className="text-gray-400 hover:text-white inline-flex items-center gap-1 text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{trip.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-brand-400" />{trip.destination}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{trip.numberOfDays} days</span>
                {trip.budgetEstimate?.total > 0 && (
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />${trip.budgetEstimate.total.toLocaleString()} est.</span>
                )}
              </div>
            </div>
            <button onClick={handleFavorite} disabled={favoriting}
              className={`p-2 rounded-xl border shrink-0 transition-all ${trip.isFavorite ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-gray-700 bg-gray-800 text-gray-500 hover:text-red-400'}`}>
              <Heart className={`w-5 h-5 ${trip.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          {trip.weatherInfo && (
            <div className="mt-3 flex items-start gap-2 text-sm text-gray-400 bg-gray-800/50 rounded-xl p-3 border border-gray-700">
              <CloudSun className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span>{trip.weatherInfo}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== ITINERARY TAB ===== */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            {trip.itinerary.map((day) => (
              <div key={day.day} className="card">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleDay(day.day)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {day.day}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{day.theme || `Day ${day.day}`}</h3>
                      <p className="text-xs text-gray-500">{day.activities?.length || 0} activities{day.dailyBudget > 0 ? ` · ~$${day.dailyBudget}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setRegenModal(day.day); }}
                      disabled={regeneratingDay === day.day}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors" title="Regenerate this day">
                      {regeneratingDay === day.day ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    {expandedDays[day.day] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>

                {expandedDays[day.day] && (
                  <div className="mt-4 space-y-3">
                    {day.notes && <p className="text-sm text-gray-400 italic bg-gray-800/50 rounded-lg p-3">{day.notes}</p>}

                    {day.activities?.map((act) => (
                      <div key={act._id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {act.time && <span className="text-xs text-gray-500 font-mono">{act.time}</span>}
                              <span className={`badge text-xs ${CATEGORY_COLORS[act.category] || 'bg-gray-700 text-gray-300'}`}>
                                {CATEGORY_ICONS[act.category]} {act.category}
                              </span>
                              {act.estimatedCost > 0 && <span className="text-xs text-gray-500">${act.estimatedCost}</span>}
                            </div>
                            <h4 className="font-medium text-white">{act.title}</h4>
                            {act.description && <p className="text-sm text-gray-400 mt-1">{act.description}</p>}
                            {act.location && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{act.location}
                              </p>
                            )}
                            {act.tips && (
                              <p className="text-xs text-yellow-400/80 mt-2 flex items-start gap-1">
                                <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />{act.tips}
                              </p>
                            )}
                          </div>
                          <button onClick={() => handleRemoveActivity(day.day, act._id)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {addingDay === day.day ? (
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-brand-500/30 space-y-3">
                        <h4 className="text-sm font-medium text-white">Add Activity</h4>
                        <input className="input text-sm py-2" placeholder="Title *" value={newActivity.title} onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))} />
                        <input className="input text-sm py-2" placeholder="Description" value={newActivity.description} onChange={(e) => setNewActivity((p) => ({ ...p, description: e.target.value }))} />
                        <div className="grid grid-cols-2 gap-2">
                          <input className="input text-sm py-2" placeholder="Time (e.g. 2:00 PM)" value={newActivity.time} onChange={(e) => setNewActivity((p) => ({ ...p, time: e.target.value }))} />
                          <input className="input text-sm py-2" type="number" placeholder="Cost ($)" value={newActivity.estimatedCost} onChange={(e) => setNewActivity((p) => ({ ...p, estimatedCost: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <input className="input text-sm py-2" placeholder="Location" value={newActivity.location} onChange={(e) => setNewActivity((p) => ({ ...p, location: e.target.value }))} />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddActivity(day.day)} className="btn-primary text-sm py-2">Add</button>
                          <button onClick={() => setAddingDay(null)} className="btn-secondary text-sm py-2">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setAddingDay(day.day)}
                          className="flex-1 py-2 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-brand-400 hover:border-brand-500/50 transition-all flex items-center justify-center gap-1">
                          <Plus className="w-4 h-4" /> Add activity
                        </button>
                        <button onClick={() => handleSuggest(day.day)} disabled={suggestingDay === day.day}
                          className="flex-1 py-2 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-purple-400 hover:border-purple-500/50 transition-all flex items-center justify-center gap-1">
                          {suggestingDay === day.day ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                          AI suggest
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {trip.travelTips?.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" /> Travel Tips
                </h3>
                <ul className="space-y-2">
                  {trip.travelTips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ===== BUDGET TAB ===== */}
        {activeTab === 'budget' && trip.budgetEstimate && (
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Estimated Budget
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Flights', value: trip.budgetEstimate.flights, icon: '✈️' },
                { label: 'Accommodation', value: trip.budgetEstimate.accommodation, icon: '🏨' },
                { label: 'Food', value: trip.budgetEstimate.food, icon: '🍽️' },
                { label: 'Activities', value: trip.budgetEstimate.activities, icon: '🎯' },
                { label: 'Transport', value: trip.budgetEstimate.transport, icon: '🚌' },
                { label: 'Miscellaneous', value: trip.budgetEstimate.miscellaneous, icon: '🛒' },
              ].filter((item) => item.value > 0).map((item) => {
                const pct = Math.round((item.value / trip.budgetEstimate.total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-300">{item.icon} {item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{pct}%</span>
                        <span className="font-semibold text-white">${item.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
              <span className="font-semibold text-white">Total Estimated</span>
              <span className="text-2xl font-bold text-emerald-400">${trip.budgetEstimate.total?.toLocaleString()}</span>
            </div>
            {trip.budgetEstimate.notes && (
              <p className="mt-3 text-sm text-gray-400 bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                💡 {trip.budgetEstimate.notes}
              </p>
            )}
          </div>
        )}

        {/* ===== HOTELS TAB ===== */}
        {activeTab === 'hotels' && (
          <div className="space-y-4">
            {trip.hotelSuggestions?.length > 0 ? trip.hotelSuggestions.map((hotel) => (
              <div key={hotel._id || hotel.name} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{hotel.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${HOTEL_TIER[hotel.tier]?.color || 'bg-gray-700 text-gray-300'}`}>
                        {HOTEL_TIER[hotel.tier]?.label || hotel.tier}
                      </span>
                      {hotel.rating > 0 && (
                        <span className="flex items-center gap-1 text-sm text-yellow-400">
                          <Star className="w-3.5 h-3.5 fill-current" /> {hotel.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {hotel.pricePerNight > 0 && (
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold text-white">${hotel.pricePerNight}</span>
                      <p className="text-xs text-gray-500">per night</p>
                    </div>
                  )}
                </div>
                {hotel.location && <p className="text-sm text-gray-400 flex items-center gap-1 mb-3"><MapPin className="w-3.5 h-3.5 text-brand-400" />{hotel.location}</p>}
                {hotel.description && <p className="text-sm text-gray-400 mb-3">{hotel.description}</p>}
                {hotel.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hotel.amenities.map((a) => <span key={a} className="badge bg-gray-800 text-gray-400">{a}</span>)}
                  </div>
                )}
                {hotel.pros?.length > 0 && (
                  <ul className="space-y-1">
                    {hotel.pros.map((pro) => <li key={pro} className="text-xs text-emerald-400 flex items-center gap-1">✓ {pro}</li>)}
                  </ul>
                )}
              </div>
            )) : (
              <div className="card text-center py-12">
                <Hotel className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No hotel suggestions for this trip.</p>
              </div>
            )}
          </div>
        )}

        {/* ===== PACKING LIST TAB ===== */}
        {activeTab === 'packing' && (
          <div className="space-y-4">
            {!packingList ? (
              <div className="card text-center py-12">
                <Backpack className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Packing List</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                  Get a smart checklist tailored to your destination, activities, budget, and climate. Never forget anything important.
                </p>
                <button onClick={handleGeneratePacking} disabled={loadingPacking} className="btn-primary">
                  {loadingPacking ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Packing List</>}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Packing List</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{packedCount} of {totalItems} packed</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-28 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: totalItems ? `${(packedCount / totalItems) * 100}%` : '0%' }} />
                    </div>
                    <button onClick={handleGeneratePacking} disabled={loadingPacking} className="btn-secondary py-2">
                      {loadingPacking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {packingList.categories?.map((cat, catIdx) => (
                  <div key={catIdx} className="card">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span>{cat.icon}</span> {cat.name}
                      <span className="text-xs text-gray-500 font-normal ml-auto">
                        {cat.items.filter((_, i) => checked[`${catIdx}-${i}`]).length}/{cat.items.length}
                      </span>
                    </h4>
                    <ul className="space-y-2">
                      {cat.items.map((item, itemIdx) => {
                        const key = `${catIdx}-${itemIdx}`;
                        const isDone = checked[key];
                        return (
                          <li key={itemIdx} onClick={() => toggleCheck(catIdx, itemIdx)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${isDone ? 'opacity-40' : 'hover:bg-gray-800/50'}`}>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
                              {isDone && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm ${isDone ? 'line-through text-gray-500' : 'text-gray-200'}`}>{item.item}</span>
                                {item.essential && !isDone && <span className="badge bg-red-500/20 text-red-400 text-xs">Essential</span>}
                              </div>
                              {item.note && !isDone && <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                {packingList.tips?.length > 0 && (
                  <div className="card">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" /> Packing Tips
                    </h4>
                    <ul className="space-y-2">
                      {packingList.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-yellow-400">•</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== AI INSIGHTS TAB ===== */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Trip Personality Score
              </h3>
              <p className="text-sm text-gray-400 mb-6">AI-generated scores based on your itinerary composition.</p>
              <div className="space-y-5">
                {[
                  { label: 'Cultural Immersion', key: 'culture', color: 'from-purple-500 to-pink-500', icon: '🏛️' },
                  { label: 'Adventure Level', key: 'adventure', color: 'from-emerald-500 to-teal-500', icon: '🧗' },
                  { label: 'Relaxation Factor', key: 'relaxation', color: 'from-blue-500 to-cyan-500', icon: '🧘' },
                  { label: 'Budget Efficiency', key: 'budget_efficiency', color: 'from-yellow-500 to-orange-500', icon: '💰' },
                  { label: 'Overall Score', key: 'overall', color: 'from-brand-500 to-emerald-500', icon: '⭐' },
                ].map((item) => {
                  const score = trip.aiInsightsScore?.[item.key] || 0;
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">{item.icon} {item.label}</span>
                        <span className={`font-bold text-lg bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                          {score}/100
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {trip.bestTimeToVisit && (
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-brand-400" /> Best Time to Visit
                </h3>
                <p className="text-gray-400 text-sm">{trip.bestTimeToVisit}</p>
              </div>
            )}
          </div>
        )}

        {/* Regenerate Day Modal */}
        {regenModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md">
              <h3 className="font-bold text-white text-lg mb-2">Regenerate Day {regenModal}</h3>
              <p className="text-gray-400 text-sm mb-4">Optionally tell AI what to focus on for this day.</p>
              <textarea className="input min-h-[80px] resize-none mb-4 text-sm"
                placeholder="e.g. More outdoor activities, focus on local food, avoid tourist traps..."
                value={regenPrompt} onChange={(e) => setRegenPrompt(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={handleRegenDay} className="btn-primary flex-1 justify-center">
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </button>
                <button onClick={() => { setRegenModal(null); setRegenPrompt(''); }} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
