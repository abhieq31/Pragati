'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ListChecks, Trophy, Sun, ArrowRight, X } from 'lucide-react';

// Authoritative state lives on the User record server-side (User.hasSeenTour),
// so once dismissed the tour never reappears even on a new browser / device.
// localStorage is used only as a fast-path to avoid a brief flash on the next
// render after dismissal. Bumped to v2 with the refreshed, feature-current copy.
const STORAGE_KEY = 'pragati-tour-v2';

interface Step {
  title: string;
  body: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  doodle: string;       // a scribbled aside, hand-drawn-arrow style
}

// Refreshed for the current app: the pipeline dashboard, board milestones,
// achievements, and My Day. Four quick, friendly steps.
const STEPS: Step[] = [
  {
    title: 'Welcome to Pragati',
    body:  'Your quality work — projects, the team, and what needs attention — in one bird’s-eye view. Pragati means progress, and that’s the whole idea.',
    icon: Sparkles,
    iconBg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
    iconColor: '#1565C0',
    doodle: 'everything starts on the dashboard ↗',
  },
  {
    title: 'Watch progress flow',
    body:  'Expand a project on your dashboard to see its tasks in working order — completed steps check off in place, so momentum is visible at a glance.',
    icon: ListChecks,
    iconBg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
    iconColor: '#15803D',
    doodle: 'green badge = all caught up ↓',
  },
  {
    title: 'Finish strong — boards & milestones',
    body:  'Open a project for its Kanban board. Drag a card to change its status; close out a phase or a whole project and a little celebration pops to mark the moment.',
    icon: Trophy,
    iconBg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    iconColor: '#B45309',
    doodle: 'milestones earn a fanfare ✨',
  },
  {
    title: 'Make it yours',
    body:  'My Day is a private scratchpad only you can see. On your profile, pick an avatar and rack up quality achievements — Right First Time, In Control, Audit-Ready.',
    icon: Sun,
    iconBg: 'linear-gradient(135deg, #FEF9C3 0%, #FDE68A 100%)',
    iconColor: '#A16207',
    doodle: 'hover your avatar to peek at them ↖',
  },
];

/* A loose, hand-drawn underline that sits under the step title. */
function ScribbleUnderline() {
  return (
    <svg width="148" height="9" viewBox="0 0 148 9" fill="none" className="mt-1 text-blue-400">
      <path
        d="M2 5.5C26 2.5 52 2 74 4c22 2 48 2.5 72-1.5"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        style={{ strokeDasharray: 1 }}
      />
    </svg>
  );
}

/* A scribbled curvy arrow doodle that points down-right toward the CTA. */
function ScribbleArrow() {
  return (
    <svg width="56" height="34" viewBox="0 0 56 34" fill="none" className="text-slate-300">
      <path d="M3 4C14 16 30 22 49 22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 6" />
      <path d="M40 14c5 4 8 6 9 8-3 1-7 1-11 1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function FirstTimeTour({ alreadySeen = false }: { alreadySeen?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen]       = useState(false);
  const [step, setStep]       = useState(0);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    if (alreadySeen) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Slight delay so the dashboard finishes its entry animation first.
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [alreadySeen]);

  function close() {
    setOpen(false);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1');
    // Fire-and-forget: persist on the user record so the tour never returns
    // on another browser / device. Failure is non-fatal.
    fetch('/api/me/tour-seen', { method: 'POST', credentials: 'include' }).catch(() => {});
  }

  if (!mounted || !open) return null;

  const s   = STEPS[step];
  const Icn = s.icon;
  const last = step === STEPS.length - 1;

  return createPortal(
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(8, 16, 32, 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={close}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-white max-w-md w-full overflow-visible modal-in"
        style={{
          // Sketchy, hand-drawn frame: a dashed outline + a slight offset
          // "double line" shadow so it reads like a doodled box, not a chrome modal.
          borderRadius: '22px',
          border: '2.5px dashed #cbd5e1',
          boxShadow: '6px 7px 0 rgba(15,23,42,0.06), 0 18px 50px rgba(15,23,42,0.18)',
          transform: 'rotate(-0.5deg)',
        }}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close tour"
        >
          <X size={14} />
        </button>

        {/* Top hero */}
        <div className="px-7 pt-7 pb-3">
          {/* Big rounded icon with a sketchy ring */}
          <div className="w-14 h-14 flex items-center justify-center mb-4"
            style={{
              background: s.iconBg,
              borderRadius: '18px',
              border: '2px solid rgba(15,23,42,0.08)',
              boxShadow: '3px 3px 0 rgba(15,23,42,0.05)',
            }}>
            <Icn size={26} style={{ color: s.iconColor }} />
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">{s.title}</h2>
          <ScribbleUnderline />
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{s.body}</p>

          {/* Scribbled aside, like a margin note */}
          <p className="mt-3 text-[12px] font-semibold text-slate-400 -rotate-1"
            style={{ fontStyle: 'italic' }}>
            {s.doodle}
          </p>
        </div>

        {/* Bottom */}
        <div className="px-7 pb-6 pt-1 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-blue-600' : i < step ? 'w-1.5 bg-blue-300' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {!last && <span className="hidden sm:block -mb-3"><ScribbleArrow /></span>}
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2.5 py-2 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => last ? close() : setStep(s => s + 1)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2.5 transition-all"
              style={{
                background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)',
                borderRadius: '14px',
                boxShadow: '3px 3px 0 rgba(21,101,192,0.22)',
              }}
            >
              {last ? "Let’s go" : 'Next'}
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
