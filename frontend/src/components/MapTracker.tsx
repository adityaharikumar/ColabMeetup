import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Navigation, MapPin, Compass, RotateCcw, ShieldAlert, Award } from 'lucide-react';
import LocationSearch from './LocationSearch';

// Fix for default Leaflet icon loader issue in bundlers
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapTrackerProps {
  targetLat: number;
  targetLng: number;
  targetName: string;
  pickupPoints?: { lat: number; lng: number; name: string }[];
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

// Recenter Map Helper Component
function MapController({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

// Click Handler for Map
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

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

export default function MapTracker({ targetLat, targetLng, targetName, pickupPoints = [] }: MapTrackerProps) {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<{lat: number, lng: number} | null>(null);

  const handleSearchSelect = (lat: number, lng: number, name: string) => {
    setFlyToCoords({ lat, lng });
    handleSetStartLocation(lat, lng);
  };

  // Custom marker creators using DivIcon for pulsing glow
  const userMarkerIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-emerald-500 border-2 border-slate-900 shadow-lg text-white font-bold text-xs">
          🏁
        </span>
      </div>
    `,
    className: 'custom-user-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const meetupMarkerIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="animate-pulse absolute inline-flex h-10 w-10 rounded-full bg-indigo-500 opacity-55"></span>
        <span class="relative inline-flex items-center justify-center rounded-full h-7 w-7 bg-indigo-600 border-2 border-slate-900 shadow-xl text-white font-bold text-xs">
          📍
        </span>
      </div>
    `,
    className: 'custom-meetup-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const pickupMarkerIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-amber-500 border-2 border-slate-900 shadow-md text-white font-bold text-xs">
          🚗
        </span>
      </div>
    `,
    className: 'custom-pickup-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Automatically request Geolocation permission on component load
  useEffect(() => {
    requestUserLocation();
  }, [targetLat, targetLng]);

  const handleSetStartLocation = (lat: number, lng: number) => {
    setUserCoords({ lat, lng });
    fetchRoute(lat, lng, targetLat, targetLng);
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setLocating(false);
        fetchRoute(coords.lat, coords.lng, targetLat, targetLng);
      },
      (err) => {
        console.warn('Geolocation error, falling back to dummy start coordinates:', err);
        setLocating(false);
        // Fallback dummy start location (approx. 2km away from target coordinates)
        const fallbackCoords = {
          lat: targetLat - 0.015,
          lng: targetLng + 0.015,
        };
        setUserCoords(fallbackCoords);
        setError('Location access denied. Using simulated start location for routing demonstration.');
        fetchRoute(fallbackCoords.lat, fallbackCoords.lng, targetLat, targetLng);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    setLoading(true);
    try {
      // Build coordinates string including waypoints (pickup points)
      let waypoints = '';
      if (pickupPoints.length > 0) {
        waypoints = pickupPoints.map(p => `${p.lng},${p.lat}`).join(';');
        waypoints = ';' + waypoints; // Prefix with semicolon
      }

      // Fetching routing data from OSRM public instance
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat}${waypoints};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
      const response = await axios.get(url);

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        // Convert [lng, lat] coordinates to Leaflet [lat, lng] format
        const coords = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
        setRouteCoords(coords);

        // Format distance and duration
        const distKm = (route.distance / 1000).toFixed(1);
        setDistance(`${distKm} km`);

        const durationMin = Math.round(route.duration / 60);
        if (durationMin > 60) {
          const hours = Math.floor(durationMin / 60);
          const mins = durationMin % 60;
          setDuration(`${hours} hr ${mins} min`);
        } else {
          setDuration(`${durationMin} min`);
        }

        // Format turn-by-turn guidance steps
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          const stepList = route.legs[0].steps
            .map((step: any) => ({
              instruction: step.maneuver.instruction,
              distance: Math.round(step.distance),
              duration: Math.round(step.duration),
            }))
            .filter((step: RouteStep) => step.instruction && step.instruction.trim() !== '');
          setSteps(stepList);
        }
      } else {
        setError('Could not calculate a driving route to this destination.');
      }
    } catch (err) {
      console.error('OSRM Router error:', err);
      setError('Routing service is currently unavailable. Displaying direct markers.');
    } finally {
      setLoading(false);
    }
  };

  // Determine map bounds
  let mapBounds: L.LatLngBoundsExpression | null = null;
  const targetLatLngs = [
    [targetLat, targetLng],
    ...pickupPoints.map(p => [p.lat, p.lng])
  ] as L.LatLngTuple[];
  
  if (userCoords) {
    targetLatLngs.push([userCoords.lat, userCoords.lng]);
  }
  
  mapBounds = L.latLngBounds(targetLatLngs).pad(0.15);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px] lg:h-[600px] w-full">
      {/* Map Element */}
      <div className="lg:col-span-2 relative h-full w-full border border-darkBorder rounded-xl overflow-hidden shadow-2xl bg-slate-950">
        <div className="absolute top-4 left-14 right-14 sm:left-20 sm:right-20 z-[1000]">
           <LocationSearch onLocationSelect={handleSearchSelect} placeholder="Search starting point (e.g. Chennai)..." />
        </div>
        <MapContainer
          center={[targetLat, targetLng]}
          zoom={13}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Sleek dark tile layer
          />
          
          {/* Target Meetup Marker */}
          <Marker position={[targetLat, targetLng]} icon={meetupMarkerIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <h4 className="font-bold text-sm">{targetName}</h4>
                <p className="text-xs">Colab Meetup Location</p>
              </div>
            </Popup>
          </Marker>

          {/* Pickup Markers */}
          {pickupPoints.map((point, idx) => (
            <Marker key={idx} position={[point.lat, point.lng]} icon={pickupMarkerIcon}>
              <Popup>
                <div className="text-slate-900 p-1">
                  <h4 className="font-bold text-sm">{point.name}</h4>
                  <p className="text-xs">Carpool Pickup Point</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* User Marker */}
          {userCoords && (
            <Marker 
              position={[userCoords.lat, userCoords.lng]} 
              icon={userMarkerIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  handleSetStartLocation(position.lat, position.lng);
                },
              }}
            >
              <Popup>
                <div className="text-slate-900 p-1">
                  <h4 className="font-bold text-sm">Your Location</h4>
                  <p className="text-xs">Starting Point (Drag to move)</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Polyline */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              color="#6366f1"
              weight={5}
              opacity={0.8}
              lineJoin="round"
            />
          )}

          {/* Automatically adjust zoom bounds */}
          <MapController bounds={mapBounds} />
          
          {/* Map Click Event */}
          <MapClickHandler onMapClick={handleSetStartLocation} />
          
          <MapFlyTo coords={flyToCoords} />
        </MapContainer>

        {/* Floating actions */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <button
            onClick={requestUserLocation}
            disabled={locating || loading}
            className="flex items-center justify-center p-2.5 bg-darkCard/90 hover:bg-slate-800 text-slate-100 border border-darkBorder rounded-lg transition-all shadow-md hover:text-indigo-400 disabled:opacity-50"
            title="Recenter and update location"
          >
            {locating ? (
              <RotateCcw className="w-5 h-5 animate-spin" />
            ) : (
              <Compass className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Loading Overlay */}
        {(loading || locating) && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex flex-col items-center justify-center text-slate-100 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium tracking-wide">
              {locating ? 'Retrieving GPS Location...' : 'Calculating Optimal Route...'}
            </span>
          </div>
        )}
      </div>

      {/* Turn-by-Turn Guidance Side Panel */}
      <div className="glass-panel border border-darkBorder rounded-xl p-5 flex flex-col h-full overflow-hidden shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Navigation className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold font-outfit text-white">Route Tracker</h3>
        </div>

        {/* Status alerts */}
        {error && (
          <div className="bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs p-3 rounded-lg flex items-start gap-2 mb-4 animate-fade-in">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Route Summary */}
        {distance && duration ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-indigo-950/20 border border-indigo-900/30 p-3 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">DISTANCE</span>
              <span className="text-xl font-bold text-indigo-300 font-outfit">{distance}</span>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">DURATION</span>
              <span className="text-xl font-bold text-emerald-400 font-outfit">{duration}</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-darkBorder p-5 rounded-lg text-center text-sm text-slate-400 my-auto">
            <MapPin className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            Activate location tracking to plot your directions to this event.
          </div>
        )}

        {/* Turn-by-turn navigation list */}
        {steps.length > 0 && (
          <div className="flex-1 overflow-y-auto pr-1">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block mb-2">
              Turn-by-Turn Directions
            </span>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 text-xs border-b border-darkBorder/40 pb-2 last:border-0">
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-400 border border-slate-700">
                      {idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-800 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium leading-relaxed">{step.instruction}</p>
                    <span className="text-slate-400 text-[10px]">
                      {step.distance >= 1000 
                        ? `${(step.distance / 1000).toFixed(1)} km` 
                        : `${step.distance} m`}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 text-xs pt-1">
                <div className="w-5 h-5 rounded-full bg-indigo-900/40 flex items-center justify-center border border-indigo-800">
                  <Award className="w-3 h-3 text-indigo-300" />
                </div>
                <div className="flex-1">
                  <p className="text-indigo-300 font-semibold">Arrive at {targetName}!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
