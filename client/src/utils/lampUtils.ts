export type LampState = 'waiting' | 'idle' | 'attention' | 'urgent' | 'success' | 'off';

const LAMP_STATES = new Set<LampState>(['waiting', 'idle', 'attention', 'urgent', 'success', 'off']);

export function parseLampState(value: unknown, fallback: LampState = 'idle'): LampState {
  if (typeof value === 'string' && LAMP_STATES.has(value as LampState)) {
    return value as LampState;
  }

  return fallback;
}
