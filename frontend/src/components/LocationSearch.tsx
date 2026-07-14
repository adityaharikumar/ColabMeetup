import { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, MapPin } from 'lucide-react';

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  placeholder?: string;
}

interface SearchResult {
  properties: {
    osm_id: number;
    name: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_value?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

const formatDisplayName = (props: SearchResult['properties']) => {
  return [props.name, props.street, props.city, props.state, props.country]
    .filter(Boolean)
    .join(', ');
};

export default function LocationSearch({ onLocationSelect, placeholder = "Search for a city or place..." }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=15`
      );
      setResults(response.data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    const lat = result.geometry.coordinates[1];
    const lon = result.geometry.coordinates[0];
    const name = formatDisplayName(result.properties);
    onLocationSelect(lat, lon, name);
    setQuery(name);
    setShowResults(false);
  };

  return (
    <div className="relative w-full z-[1001]">
      <div className="relative">
        <input
          type="text"
          value={query}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(false);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 bg-slate-900 border border-darkBorder rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm shadow-lg"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          <Search className="w-4 h-4" />
        </span>
        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-darkBorder rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden z-[1002]">
          {results.map((result, idx) => {
            const name = formatDisplayName(result.properties);
            return (
              <button
                key={result.properties.osm_id || idx}
                onClick={() => handleSelect(result)}
                className="w-full text-left px-4 py-3 border-b border-darkBorder/50 hover:bg-slate-800 transition-colors flex items-start gap-3 last:border-0"
              >
                <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm text-slate-200 leading-snug truncate">{name}</span>
                  {result.properties.osm_value && (
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                      {result.properties.osm_value.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
