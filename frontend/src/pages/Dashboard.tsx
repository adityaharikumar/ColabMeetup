import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, AlertCircle, Plus, Trash2 } from 'lucide-react';
import api from '../api';
import MapTracker from '../components/MapTracker';
import KanbanBoard from '../components/KanbanBoard';
import Gallery from '../components/Gallery';
import MiniCalendar from '../components/MiniCalendar';
import ActivityFeed from '../components/ActivityFeed';
import Leaderboard from '../components/Leaderboard';
import MyProjects from '../components/MyProjects';

interface UserParticipant {
  _id: string;
  name: string;
  email: string;
}

interface Idea {
  _id: string;
  title: string;
  description: string;
  locationName: string;
  location: {
    lat: number;
    lng: number;
  };
  owner: string;
  ownerName: string;
  category: string;
  participants: (string | UserParticipant)[];
  maxParticipants?: number;
  waitlist?: (string | UserParticipant)[];
  eventDate: string;
  createdAt: string;
}

export default function Dashboard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [detailedIdea, setDetailedIdea] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'gallery'>('overview');
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [radius, setRadius] = useState<string>('any'); // 'any', '5', '10', '25', '50'
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Get current logged in user
  const userStr = localStorage.getItem('colab_meet_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const categories = ['All', 'Technology', 'Design', 'Education', 'Social', 'Volunteering', 'Business'];

  useEffect(() => {
    fetchIdeas();
  }, [selectedCategory, radius, userLocation]);

  const fetchIdeas = async () => {
    setLoading(true);
    setError('');
    try {
      let queryParams = [];
      if (selectedCategory !== 'All') queryParams.push(`category=${selectedCategory}`);
      if (radius !== 'any' && userLocation) {
        queryParams.push(`radius=${radius}`);
        queryParams.push(`lat=${userLocation.lat}`);
        queryParams.push(`lng=${userLocation.lng}`);
      }
      
      const url = `/ideas${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
      const response = await api.get(url);
      setIdeas(response.data);
      
      // If we already have a selected idea, refresh its details too
      if (selectedIdea) {
        const refreshed = response.data.find((i: Idea) => i._id === selectedIdea._id);
        if (refreshed) {
          fetchIdeaDetails(refreshed._id);
        } else {
          setSelectedIdea(null);
          setDetailedIdea(null);
        }
      } else if (response.data.length > 0 && !selectedIdea) {
        // Default to select first idea on desktop layout
        setSelectedIdea(response.data[0]);
        fetchIdeaDetails(response.data[0]._id);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch ideas. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIdeaDetails = async (id: string) => {
    try {
      const response = await api.get(`/ideas/${id}`);
      setDetailedIdea(response.data);
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  const handleRadiusChange = (newRadius: string) => {
    if (newRadius === 'any') {
      setRadius('any');
      return;
    }
    
    // Request location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setRadius(newRadius);
        },
        (err) => {
          console.error(err);
          alert('Could not get your location. Please enable location services to use proximity search.');
          setRadius('any');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setDetailedIdea(null); // Clear previous details while loading new ones
    setActiveTab('overview');
    fetchIdeaDetails(idea._id);
  };

  const handleJoinLeave = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!selectedIdea) return;

    setActionLoading(true);
    try {
      const response = await api.post(`/ideas/${selectedIdea._id}/join`);
      setDetailedIdea(response.data);
      // Update participants list in main ideas list
      setIdeas(ideas.map(i => i._id === selectedIdea._id ? response.data : i));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIdea || !currentUser) return;
    
    if (!window.confirm('Are you sure you want to delete this proposal?')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/ideas/${selectedIdea._id}`);
      setSelectedIdea(null);
      setDetailedIdea(null);
      fetchIdeas();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter ideas based on search and selectedDate
  const filteredIdeas = ideas.filter((idea) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      idea.title.toLowerCase().includes(searchLower) ||
      idea.description.toLowerCase().includes(searchLower) ||
      idea.locationName.toLowerCase().includes(searchLower) ||
      idea.ownerName.toLowerCase().includes(searchLower);
      
    let matchesDate = true;
    if (selectedDate) {
      const d = new Date(idea.eventDate);
      const ideaDateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      matchesDate = ideaDateStr === selectedDate;
    }
    
    return matchesSearch && matchesDate;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if current user is participant
  const isParticipant = detailedIdea?.participants?.some(
    (p: any) => (typeof p === 'string' ? p : p._id) === currentUser?.id
  );

  const isWaitlisted = detailedIdea?.waitlist?.some(
    (p: any) => (typeof p === 'string' ? p : p._id) === currentUser?.id
  );

  const isFull = detailedIdea?.participants?.length >= (detailedIdea?.maxParticipants || 10);

  const isOwner = selectedIdea?.owner === currentUser?.id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search and category filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight">Collaborations Feed</h1>
          <p className="text-slate-400 text-sm mt-1">Discover, join, and navigate to local meetups and team projects.</p>
        </div>
        
        {currentUser && (
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Propose Idea</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics, tags, location..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 border-darkBorder text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
          
          <div className="h-8 w-px bg-darkBorder mx-2 self-center shrink-0"></div>
          
          <select
            value={radius}
            onChange={(e) => handleRadiusChange(e.target.value)}
            className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wide bg-slate-950 border border-darkBorder text-slate-300 focus:outline-none focus:border-indigo-500 shrink-0 cursor-pointer"
          >
            <option value="any">Any Distance</option>
            <option value="5">Within 5 miles</option>
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-sm">Loading collaborations map...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Widgets & Dashlets */}
          <div className="lg:col-span-3 space-y-4 max-h-[85vh] overflow-y-auto pr-2 scrollbar-none">
            <MyProjects ideas={ideas} currentUser={currentUser} onSelectIdea={handleSelectIdea} />
            <MiniCalendar ideas={ideas} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
            <Leaderboard />
            <ActivityFeed />
          </div>

          {/* Middle Column: Idea Feed Cards */}
          <div className="lg:col-span-4 space-y-4 max-h-[85vh] overflow-y-auto pr-2 scrollbar-none">
            {filteredIdeas.length === 0 ? (
              <div className="glass-panel border border-darkBorder rounded-2xl p-10 text-center">
                <p className="text-slate-400">No collaboration proposals found. Propose the first one!</p>
              </div>
            ) : (
              filteredIdeas.map((idea) => {
                const isActive = selectedIdea?._id === idea._id;
                return (
                  <div
                    key={idea._id}
                    onClick={() => handleSelectIdea(idea)}
                    className={`glass-panel border rounded-xl p-5 cursor-pointer transition-all glass-card-hover ${
                      isActive
                        ? 'border-indigo-500/80 bg-indigo-950/10 shadow-lg'
                        : 'border-darkBorder bg-slate-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-950/50 border border-indigo-900/30 text-indigo-300">
                        {idea.category}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        by {idea.ownerName}
                      </span>
                    </div>

                    <h3 className="text-md font-bold text-white font-outfit mt-3 line-clamp-1">{idea.title}</h3>
                    <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {idea.description}
                    </p>

                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-darkBorder/40 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{idea.locationName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{formatDate(idea.eventDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-indigo-400">
                          <Users className="w-3.5 h-3.5" />
                          <span>{idea.participants?.length || 0}{idea.maxParticipants ? `/${idea.maxParticipants}` : ''} joined</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed View & Tracking Map */}
          <div className="lg:col-span-5 max-h-[85vh] overflow-y-auto scrollbar-none pb-12">
            {selectedIdea ? (
              <div className="space-y-6">
                {/* Detail Panel */}
                <div className="glass-panel border border-darkBorder rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 flex gap-2">
                    {isOwner && (
                      <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all"
                        title="Delete proposal"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>

                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-950 border border-indigo-900/50 text-indigo-300">
                    {selectedIdea.category}
                  </span>

                  <h2 className="text-2xl font-extrabold font-outfit text-white tracking-tight mt-4">
                    {selectedIdea.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Proposed by <button onClick={() => navigate(`/profile/${selectedIdea.owner}`)} className="text-indigo-300 hover:text-indigo-400 font-medium hover:underline underline-offset-4">{selectedIdea.ownerName}</button>
                  </p>

                  <p className="text-slate-300 text-sm mt-4 leading-relaxed whitespace-pre-wrap">
                    {selectedIdea.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-darkBorder">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-950/40 border border-indigo-900/30 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400 block">MEETING PLACE</span>
                        <span className="text-slate-200 font-semibold">{selectedIdea.locationName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-400 block">DATE & TIME</span>
                        <span className="text-slate-200 font-semibold">{formatDate(selectedIdea.eventDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col items-start gap-4 pt-4 border-t border-darkBorder/40">
                    {/* Participant Avatar Lists */}
                    <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="text-xs">
                        <span className="text-slate-400 block mb-2 uppercase font-semibold tracking-wider">
                          COLLABORATORS ({detailedIdea?.participants?.length || 0}{detailedIdea?.maxParticipants ? `/${detailedIdea.maxParticipants}` : ''})
                          {isFull && <span className="ml-2 text-rose-400 font-bold bg-rose-950/50 px-1.5 py-0.5 rounded">FULL</span>}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {detailedIdea?.participants && detailedIdea.participants.map((p: any, idx: number) => {
                            const name = typeof p === 'string' ? 'Collaborator' : p.name;
                            const pId = typeof p === 'string' ? p : p._id;
                            return (
                              <button
                                key={idx}
                                onClick={() => navigate(`/profile/${pId}`)}
                                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-darkBorder hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 transition-colors rounded-lg text-xs"
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={handleJoinLeave}
                        disabled={actionLoading}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                          isParticipant
                            ? 'bg-rose-900/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300'
                            : isWaitlisted
                            ? 'bg-amber-900/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300'
                            : isFull
                            ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 shadow-md border border-amber-900/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/20'
                        }`}
                      >
                        {actionLoading ? 'Updating...' : isParticipant ? 'Leave Project' : isWaitlisted ? 'Leave Waitlist' : isFull ? 'Join Waitlist' : 'Join as Collaborator'}
                      </button>
                    </div>
                    
                    {/* Waitlist Avatars */}
                    {detailedIdea?.waitlist && detailedIdea.waitlist.length > 0 && (
                      <div className="text-xs w-full mt-2 pt-4 border-t border-darkBorder/40">
                        <span className="text-slate-500 block mb-2 uppercase font-semibold tracking-wider">WAITLIST ({detailedIdea.waitlist.length})</span>
                        <div className="flex flex-wrap gap-2 opacity-70">
                          {detailedIdea.waitlist.map((p: any, idx: number) => {
                            const name = typeof p === 'string' ? 'Waiting...' : p.name;
                            const pId = typeof p === 'string' ? p : p._id;
                            return (
                              <button
                                key={idx}
                                onClick={() => navigate(`/profile/${pId}`)}
                                className="px-2.5 py-1 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-400 transition-colors rounded-lg text-xs"
                              >
                                {idx + 1}. {name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-6 mt-8 border-b border-darkBorder/50 mb-6">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`pb-3 text-sm font-semibold transition-all ${
                        activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Overview & Routing
                    </button>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`pb-3 text-sm font-semibold transition-all ${
                        activeTab === 'tasks' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Kanban Board
                    </button>
                    <button
                      onClick={() => setActiveTab('gallery')}
                      className={`pb-3 text-sm font-semibold transition-all ${
                        activeTab === 'gallery' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Gallery
                    </button>
                  </div>

                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Carpool Section */}
                      <div className="glass-panel border border-darkBorder rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-md font-bold font-outfit text-white">Carpool Pickups</h3>
                            <p className="text-xs text-slate-400 mt-1">Add waypoints to the route if you are picking someone up.</p>
                          </div>
                          {(isParticipant || isOwner) && (
                            <button
                              onClick={() => {
                                const name = prompt('Enter pickup point name (e.g. John\'s House):');
                                if (!name) return;
                                
                                navigator.geolocation.getCurrentPosition(
                                  async (position) => {
                                    try {
                                      const response = await api.post(`/ideas/${selectedIdea._id}/pickup`, {
                                        name,
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude
                                      });
                                      setDetailedIdea(response.data);
                                    } catch (err) {
                                      alert('Failed to add pickup point');
                                    }
                                  },
                                  () => alert('Could not get your location for the pickup point'),
                                  { enableHighAccuracy: true }
                                );
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 rounded-lg text-xs font-semibold transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Pickup
                            </button>
                          )}
                        </div>

                        {detailedIdea?.pickupPoints && detailedIdea.pickupPoints.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {detailedIdea.pickupPoints.map((point: any) => (
                              <div key={point._id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-darkBorder rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-amber-900/40 border border-amber-800/50 flex items-center justify-center text-amber-400 text-sm">
                                    🚗
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-200">{point.name}</p>
                                  </div>
                                </div>
                                {(isOwner || point.addedBy === currentUser?.id) && (
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm('Remove this pickup point?')) return;
                                      try {
                                        const response = await api.delete(`/ideas/${selectedIdea._id}/pickup/${point._id}`);
                                        setDetailedIdea(response.data);
                                      } catch (err) {
                                        alert('Failed to remove pickup point');
                                      }
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic text-center py-4 border border-dashed border-darkBorder rounded-xl">No carpool stops added yet.</p>
                        )}
                      </div>

                      {/* Map Routing Component */}
                      <div className="space-y-3">
                        <h3 className="text-md font-bold font-outfit text-white tracking-wide px-1">
                          Route Tracker to Event Location
                        </h3>
                        <MapTracker
                          targetLat={selectedIdea.location.lat}
                          targetLng={selectedIdea.location.lng}
                          targetName={selectedIdea.locationName}
                          pickupPoints={detailedIdea?.pickupPoints || []}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'tasks' && (
                    <KanbanBoard 
                      ideaId={selectedIdea._id} 
                      isParticipant={isParticipant || isOwner} 
                      participants={detailedIdea?.participants || []} 
                    />
                  )}

                  {activeTab === 'gallery' && (
                    <div className="min-h-[400px]">
                      <Gallery 
                        ideaId={selectedIdea._id}
                        isParticipant={isParticipant || isOwner}
                        initialImages={detailedIdea?.galleryImages || []}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel border border-darkBorder rounded-2xl p-20 text-center text-slate-400 shadow-xl my-auto">
                <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold font-outfit text-white">Select a Proposal</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Click on any idea in the feed to check project parameters, view the routing map, and join the collaboration.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
