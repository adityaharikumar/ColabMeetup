import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const res = await api.get('/users/leaderboard');
      setLeaders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-panel border border-darkBorder rounded-2xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="font-bold text-white text-sm font-outfit tracking-wide">Top Contributors</h3>
      </div>
      <div className="space-y-3">
        {leaders.map((leader, idx) => (
          <div 
            key={leader._id} 
            onClick={() => navigate(`/profile/${leader._id}`)}
            className="flex justify-between items-center cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-600'}`}>#{idx + 1}</span>
              <span className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">{leader.name}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-indigo-950/50 border border-indigo-900/30 text-indigo-300 rounded-md">
              {leader.score} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
