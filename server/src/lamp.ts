/**
 * Lamp controller — drives a light via Home Assistant.
 * Maps dashboard lamp states to RGBW colors on the bulb.
 */
import { config } from './config.js';

export type LampState = 'waiting' | 'idle' | 'attention' | 'urgent' | 'success' | 'off';

// RGBW color presets for each state [R, G, B, W]
const STATE_COLORS: Record<Exclude<LampState, 'off'>, { rgbw: [number, number, number, number]; brightness: number }> = {
  waiting:   { rgbw: [255, 140, 0, 0],   brightness: 200 },              // amber/orange
  idle:      { rgbw: [0, 200, 255, 0],    brightness: 150 },              // cyan
  attention: { rgbw: [180, 0, 255, 0],    brightness: 220 },              // purple
  urgent:    { rgbw: [255, 0, 0, 0],      brightness: 128 },              // solid red at 50%
  success:   { rgbw: [0, 220, 60, 0],     brightness: 180 },              // green — project complete
};

let currentState: LampState = 'off';

function haEnabled(): boolean {
  return !!(config.ha.url && config.ha.token);
}

async function haCall(endpoint: string, body?: object): Promise<Response> {
  return fetch(`${config.ha.url}${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${config.ha.token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export async function getLampStatus(): Promise<{ state: LampState; haConnected: boolean }> {
  if (!haEnabled()) {
    return { state: currentState, haConnected: false };
  }

  try {
    const res = await haCall(`/api/states/${config.ha.lightEntity}`);
    const data = await res.json();
    return {
      state: data.state === 'off' ? 'off' : currentState,
      haConnected: true,
    };
  } catch {
    return { state: currentState, haConnected: false };
  }
}

export async function setLampState(state: LampState): Promise<{ state: LampState; success: boolean }> {
  if (!haEnabled()) {
    return { state, success: false };
  }

  try {
    if (state === 'off') {
      await haCall('/api/services/light/turn_off', {
        entity_id: config.ha.lightEntity,
      });
      currentState = 'off';
      return { state: 'off', success: true };
    }

    const preset = STATE_COLORS[state];

    // Set color and brightness (effects must be sent separately)
    await haCall('/api/services/light/turn_on', {
      entity_id: config.ha.lightEntity,
      rgbw_color: preset.rgbw,
      brightness: preset.brightness,
    });

    currentState = state;
    return { state, success: true };
  } catch (e) {
    console.error('Failed to set lamp state via HA:', e);
    return { state, success: false };
  }
}
