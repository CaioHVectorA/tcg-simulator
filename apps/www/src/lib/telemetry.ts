import { track } from '@vercel/analytics';
type Event = 'guest_created' | 'account_registered' | 'account_upgraded' | 'first_pack_opened' | 'pack_opened' | 'first_battle_completed' | 'first_trade_completed' | 'daily_reward_claimed';
// Aggregate funnel events only: never send tokens, IDs, emails, card names or user content.
export function event(name: Event, properties: Record<string, number | boolean> = {}, once = false) {
  if (typeof window === 'undefined') return;
  try {
    if (once) {
      const user = JSON.parse(localStorage.getItem('tcg_user_cache') || '{}') as { id?: number };
      const key = `tcg_event:${user.id || 'session'}:${name}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    }
    if (process.env.NODE_ENV === 'production') track(name, properties);
  } catch { /* Analytics must never block gameplay. */ }
}
