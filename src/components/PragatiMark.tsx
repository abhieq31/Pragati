/** Pragati's brand mark — CSS / SVG only, no image asset.
 *
 *  A figure mid-climb on a flight of three rising stairs, set inside a
 *  rounded-square gradient tile. The literal reading — "progress, one step
 *  at a time" — matches the meaning of "pragati". No external assets.
 *
 *  Used on login, signup, sidebar, loading state, and the favicon files
 *  (src/app/icon.svg, src/app/apple-icon.svg).
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
          background:
            'linear-gradient(155deg, rgba(255,255,255,0.14) 0%, transparent 55%)',
        }}
      />

      {/* Climber on stairs — three rising treads in white, climbing figure
         in soft mint green so it pops against the blue→green gradient. */}
      <svg
        width={size * 0.78}
        height={size * 0.78}
        viewBox="0 0 64 64"
        className="relative"
      >
        {/* Three ascending stairs */}
        <g fill="#ffffff">
          <rect x="6"  y="46" width="14" height="12" rx="1.5" />
          <rect x="20" y="38" width="14" height="20" rx="1.5" />
          <rect x="34" y="30" width="14" height="28" rx="1.5" />
        </g>

        {/* Climbing figure — head + torso + reaching arm + striding legs */}
        <g
          stroke="#B7E4C2"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <circle cx="41" cy="13" r="3.4" fill="#B7E4C2" stroke="none" />
          <path d="M41 17 L41 25" />
          <path d="M41 21 L47 15" />
          <path d="M41 21 L36 24" />
          <path d="M41 25 L37 30" />
          <path d="M41 25 L45 29" />
        </g>
      </svg>
    </div>
  );
}
