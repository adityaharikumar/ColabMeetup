import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Compass, LogIn, LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import NotificationBell from './components/NotificationBell';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateIdea from './pages/CreateIdea';
import Profile from './pages/Profile';

// Navigation Bar Component
function Header({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-darkBorder backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit font-extrabold text-xl tracking-tight text-white">
              Colab<span className="text-indigo-400">Meet</span>
            </span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Feed</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/create"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Propose Idea</span>
                </Link>

                <div className="h-4 w-px bg-darkBorder"></div>

                <div className="flex items-center gap-4">
                  <NotificationBell />
                  <Link to={`/profile/${user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-850 flex items-center justify-center text-xs font-semibold text-indigo-400 font-outfit">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-300 hidden md:inline">
                      {user.name}
                    </span>
                  </Link>

                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-350 hover:text-indigo-400 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

// Protected Route Guard
function ProtectedRoute({ user, children }: { user: any; children: React.ReactNode }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Initial fetch from storage
    const loadUser = () => {
      const userStr = localStorage.getItem('colab_meet_user');
      setUser(userStr ? JSON.parse(userStr) : null);
    };

    loadUser();

    // Listen to storage events to sync login status between pages
    window.addEventListener('storage', loadUser);
    return () => {
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('colab_meet_token');
    localStorage.removeItem('colab_meet_user');
    setUser(null);
    window.location.href = '/'; // Refresh to flush state
  };

  return (
    <Router>
      <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col">
        <Header user={user} onLogout={handleLogout} />
        
        {/* Main Content Area */}
        <main className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute user={user}>
                  <CreateIdea />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute user={user}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute user={user}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-darkBorder py-6 bg-slate-950/40 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold text-slate-400">ColabMeet © 2026</span>
            </div>
            <p className="text-slate-600">Built with Node.js, Mongoose, Express, React, TypeScript, Leaflet, and Tailwind CSS.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
