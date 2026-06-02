'use client';
import { useState } from 'react';
import { Avatar, AVATAR_MONOGRAM_BG, AVATAR_FONTS, avatarFg } from './ui';
import { X, Sparkles } from 'lucide-react';

/**
 * Google-style monogram avatar editor.
 *
 * Lets the user pick a letter, background colour and font for their avatar.
 * The "Inspire me" button rolls a random valid combination. On save, the
 * choice is persisted server-side (via /api/users/me) so the avatar
 * propagates to every place the user is shown — sidebar, comments, member
 * lists, mentions — without each surface needing its own customisation.
 */

interface Props {
  initial: { letter: string; bg: string; font: number };
  name: string;
  onSave: (next: { letter: string; bg: string; font: number }) => Promise<void> | void;
  onClose: () => void;
}

// Sensible default colour cycle for "Inspire me" — sampled from the same
// palette as Avatar so the random combination is always coherent.
const INSPIRE_BGS = AVATAR_MONOGRAM_BG;

export function MonogramEditor({ initial, name, onSave, onClose }: Props) {
  const defaultLetter = (name || '').trim().charAt(0).toUpperCase() || 'A';
  const [letter, setLetter] = useState((initial.letter || defaultLetter).slice(0, 2).toUpperCase());
  const [bg, setBg]         = useState(initial.bg || INSPIRE_BGS[0]);
  const [font, setFont]     = useState(initial.font ?? 0);
  const [saving, setSaving] = useState(false);

  function inspireMe() {
    const nextBg   = INSPIRE_BGS[Math.floor(Math.random() * INSPIRE_BGS.length)];
    const nextFont = Math.floor(Math.random() * AVATAR_FONTS.length);
    setBg(nextBg);
    setFont(nextFont);
  }

  async function save() {
    setSaving(true);
    try {
      await onSave({ letter: letter || defaultLetter, bg, font });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const COLOR_GROUPS = [
    { label: 'Pastel', start: 0,  end: 12 },
    { label: 'Vivid',  start: 12, end: 20 },
    { label: 'Jewel',  start: 20, end: 28 },
    { label: 'Earth',  start: 28, end: 32 },
    { label: 'Mono',   start: 32, end: 36 },
    { label: 'Brand',  start: 36, end: 40 },
  ];
  const FONT_GROUPS = [
    { label: 'Sans',    start: 0,  end: 4 },
    { label: 'Display', start: 4,  end: 6 },
    { label: 'Serif',   start: 6,  end: 9 },
    { label: 'Mono',    start: 9,  end: 11 },
    { label: 'Script',  start: 11, end: 13 },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}>
      {/* Fixed-height flex column: header + footer never scroll, only the body
          between them does — so Save/Cancel are always visible no matter how
          many swatches are below. max-h caps the modal to the viewport. */}
      <div
        className="w-full max-w-md max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-[#262624] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — preview + name live here so it stays pinned while you scroll
            options. Compact 56px avatar keeps the header short. */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-white/5">
          <Avatar name={name} letter={letter} bg={bg} font={font} size={44} />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white/90 leading-tight">Choose avatar</h3>
            <div className="text-[11px] text-slate-400 dark:text-white/40">Letter · colour · font</div>
          </div>
          {/* Inspire me — the hero action. Brand-gradient fill + a sparkle that
              spins on hover signals "try a random combination" far more clearly
              than the old grey chip. */}
          <button
            type="button"
            onClick={inspireMe}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'linear-gradient(120deg, #1565C0 0%, #1976D2 45%, #2E7D32 100%)' }}
          >
            <Sparkles size={13} className="transition-transform duration-500 group-hover:rotate-180" /> Inspire me
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Letter */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 shrink-0 w-16">
              Letter
            </label>
            <input
              value={letter}
              maxLength={2}
              onChange={(e) => {
                const v = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
                setLetter(v);
              }}
              placeholder={defaultLetter}
              className="input text-center text-base font-bold tracking-widest w-20"
            />
          </div>

          {/* Background colour swatches — grouped by family. */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">
              Background
            </label>
            <div className="space-y-2.5">
              {COLOR_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-white/30 mb-1">{group.label}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {AVATAR_MONOGRAM_BG.slice(group.start, group.end).map((c) => {
                      const active = c.toLowerCase() === bg.toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBg(c)}
                          className="w-7 h-7 rounded-lg transition-all hover:scale-110"
                          style={{
                            background: c,
                            outline: active ? `2px solid ${avatarFg(c)}` : '2px solid transparent',
                            outlineOffset: '2px',
                            boxShadow: active ? '0 2px 6px rgba(15,23,42,0.18)' : 'none',
                          }}
                          title={c}
                          aria-label={`Pick colour ${c}`}
                          aria-pressed={active}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Font picker — each sample renders in its own typeface. */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-2">
              Font
            </label>
            <div className="space-y-2">
              {FONT_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-white/30 mb-1">{group.label}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {AVATAR_FONTS.slice(group.start, group.end).map((f, i) => {
                      const fontIndex = group.start + i;
                      const active = fontIndex === font;
                      return (
                        <button
                          key={fontIndex}
                          type="button"
                          onClick={() => setFont(fontIndex)}
                          className={`w-10 h-10 rounded-lg text-base transition-all border ${
                            active
                              ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300'
                              : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                          style={{ fontFamily: f.family, fontWeight: f.weight }}
                          aria-pressed={active}
                        >
                          {f.sample}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — always visible */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
