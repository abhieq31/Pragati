import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: {
    default: "Pragati: A Bird's-Eye View of Your Projects",
    template: '%s · Pragati'
  },
  description:
    "Pragati — a bird's-eye view of your projects. Minimal, focused project intelligence for team leads.",
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
    shortcut: '/logo-icon.png'
  },
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
