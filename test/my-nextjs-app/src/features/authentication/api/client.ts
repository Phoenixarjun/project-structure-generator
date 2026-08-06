import { environment } from '../../../config/environment';

export async function fetchAuthentication() {
  const res = await fetch(`${environment.apiUrl}/authentication`);
  return res.json();
}
