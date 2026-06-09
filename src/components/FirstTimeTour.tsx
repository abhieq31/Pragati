'use client';
import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Kanban, Sun, Users, ArrowRight, X, UserCircle, LayoutDashboard } from 'lucide-react';

const STORAGE_KEY = 'pragati-tour-v3';

interface Step {
  target?: string;
  title: string;
  body: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  side?: 'right' | 'bottom' | 'top' | 'left';
  mobileTarget?: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Pragati!',
    body: "A quick tour of where things live. Takes about 30 seconds — skip whenever you like.",
    icon: Sparkles,
    iconBg: '#DBEAFE',
    iconColor: '#1565C0',
  },
  {
    target: '[data-tour="nav-dashboard"]',
    mobileTarget: '[data-mobile-tour="nav-dashboard"]',
    title: 'Your Dashboard',
    body: "Everything at a glance — tasks on your plate today, recent activity, and every project you're part of.",
    icon: LayoutDashboard,
    iconBg: '#E3F2FD',
    iconColor: '#1565C0',
    side: 'right',
  },
  {
    target: '[data-tour="nav-projects"]',
    mobileTarget: '[data-mobile-tour="nav-projects"]',
    title: 'Open a project',
    body: 'Each project has a Kanban board. Drag a card between columns to change its status — it saves instantly.',
    icon: Kanban,
    iconBg: '#F3E5F5',
    iconColor: '#7B1FA2',
    side: 'right',
  },
  {
    target: '[data-tour="nav-teams"]',
    mobileTarget: '[data-mobile-tour="nav-teams"]',
    title: 'Teams',
    body: 'Cross-functional groups of people who deliver projects together. Leads can create teams; everyone can see who they work with.',
    icon: Users,
    iconBg: '#E8F5E9',
    iconColor: '#2E7D32',
    side: 'right',
  },
  {
    target: '[data-tour="nav-my-day"]',
    mobileTarget: '[data-mobile-tour="nav-my-day"]',
    title: 'My Day is yours alone',
    body: 'A private scratchpad to empty your head, then turn the lines that matter into tracked tasks. Only you can see it.',
    icon: Sun,
    iconBg: '#FEF9C3',
    iconColor: '#A16207',
    side: 'right',
  },
  {
    target: '[data-tour="account-menu"]',
    title: 'Profile & settings',
    body: 'Customise your avatar, set your Quick PIN, toggle dark mode and notifications — all here.',
    icon: UserCircle,
    iconBg: '#FCE4EC',
    iconColor: '#C2185B',
    side: 'right',
  },
];

const SPOTLIGHT_PAD = 8;
const TOOLTIP_GAP   = 16;
const TOOLTIP_W     = 330;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

function useTargetRect(selector: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!selector) { setRect(null); return; }
    let frame = 0;
    const measure = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect(prev =>
        prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
          ? prev : r
      );
    };
    measure();
    const onChange = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
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

