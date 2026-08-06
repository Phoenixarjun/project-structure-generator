import { environment } from '../../../config/environment';

export async function fetchAuthData() {
  const res = await fetch(`${environment.apiBaseUrl}/auth`);
  return res.json();
}
