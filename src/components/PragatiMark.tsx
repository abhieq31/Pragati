/** Pragati's brand mark — CSS / SVG only, no image asset.
 *
 *  A rounded square in the brand blue-to-forest gradient, with a stylised
 *  "P" built from a vertical stem, an outer arc, and an inner forward-motion
 *  accent. The accent is what makes it feel like "pragati" (progress) — it
 *  reads as a forward-moving wedge inside the loop of the P.
 *
 *  Use this everywhere the app needs a logo (login, signup, forgot-password,
 *  sidebar, loading state). No external assets, no corporate logo.
 */
export function PragatiMark({
  size      = 96,
  /** when true, drops the glow + heavy shadow (good for inline use in the sidebar) */
  flat      = false,
  className = '',
}: {
  size?: number;
  flat?: boolean;
  className?: string;
}) {
  const radius = size * 0.26;
  const shadow = flat
    ? 'inset 0 1px 0 rgba(255,255,255,0.22)'
    : 'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.18), ' +
      '0 18px 48px rgba(21,101,192,0.40), 0 6px 14px rgba(0,0,0,0.18)';

  return (
    <div
      aria-label="Pragati"
      role="img"
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width:  size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg, #1565C0 0%, #1769C8 45%, #2B8C29 100%)',
        boxShadow: shadow,
      }}
    >
      {/* Inner glossy ring */}
      <div
        className="absolute"
        style={{
          inset: Math.max(2, size * 0.04),
          borderRadius: radius * 0.86,
          background: 'linear-gradient(155deg, rgba(255,255,255,0.10) 0%, transparent 55%)',
        }}
      />

      {/* Stylised P — vertical stem with a bowl that sits in the UPPER half
         only (bowl from y=12 to y=30 of a 64-tall canvas; stem extends to
         y=52). That's what makes it read as "P" rather than "d". A smaller
         green accent inside the bowl suggests forward motion / progress. */}
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 64 64" className="relative">
        {/* Stem + bowl outline drawn as a single stroked group */}
        <g stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Vertical stem */}
          <path d="M18 12 V52" />
          {/* Bowl — upper half only */}
          <path d="M18 12 H32 a9 9 0 0 1 0 18 H18" />
        </g>
        {/* Forward-motion accent inside the bowl */}
        <path
          d="M25 18 H30 a3.5 3.5 0 0 1 0 7 H25"
          stroke="#A7E3B2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          fill="none" opacity="0.9"
        />
      </svg>
    </div>
  );
}
