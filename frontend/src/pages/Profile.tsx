import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Globe, Book, Edit2, Save, X, Loader2 } from 'lucide-react';
import api from '../api';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  bio: string;
  skills: string[];
  githubLink: string;
  createdAt: string;
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const currentUserStr = localStorage.getItem('colab_meet_user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isOwnProfile = currentUser && profile && currentUser.id === profile._id;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // If no ID is provided, but user is logged in, use their ID
      const targetId = id || currentUser?.id;
      
      if (!targetId) {
        navigate('/login');
        return;
      }

      const response = await api.get(`/users/${targetId}`);
      setProfile(response.data);
      
      setEditBio(response.data.bio || '');
      setEditSkills(response.data.skills?.join(', ') || '');
      setEditGithub(response.data.githubLink || '');
    } catch (err: any) {
      console.error(err);
      setError('Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const response = await api.put('/users/profile', {
        bio: editBio,
        skills: editSkills,
        githubLink: editGithub,
      });
      setProfile(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20 text-rose-400 font-bold">{error || 'Profile not found'}</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="glass-panel border border-darkBorder rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -z-10"></div>
        
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex justify-center items-center text-4xl font-extrabold text-white shadow-xl shadow-indigo-500/30 shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold font-outfit text-white tracking-tight">{profile.name}</h1>
            <div className="flex items-center gap-2 text-slate-400 mt-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 mt-1">
              <User className="w-4 h-4" />
              <span className="text-sm">Member since {new Date(profile.createdAt).getFullYear()}</span>
            </div>
          </div>
          
          {isOwnProfile && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all shadow-md text-sm border border-slate-700"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-darkBorder/40">
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">About Me</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Tell everyone a bit about yourself..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Skills (comma separated)</label>
                <div className="relative">
                  <Book className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="React, Node.js, Design, etc."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">GitHub / Portfolio URL</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-darkBorder rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg transition-all"
                >
                  {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saveLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-semibold transition-all"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> About
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'This user hasn\'t added a bio yet.'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-2">
                  <Book className="w-4 h-4" /> Skills & Interests
                </h3>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-950/40 border border-indigo-900/50 text-indigo-300 rounded-lg text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No skills listed</p>
                )}
              </div>

              {profile.githubLink && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Links
                  </h3>
                  <a 
                    href={profile.githubLink.startsWith('http') ? profile.githubLink : `https://${profile.githubLink}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-sm underline underline-offset-4"
                  >
                    {profile.githubLink}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
