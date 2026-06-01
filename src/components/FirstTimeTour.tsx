'use client';
import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Kanban, Sun, Users, ArrowRight, X, UserCircle } from 'lucide-react';

// Authoritative state lives on the User record server-side (User.hasSeenTour),
// so once dismissed the tour never reappears even on a new browser / device.
// localStorage is used only as a fast-path to avoid a brief flash on the next
// render after dismissal.
const STORAGE_KEY = 'pragati-tour-v2';

interface Step {
  // Optional [data-tour="…"] selector. When set, the spotlight cuts a hole
  // around that element and the tooltip docks next to it. When empty, the
  // tour falls back to a centered modal (used for the welcome step).
  target?: string;
  title: string;
  body:  string;
  icon:  any;
  iconBg:    string;
  iconColor: string;
  /** Preferred docking side relative to the target. */
  side?: 'right' | 'bottom' | 'top' | 'left';
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Pragati',
    body:  "A 30-second tour of where things live. We'll point at each spot — you can skip any time.",
    icon: Sparkles,
    iconBg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
    iconColor: '#1565C0',
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: 'Your dashboard',
    body:  "The home base. What's on your plate today, recent activity, and a quick view of every project you're part of.",
    icon: Sparkles,
    iconBg: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
    iconColor: '#1565C0',
    side: 'right',
  },
  {
    target: '[data-tour="nav-projects"]',
    title: 'Open a project, work the board',
    body:  'Each project opens to a Kanban board. Drag a card between columns to change its status — it saves instantly.',
    icon: Kanban,
    iconBg: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
    iconColor: '#7B1FA2',
    side: 'right',
  },
  {
    target: '[data-tour="nav-teams"]',
    title: 'Teams',
    body:  'Cross-functional groups of people who deliver projects together. Leads can create teams; everyone can see who they work with.',
    icon: Users,
    iconBg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    iconColor: '#2E7D32',
    side: 'right',
  },
  {
    target: '[data-tour="nav-my-day"]',
    title: 'My Day is yours alone',
    body:  'A private scratchpad to empty your head, then turn the lines that matter into tracked tasks. Only you can see it.',
    icon: Sun,
    iconBg: 'linear-gradient(135deg, #FEF9C3 0%, #FDE68A 100%)',
    iconColor: '#A16207',
    side: 'right',
  },
  {
    target: '[data-tour="account-menu"]',
    title: 'Your profile & settings',
    body:  'Customise your monogram, set your Quick PIN, toggle dark mode and notifications — everything in your name lives here.',
    icon: UserCircle,
    iconBg: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)',
    iconColor: '#C2185B',
    side: 'right',
  },
];

/** Padding around the highlighted element, in pixels. */
const SPOTLIGHT_PAD = 6;
/** Gap between the spotlight and the tooltip card. */
const TOOLTIP_GAP   = 14;
/** Tooltip card width. */
const TOOLTIP_W     = 320;

