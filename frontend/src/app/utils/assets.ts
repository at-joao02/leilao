import { environment } from '../../environments/environment';

/**
 * Resolve caminhos de imagens guardadas no servidor (/api/uploads/...),
 * que em dev precisam do apiBase. URLs absolutos passam inalterados.
 */
export function resolveAsset(p: string | null | undefined): string {
  if (!p) return '';
  return p.startsWith('/') ? environment.apiBase + p : p;
}
