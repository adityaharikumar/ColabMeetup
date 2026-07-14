import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import api from '../api';

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-panel border border-darkBorder rounded-2xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-emerald-400" />
        <h3 className="font-bold text-white text-sm font-outfit tracking-wide">Live Feed</h3>
      </div>
      <div className="space-y-3">
        {activities.map((act) => (
          <div key={act._id} className="text-xs">
            <span className="font-semibold text-indigo-300">{act.user}</span>{' '}
            <span className="text-slate-400">{act.action}</span>{' '}
            <span className="font-medium text-slate-200">"{act.target}"</span>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {new Date(act.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {activities.length === 0 && <p className="text-xs text-slate-500 italic">No recent activity.</p>}
      </div>
    </div>
  );
}