// Scribble underline SVG for the title
function ScribbleUnderline({ color = '#1565C0' }: { color?: string }) {
  return (
    <svg viewBox="0 0 120 8" className="w-full h-2 mt-0.5" preserveAspectRatio="none" aria-hidden>
      <path
        d="M2 5 C 10 2, 20 7, 30 4 C 40 1, 50 7, 60 4 C 70 1, 80 7, 90 5 C 100 3, 110 6, 118 4"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

// Hand-drawn arrow indicator pointing at the target
function ScribbleArrow({ side }: { side: 'right' | 'left' | 'top' | 'bottom' }) {
  const paths: Record<string, string> = {
    left:   'M 40 20 C 28 20, 14 20, 4 20 M 4 20 L 14 13 M 4 20 L 14 27',
    right:  'M 4 20 C 16 20, 30 20, 40 20 M 40 20 L 30 13 M 40 20 L 30 27',
    top:    'M 20 40 C 20 28, 20 14, 20 4 M 20 4 L 13 14 M 20 4 L 27 14',
    bottom: 'M 20 4 C 20 16, 20 30, 20 40 M 20 40 L 13 30 M 20 40 L 27 30',
  };
  const isHoriz = side === 'left' || side === 'right';
  return (
    <svg
      viewBox={isHoriz ? '0 0 44 40' : '0 0 40 44'}
      width={isHoriz ? 22 : 20}
      height={isHoriz ? 20 : 22}
      aria-hidden
    >
      <path
        d={paths[side]}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FirstTimeTour({ alreadySeen = false }: { alreadySeen?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen]       = useState(false);
  const [step, setStep]       = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    if (alreadySeen) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [alreadySeen]);

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1');
    fetch('/api/me/tour-seen', { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);

  const s = STEPS[step];

  // On mobile, prefer the mobile-specific target if present
  const targetSelector = isMobile && s?.mobileTarget ? s.mobileTarget : s?.target;
  const rect = useTargetRect(targetSelector);

  if (!mounted || !open || !s) return null;

  const Icn  = s.icon;
  const last = step === STEPS.length - 1;

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight :  768;

  const hasTarget = !!targetSelector && !!rect;
  const hole = rect ? {
    top:    Math.max(0, rect.top    - SPOTLIGHT_PAD),
    left:   Math.max(0, rect.left   - SPOTLIGHT_PAD),
    width:  Math.min(vw, rect.width  + SPOTLIGHT_PAD * 2),
    height: Math.min(vh, rect.height + SPOTLIGHT_PAD * 2),
  } : null;

  // On mobile with no visible target, center the tooltip
  const effectiveHole = isMobile && !hole ? null : hole;

  // Tooltip position
  let tip: { top: number; left: number } = {
    top:  vh / 2 - 160,
    left: Math.max(16, vw / 2 - TOOLTIP_W / 2),
  };

  if (effectiveHole) {
    const side = s.side || 'right';
    if (side === 'right') {
      tip = {
        top:  Math.max(16, Math.min(vh - 300, effectiveHole.top + effectiveHole.height / 2 - 130)),
        left: Math.min(vw - TOOLTIP_W - 16, effectiveHole.left + effectiveHole.width + TOOLTIP_GAP),
      };
      if (tip.left + TOOLTIP_W > vw - 16) {
        tip = {
          top:  Math.min(vh - 300, effectiveHole.top + effectiveHole.height + TOOLTIP_GAP),
          left: Math.max(16, Math.min(vw - TOOLTIP_W - 16, effectiveHole.left + effectiveHole.width / 2 - TOOLTIP_W / 2)),
        };
      }
    } else if (side === 'bottom') {
      tip = {
        top:  Math.min(vh - 300, effectiveHole.top + effectiveHole.height + TOOLTIP_GAP),
        left: Math.max(16, Math.min(vw - TOOLTIP_W - 16, effectiveHole.left + effectiveHole.width / 2 - TOOLTIP_W / 2)),
      };
    } else if (side === 'top') {
      tip = {
        top:  Math.max(16, effectiveHole.top - 260 - TOOLTIP_GAP),
        left: Math.max(16, Math.min(vw - TOOLTIP_W - 16, effectiveHole.left + effectiveHole.width / 2 - TOOLTIP_W / 2)),
      };
    } else {
      tip = {
        top:  Math.max(16, Math.min(vh - 300, effectiveHole.top + effectiveHole.height / 2 - 130)),
        left: Math.max(16, effectiveHole.left - TOOLTIP_W - TOOLTIP_GAP),
      };
    }
  }

  // On mobile, always center the tooltip vertically if near bottom
  if (isMobile) {
    tip.left = Math.max(12, Math.min(vw - TOOLTIP_W - 12, tip.left));
    // If no target or target off screen, place in the middle
    if (!effectiveHole) {
      tip.top  = Math.max(80, vh / 2 - 160);
      tip.left = Math.max(12, vw / 2 - TOOLTIP_W / 2);
    }
  }

  // The connector arrow side (opposite of tooltip placement relative to target)
  const arrowSide: 'left' | 'right' | 'top' | 'bottom' =
    effectiveHole
      ? tip.left > effectiveHole.left + effectiveHole.width ? 'left'
        : tip.left + TOOLTIP_W < effectiveHole.left ? 'right'
        : tip.top > effectiveHole.top + effectiveHole.height ? 'top'
        : 'bottom'
      : 'left';

  return createPortal(
    <div role="dialog" aria-modal aria-label="Product tour" className="fixed inset-0 z-[9998]">
      {/* SVG filter for subtle sketch wobble on the spotlight ring */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <filter id="tour-rough" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Dim overlay */}
      {hasTarget && effectiveHole ? (
        <>
          <div className="absolute inset-x-0 top-0 tour-overlay-bg"
            style={{ height: effectiveHole.top }} onClick={close} />
          <div className="absolute inset-x-0 tour-overlay-bg"
            style={{ top: effectiveHole.top + effectiveHole.height, bottom: 0 }} onClick={close} />
          <div className="absolute tour-overlay-bg"
            style={{ top: effectiveHole.top, height: effectiveHole.height, left: 0, width: effectiveHole.left }} onClick={close} />
          <div className="absolute tour-overlay-bg"
            style={{ top: effectiveHole.top, height: effectiveHole.height, left: effectiveHole.left + effectiveHole.width, right: 0 }} onClick={close} />
          {/* Sketch-style spotlight ring */}
          <div
            className="absolute pointer-events-none rounded-xl"
            style={{
              top:    effectiveHole.top    - 4,
              left:   effectiveHole.left   - 4,
              width:  effectiveHole.width  + 8,
              height: effectiveHole.height + 8,
              filter: 'url(#tour-rough)',
              outline: '2.5px dashed rgba(255,255,255,0.6)',
              outlineOffset: '2px',
              boxShadow: '0 0 0 2px rgba(21,101,192,0.4), 0 0 20px rgba(21,101,192,0.15)',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 tour-overlay-bg" onClick={close} />
      )}

      {/* Tooltip card — hand-drawn paper aesthetic */}
      <div
        className="absolute tour-card-enter"
        style={{
          top:   tip.top,
          left:  tip.left,
          width: Math.min(TOOLTIP_W, vw - 24),
          zIndex: 9999,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Connector arrow (visible only when there's a target) */}
        {effectiveHole && (
          <div
            className="absolute"
            style={{
              ...(arrowSide === 'left'   ? { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-2px)' } :
                  arrowSide === 'right'  ? { left:  '100%', top: '50%', transform: 'translateY(-50%) translateX(2px)' } :
                  arrowSide === 'top'    ? { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-2px)' } :
                                           { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(2px)' }),
            }}
          >
            <ScribbleArrow side={arrowSide} />
          </div>
        )}

        {/* Card body */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#ffffff',
            border: '2px solid #e2e8f0',
            boxShadow: '0 20px 60px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08)',
            filter: 'url(#tour-rough)',
          }}
        >
          {/* Coloured header strip */}
          <div className="px-5 pt-5 pb-4 relative"
            style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #EFF6FF 100%)' }}
          >
            <button
              onClick={close}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close tour"
            >
              <X size={13} />
            </button>

            {/* Step counter — handwritten style */}
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              Step {step + 1} of {STEPS.length}
            </div>

            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: s.iconBg,
                border: `2px solid ${s.iconColor}22`,
                boxShadow: `0 0 0 4px ${s.iconBg}, 0 4px 12px ${s.iconColor}22`,
              }}>
              <Icn size={20} style={{ color: s.iconColor }} />
            </div>

            <div>
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-tight">{s.title}</h2>
              <ScribbleUnderline color={s.iconColor} />
            </div>
            <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">{s.body}</p>
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 pt-3 flex items-center justify-between bg-white border-t border-slate-100">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="transition-all duration-300"
                  style={{
                    width:  i === step ? 18 : 6,
                    height: 6,
                    borderRadius: 9999,
                    background: i === step ? s.iconColor : i < step ? `${s.iconColor}55` : '#e2e8f0',
                  }}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {step > 0 && (
                <button
                  onClick={() => setStep(v => v - 1)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 px-2 py-1.5 transition-colors rounded-lg hover:bg-slate-100"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => last ? close() : setStep(v => v + 1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white rounded-xl px-4 py-2 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${s.iconColor} 0%, ${s.iconColor}cc 100%)`,
                  boxShadow: `0 4px 14px ${s.iconColor}44`,
                }}
              >
                {last ? "Let's go!" : 'Next'}
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
