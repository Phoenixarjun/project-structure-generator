import { useState, useEffect } from 'react';
import { fetchAuthData } from '../api/client';

export function useAuth() {
  const [data, setData] = useState<string>('auth');
  const [loading, setLoading] = useState<boolean>(false);
  return { data, loading };
}
