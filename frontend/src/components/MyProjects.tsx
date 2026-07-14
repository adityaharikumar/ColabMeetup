import { Calendar } from 'lucide-react';

export default function MyProjects({ ideas, currentUser, onSelectIdea }: { ideas: any[], currentUser: any, onSelectIdea: (idea: any) => void }) {
  if (!currentUser) return null;

  const myIdeas = ideas.filter(idea => 
    idea.owner === currentUser.id || 
    idea.participants.some((p: any) => (typeof p === 'string' ? p : p._id) === currentUser.id)
  );

  return (
    <div className="glass-panel border border-darkBorder rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-indigo-950 flex items-center justify-center border border-indigo-900">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <h3 className="font-bold text-white text-sm font-outfit tracking-wide">My Upcoming</h3>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
        {myIdeas.length === 0 ? (
          <p className="text-xs text-slate-500">You haven't joined any projects yet.</p>
        ) : (
          myIdeas.map(idea => (
            <button 
              key={idea._id}
              onClick={() => onSelectIdea(idea)}
              className="w-full text-left p-2 rounded-xl hover:bg-slate-900 border border-transparent hover:border-darkBorder transition-all"
            >
              <h4 className="text-xs font-semibold text-slate-200 truncate">{idea.title}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(idea.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
