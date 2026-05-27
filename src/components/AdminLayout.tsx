import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderGit2, MessageSquare, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/admin/projects', icon: FolderGit2 },
  { label: 'Guestbook', path: '/admin/guestbook', icon: MessageSquare },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex crt-overlay noise-overlay">
      {/* Sidebar */}
      <aside className="w-60 glass-card border-r border-primary/15 flex flex-col p-4 shrink-0">
        <Link to="/" className="font-display text-sm text-primary neon-text-green tracking-wider mb-8 flex items-center gap-2">
          <Home size={14} /> DEV.OS
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-foreground hover:text-primary hover:bg-primary/5 border-l-2 border-transparent'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 font-mono text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="glass-card border-b border-primary/15 px-6 py-3 flex items-center justify-between">
          <h2 className="font-display text-sm text-foreground">ADMIN PANEL</h2>
          <div className="flex items-center gap-3">
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" className="w-7 h-7 rounded-full border border-primary/30" />
            )}
            <span className="font-mono text-xs text-muted-foreground">
              {user?.user_metadata?.user_name || user?.email}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
