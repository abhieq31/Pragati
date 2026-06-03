/**
 * Brand mark — a top-down bird silhouette inside a gradient tile.
 *
 * The bird-from-above motif directly embodies the product name and its core
 * premise: the bird's-eye view. Wings spread wide, body centred, tail fanned
 * — unmistakably a bird in soaring flight as seen from directly overhead.
 *
 * Consistent squircle (equal radii on all corners) so the shape matches the
 * rounded-xl treatment used for project/team avatars throughout the app.
 */
export function PragatiMark({
  size      = 96,
  flat      = false,
  className = '',
}: {
  size?: number;
  flat?: boolean;
  className?: string;
}) {
  const r = Math.round(size * 0.28);
  const shadow = flat
    ? 'inset 0 1px 0 rgba(255,255,255,0.22)'
    : [
        'inset 0 1px 0 rgba(255,255,255,0.28)',
        'inset 0 -1px 0 rgba(0,0,0,0.18)',
        '0 18px 48px rgba(21,101,192,0.38)',
        '0 6px 14px rgba(0,0,0,0.16)',
      ].join(', ');

  return (
    <div
      aria-label="MicroMacro"
      role="img"
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width:  size,
        height: size,
        borderRadius: r,
        background: 'linear-gradient(145deg, #0f4c99 0%, #1565C0 40%, #1b7f3a 100%)',
        boxShadow: shadow,
      }}
    >
      {/* Gloss overlay — subtle top-left shimmer */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: Math.max(2, Math.round(size * 0.04)),
          borderRadius: Math.round(r * 0.75),
          background: 'linear-gradient(148deg, rgba(255,255,255,0.16) 0%, transparent 52%)',
        }}
      />

      {/* Top-down bird silhouette.
          Wings sweep back and outward; small oval body; fan tail.
          Seen from directly above — the bird's-eye perspective made literal. */}
      <svg
        width={size * 0.66}
        height={size * 0.66}
        viewBox="0 0 64 64"
        className="relative"
        fill="none"
      >
        {/* Left wing — sweeps left, arcs back */}
        <path
          d="M30 30 C26 25 15 21 8 27 C4 31 8 38 18 35 C24 33 28 31 30 30"
          fill="white"
          opacity="0.92"
        />
        {/* Right wing — mirror */}
        <path
          d="M34 30 C38 25 49 21 56 27 C60 31 56 38 46 35 C40 33 36 31 34 30"
          fill="white"
          opacity="0.92"
        />
        {/* Body — teardrop (head narrow, tail wider) */}
        <ellipse cx="32" cy="29" rx="3.5" ry="7" fill="white" opacity="0.97" />
        {/* Tail fan — three spread feathers */}
        <path
          d="M28.5 36 L32 44 L35.5 36"
          fill="white"
          opacity="0.72"
        />
        {/* Wing-tip feather splits — gives detail at larger sizes */}
        {size >= 40 && (
          <>
            <path d="M8 27 C6 24 5 27 6 30" stroke="white" strokeWidth="1" opacity="0.4" fill="none" />
            <path d="M56 27 C58 24 59 27 58 30" stroke="white" strokeWidth="1" opacity="0.4" fill="none" />
          </>
        )}
      </svg>
    </div>
  );
}
