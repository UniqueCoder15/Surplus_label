/**
 * SurplusLabel - API Client Configuration & URL Resolution
 * Resolves the backend API base URL using VITE_API_URL if configured,
 * falling back to empty string (relative paths) for local Vite proxy and unified deployments.
 */

export const API_BASE_URL: string = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || ''
)
  .trim()
  .replace(/\/+$/, '');

export function getApiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}
