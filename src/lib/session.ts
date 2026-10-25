const KEY = 'brain-blitz-session';
export interface SavedSession { code: string; playerId: string; nickname: string; avatar: string; }
export const saveSession = (session: SavedSession) => sessionStorage.setItem(KEY, JSON.stringify(session));
export const loadSession = (): SavedSession | undefined => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '') as SavedSession; } catch { return undefined; }
};
export const clearSession = () => sessionStorage.removeItem(KEY);
