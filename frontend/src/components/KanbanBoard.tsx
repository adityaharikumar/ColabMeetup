import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../api';

interface Task {
  _id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee?: { _id: string; name: string };
}

export default function KanbanBoard({ ideaId, isParticipant, participants }: { ideaId: string, isParticipant: boolean, participants: any[] }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [ideaId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ideas/${ideaId}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const res = await api.post(`/ideas/${ideaId}/tasks`, { title: newTaskTitle });
      setTasks([...tasks, res.data]);
      setNewTaskTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? res.data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { assigneeId: assigneeId || null });
      setTasks(tasks.map(t => t._id === taskId ? res.data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-800/40' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-indigo-900/20' },
    { id: 'done', title: 'Done', color: 'bg-emerald-900/20' }
  ];

  return (
    <div className="flex flex-col h-[600px] w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-md font-bold font-outfit text-white">Project Tasks</h3>
          <p className="text-xs text-slate-400 mt-1">Organize work with your collaborators.</p>
        </div>
        {isParticipant && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        )}
      </div>

      {isAdding && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-900/50 rounded-xl border border-indigo-500/50 animate-fade-in">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="e.g. Set up database schema..."
            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder-slate-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
          />
          <button onClick={handleCreateTask} className="text-xs font-semibold px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition-colors">Save</button>
          <button onClick={() => setIsAdding(false)} className="text-xs font-semibold px-3 py-1.5 text-slate-400 hover:text-white transition-colors">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className={`flex flex-col rounded-xl border border-darkBorder ${col.color} p-3 overflow-y-auto`}>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex justify-between items-center">
                {col.title} <span className="bg-slate-950 border border-darkBorder px-2 py-0.5 rounded-full text-[10px] text-slate-400">{colTasks.length}</span>
              </h4>
              
              <div className="flex flex-col gap-3">
                {colTasks.map(task => (
                  <div key={task._id} className="bg-slate-950 border border-darkBorder rounded-lg p-3 shadow-md group cursor-default hover:border-indigo-500/40 transition-all flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-200 font-medium leading-snug">{task.title}</p>
                      {isParticipant && (
                        <button onClick={() => handleDeleteTask(task._id)} className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <select
                        value={task.assignee?._id || ''}
                        onChange={(e) => handleAssignTask(task._id, e.target.value)}
                        disabled={!isParticipant}
                        className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 rounded px-1.5 py-1 max-w-[120px] truncate outline-none focus:border-indigo-500 transition-colors disabled:opacity-70"
                      >
                        <option value="">Unassigned</option>
                        {participants.map(p => (
                          <option key={p._id || p} value={p._id || p}>{p.name || 'User'}</option>
                        ))}
                      </select>

                      {isParticipant && (
                        <div className="flex gap-1">
                          {col.id !== 'todo' && (
                            <button onClick={() => handleUpdateStatus(task._id, 'todo')} className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors" title="Move to To Do">
                              To Do
                            </button>
                          )}
                          {col.id !== 'in-progress' && (
                            <button onClick={() => handleUpdateStatus(task._id, 'in-progress')} className="text-[10px] px-2 py-1 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 rounded transition-colors" title="Move to In Progress">
                              Progress
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button onClick={() => handleUpdateStatus(task._id, 'done')} className="text-[10px] px-2 py-1 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 rounded transition-colors" title="Move to Done">
                              Done
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-500 italic">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
