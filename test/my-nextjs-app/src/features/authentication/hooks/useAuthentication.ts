import { useState } from 'react';

export function useAuthentication() {
  const [state] = useState('authentication');
  return { state };
}
