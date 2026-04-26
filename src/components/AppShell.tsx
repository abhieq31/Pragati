'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar } from './ui';
import { AlembicLogo } from './AlembicLogo';
import { LayoutDashboard, FolderKanban, Users, Calendar, PieChart, Lightbulb, LogOut, UserCog } from 'lucide-react';
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
    { href: '/',         label: 'My Tasks',  icon: LayoutDashboard },
    { href: '/projects', label: 'Projects',  icon: FolderKanban },
    { href: '/yearly',   label: 'My Year',   icon: Calendar },
  ];

  const pmNav = [
    { href: '/',         label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/projects', label: 'Projects',       icon: FolderKanban },
    { href: '/teams',    label: 'Teams',           icon: Users },
    { href: '/org',      label: 'Command Centre', icon: PieChart },
    { href: '/yearly',   label: 'Yearly view',    icon: Calendar },
    { href: '/insights', label: 'Insights',       icon: Lightbulb, badge: 'Live' },
    { href: '/people',   label: 'People',          icon: UserCog },
  ];

  const nav = user.role === 'pm' ? pmNav : employeeNav;
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname?.startsWith(href);

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F7FA' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className="w-56 shrink-0 flex flex-col sticky top-0 h-screen chevron-watermark"
        style={{ background: '#0B1628' }}
      >
        {/* Logo */}
        <div className="px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Real PNG icon in a white rounded badge — standard enterprise sidebar pattern */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', borderRadius: 7, padding: '4px 5px', lineHeight: 0, flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="" width={22} height={22} style={{ display: 'block', objectFit: 'contain' }} />
            </span>
            <div>
              <div className="font-black text-white text-sm tracking-tight leading-tight">Pragati</div>
              <div style={{ fontSize: 9, letterSpacing: '0.15em' }} className="text-white/30 uppercase mt-0.5">
                Alembic Digital
              </div>
            </div>
          </Link>
        </div>

        {/* Section label */}
        <div className="px-5 pb-2">
          <div style={{ fontSize: 9, letterSpacing: '0.18em' }} className="text-white/20 uppercase font-bold">
            {user.role === 'pm' ? 'Project Manager' : 'Team Member'}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-auto pb-3">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100 group ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon
                  size={15}
                  className={`shrink-0 ${active ? 'text-blue-300' : 'text-white/30 group-hover:text-white/60'}`}
                />
                <span className="flex-1 truncate">{n.label}</span>
                {(n as any).badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(21,101,192,0.6)', color: '#90CAF9' }}>
                    {(n as any).badge}
                  </span>
                )}
                {active && <span className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-white/5 transition-colors">
            <Link href="/settings" title="Account settings" className="shrink-0">
              <Avatar name={user.name} size={28} />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href="/settings" className="block text-xs font-semibold text-white/80 truncate hover:text-white transition-colors">
                {user.name}
              </Link>
              <div style={{ fontSize: 10 }} className="text-white/30 truncate">
                {user.title || (user.role === 'pm' ? 'Project Manager' : 'Team Member')}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="text-white/20 hover:text-white/70 transition-colors shrink-0"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="max-w-7xl mx-auto px-7 py-7">{children}</div>
      </main>
    </div>
  );
}
