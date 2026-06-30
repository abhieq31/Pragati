/**
 * Launch feature flags — keep the first impression focused.
 *
 * The mission is the morning decision: open Pragati and do the one thing that
 * matters. Secondary "workbench" tools (whiteboard, sticky notes, mind map)
 * are real but they don't serve that mission, so they're OFF for the launch to
 * a large user base and can be switched back on per-deployment without a code
 * change. NEXT_PUBLIC_ so the flag is readable in client components too.
 */
export const SCRATCHPAD_ENABLED = process.env.NEXT_PUBLIC_SCRATCHPAD_ENABLED === '1';
