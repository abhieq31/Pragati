/**
 * Alembic Digital icon mark as SVG — works on any background colour.
 * Blue: #1769C8  Green: #2B8C29  viewBox 0 0 100 130
 * For the full PNG wordmark use <img src="/logo-full.png" /> on light surfaces.
 */

interface Props {
  width?: number;
  className?: string;
}

export function AlembicLogo({ width = 32, className = '' }: Props) {
  const height = Math.round(width * 1.3);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Large blue — right-pointing arrow with concave curved notch top-left */}
      <path
        d="M 20 2
           L 96 38
           L 10 55
           C 10 40 8 25 8 14
           C 8 5 14 0 20 2
           Z"
        fill="#1769C8"
      />

      {/* Green — right-pointing chevron */}
      <path
        d="M 10 63
           L 91 81
           L 3 130
           Z"
        fill="#2B8C29"
      />

      {/* Thin blue sliver */}
      <path
        d="M 87 84
           L 96 90
           L 20 130
           Z"
        fill="#1769C8"
      />
    </svg>
  );
}
