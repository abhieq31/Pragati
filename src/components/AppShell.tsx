'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar } from './ui';
import { LayoutDashboard, FolderKanban, Users, Calendar, PieChart, Sparkles, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/client/api';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'pm';
  title?: string;
}

export default function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const employeeNav = [
    { href: '/', label: 'My Tasks', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/yearly', label: 'My Year', icon: Calendar }
  ];

  const pmNav = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/org', label: 'Team Overview', icon: PieChart },
    { href: '/yearly', label: 'Yearly View', icon: Calendar },
    { href: '/ai/triage', label: 'AI Triage', icon: Sparkles, badge: 'AI' },
    { href: '/ai/risk', label: 'Deadline Risk', icon: AlertTriangle, badge: 'ML' }
  ];

  const nav = user.role === 'pm' ? pmNav : employeeNav;
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname?.startsWith(href);

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const roleLabel = user.role === 'pm' ? 'Project Manager' : 'Team Member';

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-56 shrink-0 bg-slate-900 text-slate-100 flex flex-col sticky top-0 h-screen">
        <div className="px-4 py-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-sm">
              QI
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">QInformX</div>
              <div className="text-[10px] text-slate-400 leading-tight">Alembic Pharma · QI</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-auto">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(n.href) ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1">{n.label}</span>
                {(n as any).badge && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-brand-500/70 text-white">
                    {(n as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar name={user.name} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-100 truncate">{user.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.title || roleLabel}</div>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-white text-xs ml-1" title="Sign out">
              ⎋
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
