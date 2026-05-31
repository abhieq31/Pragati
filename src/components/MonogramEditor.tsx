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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#262624] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-5 py-3.5 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white/90">Choose avatar</h3>
          <button onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Live preview — the actual Avatar component, so what the user sees
            here is exactly what every other surface will render. */}
        <div className="flex flex-col items-center pt-6 pb-3">
          <Avatar name={name} letter={letter} bg={bg} font={font} size={108} />
          <div className="mt-3 text-[11px] text-slate-400 dark:text-white/40">Tap a letter, colour or font below.</div>
        </div>

        {/* Inspire me */}
        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={inspireMe}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
          >
            <Sparkles size={13} /> Inspire me
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Letter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1.5">
              Letter
            </label>
            <input
              value={letter}
              maxLength={2}
              onChange={(e) => {
                // Allow up to 2 letters/digits, uppercase, no whitespace.
                const v = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
                setLetter(v);
              }}
              placeholder={defaultLetter}
              className="input text-center text-lg font-bold tracking-widest w-24 mx-auto block"
            />
          </div>

          {/* Background colour swatches */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1.5">
              Background
            </label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_MONOGRAM_BG.map((c) => {
                const active = c.toLowerCase() === bg.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBg(c)}
                    className="w-9 h-9 rounded-lg transition-all"
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

          {/* Font picker — each sample renders in its own typeface */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1.5">
              Font
            </label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_FONTS.map((f, i) => {
                const active = i === font;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFont(i)}
                    className={`w-12 h-12 rounded-lg text-lg transition-all border ${
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
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
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
