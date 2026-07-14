import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Calendar, MapPin, Tag, FileText, Compass, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api';
import LocationSearch from '../components/LocationSearch';

// FlyTo Map Component
function MapFlyTo({ coords }: { coords: {lat: number, lng: number} | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

// Click handler component for the map
function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function CreateIdea() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [category, setCategory] = useState('Technology');
  const [eventDate, setEventDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(10);
  
  // Map coordinates (default to a central starting point e.g. London or New York)
  // Let's use New York coordinates [40.7128, -74.0060] as a placeholder, but try to get current position on mount.
  const [lat, setLat] = useState<number>(40.7128);
  const [lng, setLng] = useState<number>(-74.0060);
  const [locationSelected, setLocationSelected] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<{lat: number, lng: number} | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // Try to locate user on page load to center the map on their location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        (err) => {
          console.warn('Could not locate user for initial map state', err);
        }
      );
    }
  }, []);

  const handleMapClick = (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat);
    setLng(selectedLng);
    setLocationSelected(true);
  };

  const handleSearchSelect = (selectedLat: number, selectedLng: number, name: string) => {
    setLat(selectedLat);
    setLng(selectedLng);
    setLocationSelected(true);
    setFlyToCoords({ lat: selectedLat, lng: selectedLng });
    if (!locationName) {
      setLocationName(name); // Auto-fill location name if it's empty
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !locationName || !eventDate) {
      setError('Please fill in all details.');
      return;
    }

    if (!locationSelected) {
      setError('Please click on the map to set the exact meeting coordinates.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/ideas', {
        title,
        description,
        locationName,
        lat,
        lng,
        category,
        eventDate,
        maxParticipants,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight">Propose a Collaboration</h1>
        <p className="text-slate-400 mt-2">Publish your project idea, set the meeting location, and let collaborators track their route to join you.</p>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-sm p-4 rounded-xl mb-6 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Success! Your collaboration plan has been proposed. Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form Details */}
        <div className="glass-panel border border-darkBorder rounded-2xl p-6 space-y-5 shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Title
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Compass className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Build an AI drone prototype, Coffee shop jam, etc."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Description / Plan
            </label>
            <div className="relative">
              <span className="absolute top-3.5 left-3.5 text-slate-500">
                <FileText className="w-4 h-4" />
              </span>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is your plan? Who do you need? Explain how people can help..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
                Category
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Tag className="w-4 h-4" />
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm appearance-none"
                >
                  <option value="Technology">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Education">Education</option>
                  <option value="Social">Social / Fun</option>
                  <option value="Volunteering">Volunteering</option>
                  <option value="Business">Business</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
                Event Date & Time
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Max Participants (RSVP Limit)
            </label>
            <input
              type="number"
              required
              min="2"
              max="1000"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
              Venue / Location Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Starbucks, Co-working Hub, Sector 4 Park"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          {locationSelected && (
            <div className="bg-emerald-950/20 border border-emerald-900/30 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs">✓</div>
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">Coordinates Verified</span>
                <span className="text-slate-400">Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Publish Proposal'
            )}
          </button>
        </div>

        {/* Right Column: Map Selection */}
        <div className="glass-panel border border-darkBorder rounded-2xl p-6 flex flex-col h-[520px] shadow-xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold font-outfit text-white uppercase tracking-wider">Select Location on Map</h3>
            <p className="text-xs text-slate-400 mt-1">
              Click anywhere on the map to place the meetup coordinate pin. Zoom and drag to find your exact venue.
            </p>
          </div>

          <div className="flex-1 relative border border-darkBorder rounded-xl overflow-hidden shadow-inner bg-slate-950">
            <div className="absolute top-4 left-14 right-14 sm:left-20 sm:right-20 z-[1000]">
               <LocationSearch onLocationSelect={handleSearchSelect} placeholder="Search for city or venue..." />
            </div>
            <MapContainer
              center={[lat, lng]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <Marker position={[lat, lng]} />
              <MapClickHandler onSelect={handleMapClick} />
              <MapFlyTo coords={flyToCoords} />
            </MapContainer>
          </div>
        </div>
      </form>
    </div>
  );
}
