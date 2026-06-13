/**
 * Profile links are generic — a member can add any site, not just GitHub.
 * To keep the public profile pretty without a heavy icon set or external
 * favicon calls (free-forever, no third-party fetch), we detect a handful of
 * well-known hosts and give each a brand label + accent colour, falling back
 * to a clean "hostname" website chip for everything else.
 *
 * Pure + dependency-free so it runs on the server (serializer) and client
 * (settings editor, profile view) alike.
 */

export type LinkBrand =
  | 'github'
  | 'linkedin'
  | 'twitter'
  | 'instagram'
  | 'youtube'
  | 'medium'
  | 'dribbble'
  | 'behance'
  | 'figma'
  | 'gitlab'
  | 'email'
  | 'website';

export interface LinkMeta {
  brand: LinkBrand;
  /** Pretty default label (used when the member didn't set their own). */
  label: string;
  /** Brand accent colour for the chip. */
  color: string;
  /** Normalised href to actually link to. */
  href: string;
  /** @handle when one can be derived from the path (github/x/instagram/…). */
  handle?: string;
}

const BRANDS: Record<string, { brand: LinkBrand; name: string; color: string; handleFromPath?: boolean }> = {
  'github.com': { brand: 'github', name: 'GitHub', color: '#24292f', handleFromPath: true },
  'linkedin.com': { brand: 'linkedin', name: 'LinkedIn', color: '#0a66c2' },
  'twitter.com': { brand: 'twitter', name: 'X', color: '#0f172a', handleFromPath: true },
  'x.com': { brand: 'twitter', name: 'X', color: '#0f172a', handleFromPath: true },
  'instagram.com': { brand: 'instagram', name: 'Instagram', color: '#e1306c', handleFromPath: true },
  'youtube.com': { brand: 'youtube', name: 'YouTube', color: '#ff0000' },
  'youtu.be': { brand: 'youtube', name: 'YouTube', color: '#ff0000' },
  'medium.com': { brand: 'medium', name: 'Medium', color: '#0f172a', handleFromPath: true },
  'dribbble.com': { brand: 'dribbble', name: 'Dribbble', color: '#ea4c89', handleFromPath: true },
  'behance.net': { brand: 'behance', name: 'Behance', color: '#1769ff', handleFromPath: true },
  'figma.com': { brand: 'figma', name: 'Figma', color: '#a259ff' },
  'gitlab.com': { brand: 'gitlab', name: 'GitLab', color: '#fc6d26', handleFromPath: true },
};

function bareHost(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase();
}

export function linkMeta(rawUrl: string, customLabel?: string): LinkMeta {
  const label = (customLabel || '').trim();

  if (/^mailto:/i.test(rawUrl)) {
    const addr = rawUrl.replace(/^mailto:/i, '').trim();
    return { brand: 'email', label: label || addr || 'Email', color: '#0f172a', href: rawUrl };
  }

  let host = '';
  let firstSeg = '';
  let href = rawUrl.trim();
  try {
    const u = new URL(href);
    host = bareHost(u.hostname);
    firstSeg = u.pathname.split('/').filter(Boolean)[0] || '';
    href = u.toString();
  } catch {
    // Not parseable — show it verbatim as a website chip.
    return { brand: 'website', label: label || rawUrl, color: '#475569', href: rawUrl };
  }

  const known = BRANDS[host];
  if (known) {
    const handle = known.handleFromPath && firstSeg ? `@${firstSeg}` : undefined;
    return {
      brand: known.brand,
      label: label || (handle ? `${known.name} ${handle}` : known.name),
      color: known.color,
      href,
      handle,
    };
  }

  return { brand: 'website', label: label || host, color: '#475569', href };
}