function useTargetRect(selector: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!selector) { setRect(null); return; }
    let frame = 0;
    const measure = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      // Only update when the rect actually changed — avoids a render loop
      // when the layout is stable.
      setRect(prev =>
        prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev : r
      );
    };
    measure();
    const onChange = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    // Targets can mount/unmount on route changes; re-measure periodically
    // for the first few seconds so we don't go blank.
    const interval = setInterval(measure, 250);
    setTimeout(() => clearInterval(interval), 4000);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
      clearInterval(interval);
      cancelAnimationFrame(frame);
    };
  }, [selector]);
  return rect;
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
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [alreadySeen]);

  function close() {
    setOpen(false);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1');
    fetch('/api/me/tour-seen', { method: 'POST', credentials: 'include' }).catch(() => {});
  }

  const s    = STEPS[step];
  const rect = useTargetRect(s?.target);

  if (!mounted || !open || !s) return null;

  const Icn  = s.icon;
  const last = step === STEPS.length - 1;

  // Compute the spotlight hole + tooltip position.
  const hasTarget = !!s.target && !!rect;
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight :  768;

  // Spotlight rectangle (with padding) — clipped to viewport.
  const hole = rect ? {
    top:    Math.max(0, rect.top    - SPOTLIGHT_PAD),
    left:   Math.max(0, rect.left   - SPOTLIGHT_PAD),
    width:  Math.min(vw, rect.width  + SPOTLIGHT_PAD * 2),
    height: Math.min(vh, rect.height + SPOTLIGHT_PAD * 2),
  } : null;

  // Tooltip position. Default: dock to the right of the target.
  let tip: { top: number; left: number } = { top: vh / 2 - 140, left: vw / 2 - TOOLTIP_W / 2 };
  if (hole) {
    const side = s.side || 'right';
    if (side === 'right') {
      tip = {
        top:  Math.max(16, Math.min(vh - 240, hole.top + hole.height / 2 - 110)),
        left: Math.min(vw - TOOLTIP_W - 16, hole.left + hole.width + TOOLTIP_GAP),
      };
      // If the target is too close to the right edge, dock below instead.
      if (tip.left + TOOLTIP_W > vw - 16) {
        tip = {
          top:  Math.min(vh - 240, hole.top + hole.height + TOOLTIP_GAP),
          left: Math.max(16, Math.min(vw - TOOLTIP_W - 16, hole.left + hole.width / 2 - TOOLTIP_W / 2)),
        };
      }
    } else if (side === 'bottom') {
      tip = {
        top:  Math.min(vh - 240, hole.top + hole.height + TOOLTIP_GAP),
        left: Math.max(16, Math.min(vw - TOOLTIP_W - 16, hole.left + hole.width / 2 - TOOLTIP_W / 2)),
      };
    } else if (side === 'top') {
      tip = {
        top:  Math.max(16, hole.top - 220 - TOOLTIP_GAP),
        left: Math.max(16, Math.min(vw - TOOLTIP_W - 16, hole.left + hole.width / 2 - TOOLTIP_W / 2)),
      };
    } else {
      tip = {
        top:  Math.max(16, Math.min(vh - 240, hole.top + hole.height / 2 - 110)),
        left: Math.max(16, hole.left - TOOLTIP_W - TOOLTIP_GAP),
      };
    }
  }

  return createPortal(
    <div role="dialog" aria-modal aria-label="Product tour" className="fixed inset-0 z-[9998]">
      {/* The dim layer with a spotlight cut-out around the target. We draw
          four black rectangles around the hole rather than using an SVG
          mask — keeps it lightweight and supports click-through inside the
          hole if we ever want it. */}
      {hasTarget && hole ? (
        <>
          {/* top */}
          <div className="absolute inset-x-0 top-0 bg-slate-900/65 backdrop-blur-[1px]"
            style={{ height: hole.top }} onClick={close} />
          {/* bottom */}
          <div className="absolute inset-x-0 bg-slate-900/65 backdrop-blur-[1px]"
            style={{ top: hole.top + hole.height, bottom: 0 }} onClick={close} />
          {/* left */}
          <div className="absolute bg-slate-900/65 backdrop-blur-[1px]"
            style={{ top: hole.top, height: hole.height, left: 0, width: hole.left }} onClick={close} />
          {/* right */}
          <div className="absolute bg-slate-900/65 backdrop-blur-[1px]"
            style={{ top: hole.top, height: hole.height, left: hole.left + hole.width, right: 0 }} onClick={close} />
          {/* Hand-drawn-style ring around the hole. */}
          <div className="absolute pointer-events-none rounded-xl tour-spotlight-ring"
            style={{
              top: hole.top - 3, left: hole.left - 3,
              width: hole.width + 6, height: hole.height + 6,
            }} />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" onClick={close} />
      )}

      {/* Tooltip card. */}
      <div
        className="absolute bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden tour-tip-in"
        style={{ top: tip.top, left: tip.left, width: TOOLTIP_W }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative px-5 pt-5 pb-4"
          style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #FFFFFF 100%)' }}>
          <button
            onClick={close}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close tour"
          >
            <X size={13} />
          </button>

          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: s.iconBg,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 12px rgba(15,23,42,0.06)',
            }}>
            <Icn size={20} style={{ color: s.iconColor }} />
          </div>

          <h2 className="text-base font-black text-slate-900 tracking-tight">{s.title}</h2>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{s.body}</p>
        </div>

        <div className="px-5 pb-4 pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-5 bg-blue-600' : i < step ? 'w-1.5 bg-blue-300' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {step > 0 && (
              <button
                onClick={() => setStep(v => v - 1)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 px-2 py-1.5 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => last ? close() : setStep(v => v + 1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white rounded-lg px-3 py-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)',
                boxShadow: '0 4px 12px rgba(21,101,192,0.32)',
              }}
            >
              {last ? "Let's go" : 'Next'}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
