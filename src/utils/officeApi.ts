import { INITIAL_OFFICE_STATE } from '@/data/initial-office';
import { OfficeState } from '@/types/office';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || '';
const LOCAL_STORAGE_KEY = 'workstation_3d_office_state_v1';

function getApiUrl(): string {
  if (API_ENDPOINT) {
    return `${API_ENDPOINT.replace(/\/$/, '')}/office`;
  }
  return '/api/office';
}

export async function fetchOfficeState(): Promise<OfficeState> {
  try {
    const res = await fetch(getApiUrl(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      const state = (json?.data || json) as OfficeState;
      if (state && Array.isArray(state.todos)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        }
        return state;
      }
    }
  } catch (err) {
    console.warn('API fetch fallback to localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as OfficeState;
      } catch {
        // ignore parse error
      }
    }
  }

  return structuredClone(INITIAL_OFFICE_STATE);
}

export async function postOfficeAction(
  payload: Record<string, any>
): Promise<OfficeState | null> {
  try {
    const res = await fetch(getApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      const state = (json?.data || json) as OfficeState;
      if (state && Array.isArray(state.todos)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        }
        return state;
      }
    }
  } catch (err) {
    console.warn('Failed to post office action to API, saving locally:', err);
  }
  return null;
}
